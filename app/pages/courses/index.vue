<script setup lang="ts">
import { Clock, RefreshCw, Search, SearchX, Unplug, X } from '@lucide/vue'
import type { Course } from '~/types/course'
import type { CourseCategory } from '~/utils/courseTech'
import type { CourseLevel } from '~/utils/courseLevel'

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

const levelBadgeClass: Record<CourseLevel, string> = {
  Beginner: 'bg-success-50 text-success-700 dark:bg-success-400/10 dark:text-success-400',
  Intermediate: 'bg-accent-50 text-accent-700 dark:bg-accent-400/10 dark:text-accent-400',
  Advanced: 'bg-ai-50 text-ai-700 dark:bg-ai-400/10 dark:text-ai-400'
}

const levelLabelKey: Record<CourseLevel, string> = {
  Beginner: 'courses.levelBeginner',
  Intermediate: 'courses.levelIntermediate',
  Advanced: 'courses.levelAdvanced'
}

const categoryLabelKey: Record<CourseCategory, string> = {
  frontend: 'courses.categoryFrontend',
  backend: 'courses.categoryBackend',
  devops: 'courses.categoryDevops',
  languages: 'courses.categoryLanguages',
  ai: 'courses.categoryAi'
}

const query = ref('')
const selectedCategory = ref<CourseCategory | 'all'>('all')
const selectedLevel = ref<CourseLevel | 'all'>('all')

// Only offer categories/levels that at least one course actually has, so a
// pill never leads to an empty list.
const categories = computed(() => {
  const present = new Set((courses.value ?? []).map((c) => getCourseCategory(c)))
  return (Object.keys(categoryLabelKey) as CourseCategory[]).filter((c) => present.has(c))
})
const levels = computed(() => {
  const present = new Set((courses.value ?? []).map((c) => getCourseLevel(c)))
  return (Object.keys(levelLabelKey) as CourseLevel[]).filter((l) => present.has(l))
})

const filteredCourses = computed(() => {
  const q = query.value.trim().toLowerCase()
  return (courses.value ?? []).filter((course) => {
    if (selectedCategory.value !== 'all' && getCourseCategory(course) !== selectedCategory.value) return false
    if (selectedLevel.value !== 'all' && getCourseLevel(course) !== selectedLevel.value) return false
    if (!q) return true
    const tagNames = course.tags.map((tag) => tag.name).join(' ')
    const haystack = `${course.title} ${course.descriptionEn ?? ''} ${TECH_LABELS[getCourseTech(course)]} ${tagNames}`.toLowerCase()
    return haystack.includes(q)
  })
})

const hasActiveFilters = computed(() => query.value.trim() !== '' || selectedCategory.value !== 'all' || selectedLevel.value !== 'all')

function clearFilters() {
  query.value = ''
  selectedCategory.value = 'all'
  selectedLevel.value = 'all'
}

// Sum of the per-lesson reading estimates from the API (200 wpm, same as the
// lesson page) — an honest reading-time figure, not a claimed course length.
function durationLabel(course: Course): string {
  const total = course.lessons.reduce((sum, l) => sum + (l.readingMinutes ?? 1), 0)
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (hours === 0) return t('courses.duration', { minutes })
  if (minutes === 0) return t('courses.durationHoursOnly', { hours })
  return t('courses.durationHours', { hours, minutes })
}

const pillBase = 'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors'
const pillOn = 'border-accent-600 bg-accent-600 text-white dark:border-accent-500 dark:bg-accent-500'
const pillOff = 'border-divider bg-surface text-zinc-600 hover:border-accent-200 hover:text-accent-700 dark:border-divider-dark dark:bg-surface-dark dark:text-zinc-300 dark:hover:border-accent-400/40 dark:hover:text-accent-400'
</script>

