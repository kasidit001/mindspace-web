<script setup lang="ts">
// "My Courses" — only courses the learner has actually started or finished,
// most-recently-touched first. Distinct from /courses (the full, unfiltered
// catalog) and /dashboard (a single featured "continue learning" course) —
// this is the complete list of what's actually on the learner's plate.
import { ArrowRight, BookOpen, Rocket, Sprout, Zap } from '@lucide/vue'
import type { Course } from '~/types/course'

definePageMeta({ layout: 'dashboard' })

const { data: courses, status } = useCourses()
const progress = useProgressStore()
const { user } = useAuth()
const { t } = useLanguage()

// Same hydration-safety pattern as dashboard.vue/courses/index.vue: progress
// is localStorage-only, unknown to the server until mounted on the client.
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

function nextLessonId(course: Course): string | null {
  const lessons = sortedLessons(course)
  const next = lessons.find((l) => !mounted.value || !progress.isCompleted(l.id))
  return (next ?? lessons[0])?.id ?? null
}

function actionLabel(course: Course): string {
  const done = completedCount(course)
  if (done === course.lessons.length) return t('dashboard.review')
  return t('dashboard.continue')
}

function lastAccessedAt(course: Course): number {
  if (!mounted.value) return 0
  const timestamps = course.lessons
    .map((l) => progress.completed[l.id])
    .filter(Boolean)
    .map((iso) => new Date(iso!).getTime())
    .filter((n) => !Number.isNaN(n))
  return timestamps.length ? Math.max(...timestamps) : 0
}

/** Only courses with at least one completed lesson, most recently touched first. */
const myCourses = computed(() => {
  if (!mounted.value) return []
  return (courses.value ?? [])
    .filter((c) => completedCount(c) > 0)
    .sort((a, b) => lastAccessedAt(b) - lastAccessedAt(a))
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-12">
    <!-- Signed-out state: matches dashboard.vue/courses/index.vue's gating. -->
    <div v-if="!user" class="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <span class="flex size-12 items-center justify-center rounded-full bg-accent-50 text-accent-600 dark:bg-accent-400/10 dark:text-accent-400">
        <BookOpen :size="22" :stroke-width="1.75" />
      </span>
      <h1 class="font-display mt-4 text-xl font-bold tracking-tight">{{ t('dashboard.loginPromptTitle') }}</h1>
      <p class="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{{ t('dashboard.loginPromptBody') }}</p>
      <NuxtLink to="/login" class="btn-primary mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold">
        {{ t('auth.logIn') }}
      </NuxtLink>
    </div>

    <template v-else>
      <header>
        <h1 class="font-display text-2xl font-bold tracking-tight sm:text-3xl">{{ t('myCourses.title') }}</h1>
        <p class="mt-1.5 text-zinc-500 dark:text-zinc-400">{{ t('myCourses.subtitle') }}</p>
      </header>

      <div v-if="status === 'pending' || !mounted" class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="card animate-pulse p-5">
          <div class="h-4 w-2/3 rounded-md bg-zinc-200 dark:bg-white/10" />
          <div class="mt-3 h-2 w-full rounded-full bg-zinc-100 dark:bg-white/[0.06]" />
        </div>
      </div>

      <!-- Empty state: hasn't started anything yet — point to Explore Courses
           rather than showing an empty grid. -->
      <div v-else-if="!myCourses.length" class="card mt-8 flex flex-col items-center p-10 text-center">
        <span class="flex size-11 items-center justify-center rounded-full bg-accent-50 text-accent-600 dark:bg-accent-400/10 dark:text-accent-400">
          <BookOpen :size="20" :stroke-width="1.75" />
        </span>
        <h2 class="mt-3 font-display text-lg font-bold tracking-tight">{{ t('myCourses.emptyTitle') }}</h2>
        <p class="mt-1.5 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{{ t('myCourses.emptyBody') }}</p>
        <NuxtLink to="/courses" class="btn-primary mt-5 rounded-lg px-5 py-2.5 text-sm font-semibold">
          {{ t('dashboard.browseCourses') }}
        </NuxtLink>
      </div>

      <div v-else class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="course in myCourses"
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
          <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {{ t('progress.lessonsCompleted', { done: completedCount(course), total: course.lessons.length }) }}
          </p>
          <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
            <div class="h-full rounded-full bg-accent-500" :style="{ width: `${progressPercent(course)}%` }" />
          </div>
          <span class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-700 dark:text-accent-400">
            {{ actionLabel(course) }}
            <ArrowRight :size="14" :stroke-width="2" />
          </span>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
