<script setup lang="ts">
import { ArrowRight, Bot, Check, Code2, Command, Menu, Moon, Rocket, Search, Sprout, Sun, X, Zap } from '@lucide/vue'
import { TECH_LABELS, type TechId } from '~/utils/courseTech'

// Landing page has no shared layout (no sidebar/chat chrome) — it's the
// public entry point; /courses is where the actual app lives.
//
// "Constructor" redesign: a dark-mode-first, developer-focused SaaS
// dashboard aesthetic (reference: Spline.one's "Constructor UI System") —
// compact bento-grid metric cards, micro badges, a simple real-data
// sparkline, Electric Indigo as the one loud accent. Replaces "Dossier"'s
// editorial benchmark-card/HUD-telemetry treatment with an actual
// dashboard-preview panel built from this catalog's own real numbers.
const { theme, toggle: toggleTheme } = useTheme()
const { data: courses } = useCourses()
const { t } = useLanguage()
const { user, logout } = useAuth()
const paletteOpen = useCommandPaletteOpen()
// Nav links (Courses/Skill Map/Dashboard) and the Log In link are hidden
// below md/sm on the desktop header row — this is the mobile stand-in so
// they're still reachable on phones, not just via the hero CTA buttons.
const mobileMenuOpen = ref(false)

const levelIcon = {
  Beginner: Sprout,
  Intermediate: Zap,
  Advanced: Rocket
} as const

const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const
type LevelFilter = (typeof levels)[number]

const levelLabelKey: Record<LevelFilter, string> = {
  All: 'landing.filterAll',
  Beginner: 'landing.filterBeginner',
  Intermediate: 'landing.filterIntermediate',
  Advanced: 'landing.filterAdvanced'
}

const selectedLevel = ref<LevelFilter>('All')

const filteredCourses = computed(() => {
  const list = courses.value ?? []
  return selectedLevel.value === 'All' ? list : list.filter((course) => getCourseLevel(course) === selectedLevel.value)
})

function firstLessonId(course: { lessons: { id: string; order: number }[] }): string | null {
  return [...course.lessons].sort((a, b) => a.order - b.order)[0]?.id ?? null
}

// Computed (not a plain array) so titles/bodies re-translate when the
// language switches.
const features = computed(() => [
  { icon: Bot, title: t('features.aiTutor.title'), body: t('features.aiTutor.body') },
  { icon: Code2, title: t('features.highlightedCode.title'), body: t('features.highlightedCode.body') },
  { icon: Check, title: t('features.progress.title'), body: t('features.progress.body') },
  { icon: Command, title: t('features.search.title'), body: t('features.search.body') }
])

const ecosystem: TechId[] = ['ts', 'js', 'python', 'node', 'go', 'docker', 'react', 'vue', 'nuxt', 'claude']

// "How it works" stepper — a step counter and a real, documented endpoint
// shown bare (no IDE chrome), cycling automatically. Built from this API's
// own real routes (see CLAUDE.md), not invented API shapes.
interface MethodStep { title: string; method: string; path: string; body?: string }
const methodSteps: MethodStep[] = [
  { title: 'Ask anything, get a grounded answer.', method: 'POST', path: '/api/chat/ask', body: '{ "question": "...", "stream": true }' },
  { title: 'Every answer cites its source.', method: 'SSE', path: 'event: done', body: 'data: { "citations": ["..."] }' },
  { title: 'Progress checks itself off.', method: 'POST', path: '/api/lessons/:id/complete' },
  { title: '⌘K finds it in under a second.', method: 'GET', path: '/api/search?q=...' }
]
const activeStep = ref(0)
let stepTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  if (prefersReducedMotion()) return
  stepTimer = setInterval(() => {
    activeStep.value = (activeStep.value + 1) % methodSteps.length
  }, 3400)
})
onBeforeUnmount(() => {
  if (stepTimer) clearInterval(stepTimer)
})

