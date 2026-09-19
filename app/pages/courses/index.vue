<script setup lang="ts">
import { RefreshCw, Rocket, Sprout, Unplug, Zap } from '@lucide/vue'
import type { Course } from '~/types/course'

// Uses the minimal Home/Explore/My Courses sidebar (layouts/dashboard.vue),
// not course.vue's nested lesson-tree sidebar — that tree is for navigating
// *within* a lesson you're reading, and showing it while just browsing the
// catalog was exactly the cognitive-overload complaint this page used to get.
definePageMeta({ layout: 'dashboard' })

const { data: courses, status, error, refresh, pending } = useCourses()
const progress = useProgressStore()
const { t } = useLanguage()

// Avoid a hydration mismatch: progress is localStorage-backed and only
// known once mounted on the client.
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

function firstLessonId(course: Course): string | null {
  return [...course.lessons].sort((a, b) => a.order - b.order)[0]?.id ?? null
}

function completedCount(course: Course): number {
  if (!mounted.value) return 0
  return course.lessons.filter((l) => progress.isCompleted(l.id)).length
}

function lessonCountLabel(course: Course): string {
  const total = course.lessons.length
  const done = completedCount(course)
  const noun = t(total === 1 ? 'common.lesson' : 'common.lessons')
  return done > 0 ? `${done}/${total} ${noun}` : `${total} ${noun}`
}

function progressPercent(course: Course): number {
  if (!course.lessons.length) return 0
  return Math.round((completedCount(course) / course.lessons.length) * 100)
}

const levelIcon = {
  Beginner: Sprout,
  Intermediate: Zap,
  Advanced: Rocket
} as const
</script>

<template>
  <div class="mx-auto max-w-5xl px-6 py-14 sm:px-10">
    <h1 class="font-display text-3xl font-bold tracking-tight">{{ t('courses.title') }}</h1>
    <p class="mt-2 text-zinc-600 dark:text-zinc-400">
      {{ t('courses.subtitlePrefix') }}
      <kbd class="rounded-md border border-divider px-1 font-mono text-xs dark:border-divider-dark">⌘K</kbd>
      {{ t('courses.subtitleSuffix') }}
    </p>

    <!-- Loading skeleton -->
    <div v-if="status === 'pending'" class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div v-for="i in 2" :key="i" class="card flex animate-pulse items-center gap-4 p-5">
        <div class="size-10 shrink-0 rounded-md bg-zinc-200 dark:bg-white/10" />
        <div class="flex-1 space-y-2">
          <div class="h-4 w-1/2 rounded-md bg-zinc-200 dark:bg-white/10" />
          <div class="h-3 w-1/3 rounded-md bg-zinc-100 dark:bg-white/[0.06]" />
        </div>
      </div>
    </div>

    <!-- Error / reconnect state -->
    <div v-else-if="error" class="mt-10 flex flex-col items-center rounded-md border border-dashed border-critical-200 p-12 text-center dark:border-critical-900/50">
      <Unplug :size="36" :stroke-width="1.75" class="text-critical-500 dark:text-critical-400" aria-hidden="true" />
      <p class="mt-3 font-medium text-zinc-800 dark:text-zinc-100">{{ t('courses.cantReach') }}</p>
      <p class="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {{ t('courses.loadError') }}
      </p>
      <button
        type="button"
        class="mt-5 flex items-center gap-1.5 rounded-md border border-divider px-4 py-2 text-sm font-medium text-zinc-600 hover:border-accent-600 hover:text-accent-700 disabled:opacity-50 dark:border-divider-dark dark:text-zinc-300 dark:hover:border-accent-400 dark:hover:text-accent-400"
        :disabled="pending"
        @click="refresh()"
      >
        <RefreshCw :size="14" :stroke-width="1.75" />
        {{ pending ? t('sidebar.reconnecting') : t('sidebar.reconnect') }}
      </button>
    </div>

    <!-- Structured cards: level badge, title, a real progress bar (not just
         a lesson-count caption), lesson count below it. -->
    <div v-else-if="courses?.length" class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="course in courses"
        :key="course.id"
        :to="firstLessonId(course) ? `/courses/${firstLessonId(course)}` : '/courses'"
        class="card flex flex-col p-5 transition-all duration-200"
        :class="firstLessonId(course)
          ? 'hover:-translate-y-0.5 hover:shadow-lg'
          : 'pointer-events-none opacity-60'"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-400/10 dark:text-accent-400">
            <component :is="levelIcon[getCourseLevel(course)]" :size="18" :stroke-width="1.75" />
          </span>
          <span v-if="mounted && progressPercent(course) > 0" class="text-xs font-semibold text-accent-700 dark:text-accent-400">
            {{ progressPercent(course) }}%
          </span>
        </div>
        <h2 class="mt-3.5 truncate font-semibold">{{ course.title }}</h2>
        <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
          <div
            class="h-full rounded-full bg-accent-500 transition-all duration-500"
            :style="{ width: `${progressPercent(course)}%` }"
          />
        </div>
        <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{{ lessonCountLabel(course) }}</p>
      </NuxtLink>
    </div>

    <p v-else class="mt-10 text-sm text-zinc-500">{{ t('courses.noCourses') }}</p>
  </div>
</template>
