<script setup lang="ts">
// The learner's personal "Home" — everything on it is computed from real
// data (useCourses() + the localStorage-backed progress store already used
// by layouts/course.vue and courses/index.vue), not mocked. There's no
// multi-user/"other students" data source anywhere in this app yet
// (progress isn't even server-side — see stores/progress.ts), so this
// intentionally shows the current learner's own progress rather than
// fabricating a roster of students to satisfy a "class of students" look.
//
// Framed as a welcoming Home rather than a data-dense Dashboard: one
// "Continue learning" hero (the single most relevant next step) plus the
// streak up top, everything else folded into a browsable, invitational
// course grid below — no raw stat grid, no sortable table.
import { ArrowRight, Compass, Flame, GraduationCap, PartyPopper, Rocket, Sprout, Zap } from '@lucide/vue'
import type { Course } from '~/types/course'
import { pickLocalized } from '~/utils/localizedLesson'

definePageMeta({ layout: 'dashboard' })

const { data: courses, status } = useCourses()
const progress = useProgressStore()
const { user } = useAuth()
const { t, lang } = useLanguage()

// Same hydration-safety pattern as layouts/course.vue and courses/index.vue:
// progress is localStorage-only, unknown to the server, so checkmarks/
// percentages/streak must wait for the client mount to avoid a hydration
// mismatch.
const mounted = ref(false)
onMounted(() => { mounted.value = true })

const levelIcon = { Beginner: Sprout, Intermediate: Zap, Advanced: Rocket } as const
const levelBadgeClass = {
  Beginner: 'bg-success-50 text-success-700 dark:bg-success-400/10 dark:text-success-400',
  Intermediate: 'bg-accent-50 text-accent-700 dark:bg-accent-400/10 dark:text-accent-400',
  Advanced: 'bg-ai-50 text-ai-700 dark:bg-ai-400/10 dark:text-ai-400'
} as const

function sortedLessons(course: Course) {
  return [...course.lessons].sort((a, b) => a.order - b.order)
}

function completedCount(course: Course): number {
  if (!mounted.value) return 0
  return course.lessons.filter((l) => progress.isCompleted(l.id)).length
}

function progressPercent(course: Course): number {
  if (!course.lessons.length) return 0
  return Math.round((completedCount(course) / course.lessons.length) * 100)
}

/** First lesson the learner hasn't finished yet, or the first lesson if
 * none are done, or the last one if the course is fully complete. */
function nextLessonId(course: Course): string | null {
  const lessons = sortedLessons(course)
  const next = lessons.find((l) => !mounted.value || !progress.isCompleted(l.id))
  return (next ?? lessons[0])?.id ?? null
}

function actionLabel(course: Course): string {
  const done = completedCount(course)
  if (done === 0) return t('dashboard.start')
  if (done === course.lessons.length) return t('dashboard.review')
  return t('dashboard.continue')
}

/** Most recent completion timestamp among a course's lessons, or 0 if none —
 * used only to rank which in-progress course to feature, never displayed. */
function lastAccessedAt(course: Course): number {
  if (!mounted.value) return 0
  const timestamps = course.lessons
    .map((l) => progress.completed[l.id])
    .filter(Boolean)
    .map((iso) => new Date(iso!).getTime())
    .filter((n) => !Number.isNaN(n))
  return timestamps.length ? Math.max(...timestamps) : 0
}

const totalLessons = computed(() => (courses.value ?? []).reduce((n, c) => n + c.lessons.length, 0))
const completedLessons = computed(() => {
  if (!mounted.value) return 0
  return (courses.value ?? []).reduce((n, c) => n + completedCount(c), 0)
})
const overallPercent = computed(() =>
  totalLessons.value ? Math.round((completedLessons.value / totalLessons.value) * 100) : 0
)
const streakDays = computed(() => (mounted.value ? progress.streakDays : 0))

/** The single course to feature in the "Continue learning" hero: the
 * in-progress course studied most recently, or — if nothing's in progress
 * yet — the first course not yet started, so there's always an inviting
 * next step rather than an empty box. */
const continueCourse = computed<Course | null>(() => {
  if (!mounted.value) return null
  const list = courses.value ?? []
  const inProgress = list.filter((c) => {
    const done = completedCount(c)
    return c.lessons.length > 0 && done > 0 && done < c.lessons.length
  })
  if (inProgress.length) {
    return [...inProgress].sort((a, b) => lastAccessedAt(b) - lastAccessedAt(a))[0] ?? null
  }
  return list.find((c) => c.lessons.length > 0 && completedCount(c) === 0) ?? null
})

