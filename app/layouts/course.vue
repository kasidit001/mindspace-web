<script setup lang="ts">
import {
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Maximize2,
  Menu,
  Minimize2,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  Moon,
  User,
  X
} from '@lucide/vue'

const { data: courses, status, error, refresh, pending } = useCourses()
const route = useRoute()
const progress = useProgressStore()
const paletteOpen = useCommandPaletteOpen()
const focusMode = useFocusMode()
const chatOpen = useChatDrawerOpen()
const { theme, toggle: toggleTheme } = useTheme()

const sidebarOpen = ref(false)
const profileOpen = ref(false)
const collapsedCourses = ref(new Set<string>())

function toggleCourse(courseId: string) {
  const next = new Set(collapsedCourses.value)
  if (next.has(courseId)) next.delete(courseId)
  else next.add(courseId)
  collapsedCourses.value = next
}

// Avoid a hydration mismatch: the server never knows localStorage progress,
// so only render checkmarks/stats once mounted on the client.
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

// Close the mobile drawer / profile popover whenever the route changes.
watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
    profileOpen.value = false
  }
)

const currentLesson = computed(() => {
  const lessonId = route.params.lessonId as string | undefined
  if (!lessonId) return null
  for (const course of courses.value ?? []) {
    const lesson = course.lessons.find((l) => l.id === lessonId)
    if (lesson) return { course, lesson }
  }
  return null
})

const totalLessons = computed(() => (courses.value ?? []).reduce((n, c) => n + c.lessons.length, 0))
const completedTotal = computed(() => {
  if (!mounted.value) return 0
  return (courses.value ?? []).reduce(
    (n, c) => n + c.lessons.filter((l) => progress.isCompleted(l.id)).length,
    0
  )
})

