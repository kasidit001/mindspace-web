<script setup lang="ts">
// The learner's own dashboard — everything on it is computed from real
// data (useCourses() + the localStorage-backed progress store already
// used by layouts/course.vue and courses/index.vue), not mocked. There's
// no multi-user/"other students" data source anywhere in this app yet
// (progress isn't even server-side — see stores/progress.ts), so this
// intentionally shows the current learner's own progress rather than
// fabricating a roster of students to satisfy a "class of students" look.
import { ArrowRight, BookOpenCheck, GraduationCap, ListChecks, Rocket, Sparkles, Sprout, Zap } from '@lucide/vue'
import type { Course } from '~/types/course'

definePageMeta({ layout: 'dashboard' })

const { data: courses, status } = useCourses()
const progress = useProgressStore()
const { user } = useAuth()
const { t } = useLanguage()

// Same hydration-safety pattern as layouts/course.vue and courses/index.vue:
// progress is localStorage-only, unknown to the server, so checkmarks/
// percentages must wait for the client mount to avoid a hydration mismatch.
const mounted = ref(false)
onMounted(() => { mounted.value = true })

const levelIcon = { Beginner: Sprout, Intermediate: Zap, Advanced: Rocket } as const
const levelBadgeClass = {
  Beginner: 'bg-success-50 text-success-700',
  Intermediate: 'bg-accent-50 text-accent-700',
  Advanced: 'bg-ai-50 text-ai-700'
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

const totalLessons = computed(() => (courses.value ?? []).reduce((n, c) => n + c.lessons.length, 0))
const completedLessons = computed(() => {
  if (!mounted.value) return 0
  return (courses.value ?? []).reduce((n, c) => n + completedCount(c), 0)
})
const overallPercent = computed(() =>
  totalLessons.value ? Math.round((completedLessons.value / totalLessons.value) * 100) : 0
)
const coursesInProgress = computed(() => {
  if (!mounted.value) return 0
  return (courses.value ?? []).filter((c) => {
    const done = completedCount(c)
    return done > 0 && done < c.lessons.length
  }).length
})

const stats = computed(() => [
  { icon: ListChecks, label: t('dashboard.statLessonsCompleted'), value: `${completedLessons.value}/${totalLessons.value}` },
  { icon: Sparkles, label: t('dashboard.statCoursesInProgress'), value: String(coursesInProgress.value) },
  { icon: GraduationCap, label: t('dashboard.statCompletion'), value: `${overallPercent.value}%` },
  { icon: BookOpenCheck, label: t('dashboard.statCoursesAvailable'), value: String(courses.value?.length ?? 0) }
])
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-12">
    <!-- Signed-out state: progress lives in this browser regardless of
         login, but the personalized summary is gated behind an account
         like the rest of the app's per-user surfaces. -->
    <div v-if="!user" class="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <span class="flex size-12 items-center justify-center rounded-full bg-accent-50 text-accent-600">
        <GraduationCap :size="22" :stroke-width="1.75" />
      </span>
      <h1 class="font-display mt-4 text-xl font-bold tracking-tight">{{ t('dashboard.loginPromptTitle') }}</h1>
      <p class="mt-2 max-w-sm text-sm text-zinc-500">{{ t('dashboard.loginPromptBody') }}</p>
      <NuxtLink to="/login" class="btn-primary mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold">
        {{ t('auth.logIn') }}
      </NuxtLink>
    </div>

    <template v-else>
      <header>
        <h1 class="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {{ t('dashboard.title', { name: user.name }) }}
        </h1>
        <p class="mt-1.5 text-zinc-500">{{ t('dashboard.subtitle') }}</p>
      </header>

      <!-- Stat cards -->
      <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="stat in stats" :key="stat.label" class="card p-5">
          <span class="flex size-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <component :is="stat.icon" :size="17" :stroke-width="1.9" />
          </span>
          <p class="mt-3 text-2xl font-bold tracking-tight">{{ stat.value }}</p>
          <p class="mt-0.5 text-sm text-zinc-500">{{ stat.label }}</p>
        </div>
      </div>

      <!-- Course overview cards -->
      <section class="mt-10">
        <h2 class="font-display text-lg font-bold tracking-tight">{{ t('dashboard.overviewHeading') }}</h2>

        <div v-if="status === 'pending'" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 3" :key="i" class="card animate-pulse p-5">
            <div class="h-4 w-2/3 rounded-md bg-zinc-200" />
            <div class="mt-3 h-2 w-full rounded-full bg-zinc-100" />
          </div>
        </div>

        <div v-else class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="course in courses ?? []"
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
            <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div class="h-full rounded-full bg-accent-500" :style="{ width: `${progressPercent(course)}%` }" />
            </div>
            <span class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-700">
              {{ actionLabel(course) }}
              <ArrowRight :size="14" :stroke-width="2" />
            </span>
          </NuxtLink>
        </div>
      </section>

      <!-- Data table -->
      <section class="mt-10">
        <h2 class="font-display text-lg font-bold tracking-tight">{{ t('dashboard.tableHeading') }}</h2>
        <div class="mt-4 overflow-hidden rounded-xl border border-divider">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-divider bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th class="px-5 py-3 font-medium">{{ t('dashboard.colCourse') }}</th>
                <th class="px-5 py-3 font-medium">{{ t('dashboard.colLevel') }}</th>
                <th class="px-5 py-3 font-medium">{{ t('dashboard.colLessons') }}</th>
                <th class="px-5 py-3 font-medium">{{ t('dashboard.colProgress') }}</th>
                <th class="px-5 py-3 font-medium">{{ t('dashboard.colAction') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="course in courses ?? []"
                :key="course.id"
                class="border-b border-divider last:border-b-0"
              >
                <td class="px-5 py-3.5 font-medium">{{ course.title }}</td>
                <td class="px-5 py-3.5 text-zinc-500">{{ getCourseLevel(course) }}</td>
                <td class="px-5 py-3.5 text-zinc-500">{{ completedCount(course) }}/{{ course.lessons.length }}</td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-2">
                    <div class="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100">
                      <div class="h-full rounded-full bg-accent-500" :style="{ width: `${progressPercent(course)}%` }" />
                    </div>
                    <span class="text-xs text-zinc-500">{{ progressPercent(course) }}%</span>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-right">
                  <NuxtLink
                    :to="nextLessonId(course) ? `/courses/${nextLessonId(course)}` : '/courses'"
                    class="font-semibold text-accent-700 hover:underline"
                  >
                    {{ actionLabel(course) }}
                  </NuxtLink>
                </td>
              </tr>
              <tr v-if="!courses?.length">
                <td colspan="5" class="px-5 py-8 text-center text-zinc-500">{{ t('courses.noCourses') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