// Real shiki syntax highlighting for every step, via the same `<MDC>`
// rendering path lesson content already uses (see courses/[lessonId].vue) —
// a markdown fence string in, real tokenized `<ProsePre>` output out. All 4
// are computed up front (not just the active one) and all 4 stay mounted
// in the template via v-show — switching steps only toggles visibility.
const stepCodeMds = computed(() =>
  methodSteps.map((step) => {
    const lines = [`${step.method} ${step.path}`, ...(step.body ? [step.body] : [])]
    return '```bash\n' + lines.join('\n') + '\n```'
  })
)

// Dashboard-preview numbers — all real, from this catalog. No invented
// metrics, no fabricated trend lines.
const { target: statsTarget, isInView: statsInView } = useInView()
const totalCourses = computed(() => courses.value?.length ?? 0)
const totalLessons = computed(() => (courses.value ?? []).reduce((sum, c) => sum + c.lessons.length, 0))
const totalTech = computed(() => ecosystem.length)

const levelCounts = computed(() => {
  const list = courses.value ?? []
  const counts = { Beginner: 0, Intermediate: 0, Advanced: 0 } as Record<ReturnType<typeof getCourseLevel>, number>
  for (const c of list) counts[getCourseLevel(c)]++
  const max = Math.max(counts.Beginner, counts.Intermediate, counts.Advanced) || 1
  return (['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => ({
    level,
    count: counts[level],
    pct: Math.max(8, Math.round((counts[level] / max) * 100))
  }))
})

// Top 5 courses by lesson count, real data — doubles as the sparkline
// series (a line chart needs an order, so "deepest first" is it) and the
// course-depth bento card's bar-chart rows.
const topCoursesByLessons = computed(() => {
  const list = [...(courses.value ?? [])].sort((a, b) => b.lessons.length - a.lessons.length).slice(0, 5)
  const max = list[0]?.lessons.length || 1
  return list.map((c) => ({ title: c.title, count: c.lessons.length, pct: Math.max(8, Math.round((c.lessons.length / max) * 100)) }))
})

