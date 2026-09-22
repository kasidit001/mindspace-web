<script setup lang="ts">
import { ArrowLeft, ArrowRight, BookOpen, Check, Unplug } from '@lucide/vue'

definePageMeta({ layout: 'course' })

const route = useRoute()
const lessonId = computed(() => route.params.lessonId as string)

const { data: lesson, status, error } = useLesson(lessonId)
const { data: courses } = useCourses()
const progress = useProgressStore()
const sidebarCollapsed = useSidebarCollapsed()
const { t, lang } = useLanguage()

// Thai is a partial translation layered on English — fall back whenever a
// lesson has no Thai copy yet (see ~/utils/localizedLesson).
const lessonTitle = computed(() =>
  lesson.value ? pickLocalized(lesson.value.titleEn, lesson.value.titleTh, lang.value) : ''
)
const lessonContent = computed(() =>
  lesson.value ? pickLocalized(lesson.value.contentEn, lesson.value.contentTh, lang.value) : ''
)

// Completion is an explicit action (the "Mark as Read" button below the
// content) — it used to fire automatically the instant a lesson loaded,
// which counted a lesson as done whether or not anyone actually read it.
function markAsRead() {
  if (lesson.value) progress.markCompleted(lesson.value.id)
}

const hasLab = computed(() => !!lesson.value?.labs?.length)
const labPassed = ref(false)
// A lesson with a lab can only be marked read once its tests pass; one
// without a lab keeps the old self-reported behavior.
const canMarkAsRead = computed(() => !hasLab.value || labPassed.value)

watch(lessonId, () => {
  labPassed.value = false
})

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
  const words = lessonContent.value.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
})

// Avoid a hydration mismatch: progress is localStorage-backed and only
// known once mounted on the client.
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
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
    class="mx-auto px-4 py-10 transition-[max-width] duration-200 sm:px-6"
    :class="sidebarCollapsed ? 'max-w-[960px]' : 'max-w-[820px]'"
  >
    <!-- Reader card, floating over the workspace canvas -->
    <div class="card p-6 sm:p-10">
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

      <div v-else-if="error" class="rounded-md border border-critical-200 bg-critical-50 p-6 text-center dark:border-critical-900/50 dark:bg-critical-900/20">
        <Unplug :size="28" :stroke-width="1.75" class="mx-auto text-critical-500 dark:text-critical-400" aria-hidden="true" />
        <p class="mt-2 font-medium text-critical-700 dark:text-critical-400">{{ t('lesson.loadError') }}</p>
        <p class="mt-1 text-sm text-critical-600/80 dark:text-critical-400/70">
          {{ t('lesson.loadErrorBody') }}
        </p>
      </div>

      <template v-else-if="lesson">
        <div class="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
          <span class="sm:hidden">{{ lesson.course.title }}</span>
          <span class="hidden sm:inline" aria-hidden="true">·</span>
          <span class="inline-flex items-center gap-1.5">
            <BookOpen :size="14" :stroke-width="1.75" />
            {{ t('lesson.minRead', { count: readingMinutes }) }}
          </span>
        </div>
        <h1 class="font-display text-2xl font-bold tracking-tight sm:text-3xl">{{ lessonTitle }}</h1>

        <!-- Markdown content, with syntax-highlighted TypeScript code blocks -->
        <div class="prose prose-zinc mt-6 max-w-none dark:prose-invert">
          <MDC :value="lessonContent" tag="div" />
        </div>

        <!-- Code Lab: a real exercise (or several) to solve, not just prose
             to skim. Every lab's tests must pass before "Mark as Read"
             unlocks below. -->
        <CodeLab
          v-if="hasLab"
          class="mt-6"
          :labs="lesson.labs!"
          @passed="labPassed = true"
        />

        <!-- Explicit completion — the only way a lesson gets marked done,
             so "completed" actually reflects the learner's own judgment
             (and, for lessons with a lab, actually solving it) rather than
             the page merely having loaded. -->
        <div class="mt-8 border-t border-divider pt-6 text-center dark:border-divider-dark">
          <button
            v-if="!(mounted && progress.isCompleted(lesson.id))"
            type="button"
            class="btn-primary inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
            :disabled="!canMarkAsRead"
            @click="markAsRead"
          >
            <Check :size="16" :stroke-width="2" />
            {{ t('lesson.markAsRead') }}
          </button>
          <p v-else class="inline-flex items-center gap-2 text-sm font-medium text-success-700 dark:text-success-400">
            <Check :size="16" :stroke-width="2" />
            {{ t('lesson.markedAsRead') }}
          </p>
          <p v-if="hasLab && !canMarkAsRead" class="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {{ t('lab.gateNotice') }}
          </p>
        </div>

        <!-- Previous / next lesson navigation -->
        <nav class="mt-10 flex items-stretch gap-4 border-t border-divider pt-6 dark:border-divider-dark">
          <NuxtLink
            v-if="previousLesson"
            :to="`/courses/${previousLesson.id}`"
            class="group flex-1 rounded-md border border-divider p-3 text-left transition-colors hover:border-accent-600 dark:border-divider-dark dark:hover:border-accent-400"
          >
            <span class="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <ArrowLeft :size="12" :stroke-width="1.75" />
              {{ t('lesson.previous') }}
            </span>
            <span class="mt-0.5 block truncate font-medium text-zinc-800 group-hover:text-accent-700 dark:text-zinc-200 dark:group-hover:text-accent-400">
              {{ pickLocalized(previousLesson.titleEn, previousLesson.titleTh, lang) }}
            </span>
          </NuxtLink>
          <div v-else class="flex-1" />

          <NuxtLink
            v-if="nextLesson"
            :to="`/courses/${nextLesson.id}`"
            class="group flex-1 rounded-md border border-divider p-3 text-right transition-colors hover:border-accent-600 dark:border-divider-dark dark:hover:border-accent-400"
          >
            <span class="flex items-center justify-end gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              {{ t('lesson.next') }}
              <ArrowRight :size="12" :stroke-width="1.75" />
            </span>
            <span class="mt-0.5 block truncate font-medium text-zinc-800 group-hover:text-accent-700 dark:text-zinc-200 dark:group-hover:text-accent-400">
              {{ pickLocalized(nextLesson.titleEn, nextLesson.titleTh, lang) }}
            </span>
          </NuxtLink>
          <div v-else class="flex-1" />
        </nav>
      </template>
    </div>
  </div>
</template>
