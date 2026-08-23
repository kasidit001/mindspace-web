<script setup lang="ts">
definePageMeta({ layout: 'course' })

const { data: courses, status } = useCourses()
</script>

<template>
  <div class="mx-auto max-w-2xl px-8 py-16">
    <h1 class="text-2xl font-bold">Welcome to Mindspace</h1>
    <p class="mt-2 text-slate-600 dark:text-slate-400">
      Pick a lesson from the sidebar to get started, or ask the AI tutor a question at any time.
    </p>

    <div v-if="status === 'success' && courses?.length" class="mt-8 space-y-4">
      <article v-for="course in courses" :key="course.id" class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 class="font-semibold">{{ course.title }}</h2>
        <p v-if="course.description" class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {{ course.description }}
        </p>
        <p class="mt-2 text-xs text-slate-500">{{ course.lessons.length }} lesson(s)</p>
      </article>
    </div>
  </div>
</template>
