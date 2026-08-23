<script setup lang="ts">
import type { Course } from '~/types/course'

definePageMeta({ layout: 'course' })

const { data: courses, status } = useCourses()
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

function progressPercent(course: Course): number {
  if (!course.lessons.length) return 0
  return Math.round((completedCount(course) / course.lessons.length) * 100)
}

const levelBadgeClass: Record<string, string> = {
  Beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Advanced: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-6 py-14 sm:px-10">
    <h1 class="text-3xl font-extrabold tracking-tight">Explore Courses</h1>
    <p class="mt-2 text-slate-600 dark:text-slate-400">
      Pick up where you left off, or start something new. Press <kbd class="rounded border border-slate-300 px-1 text-xs dark:border-slate-600">⌘K</kbd> to jump straight to a lesson.
    </p>

    <div v-if="status === 'success' && courses?.length" class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
      <NuxtLink
        v-for="course in courses"
        :key="course.id"
        :to="firstLessonId(course) ? `/courses/${firstLessonId(course)}` : '/courses'"
        class="group relative block"
        :class="firstLessonId(course) ? '' : 'pointer-events-none'"
      >
        <!-- Cover glow effect -->
        <div
          class="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-40"
          aria-hidden="true"
        />

        <div
          class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-transparent group-hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
          :class="firstLessonId(course) ? '' : 'opacity-60'"
        >
          <div class="flex items-start justify-between gap-3">
            <span
              class="rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="levelBadgeClass[getCourseLevel(course)]"
            >
              {{ getCourseLevel(course) }}
            </span>
            <span class="shrink-0 text-xs text-slate-500 dark:text-slate-400">
              {{ course.lessons.length }} lesson{{ course.lessons.length === 1 ? '' : 's' }}
            </span>
          </div>

          <h2 class="mt-4 text-lg font-semibold">{{ course.title }}</h2>
          <p v-if="course.description" class="mt-1.5 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
            {{ course.description }}
          </p>

          <!-- Progress bar -->
          <div class="mt-5">
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                :style="{ width: `${progressPercent(course)}%` }"
              />
            </div>
            <div class="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{{ completedCount(course) }}/{{ course.lessons.length }} completed</span>
              <span class="font-medium text-emerald-600 dark:text-emerald-400">
                {{ progressPercent(course) === 100 ? 'Completed ✓' : progressPercent(course) > 0 ? 'Continue →' : 'Start course →' }}
              </span>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <p v-else-if="status === 'success'" class="mt-10 text-sm text-slate-500">No courses yet.</p>
  </div>
</template>
