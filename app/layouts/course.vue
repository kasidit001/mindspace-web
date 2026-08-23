<script setup lang="ts">
const { data: courses, status, error, refresh, pending } = useCourses()
const route = useRoute()
const progress = useProgressStore()
const paletteOpen = useCommandPaletteOpen()
const focusMode = useFocusMode()
const { theme, toggle: toggleTheme } = useTheme()

const sidebarOpen = ref(false)
const profileOpen = ref(false)

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
  <div class="flex h-screen flex-col overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <!-- Persistent top bar: brand, breadcrumbs, spotlight search, controls -->
    <header class="flex shrink-0 items-center gap-3 border-b border-zinc-200 px-4 py-2.5 dark:border-white/10">
      <button
        type="button"
        class="text-xl leading-none text-zinc-600 dark:text-zinc-300 lg:hidden"
        aria-label="Open sidebar"
        @click="sidebarOpen = true"
      >
        ☰
      </button>

      <NuxtLink to="/" class="shrink-0 font-bold tracking-tight">Mindspace</NuxtLink>

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
          class="flex w-full max-w-md items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-left text-sm text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:bg-white/[0.07]"
          @click="paletteOpen = true"
        >
          <span aria-hidden="true">🔎</span>
          <span class="flex-1 truncate">Search lessons, or ask the AI…</span>
          <kbd class="hidden shrink-0 rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-[10px] dark:border-zinc-600 sm:inline">⌘K</kbd>
        </button>
      </div>

      <!-- Focus mode (desktop only — on mobile the sidebar is already an overlay) -->
      <button
        type="button"
        class="hidden shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors lg:inline-flex"
        :class="focusMode
          ? 'border-emerald-400 text-emerald-700 dark:border-emerald-600 dark:text-emerald-400'
          : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-white/10 dark:text-zinc-300 dark:hover:border-white/20'"
        :title="focusMode ? 'Exit focus mode' : 'Hide sidebar to focus on reading'"
        @click="focusMode = !focusMode"
      >
        <span aria-hidden="true">{{ focusMode ? '⤢' : '⤡' }}</span>
        Focus
      </button>

      <!-- Theme toggle -->
      <button
        type="button"
        class="shrink-0 rounded-full border border-zinc-200 p-2 text-sm text-zinc-600 transition-colors hover:border-zinc-300 dark:border-white/10 dark:text-zinc-300 dark:hover:border-white/20"
        :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <span aria-hidden="true">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
      </button>

      <!-- Profile / progress popover -->
      <div class="relative shrink-0">
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-semibold text-white shadow-glow"
          aria-label="Your progress"
          @click="profileOpen = !profileOpen"
        >
          🧑‍💻
        </button>

        <div v-if="profileOpen" class="fixed inset-0 z-40" @click="profileOpen = false" />

        <div
          v-if="profileOpen"
          class="glass-strong absolute right-0 z-50 mt-2 w-56 rounded-xl p-4 text-sm shadow-xl"
        >
          <p class="font-semibold text-zinc-900 dark:text-white">Your progress</p>
          <p class="mt-1 text-zinc-500 dark:text-zinc-400">
            {{ completedTotal }}/{{ totalLessons }} lessons completed
          </p>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
            <div
              class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              :style="{ width: totalLessons ? `${Math.round((completedTotal / totalLessons) * 100)}%` : '0%' }"
            />
          </div>
          <button
            type="button"
            class="mt-3 w-full rounded-md border border-zinc-200 py-1.5 text-xs text-zinc-500 hover:border-red-300 hover:text-red-600 dark:border-white/10 dark:text-zinc-400 dark:hover:border-red-800 dark:hover:text-red-400"
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

      <!-- Left sidebar: courses & lessons -->
      <aside
        class="scrollbar-thin fixed inset-y-0 left-0 z-40 w-72 shrink-0 transform overflow-y-auto border-r border-zinc-200 bg-white transition-transform duration-200 dark:border-white/10 dark:bg-zinc-950 lg:static lg:z-auto lg:translate-x-0"
        :class="[
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          focusMode ? 'lg:hidden' : ''
        ]"
      >
        <div class="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-white/10 lg:hidden">
          <span class="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Courses</span>
          <button
            type="button"
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close sidebar"
            @click="sidebarOpen = false"
          >
            ✕
          </button>
        </div>

        <!-- Loading skeleton -->
        <div v-if="status === 'pending'" class="space-y-4 px-4 py-4">
          <div v-for="i in 2" :key="i" class="space-y-2">
            <div class="h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-white/10" />
            <div
              v-for="j in 3"
              :key="j"
              class="h-6 w-full animate-pulse rounded bg-zinc-100 dark:bg-white/[0.06]"
              :style="{ animationDelay: `${j * 80}ms` }"
            />
          </div>
        </div>

        <div v-else-if="error" class="px-4 py-4 text-sm">
          <p class="text-red-600 dark:text-red-400">Couldn't load courses — mindspace-api may be offline.</p>
          <button
            type="button"
            class="mt-3 flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:border-emerald-600 dark:hover:text-emerald-400"
            :disabled="pending"
            @click="refresh()"
          >
            <span aria-hidden="true">↻</span>
            {{ pending ? 'Reconnecting…' : 'Reconnect API' }}
          </button>
        </div>

        <nav v-else class="px-2 py-2">
          <div v-for="course in courses" :key="course.id" class="mb-4">
            <p class="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {{ course.title }}
            </p>
            <ul>
              <li v-for="lesson in course.lessons" :key="lesson.id">
                <NuxtLink
                  :to="`/courses/${lesson.id}`"
                  class="flex items-center gap-2 rounded-md border-l-2 px-2.5 py-1.5 text-sm transition-colors duration-150"
                  :class="route.params.lessonId === lesson.id
                    ? 'border-emerald-500 bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'border-transparent text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:border-white/20 dark:hover:bg-white/[0.05]'"
                >
                  <span class="flex-1 truncate">{{ lesson.order }}. {{ lesson.title }}</span>
                  <span
                    v-if="mounted && progress.isCompleted(lesson.id)"
                    class="shrink-0 text-emerald-500"
                    title="Completed"
                    aria-label="Completed"
                  >
                    ✓
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </div>

          <p v-if="courses && courses.length === 0" class="px-2 py-1 text-sm text-zinc-500">
            No courses yet.
          </p>
        </nav>
      </aside>

      <!-- Main content -->
      <main class="scrollbar-thin min-w-0 flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>

    <!-- AI chat drawer, available everywhere in the course layout -->
    <ChatDrawer />
  </div>
</template>