<template>
  <div class="mx-auto max-w-5xl px-6 py-14 sm:px-10">
    <h1 class="font-display text-3xl font-bold tracking-tight">{{ t('courses.title') }}</h1>
    <p class="mt-2 text-zinc-600 dark:text-zinc-400">
      {{ t('courses.subtitlePrefix') }}
      <kbd class="rounded-md border border-divider px-1 font-mono text-xs dark:border-divider-dark">⌘K</kbd>
      {{ t('courses.subtitleSuffix') }}
    </p>

    <div v-if="courses?.length" class="mt-8 space-y-4">
      <div class="relative">
        <Search :size="18" :stroke-width="1.9" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
        <input
          v-model="query"
          type="search"
          :placeholder="t('courses.searchPlaceholder')"
          :aria-label="t('courses.searchLabel')"
          class="w-full rounded-xl border border-divider bg-surface py-3 pl-11 pr-4 text-base text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 dark:border-divider-dark dark:bg-surface-dark dark:text-zinc-100"
        >
      </div>

      <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div class="flex flex-wrap items-center gap-2" role="group" :aria-label="t('courses.categoryLabel')">
          <button type="button" :class="[pillBase, selectedCategory === 'all' ? pillOn : pillOff]" @click="selectedCategory = 'all'">
            {{ t('courses.all') }}
          </button>
          <button
            v-for="category in categories"
            :key="category"
            type="button"
            :class="[pillBase, selectedCategory === category ? pillOn : pillOff]"
            @click="selectedCategory = category"
          >
            {{ t(categoryLabelKey[category]) }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2" role="group" :aria-label="t('courses.levelLabel')">
          <span class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{{ t('courses.levelLabel') }}</span>
          <button type="button" :class="[pillBase, selectedLevel === 'all' ? pillOn : pillOff]" @click="selectedLevel = 'all'">
            {{ t('courses.all') }}
          </button>
          <button
            v-for="level in levels"
            :key="level"
            type="button"
            :class="[pillBase, selectedLevel === level ? pillOn : pillOff]"
            @click="selectedLevel = level"
          >
            {{ t(levelLabelKey[level]) }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
        <span>{{ t('courses.resultCount', { count: filteredCourses.length, total: courses.length }) }}</span>
        <button v-if="hasActiveFilters" type="button" class="inline-flex items-center gap-1 font-medium text-accent-700 hover:underline dark:text-accent-400" @click="clearFilters">
          <X :size="14" :stroke-width="2" />
          {{ t('courses.clearFilters') }}
        </button>
      </div>
    </div>

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

    <!-- Cards: official tech logo, level badge, title, reading-time and
         lesson count, and a real progress bar. -->
    <div v-else-if="filteredCourses.length" class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="course in filteredCourses"
        :key="course.id"
        :to="firstLessonId(course) ? `/courses/${firstLessonId(course)}` : '/courses'"
        class="card flex flex-col p-5 transition-all duration-200"
        :class="firstLessonId(course)
          ? 'hover:-translate-y-0.5 hover:shadow-lg'
          : 'pointer-events-none opacity-60'"
      >
        <div class="flex items-start justify-between gap-2">
          <TechLogo :tech="getCourseTech(course)" :size="44" />
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="levelBadgeClass[getCourseLevel(course)]">
            {{ t(levelLabelKey[getCourseLevel(course)]) }}
          </span>
        </div>
        <h2 class="mt-4 font-semibold leading-snug">{{ course.title }}</h2>
        <ul v-if="course.tags.length" class="mt-2 flex flex-wrap gap-1.5">
          <li
            v-for="tag in course.tags"
            :key="tag.id"
            class="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-400"
          >
            {{ tag.name }}
          </li>
        </ul>
        <p class="mt-2 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <span>{{ lessonCountLabel(course) }}</span>
          <span class="inline-flex items-center gap-1">
            <Clock :size="13" :stroke-width="1.9" aria-hidden="true" />
            {{ durationLabel(course) }}
          </span>
        </p>
        <div class="mt-4 flex items-center gap-2.5">
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
            <div
              class="h-full rounded-full bg-accent-500 transition-all duration-500"
              :style="{ width: `${progressPercent(course)}%` }"
            />
          </div>
          <span v-if="mounted && progressPercent(course) > 0" class="text-xs font-semibold text-accent-700 dark:text-accent-400">
            {{ progressPercent(course) }}%
          </span>
        </div>
      </NuxtLink>
    </div>

    <div v-else-if="courses?.length" class="mt-6 flex flex-col items-center rounded-xl border border-dashed border-divider p-12 text-center dark:border-divider-dark">
      <SearchX :size="34" :stroke-width="1.75" class="text-zinc-400" aria-hidden="true" />
      <p class="mt-3 font-medium text-zinc-800 dark:text-zinc-100">{{ t('courses.noMatches') }}</p>
      <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{{ t('courses.noMatchesBody') }}</p>
      <button type="button" class="mt-4 text-sm font-medium text-accent-700 hover:underline dark:text-accent-400" @click="clearFilters">
        {{ t('courses.clearFilters') }}
      </button>
    </div>

    <p v-else class="mt-10 text-sm text-zinc-500">{{ t('courses.noCourses') }}</p>
  </div>
</template>
