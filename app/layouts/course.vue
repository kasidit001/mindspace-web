<script setup lang="ts">
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  Moon,
  User,
  Waypoints,
  X
} from '@lucide/vue'
import type { Course } from '~/types/course'

const { data: courses, status, error, refresh, pending } = useCourses()
const route = useRoute()
const progress = useProgressStore()
const paletteOpen = useCommandPaletteOpen()
const sidebarCollapsed = useSidebarCollapsed()
const chatOpen = useChatDrawerOpen()
const { theme, toggle: toggleTheme } = useTheme()
const { t } = useLanguage()
const { user, isAdmin, logout } = useAuth()

const sidebarOpen = ref(false)
const profileOpen = ref(false)
const collapsedCourses = ref(new Set<string>())

// Desktop sidebar collapse — independent of the mobile drawer (sidebarOpen).
// Shared state (not a local ref) since the lesson page widens its reading
// column when this is true.
function toggleSidebarCollapsed() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

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

// The reading page (the only page with a :lessonId param) scopes the
// sidebar to just that lesson's course — showing every course's full tree
// at once (the old behavior) buried the course actually being read among
// unrelated ones. map.vue/admin/index.vue reuse this same layout with no
// lessonId, so they fall back to the full multi-course browser below.
const currentCourse = computed(() => {
  const lessonId = route.params.lessonId as string | undefined
  if (!lessonId) return null
  return (courses.value ?? []).find((c) => c.lessons.some((l) => l.id === lessonId)) ?? null
})

const totalLessons = computed(() => (courses.value ?? []).reduce((n, c) => n + c.lessons.length, 0))
const completedTotal = computed(() => {
  if (!mounted.value) return 0
  return (courses.value ?? []).reduce(
    (n, c) => n + c.lessons.filter((l) => progress.isCompleted(l.id)).length,
    0
  )
})

