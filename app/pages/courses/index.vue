<script setup lang="ts">
import type { Course } from '~/types/course'

definePageMeta({ layout: 'course' })

const { data: courses, status, error, refresh, pending } = useCourses()
const progress = useProgressStore()

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
  const noun = `lesson${total === 1 ? '' : 's'}`
  return done > 0 ? `${done}/${total} ${noun}` : `${total} ${noun}`
}

const levelIcon: Record<string, string> = {
  Beginner: '🌱',
  Intermediate: '⚡',
  Advanced: '🚀'
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-6 py-14 sm:px-10">
    <h1 class="text-3xl font-bold tracking-tight">Explore Courses</h1>
    <p class="mt-2 text-zinc-600 dark:text-zinc-400">
      Pick up where you left off, or start something new. Press
      <kbd class="rounded border border-divider px-1 font-mono text-xs dark:border-divider-dark">⌘K</kbd>
      to jump straight to a lesson.
    </p>

    <!-- Loading skeleton -->
    <div v-if="status === 'pending'" class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div v-for="i in 2" :key="i" class="flex animate-pulse items-center gap-4 rounded border border-divider p-5 dark:border-divider-dark">
        <div class="size-10 shrink-0 rounded bg-zinc-200 dark:bg-white/10" />
        <div class="flex-1 space-y-2">
          <div class="h-4 w-1/2 rounded bg-zinc-200 dark:bg-white/10" />
          <div class="h-3 w-1/3 rounded bg-zinc-100 dark:bg-white/[0.06]" />
        </div>
      </div>
    </div>

    <!-- Error / reconnect state -->
    <div v-else-if="error" class="mt-10 flex flex-col items-center rounded border border-dashed border-red-200 p-12 text-center dark:border-red-900/50">
      <p class="text-4xl" aria-hidden="true">🔌</p>
      <p class="mt-3 font-medium text-zinc-800 dark:text-zinc-100">Can't reach mindspace-api</p>
      <p class="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        The course list couldn't load. Make sure mindspace-api is running on port 8080, then try again.
      </p>
      <button
        type="button"
        class="mt-5 flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        :disabled="pending"
        @click="refresh()"
      >
        <span aria-hidden="true">↻</span>
        {{ pending ? 'Reconnecting…' : 'Reconnect API' }}
      </button>
    </div>

    <!-- Sharp-edged, bordered cards: icon, name, lesson count. -->
    <div v-else-if="courses?.length" class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="course in courses"
        :key="course.id"
        :to="firstLessonId(course) ? `/courses/${firstLessonId(course)}` : '/courses'"
        class="flex items-center gap-4 rounded border border-divider p-5 transition-colors"
        :class="firstLessonId(course)
          ? 'hover:border-emerald-400 dark:hover:border-emerald-600'
          : 'pointer-events-none opacity-60'"
      >
        <span class="flex size-10 shrink-0 items-center justify-center rounded bg-zinc-100 text-xl dark:bg-white/[0.06]">
          {{ levelIcon[getCourseLevel(course)] }}
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="truncate font-semibold">{{ course.title }}</h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">{{ lessonCountLabel(course) }}</p>
        </div>
      </NuxtLink>
    </div>

    <p v-else class="mt-10 text-sm text-zinc-500">No courses yet.</p>
  </div>
</template>
