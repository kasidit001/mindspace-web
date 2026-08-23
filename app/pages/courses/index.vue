<script setup lang="ts">
import type { Course } from '~/types/course'

definePageMeta({ layout: 'course' })

const { data: courses, status } = useCourses()

function firstLessonId(course: Course): string | null {
  return [...course.lessons].sort((a, b) => a.order - b.order)[0]?.id ?? null
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-8 py-16">
    <h1 class="text-2xl font-bold">Welcome to Mindspace</h1>
    <p class="mt-2 text-slate-600 dark:text-slate-400">
      Pick a lesson from the sidebar to get started, or ask the AI tutor a question at any time.
    </p>

    <div v-if="status === 'success' && courses?.length" class="mt-8 space-y-4">
      <NuxtLink
        v-for="course in courses"
        :key="course.id"
        :to="firstLessonId(course) ? `/courses/${firstLessonId(course)}` : '/courses'"
        class="block rounded-lg border border-slate-200 p-4 transition-all dark:border-slate-800"
        :class="firstLessonId(course)
          ? 'cursor-pointer hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:hover:border-emerald-600'
          : 'pointer-events-none opacity-60'"
      >
        <h2 class="font-semibold">{{ course.title }}</h2>
        <p v-if="course.description" class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {{ course.description }}
        </p>
        <p class="mt-2 text-xs text-slate-500">
          {{ course.lessons.length }} lesson(s)
          <span v-if="firstLessonId(course)" class="ml-1 text-emerald-600 dark:text-emerald-400">→ Start course</span>
        </p>
      </NuxtLink>
    </div>
  </div>
</template>