const allCaughtUp = computed(() =>
  mounted.value &&
  (courses.value?.length ?? 0) > 0 &&
  !continueCourse.value &&
  (courses.value ?? []).every((c) => completedCount(c) === c.lessons.length)
)

function continueLessonTitle(course: Course): string {
  const lesson = sortedLessons(course).find((l) => l.id === nextLessonId(course))
  return lesson ? pickLocalized(lesson.titleEn, lesson.titleTh, lang.value) : ''
}

function continueLessonPosition(course: Course): number {
  const lessons = sortedLessons(course)
  const idx = lessons.findIndex((l) => l.id === nextLessonId(course))
  return idx === -1 ? lessons.length : idx + 1
}

/** Not-started courses surface first — the clearest invitation to explore —
 * then in-progress, then fully completed ones last. Mirrors the honest
 * "not started / continue" heuristic mindspace-api's dashboard usecase uses. */
const exploreCourses = computed(() => {
  const rank = (c: Course) => {
    const done = completedCount(c)
    if (done === 0) return 0
    if (done < c.lessons.length) return 1
    return 2
  }
  return [...(courses.value ?? [])].sort((a, b) => rank(a) - rank(b))
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-12">
    <!-- Signed-out state: progress lives in this browser regardless of
         login, but the personalized summary is gated behind an account
         like the rest of the app's per-user surfaces. -->
    <div v-if="!user" class="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <span class="flex size-12 items-center justify-center rounded-full bg-accent-50 text-accent-600 dark:bg-accent-400/10 dark:text-accent-400">
        <GraduationCap :size="22" :stroke-width="1.75" />
      </span>
      <h1 class="font-display mt-4 text-xl font-bold tracking-tight">{{ t('dashboard.loginPromptTitle') }}</h1>
      <p class="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{{ t('dashboard.loginPromptBody') }}</p>
      <NuxtLink to="/login" class="btn-primary mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold">
        {{ t('auth.logIn') }}
      </NuxtLink>
    </div>

    <template v-else>
      <header>
        <h1 class="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {{ t('dashboard.title', { name: user.name.split(' ')[0] ?? user.name }) }}
        </h1>
        <p class="mt-1.5 text-zinc-500 dark:text-zinc-400">{{ t('dashboard.subtitle') }}</p>
      </header>

      <!-- Continue learning + streak: the top of the page is "what should I
           do right now", not a stat grid. -->
      <section class="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div v-if="status === 'pending'" class="card animate-pulse p-6 sm:p-8">
          <div class="h-4 w-1/3 rounded-md bg-zinc-200 dark:bg-white/10" />
          <div class="mt-4 h-6 w-2/3 rounded-md bg-zinc-200 dark:bg-white/10" />
          <div class="mt-3 h-2 w-full rounded-full bg-zinc-100 dark:bg-white/[0.06]" />
        </div>

        <NuxtLink
          v-else-if="continueCourse"
          :to="`/courses/${nextLessonId(continueCourse)}`"
          class="card group relative overflow-hidden p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-8"
        >
          <span class="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700 dark:bg-accent-400/10 dark:text-accent-400">
            <Compass :size="12" :stroke-width="2" />
            {{ t('dashboard.continueLearning') }}
          </span>
          <h2 class="mt-4 font-display text-xl font-bold tracking-tight sm:text-2xl">{{ continueCourse.title }}</h2>
          <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {{ t('dashboard.lessonPosition', { current: continueLessonPosition(continueCourse), total: continueCourse.lessons.length }) }}
            &mdash; {{ continueLessonTitle(continueCourse) }}
          </p>
          <div class="mt-4 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
            <div class="h-full rounded-full bg-accent-500 transition-all duration-500" :style="{ width: `${progressPercent(continueCourse)}%` }" />
          </div>
          <span class="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 dark:text-accent-400">
            {{ actionLabel(continueCourse) }}
            <ArrowRight :size="14" :stroke-width="2" class="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </NuxtLink>

        <div v-else-if="allCaughtUp" class="card flex flex-col items-center justify-center p-6 text-center sm:p-8">
          <span class="flex size-11 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-400/10 dark:text-success-400">
            <PartyPopper :size="20" :stroke-width="1.75" />
          </span>
          <h2 class="mt-3 font-display text-lg font-bold tracking-tight">{{ t('dashboard.allCaughtUpTitle') }}</h2>
          <p class="mt-1.5 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{{ t('dashboard.allCaughtUpBody') }}</p>
        </div>

        <div v-else class="card flex flex-col items-center justify-center p-6 text-center sm:p-8">
          <span class="flex size-11 items-center justify-center rounded-full bg-accent-50 text-accent-600 dark:bg-accent-400/10 dark:text-accent-400">
            <Compass :size="20" :stroke-width="1.75" />
          </span>
          <h2 class="mt-3 font-display text-lg font-bold tracking-tight">{{ t('dashboard.emptyStateTitle') }}</h2>
          <p class="mt-1.5 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{{ t('dashboard.emptyStateBody') }}</p>
          <NuxtLink to="/courses" class="btn-primary mt-5 rounded-lg px-5 py-2.5 text-sm font-semibold">
            {{ t('dashboard.browseCourses') }}
          </NuxtLink>
        </div>

        <div class="flex flex-col gap-4">
          <div class="card flex items-center gap-4 p-5">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-full"
              :class="streakDays > 0 ? 'bg-warning-50 text-warning-600 dark:bg-warning-400/10 dark:text-warning-400' : 'bg-zinc-100 text-zinc-400 dark:bg-white/[0.06] dark:text-zinc-500'"
            >
              <Flame :size="19" :stroke-width="1.9" />
            </span>
            <div>
              <p class="text-xl font-bold tracking-tight">{{ t('dashboard.streakValue', { days: streakDays }) }}</p>
              <p class="text-xs text-zinc-500 dark:text-zinc-400">{{ streakDays > 0 ? t('dashboard.streakCaption') : t('dashboard.streakEmptyCaption') }}</p>
            </div>
          </div>

          <div class="card p-5">
            <p class="text-xl font-bold tracking-tight">{{ completedLessons }}<span class="text-sm font-normal text-zinc-400">/{{ totalLessons }}</span></p>
            <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{{ t('dashboard.statLessonsCompleted') }}</p>
            <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
              <div class="h-full rounded-full bg-accent-500 transition-all duration-500" :style="{ width: `${overallPercent}%` }" />
            </div>
          </div>
        </div>
      </section>

      <!-- Explore: a browsable, invitational course grid — not-started
           courses lead, so this reads as "here's what to try next", not a
           re-listing of the same stats above. -->
      <section class="mt-10">
        <div class="flex items-baseline justify-between gap-4">
          <div>
            <h2 class="font-display text-lg font-bold tracking-tight">{{ t('dashboard.exploreHeading') }}</h2>
            <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{{ t('dashboard.exploreSubtitle') }}</p>
          </div>
          <NuxtLink to="/courses" class="hidden shrink-0 items-center gap-1 text-sm font-semibold text-accent-700 hover:underline dark:text-accent-400 sm:inline-flex">
            {{ t('dashboard.browseCourses') }}
            <ArrowRight :size="14" :stroke-width="2" />
          </NuxtLink>
        </div>

        <div v-if="status === 'pending'" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 3" :key="i" class="card animate-pulse p-5">
            <div class="h-4 w-2/3 rounded-md bg-zinc-200 dark:bg-white/10" />
            <div class="mt-3 h-2 w-full rounded-full bg-zinc-100 dark:bg-white/[0.06]" />
          </div>
        </div>

        <div v-else class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="course in exploreCourses"
            :key="course.id"
            :to="nextLessonId(course) ? `/courses/${nextLessonId(course)}` : '/courses'"
            class="card flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div class="flex items-center justify-between gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="levelBadgeClass[getCourseLevel(course)]"
              >
                <component :is="levelIcon[getCourseLevel(course)]" :size="12" :stroke-width="2" />
                {{ getCourseLevel(course) }}
              </span>
              <span class="text-xs font-medium text-zinc-400">{{ progressPercent(course) }}%</span>
            </div>
            <h3 class="mt-3 font-semibold leading-snug">{{ course.title }}</h3>
            <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
              <div class="h-full rounded-full bg-accent-500" :style="{ width: `${progressPercent(course)}%` }" />
            </div>
            <span class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-700 dark:text-accent-400">
              {{ actionLabel(course) }}
              <ArrowRight :size="14" :stroke-width="2" />
            </span>
          </NuxtLink>

          <p v-if="!courses?.length" class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('courses.noCourses') }}</p>
        </div>
      </section>
    </template>
  </div>
</template>