// Sparkline polyline points for the hero's "Lesson Depth" bento card —
// viewBox 0 0 100 32, left-to-right, real lesson counts (not a fabricated
// time series — there's no history to chart, so this reads as a
// ranked-depth trend line instead of a literal over-time metric).
const sparklinePoints = computed(() => {
  const rows = topCoursesByLessons.value
  if (rows.length < 2) return ''
  return rows
    .map((row, i) => {
      const x = (i / (rows.length - 1)) * 100
      const y = 30 - (row.pct / 100) * 26
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})
</script>

<template>
  <div class="min-h-screen bg-canvas text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <!-- Nav — sticky, a real search trigger (opens the shared Cmd+K
         palette) standing in for a decorative search box. -->
    <header class="sticky top-0 z-20 border-b border-divider bg-canvas/85 backdrop-blur-md dark:border-divider-dark dark:bg-canvas-dark/85">
      <div class="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3.5 sm:gap-5">
        <button
          type="button"
          class="shrink-0 rounded-md border border-divider p-1.5 text-zinc-600 transition-colors hover:border-zinc-300 dark:border-divider-dark dark:text-zinc-300 dark:hover:border-white/20 md:hidden"
          :aria-label="mobileMenuOpen ? t('nav.closeSidebar') : t('nav.openSidebar')"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <component :is="mobileMenuOpen ? X : Menu" :size="18" :stroke-width="1.75" />
        </button>

        <AppLogo class="shrink-0" />

        <nav class="hidden shrink-0 items-center gap-5 text-sm font-medium text-zinc-600 dark:text-zinc-300 md:flex">
          <NuxtLink v-if="user" to="/dashboard" class="transition-colors hover:text-zinc-900 dark:hover:text-white">{{ t('dashboard.navDashboard') }}</NuxtLink>
          <NuxtLink to="/courses" class="transition-colors hover:text-zinc-900 dark:hover:text-white">{{ t('nav.courses') }}</NuxtLink>
          <NuxtLink to="/map" class="transition-colors hover:text-zinc-900 dark:hover:text-white">{{ t('nav.skillMap') }}</NuxtLink>
        </nav>

        <div class="flex flex-1 justify-center">
          <button
            type="button"
            class="flex w-full max-w-sm items-center gap-2 rounded-full border border-divider bg-zinc-50 px-3.5 py-1.5 text-left text-sm text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-white dark:border-divider-dark dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:bg-white/[0.07]"
            @click="paletteOpen = true"
          >
            <Search :size="16" :stroke-width="1.75" class="shrink-0" />
            <span class="hidden flex-1 truncate sm:inline">{{ t('nav.searchPlaceholder') }}</span>
            <kbd class="ml-auto hidden shrink-0 rounded-md border border-zinc-300 px-1.5 py-0.5 font-mono text-[10px] dark:border-zinc-600 sm:inline">⌘K</kbd>
          </button>
        </div>

        <div class="flex shrink-0 items-center gap-2.5">
          <div class="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            class="rounded-md border border-divider p-1.5 text-sm transition-colors hover:border-zinc-300 dark:border-divider-dark dark:hover:border-white/20"
            :aria-label="theme === 'dark' ? t('nav.switchToLight') : t('nav.switchToDark')"
            @click="toggleTheme"
          >
            <component :is="theme === 'dark' ? Sun : Moon" :size="16" :stroke-width="1.75" />
          </button>

          <template v-if="user">
            <span class="hidden text-sm text-zinc-500 dark:text-zinc-400 lg:inline">{{ t('auth.greeting', { name: user.name }) }}</span>
            <button
              type="button"
              class="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
              @click="logout"
            >
              {{ t('auth.logOut') }}
            </button>
          </template>
          <template v-else>
            <NuxtLink
              to="/login"
              class="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white sm:inline"
            >
              {{ t('auth.logIn') }}
            </NuxtLink>
            <NuxtLink to="/signup" class="btn-primary shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold">
              {{ t('auth.signUp') }}
            </NuxtLink>
          </template>
        </div>
      </div>

      <!-- Mobile nav panel — the md:flex nav and sm:inline Log In link above
           have no other way to reach a phone visitor, so this is their
           stand-in below md. -->
      <div v-if="mobileMenuOpen" class="border-t border-divider px-6 py-4 dark:border-divider-dark md:hidden">
        <nav class="flex flex-col gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <NuxtLink
            v-if="user"
            to="/dashboard"
            class="rounded-md px-2.5 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
            @click="mobileMenuOpen = false"
          >
            {{ t('dashboard.navDashboard') }}
          </NuxtLink>
          <NuxtLink
            to="/courses"
            class="rounded-md px-2.5 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
            @click="mobileMenuOpen = false"
          >
            {{ t('nav.courses') }}
          </NuxtLink>
          <NuxtLink
            to="/map"
            class="rounded-md px-2.5 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
            @click="mobileMenuOpen = false"
          >
            {{ t('nav.skillMap') }}
          </NuxtLink>
          <NuxtLink
            v-if="!user"
            to="/login"
            class="rounded-md px-2.5 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
            @click="mobileMenuOpen = false"
          >
            {{ t('auth.logIn') }}
          </NuxtLink>
        </nav>
        <div class="mt-3 flex items-center justify-between border-t border-divider pt-3 dark:border-divider-dark sm:hidden">
          <LanguageSwitcher />
        </div>
      </div>
    </header>

    <!-- Hero — light-first, same card language as the rest of the app
         (dashboard.vue/course.vue): headline + CTAs on the left, a real
         bento-grid dashboard-preview panel on the right instead of an
         illustration — this catalog's own numbers, rendered as metric
         cards, a real-data sparkline, micro badges. -->
    <section class="px-6 pt-8 sm:pt-12">
      <div class="reveal relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-divider bg-surface px-6 py-16 dark:border-divider-dark dark:bg-surface-dark sm:px-10 sm:py-20" style="--delay: 0s">
        <div class="relative z-10 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <div class="text-center lg:text-left">
            <span class="badge border border-divider bg-zinc-50 text-zinc-600 dark:border-divider-dark dark:bg-white/5 dark:text-zinc-300">
              <span class="size-1.5 shrink-0 rounded-full bg-lime-500" />
              {{ t('landing.badgeVerb') }} <span class="text-zinc-400 dark:text-white/50">{{ t('landing.badgeTerm') }}</span>
            </span>
            <h1 class="font-display text-balance mt-5 text-[2.25rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.1rem]">
              {{ t('landing.heroTitle') }} <span class="text-accent-600 dark:text-accent-400">for humans.</span>
            </h1>
            <p class="mx-auto mt-5 max-w-[30rem] text-balance text-base leading-relaxed text-zinc-500 dark:text-zinc-400 lg:mx-0">
              {{ t('landing.heroBody') }}
            </p>

            <div class="mt-7 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <NuxtLink to="/courses" class="btn-primary w-full rounded-lg px-5 py-2.5 text-sm font-semibold sm:w-auto">
                {{ t('landing.startLearningFree') }}
              </NuxtLink>
              <NuxtLink
                to="/courses"
                class="group inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-700 transition-colors hover:text-zinc-900 dark:text-white/90 dark:hover:text-white"
              >
                {{ t('landing.exploreCourses') }}
                <ArrowRight :size="14" :stroke-width="2" class="transition-transform group-hover:translate-x-1" />
              </NuxtLink>
            </div>
          </div>

          <!-- Bento-grid dashboard preview: two compact metric cards, one
               wide "lesson depth" sparkline card — same `.card` surface as
               every other card in the app, just smaller padding. -->
          <div class="grid grid-cols-2 gap-3">
            <div class="card p-4">
              <div class="flex items-center justify-between">
                <span class="text-xs text-zinc-500 dark:text-zinc-400">Courses</span>
                <span class="badge bg-lime-500/10 text-lime-700 dark:text-lime-400">Live</span>
              </div>
              <p class="mt-2.5 text-3xl font-bold tracking-tight">{{ totalCourses }}</p>
            </div>
            <div class="card p-4">
              <div class="flex items-center justify-between">
                <span class="text-xs text-zinc-500 dark:text-zinc-400">Lessons</span>
                <span class="badge bg-accent-500/10 text-accent-700 dark:text-accent-400">{{ totalTech }} stacks</span>
              </div>
              <p class="mt-2.5 text-3xl font-bold tracking-tight">{{ totalLessons }}</p>
            </div>

            <div class="card col-span-2 p-4">
              <div class="flex items-center justify-between">
                <span class="text-xs text-zinc-500 dark:text-zinc-400">Lesson depth, top 5 courses</span>
                <span class="badge bg-lime-500/10 text-lime-700 dark:text-lime-400">{{ topCoursesByLessons[0]?.count ?? 0 }} max</span>
              </div>
              <svg viewBox="0 0 100 32" class="mt-3 h-10 w-full overflow-visible" preserveAspectRatio="none">
                <polyline
                  :points="sparklinePoints"
                  fill="none"
                  class="stroke-lime-600 dark:stroke-lime-400"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  vector-effect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Ecosystem — a compact row of micro badges (logo + label), not a
         big-icon chip row: matches the spec's data-dense badge language. -->
    <section class="mx-auto max-w-4xl px-6 pb-10 pt-10 sm:pt-14">
      <p class="text-center text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-600">
        {{ t('landing.ecosystemLabel') }}
      </p>
      <ul class="mt-6 flex flex-wrap items-center justify-center gap-2">
        <li
          v-for="tech in ecosystem"
          :key="tech"
          class="badge border border-divider bg-white text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
        >
          <TechLogo :tech="tech" :size="14" />
          {{ TECH_LABELS[tech] }}
        </li>
      </ul>
    </section>

    <!-- How it works — a card: a step counter, one confident claim, and a
         real endpoint shown bare, cycling automatically. -->
    <section class="px-6 pb-10 sm:pb-14">
      <div class="card relative mx-auto max-w-2xl px-6 py-12 text-center sm:px-10">
        <p class="font-mono text-xs font-medium tracking-[0.1em] text-accent-600 dark:text-accent-400">
          {{ String(activeStep + 1).padStart(2, '0') }} / {{ String(methodSteps.length).padStart(2, '0') }}
        </p>
        <div v-for="(step, i) in methodSteps" v-show="i === activeStep" :key="step.title">
          <h2 class="font-display mt-4 text-xl font-bold tracking-tight sm:text-2xl">
            {{ step.title }}
          </h2>
          <div class="mt-6 text-left text-sm [&_.border-ai-500]:border-t-accent-500">
            <MDC :value="stepCodeMds[i]!" tag="div" />
          </div>
        </div>
        <div class="mt-7 flex items-center justify-center gap-2">
          <button
            v-for="(step, i) in methodSteps"
            :key="step.title"
            type="button"
            class="h-1.5 rounded-full transition-all"
            :class="i === activeStep ? 'w-6 bg-accent-500' : 'w-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-white/15 dark:hover:bg-white/25'"
            :aria-label="`Step ${i + 1}: ${step.title}`"
            @click="activeStep = i"
          />
        </div>
      </div>
    </section>

    <!-- Course grid — a level-filter pill bar over a real, filterable
         course grid. Micro badges throughout. -->
    <section v-if="courses?.length" class="relative mx-auto max-w-6xl px-6 pb-20 pt-6">
      <div class="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <h2 class="font-display text-2xl font-bold tracking-tight sm:text-3xl">{{ t('landing.startWithACourse') }}</h2>
        <NuxtLink to="/courses" class="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent-700 hover:underline dark:text-accent-400">
          {{ t('landing.viewAll') }}
          <ArrowRight :size="14" :stroke-width="1.75" />
        </NuxtLink>
      </div>

      <div class="mb-7 flex flex-wrap gap-2" role="group" :aria-label="t('landing.filterLabel')">
        <button
          v-for="level in levels"
          :key="level"
          type="button"
          class="rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
          :class="selectedLevel === level
            ? 'border-accent-600 bg-accent-600 text-white'
            : 'border-divider text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-divider-dark dark:text-zinc-400 dark:hover:border-white/20 dark:hover:text-white'"
          :aria-pressed="selectedLevel === level"
          @click="selectedLevel = level"
        >
          {{ t(levelLabelKey[level]) }}
        </button>
      </div>

      <div v-if="filteredCourses.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="course in filteredCourses"
          :key="course.id"
          :to="firstLessonId(course) ? `/courses/${firstLessonId(course)}` : '/courses'"
          class="card group flex flex-col gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-500/40"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="badge bg-accent-500/10 text-accent-700 dark:text-accent-400">
              <component :is="levelIcon[getCourseLevel(course)]" :size="12" :stroke-width="2" />
              {{ t(levelLabelKey[getCourseLevel(course)]) }}
            </span>
            <span class="font-mono text-xs text-zinc-400 dark:text-zinc-500">
              {{ course.lessons.length }} {{ t(course.lessons.length === 1 ? 'common.lesson' : 'common.lessons') }}
            </span>
          </div>

          <div>
            <h3 class="font-display text-lg font-bold tracking-tight">{{ course.title }}</h3>
            <p v-if="course.descriptionEn" class="mt-1.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              {{ course.descriptionEn }}
            </p>
          </div>

          <span class="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-accent-700 dark:text-accent-400">
            {{ t('landing.tryItYourself') }}
            <ArrowRight :size="14" :stroke-width="1.75" class="transition-transform group-hover:translate-x-0.5" />
          </span>
        </NuxtLink>
      </div>
      <p v-else class="rounded-xl border border-dashed border-divider p-10 text-center text-sm text-zinc-500 dark:border-divider-dark dark:text-zinc-400">
        {{ t('landing.noLevelMatches') }}
      </p>
    </section>

    <!-- Dashboard section — a bento-grid metric dashboard: four cards (2
         metrics + a level-breakdown bar card), all built from real catalog
         data, same `.card` surface as everywhere else. -->
    <section ref="statsTarget" class="relative w-full bg-zinc-50 px-6 py-16 dark:bg-white/[0.02] sm:py-20">
      <div class="relative mx-auto max-w-6xl">
        <h2 class="font-display mb-8 text-center text-2xl font-bold tracking-tight sm:text-3xl">{{ t('landing.whyMindspace') }}</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="card p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs text-zinc-500 dark:text-zinc-400">Courses</span>
              <span class="badge bg-lime-500/10 text-lime-700 dark:text-lime-400">Live</span>
            </div>
            <p class="mt-3 text-4xl font-extrabold tracking-tight">{{ totalCourses }}</p>
            <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Beginner → Advanced</p>
          </div>

          <div class="card p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs text-zinc-500 dark:text-zinc-400">Lessons</span>
              <span class="badge bg-accent-500/10 text-accent-700 dark:text-accent-400">Depth</span>
            </div>
            <p class="mt-3 text-4xl font-extrabold tracking-tight">{{ totalLessons }}</p>
            <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Across the catalog</p>
          </div>

          <div class="card p-5 lg:col-span-2">
            <p class="text-xs text-zinc-500 dark:text-zinc-400">By level</p>
            <div class="mt-3 space-y-2">
              <div v-for="row in levelCounts" :key="row.level" class="flex items-center gap-3 text-sm">
                <span class="w-20 shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">{{ row.level }}</span>
                <span class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                  <span
                    class="absolute inset-y-0 left-0 rounded-full bg-accent-500 transition-[width] duration-700"
                    :style="{ width: (statsInView ? row.pct : 0) + '%' }"
                  />
                </span>
                <span class="w-6 shrink-0 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">{{ row.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Feature grid — four compact bento cards instead of long-form
         editorial rows, matching the spec's "organized metric cards" vibe. -->
    <section class="relative mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <article v-for="feature in features" :key="feature.title" class="card p-6">
          <span class="flex size-9 items-center justify-center rounded-lg bg-accent-500/10 text-accent-600 dark:text-accent-400">
            <component :is="feature.icon" :size="18" :stroke-width="1.75" />
          </span>
          <h3 class="font-display mt-4 text-lg font-bold tracking-tight">{{ feature.title }}</h3>
          <p class="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{{ feature.body }}</p>
        </article>
      </div>
    </section>

    <!-- Closing banner — a card with a subtle indigo-tinted border. -->
    <section class="relative mx-auto max-w-6xl px-6 pb-20">
      <div class="card flex flex-col items-center gap-5 border-accent-500/30 px-6 py-10 text-center sm:flex-row sm:justify-between sm:px-10 sm:text-left">
        <div>
          <p class="badge bg-accent-500/10 text-accent-700 dark:text-accent-400">{{ t('landing.ctaEyebrow') }}</p>
          <p class="font-display mt-2.5 text-xl font-bold tracking-tight">{{ t('landing.ctaTitle') }}</p>
          <p class="mt-1.5 max-w-md text-sm text-zinc-500 dark:text-zinc-400">{{ t('landing.ctaBody') }}</p>
        </div>
        <NuxtLink to="/courses" class="btn-primary w-full shrink-0 rounded-full px-7 py-3 text-base font-semibold sm:w-auto">
          {{ t('landing.ctaButton') }}
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-divider px-6 py-8 text-center dark:border-divider-dark">
      <p class="text-sm text-zinc-500 dark:text-zinc-400">
        {{ t('landing.readyToDiveIn') }}
        <NuxtLink to="/courses" class="inline-flex items-center gap-1 font-semibold text-accent-700 hover:underline dark:text-accent-400">
          {{ t('landing.openTheCourses') }}
          <ArrowRight :size="14" :stroke-width="1.75" />
        </NuxtLink>
      </p>
    </footer>
  </div>
</template>