function courseCompletedCount(course: Course): number {
  if (!mounted.value) return 0
  return course.lessons.filter((l) => progress.isCompleted(l.id)).length
}
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-canvas text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <!-- Persistent top bar: brand, breadcrumbs, spotlight search, controls -->
    <header class="flex h-12 shrink-0 items-center gap-3 border-b border-divider px-3 dark:border-divider-dark">
      <button
        type="button"
        class="text-lg leading-none text-zinc-600 dark:text-zinc-300 lg:hidden"
        :aria-label="t('nav.openSidebar')"
        @click="sidebarOpen = true"
      >
        <Menu :size="18" :stroke-width="1.75" />
      </button>

      <NuxtLink to="/" class="shrink-0">
        <AppLogo size="sm" />
      </NuxtLink>

      <div class="flex flex-1 justify-center">
        <button
          type="button"
          class="flex w-full max-w-md items-center gap-2 rounded-full border border-divider bg-zinc-50 px-3.5 py-1.5 text-left text-sm text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-white dark:border-divider-dark dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:bg-white/[0.07]"
          @click="paletteOpen = true"
        >
          <Search :size="16" :stroke-width="1.75" class="shrink-0" />
          <span class="flex-1 truncate">{{ t('nav.searchPlaceholder') }}</span>
          <kbd class="hidden shrink-0 rounded-md border border-zinc-300 px-1.5 py-0.5 font-mono text-[10px] dark:border-zinc-600 sm:inline">⌘K</kbd>
        </button>
      </div>

      <!-- AI Assistant toggle (tool-window style, docks on desktop) -->
      <button
        type="button"
        class="shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all"
        :class="chatOpen
          ? 'border-ai-500 text-ai-700 dark:text-ai-400'
          : 'border-divider text-zinc-600 hover:border-zinc-300 dark:border-divider-dark dark:text-zinc-300 dark:hover:border-white/20'"
        :title="chatOpen ? t('nav.closeAssistant') : t('nav.openAssistant')"
        @click="chatOpen = !chatOpen"
      >
        <Sparkles :size="16" :stroke-width="1.75" />
        <span class="hidden sm:inline">{{ t('nav.assistant') }}</span>
      </button>

      <!-- Language switcher -->
      <LanguageSwitcher />

      <!-- Theme toggle -->
      <button
        type="button"
        class="shrink-0 rounded-lg border border-divider p-1.5 text-sm text-zinc-600 transition-colors hover:border-zinc-300 dark:border-divider-dark dark:text-zinc-300 dark:hover:border-white/20"
        :aria-label="theme === 'dark' ? t('nav.switchToLight') : t('nav.switchToDark')"
        @click="toggleTheme"
      >
        <component :is="theme === 'dark' ? Sun : Moon" :size="16" :stroke-width="1.75" />
      </button>

      <!-- Profile / progress popover -->
      <div class="relative shrink-0">
        <button
          type="button"
          class="flex size-7 items-center justify-center rounded-full"
          :class="user
            ? 'bg-accent-500 text-[10px] font-bold text-white'
            : 'border border-ai-500/60 bg-canvas-dark text-ai-400'"
          :aria-label="t('nav.yourProgress')"
          @click="profileOpen = !profileOpen"
        >
          <template v-if="user">{{ user.name.charAt(0).toUpperCase() }}</template>
          <User v-else :size="16" :stroke-width="1.75" />
        </button>

        <div v-if="profileOpen" class="fixed inset-0 z-40" @click="profileOpen = false" />

        <div
          v-if="profileOpen"
          class="card absolute right-0 z-50 mt-2 w-64 p-4 text-sm"
        >
          <template v-if="user">
            <div class="flex items-center gap-1.5">
              <p class="truncate font-semibold text-zinc-900 dark:text-white">{{ user.name }}</p>
              <span
                class="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                :class="isAdmin
                  ? 'bg-accent-500 text-white'
                  : 'bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400'"
              >
                {{ isAdmin ? t('auth.roleAdmin') : t('auth.roleUser') }}
              </span>
            </div>
            <p class="truncate text-xs text-zinc-500 dark:text-zinc-400">{{ user.email }}</p>
            <NuxtLink
              v-if="isAdmin"
              to="/admin"
              class="mt-2 inline-block text-xs font-medium text-accent-700 hover:underline dark:text-accent-400"
            >
              {{ t('admin.title') }}
            </NuxtLink>
          </template>
          <template v-else>
            <p class="font-semibold text-zinc-900 dark:text-white">{{ t('auth.notLoggedIn') }}</p>
            <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{{ t('auth.notLoggedInBody') }}</p>
            <div class="mt-3 flex gap-2">
              <NuxtLink
                to="/login"
                class="flex-1 rounded-md border border-divider py-1.5 text-center text-xs font-medium text-zinc-600 hover:border-zinc-300 dark:border-divider-dark dark:text-zinc-300 dark:hover:border-white/20"
              >
                {{ t('auth.logIn') }}
              </NuxtLink>
              <NuxtLink
                to="/signup"
                class="flex-1 rounded-md border border-accent-600 py-1.5 text-center text-xs font-semibold text-accent-700 hover:bg-accent-50 dark:border-accent-400 dark:text-accent-400 dark:hover:bg-accent-400/10"
              >
                {{ t('auth.signUp') }}
              </NuxtLink>
            </div>
          </template>

          <hr class="my-3 border-divider dark:border-divider-dark">

          <p class="font-semibold text-zinc-900 dark:text-white">{{ t('nav.yourProgress') }}</p>
          <p class="mt-1 text-zinc-500 dark:text-zinc-400">
            {{ t('progress.lessonsCompleted', { done: completedTotal, total: totalLessons }) }}
          </p>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
            <div
              class="h-full rounded-full bg-success-500 transition-all duration-500"
              :style="{ width: totalLessons ? `${Math.round((completedTotal / totalLessons) * 100)}%` : '0%' }"
            />
          </div>
          <NuxtLink
            v-if="user"
            to="/dashboard"
            class="mt-3 block w-full rounded-md border border-divider py-1.5 text-center text-xs font-medium text-accent-700 hover:bg-accent-50 dark:border-divider-dark dark:text-accent-400 dark:hover:bg-accent-400/10"
          >
            {{ t('dashboard.navDashboard') }}
          </NuxtLink>
          <button
            v-if="user"
            type="button"
            class="mt-3 w-full rounded-md border border-divider py-1.5 text-xs text-zinc-500 hover:border-critical-300 hover:text-critical-600 dark:border-divider-dark dark:text-zinc-400 dark:hover:border-critical-800 dark:hover:text-critical-400"
            @click="logout"
          >
            {{ t('auth.logOut') }}
          </button>
        </div>
      </div>
    </header>

    <div class="relative flex flex-1 overflow-hidden">
      <!-- Backdrop for the mobile sidebar drawer -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 bg-black/30 lg:hidden"
        @click="sidebarOpen = false"
      />

      <!-- Left sidebar: compact lesson tree. Collapses on desktop by
           animating width to 0 (not display:none) so it slides shut instead
           of vanishing — sidebarCollapsed is set by either the rail toggle
           below or Focus mode. -->
      <aside
        class="scrollbar-thin fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform overflow-y-auto border-r border-divider bg-canvas transition-[transform,width] duration-200 dark:border-divider-dark dark:bg-canvas-dark lg:static lg:z-auto lg:translate-x-0"
        :class="[
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarCollapsed ? 'lg:w-0 lg:overflow-hidden lg:border-r-0' : 'lg:w-64'
        ]"
      >
        <!-- Formal index header: a fixed "table of contents" label anchoring
             the tree, rather than dropping straight into the list. When
             reading a lesson, this is a back link to the course catalog
             instead of a generic "Courses" label — the tree below is
             scoped to one course, so "back to everything" is the useful
             action here, not a heading. -->
        <div class="flex items-center justify-between border-b border-divider px-4 py-3 dark:border-divider-dark">
          <NuxtLink
            v-if="currentCourse"
            to="/courses"
            class="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 hover:text-accent-700 dark:text-zinc-600 dark:hover:text-accent-400"
          >
            <ArrowLeft :size="12" :stroke-width="2" />
            {{ t('sidebar.backToCourses') }}
          </NuxtLink>
          <span v-else class="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
            {{ t('sidebar.coursesHeading') }}
          </span>
          <NuxtLink
            to="/map"
            class="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-accent-700 hover:underline dark:text-accent-400"
            :title="t('nav.skillMap')"
          >
            <Waypoints :size="12" :stroke-width="2" />
            {{ t('nav.skillMap') }}
          </NuxtLink>
          <button
            type="button"
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 lg:hidden"
            :aria-label="t('nav.closeSidebar')"
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
          <p class="text-critical-600 dark:text-critical-400">{{ t('sidebar.loadError') }}</p>
          <button
            type="button"
            class="mt-3 flex items-center gap-1.5 rounded-md border border-divider px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-accent-600 hover:text-accent-700 disabled:opacity-50 dark:border-divider-dark dark:text-zinc-300 dark:hover:border-accent-400 dark:hover:text-accent-400"
            :disabled="pending"
            @click="refresh()"
          >
            <RefreshCw :size="14" :stroke-width="1.75" />
            {{ pending ? t('sidebar.reconnecting') : t('sidebar.reconnect') }}
          </button>
        </div>

        <!-- Reading a lesson: the tree is scoped to just that lesson's
             course, not every course at once — the old always-show-every-
             course accordion buried the one actually being read among
             unrelated ones. -->
        <nav v-else-if="currentCourse" class="px-2 py-2">
          <div class="flex items-center gap-2 px-1 py-1">
            <span class="flex-1 truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-700 dark:text-zinc-300">
              {{ currentCourse.title }}
            </span>
            <span
              v-if="mounted"
              class="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums"
              :class="courseCompletedCount(currentCourse) === currentCourse.lessons.length && currentCourse.lessons.length > 0
                ? 'bg-success-50 text-success-700 dark:bg-success-400/10 dark:text-success-400'
                : 'bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-500'"
            >
              {{ courseCompletedCount(currentCourse) }}/{{ currentCourse.lessons.length }}
            </span>
          </div>
          <CourseSidebarLessons class="mt-1" :lessons="currentCourse.lessons" />
        </nav>

        <!-- Fallback for the other pages sharing this layout (Skill Map,
             Admin) which have no single lesson/course to scope to — browse
             every course, each individually collapsible. -->
        <nav v-else class="px-2 py-1">
          <!-- Each course reads as a numbered section of a table of
               contents — index numeral instead of a folder icon, a rule
               above every section but the first for clear separation. -->
          <div
            v-for="(course, i) in courses"
            :key="course.id"
            class="border-t border-divider py-3 first:border-t-0 first:pt-2 dark:border-divider-dark"
          >
            <button
              type="button"
              class="group flex w-full items-center gap-2 px-1 py-1 text-left transition-colors"
              @click="toggleCourse(course.id)"
            >
              <span class="shrink-0 text-[10px] tabular-nums text-zinc-400 dark:text-zinc-600">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="flex-1 truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-700 group-hover:text-accent-700 dark:text-zinc-300 dark:group-hover:text-accent-400">
                {{ course.title }}
              </span>
              <span
                v-if="mounted"
                class="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums"
                :class="courseCompletedCount(course) === course.lessons.length && course.lessons.length > 0
                  ? 'bg-success-50 text-success-700 dark:bg-success-400/10 dark:text-success-400'
                  : 'bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-500'"
              >
                {{ courseCompletedCount(course) }}/{{ course.lessons.length }}
              </span>
              <component
                :is="collapsedCourses.has(course.id) ? ChevronRight : ChevronDown"
                :size="12"
                :stroke-width="2"
                class="shrink-0 text-zinc-400 dark:text-zinc-600"
              />
            </button>
            <CourseSidebarLessons v-if="!collapsedCourses.has(course.id)" class="mt-1" :lessons="course.lessons" />
          </div>

          <p v-if="courses && courses.length === 0" class="px-2.5 py-1 text-sm text-zinc-500">
            {{ t('sidebar.noCourses') }}
          </p>
        </nav>
      </aside>

      <!-- Floating rail toggle: sits right on the sidebar/content boundary
           (desktop only — the mobile drawer has its own hamburger/X), so
           it's always reachable regardless of collapsed state and slides
           along with the panel instead of jumping. -->
      <button
        type="button"
        class="absolute top-1/2 z-20 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border border-divider bg-canvas text-zinc-400 shadow-sm transition-[left] duration-200 hover:border-accent-400 hover:text-accent-700 dark:border-divider-dark dark:bg-canvas-dark dark:text-zinc-500 dark:hover:border-accent-400/60 dark:hover:text-accent-400 lg:flex"
        :style="{ left: sidebarCollapsed ? '4px' : '244px' }"
        :aria-label="sidebarCollapsed ? t('nav.openSidebar') : t('nav.closeSidebar')"
        @click="toggleSidebarCollapsed"
      >
        <component :is="sidebarCollapsed ? ChevronRight : ChevronLeft" :size="13" :stroke-width="2.5" />
      </button>

      <!-- Main content — dot-grid workbench texture behind the reader card -->
      <main class="scrollbar-thin min-w-0 flex-1 overflow-y-auto bg-canvas dark:bg-canvas-dark">
        <slot />
      </main>

      <!-- AI Assistant — a real docked panel on desktop (pushes content,
           doesn't cover it), an overlay drawer on mobile. -->
      <ChatDrawer />
    </div>
  </div>
</template>
