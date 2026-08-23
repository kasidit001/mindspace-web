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

// Rough estimate — word count over a 200wpm reading pace, matching the
// convention on most docs/blog sites. Not meant to be precise.
const readingMinutes = computed(() => {
  const words = lesson.value?.content.trim().split(/\s+/).filter(Boolean).length ?? 0
  return Math.max(1, Math.round(words / 200))
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
    :class="focusMode ? 'max-w-[880px]' : 'max-w-[720px]'"
  >
    <!-- Loading skeleton -->
    <div v-if="status === 'pending'" class="animate-pulse space-y-4">
      <div class="h-3 w-32 rounded-md bg-zinc-200 dark:bg-white/10" />
      <div class="h-8 w-2/3 rounded-md bg-zinc-200 dark:bg-white/10" />
      <div class="mt-8 space-y-3">
        <div class="h-4 w-full rounded-md bg-zinc-100 dark:bg-white/[0.06]" />
        <div class="h-4 w-full rounded-md bg-zinc-100 dark:bg-white/[0.06]" />
        <div class="h-4 w-5/6 rounded-md bg-zinc-100 dark:bg-white/[0.06]" />
      </div>
    </div>

    <div v-else-if="error" class="rounded-md border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
      <p class="text-3xl" aria-hidden="true">🔌</p>
      <p class="mt-2 font-medium text-red-700 dark:text-red-400">Couldn't load this lesson</p>
      <p class="mt-1 text-sm text-red-600/80 dark:text-red-400/70">
        It may not exist, or mindspace-api isn't running on port 8080.
      </p>
    </div>

    <template v-else-if="lesson">
      <div class="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
        <span class="sm:hidden">{{ lesson.course.title }}</span>
        <span class="hidden sm:inline" aria-hidden="true">·</span>
        <span>{{ readingMinutes }} min read</span>
      </div>
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ lesson.title }}</h1>

      <!-- Markdown content, with syntax-highlighted TypeScript code blocks -->
      <div class="prose prose-zinc mt-6 max-w-none dark:prose-invert">
        <MDC :value="lesson.content" tag="div" />
      </div>

      <!-- Previous / next lesson navigation -->
      <nav class="mt-10 flex items-stretch gap-4 border-t border-divider pt-6 dark:border-divider-dark">
        <NuxtLink
          v-if="previousLesson"
          :to="`/courses/${previousLesson.id}`"
          class="group flex-1 rounded-md border border-divider p-3 text-left transition-colors hover:border-accent-400 dark:border-divider-dark dark:hover:border-accent-600"
        >
          <span class="block text-xs text-zinc-500 dark:text-zinc-400">← Previous</span>
          <span class="mt-0.5 block truncate font-medium text-zinc-800 group-hover:text-accent-700 dark:text-zinc-200 dark:group-hover:text-accent-400">
            {{ previousLesson.title }}
          </span>
        </NuxtLink>
        <div v-else class="flex-1" />

        <NuxtLink
          v-if="nextLesson"
          :to="`/courses/${nextLesson.id}`"
          class="group flex-1 rounded-md border border-divider p-3 text-right transition-colors hover:border-accent-400 dark:border-divider-dark dark:hover:border-accent-600"
        >
          <span class="block text-xs text-zinc-500 dark:text-zinc-400">Next →</span>
          <span class="mt-0.5 block truncate font-medium text-zinc-800 group-hover:text-accent-700 dark:text-zinc-200 dark:group-hover:text-accent-400">
            {{ nextLesson.title }}
          </span>
        </NuxtLink>
        <div v-else class="flex-1" />
      </nav>
    </template>
  </div>
</template>
