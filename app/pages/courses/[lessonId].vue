<script setup lang="ts">
definePageMeta({ layout: 'course' })

const route = useRoute()
const lessonId = computed(() => route.params.lessonId as string)

const { data: lesson, status, error } = useLesson(lessonId)
const { data: courses } = useCourses()
const progress = useProgressStore()
const focusMode = useFocusMode()

watch(
  lesson,
  (l) => {
    if (l) progress.markCompleted(l.id)
  },
  { immediate: true }
)

const siblingLessons = computed(() => {
  const course = courses.value?.find((c) => c.id === lesson.value?.courseId)
  if (!course) return []
  return [...course.lessons].sort((a, b) => a.order - b.order)
})

const currentIndex = computed(() =>
  siblingLessons.value.findIndex((l) => l.id === lessonId.value)
)

const previousLesson = computed(() =>
  currentIndex.value > 0 ? siblingLessons.value[currentIndex.value - 1] : null
)

const nextLesson = computed(() => {
  const list = siblingLessons.value
  const i = currentIndex.value
  return i !== -1 && i < list.length - 1 ? list[i + 1] : null
})

const rootEl = ref<HTMLElement | null>(null)

// Scroll the reading pane back to the top whenever navigating between lessons.
watch(lessonId, () => {
  rootEl.value?.closest('main')?.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<template>
  <div
    ref="rootEl"
    class="mx-auto px-8 py-10 transition-[max-width] duration-200"
    :class="focusMode ? 'max-w-4xl' : 'max-w-3xl'"
  >
    <p v-if="status === 'pending'" class="text-slate-500">Loading lesson…</p>

    <p v-else-if="error" class="text-red-600 dark:text-red-400">
      Couldn't load this lesson (it may not exist, or mindspace-api isn't running on port 8080).
    </p>

    <template v-else-if="lesson">
      <div class="mb-2 flex items-center justify-between gap-4">
        <nav class="text-sm text-slate-500 dark:text-slate-400">
          {{ lesson.course.title }}
        </nav>
        <button
          type="button"
          class="hidden shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-600 dark:hover:text-emerald-400 lg:inline-flex"
          :class="{ 'border-emerald-400 text-emerald-700 dark:border-emerald-600 dark:text-emerald-400': focusMode }"
          @click="focusMode = !focusMode"
        >
          <span aria-hidden="true">{{ focusMode ? '⤢' : '⤡' }}</span>
          {{ focusMode ? 'Exit focus mode' : 'Focus mode' }}
        </button>
      </div>
      <h1 class="text-2xl font-bold">{{ lesson.title }}</h1>

      <!-- Markdown content, with syntax-highlighted TypeScript code blocks -->
      <div class="prose prose-slate mt-6 max-w-none dark:prose-invert">
        <MDC :value="lesson.content" tag="div" />
      </div>

      <!-- Previous / next lesson navigation -->
      <nav class="mt-10 flex items-stretch gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
        <NuxtLink
          v-if="previousLesson"
          :to="`/courses/${previousLesson.id}`"
          class="group flex-1 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-emerald-400 dark:border-slate-800 dark:hover:border-emerald-600"
        >
          <span class="block text-xs text-slate-500 dark:text-slate-400">← Previous</span>
          <span class="mt-0.5 block truncate font-medium text-slate-800 group-hover:text-emerald-700 dark:text-slate-200 dark:group-hover:text-emerald-400">
            {{ previousLesson.title }}
          </span>
        </NuxtLink>
        <div v-else class="flex-1" />

        <NuxtLink
          v-if="nextLesson"
          :to="`/courses/${nextLesson.id}`"
          class="group flex-1 rounded-lg border border-slate-200 p-3 text-right transition-colors hover:border-emerald-400 dark:border-slate-800 dark:hover:border-emerald-600"
        >
          <span class="block text-xs text-slate-500 dark:text-slate-400">Next →</span>
          <span class="mt-0.5 block truncate font-medium text-slate-800 group-hover:text-emerald-700 dark:text-slate-200 dark:group-hover:text-emerald-400">
            {{ nextLesson.title }}
          </span>
        </NuxtLink>
        <div v-else class="flex-1" />
      </nav>
    </template>
  </div>
</template>