function resetProgress() {
  progress.completed = []
  progress.persist()
}
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-canvas text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <!-- Persistent top bar: brand, breadcrumbs, spotlight search, controls -->
    <header class="flex h-12 shrink-0 items-center gap-3 border-b border-divider px-3 dark:border-divider-dark">
      <button
        type="button"
        class="text-lg leading-none text-zinc-600 dark:text-zinc-300 lg:hidden"
        aria-label="Open sidebar"
        @click="sidebarOpen = true"
      >
        <Menu :size="18" :stroke-width="1.75" />
      </button>

      <NuxtLink to="/" class="shrink-0 text-sm font-semibold tracking-tight">Mindspace</NuxtLink>

      <!-- Breadcrumbs -->
      <nav
        v-if="currentLesson"
        class="hidden min-w-0 items-center gap-1.5 truncate text-sm text-zinc-500 dark:text-zinc-400 sm:flex"
        aria-label="Breadcrumb"
      >
        <span aria-hidden="true">/</span>
        <NuxtLink to="/courses" class="shrink-0 hover:text-zinc-800 dark:hover:text-zinc-200">Courses</NuxtLink>
        <span aria-hidden="true">/</span>
        <span class="shrink-0">{{ currentLesson.course.title }}</span>
        <span aria-hidden="true">/</span>
        <span class="truncate font-medium text-zinc-800 dark:text-zinc-200">{{ currentLesson.lesson.title }}</span>
      </nav>

      <div class="flex flex-1 justify-center">
        <button
          type="button"
          class="flex w-full max-w-md items-center gap-2 rounded-md border border-divider bg-zinc-50 px-3 py-1.5 text-left text-sm text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-white dark:border-divider-dark dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:bg-white/[0.07]"
          @click="paletteOpen = true"
        >
          <Search :size="16" :stroke-width="1.75" class="shrink-0" />
          <span class="flex-1 truncate">Search lessons, or ask the AI…</span>
          <kbd class="hidden shrink-0 rounded-md border border-zinc-300 px-1.5 py-0.5 font-mono text-[10px] dark:border-zinc-600 sm:inline">⌘K</kbd>
        </button>
      </div>

      <!-- Focus mode (desktop only — on mobile the sidebar is already an overlay) -->
      <button
        type="button"
        class="hidden shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors lg:inline-flex"
        :class="focusMode
          ? 'border-accent-500 text-accent-700 dark:text-accent-400'
          : 'border-divider text-zinc-600 hover:border-zinc-300 dark:border-divider-dark dark:text-zinc-300 dark:hover:border-white/20'"
        :title="focusMode ? 'Exit focus mode' : 'Hide sidebar to focus on reading'"
        @click="focusMode = !focusMode"
      >
        <component :is="focusMode ? Minimize2 : Maximize2" :size="14" :stroke-width="1.75" />
        Focus
      </button>

      <!-- AI Assistant toggle (tool-window style, docks on desktop) -->
      <button
        type="button"
        class="shrink-0 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
        :class="chatOpen
          ? 'border-ai-500 text-ai-700 dark:text-ai-400'
          : 'border-divider text-zinc-600 hover:border-zinc-300 dark:border-divider-dark dark:text-zinc-300 dark:hover:border-white/20'"
        :title="chatOpen ? 'Close AI Assistant' : 'Open AI Assistant'"
        @click="chatOpen = !chatOpen"
      >
        <Sparkles :size="16" :stroke-width="1.75" />
        <span class="hidden sm:inline">Assistant</span>
      </button>

      <!-- Theme toggle -->
      <button
        type="button"
        class="shrink-0 rounded-md border border-divider p-1.5 text-sm text-zinc-600 transition-colors hover:border-zinc-300 dark:border-divider-dark dark:text-zinc-300 dark:hover:border-white/20"
        :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <component :is="theme === 'dark' ? Sun : Moon" :size="16" :stroke-width="1.75" />
      </button>

      <!-- Profile / progress popover -->
      <div class="relative shrink-0">
        <button
          type="button"
          class="flex size-7 items-center justify-center rounded-full bg-accent-600 text-white"
          aria-label="Your progress"
          @click="profileOpen = !profileOpen"
        >
          <User :size="16" :stroke-width="1.75" />
        </button>

        <div v-if="profileOpen" class="fixed inset-0 z-40" @click="profileOpen = false" />

        <div
          v-if="profileOpen"
          class="absolute right-0 z-50 mt-2 w-56 rounded-md border border-divider bg-canvas p-4 text-sm shadow-md dark:border-divider-dark dark:bg-canvas-dark"
        >
          <p class="font-semibold text-zinc-900 dark:text-white">Your progress</p>
          <p class="mt-1 text-zinc-500 dark:text-zinc-400">
            {{ completedTotal }}/{{ totalLessons }} lessons completed
          </p>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
            <div
              class="h-full rounded-full bg-accent-600 transition-all duration-500"
              :style="{ width: totalLessons ? `${Math.round((completedTotal / totalLessons) * 100)}%` : '0%' }"
            />
          </div>
          <button
            type="button"
            class="mt-3 w-full rounded-md border border-divider py-1.5 text-xs text-zinc-500 hover:border-red-300 hover:text-red-600 dark:border-divider-dark dark:text-zinc-400 dark:hover:border-red-800 dark:hover:text-red-400"
            @click="resetProgress"
          >
            Reset progress
          </button>
        </div>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Backdrop for the mobile sidebar drawer -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 bg-black/30 lg:hidden"
        @click="sidebarOpen = false"
      />

      <!-- Left sidebar: compact lesson tree -->
      <aside
        class="scrollbar-thin fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform overflow-y-auto border-r border-divider bg-canvas transition-transform duration-200 dark:border-divider-dark dark:bg-canvas-dark lg:static lg:z-auto lg:translate-x-0"
        :class="[
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          focusMode ? 'lg:hidden' : ''
        ]"
      >
        <div class="flex items-center justify-between border-b border-divider px-4 py-3 dark:border-divider-dark lg:hidden">
          <span class="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Courses</span>
          <button
            type="button"
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close sidebar"
            @click="sidebarOpen = false"
          >
            <X :size="16" :stroke-width="1.75" />
          </button>
        </div>

        <!-- Loading skeleton -->
        <div v-if="status === 'pending'" class="space-y-3 px-3 py-3">
          <div v-for="i in 2" :key="i" class="space-y-1.5">
            <div class="h-3 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-white/10" />
            <div
              v-for="j in 3"
              :key="j"
              class="h-5 w-full animate-pulse rounded-md bg-zinc-100 dark:bg-white/[0.06]"
              :style="{ animationDelay: `${j * 80}ms` }"
            />
          </div>
        </div>

        <div v-else-if="error" class="px-4 py-4 text-sm">
          <p class="text-red-600 dark:text-red-400">Couldn't load courses — mindspace-api may be offline.</p>
          <button
            type="button"
            class="mt-3 flex items-center gap-1.5 rounded-md border border-divider px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-accent-400 hover:text-accent-700 disabled:opacity-50 dark:border-divider-dark dark:text-zinc-300 dark:hover:border-accent-600 dark:hover:text-accent-400"
            :disabled="pending"
            @click="refresh()"
          >
            <RefreshCw :size="14" :stroke-width="1.75" />
            {{ pending ? 'Reconnecting…' : 'Reconnect API' }}
          </button>
        </div>

        <nav v-else class="px-1.5 py-2">
          <div v-for="course in courses" :key="course.id" class="mb-3">
            <button
              type="button"
              class="flex w-full items-center gap-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
              @click="toggleCourse(course.id)"
            >
              <component
                :is="collapsedCourses.has(course.id) ? ChevronRight : ChevronDown"
                :size="14"
                :stroke-width="1.75"
                class="shrink-0"
              />
              <Folder :size="14" :stroke-width="1.75" class="shrink-0" />
              <span class="truncate">{{ course.title }}</span>
            </button>
            <ul v-if="!collapsedCourses.has(course.id)">
              <li v-for="lesson in course.lessons" :key="lesson.id">
                <NuxtLink
                  :to="`/courses/${lesson.id}`"
                  class="flex items-center gap-2 border-l-2 px-2.5 py-1 text-[13px] leading-5 transition-colors duration-100"
                  :class="route.params.lessonId === lesson.id
                    ? 'border-accent-500 bg-zinc-100 font-medium text-zinc-900 dark:bg-white/[0.06] dark:text-white'
                    : 'border-transparent text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-white/[0.04]'"
                >
                  <FileText :size="14" :stroke-width="1.75" class="shrink-0 text-zinc-400 dark:text-zinc-500" />
                  <span class="flex-1 truncate">{{ lesson.order }}. {{ lesson.title }}</span>
                  <Check
                    v-if="mounted && progress.isCompleted(lesson.id)"
                    :size="14"
                    :stroke-width="1.75"
                    class="shrink-0 text-accent-600 dark:text-accent-500"
                    title="Completed"
                    aria-label="Completed"
                  />
                </NuxtLink>
              </li>
            </ul>
          </div>

          <p v-if="courses && courses.length === 0" class="px-2.5 py-1 text-sm text-zinc-500">
            No courses yet.
          </p>
        </nav>
      </aside>

      <!-- Main content -->
      <main class="scrollbar-thin min-w-0 flex-1 overflow-y-auto">
        <slot />
      </main>

      <!-- AI Assistant — a real docked panel on desktop (pushes content,
           doesn't cover it), an overlay drawer on mobile. -->
      <ChatDrawer />
    </div>
  </div>
</template>
