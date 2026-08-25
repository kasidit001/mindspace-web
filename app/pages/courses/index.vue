<script setup lang="ts">
import { RefreshCw, Rocket, Sprout, Unplug, Zap } from '@lucide/vue'
import type { Course } from '~/types/course'

definePageMeta({ layout: 'course' })

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
      <div v-for="i in 2" :key="i" class="flex animate-pulse items-center gap-4 rounded-md border border-divider bg-surface p-5 dark:border-divider-dark dark:bg-surface-dark">
        <div class="size-10 shrink-0 rounded-md bg-zinc-200 dark:bg-white/10" />
        <div class="flex-1 space-y-2">
          <div class="h-4 w-1/2 rounded-md bg-zinc-200 dark:bg-white/10" />
          <div class="h-3 w-1/3 rounded-md bg-zinc-100 dark:bg-white/[0.06]" />
        </div>
      </div>
    </div>

    <!-- Error / reconnect state -->
    <div v-else-if="error" class="mt-10 flex flex-col items-center rounded-md border border-dashed border-red-200 p-12 text-center dark:border-red-900/50">
      <Unplug :size="36" :stroke-width="1.75" class="text-red-400 dark:text-red-500" aria-hidden="true" />
      <p class="mt-3 font-medium text-zinc-800 dark:text-zinc-100">{{ t('courses.cantReach') }}</p>
      <p class="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {{ t('courses.loadError') }}
      </p>
      <button
        type="button"
        class="btn-neon mt-5 flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
        :disabled="pending"
        @click="refresh()"
      >
        <RefreshCw :size="14" :stroke-width="1.75" />
        {{ pending ? t('sidebar.reconnecting') : t('sidebar.reconnect') }}
      </button>
    </div>

    <!-- Sharp-edged, bordered cards: icon, name, lesson count. -->
    <div v-else-if="courses?.length" class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="course in courses"
        :key="course.id"
        :to="firstLessonId(course) ? `/courses/${firstLessonId(course)}` : '/courses'"
        class="flex items-center gap-4 rounded-md border border-divider bg-surface p-5 transition-colors dark:bg-surface-dark"
        :class="firstLessonId(course)
          ? 'hover:border-accent-600 dark:hover:border-accent-400'
          : 'pointer-events-none opacity-60'"
      >
        <span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 dark:bg-white/[0.06]">
          <component :is="levelIcon[getCourseLevel(course)]" :size="18" :stroke-width="1.75" />
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="truncate font-semibold">{{ course.title }}</h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">{{ lessonCountLabel(course) }}</p>
        </div>
      </NuxtLink>
    </div>

    <p v-else class="mt-10 text-sm text-zinc-500">{{ t('courses.noCourses') }}</p>
  </div>
</template>
