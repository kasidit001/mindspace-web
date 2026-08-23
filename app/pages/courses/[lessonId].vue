<script setup lang="ts">
definePageMeta({ layout: 'course' })

const route = useRoute()
const lessonId = computed(() => route.params.lessonId as string)

const { data: lesson, status, error } = useLesson(lessonId)
</script>

<template>
  <div class="mx-auto max-w-3xl px-8 py-10">
    <p v-if="status === 'pending'" class="text-slate-500">Loading lesson…</p>

    <p v-else-if="error" class="text-red-600 dark:text-red-400">
      Couldn't load this lesson (it may not exist, or mindspace-api isn't running on port 8080).
    </p>

    <template v-else-if="lesson">
      <nav class="mb-2 text-sm text-slate-500 dark:text-slate-400">
        {{ lesson.course.title }}
      </nav>
      <h1 class="text-2xl font-bold">{{ lesson.title }}</h1>

      <!-- Markdown content, with syntax-highlighted TypeScript code blocks -->
      <div class="prose prose-slate mt-6 max-w-none dark:prose-invert">
        <MDC :value="lesson.content" tag="div" />
      </div>
    </template>
  </div>
</template>
