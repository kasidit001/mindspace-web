<script setup lang="ts">
import { ArrowRight, Bot, Check, Code2, Command, Menu, Moon, Rocket, Search, Sprout, Sun, X, Zap } from '@lucide/vue'
import { TECH_LABELS, type TechId } from '~/utils/courseTech'

// Landing page has no shared layout (no sidebar/chat chrome) — it's the
// public entry point; /courses is where the actual app lives.
//
// Coursera-referenced redesign: a rounded gradient promo banner in place of
// the old full-bleed 3D hero, a real search trigger (opens the same Cmd+K
// command palette the rest of the app uses) in place of a decorative search
// box, and a filterable "start with a course" grid using real course data
// instead of a fixed two-card preview.
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

const levelBadgeClass = {
  Beginner: 'bg-success-50 text-success-700 dark:bg-success-400/10 dark:text-success-400',
  Intermediate: 'bg-accent-50 text-accent-700 dark:bg-accent-400/10 dark:text-accent-400',
  Advanced: 'bg-ai-50 text-ai-700 dark:bg-ai-400/10 dark:text-ai-400'
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

// Ecosystem cloud — the reference's "plugin cloud" scene (small cards
// scattered at varied depth/rotation rather than a flat chip row),
// recreated with the real logos this platform teaches. Rotation/offset
// pairs are hardcoded per slot (not Math.random()) so the layout is
// identical between server and client render — a random value here would
// hydration-mismatch on every load.
const ecosystem: TechId[] = ['ts', 'js', 'python', 'node', 'go', 'docker', 'react', 'vue', 'nuxt', 'claude']
const CLOUD_OFFSETS = [
  { rotate: -6, y: 4 }, { rotate: 4, y: -10 }, { rotate: -3, y: 12 }, { rotate: 7, y: -2 },
  { rotate: -8, y: -6 }, { rotate: 5, y: 8 }, { rotate: -4, y: -12 }, { rotate: 8, y: 2 },
  { rotate: -5, y: 10 }, { rotate: 3, y: -4 }
]

// "How it works" stepper — the reference's "01/07" numbered-sequence
// pattern paired with a floating (no IDE chrome) code snippet, recreated
// with the platform's own real, documented endpoints (see CLAUDE.md) —
// not invented API shapes.
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

// Scroll-triggered bar growth for the dossier stat cards below — the
// reference's benchmark bars climb as the scene plays rather than sitting
// pre-filled on the first frame.
const { target: statsTarget, isInView: statsInView } = useInView()

// "Dossier" stat cards — the reference's literal benchmark-card look
// (FILE NUMBER + tag + one giant stat + a bar-chart comparison), built from
// the platform's own real numbers rather than invented competitor
// comparisons. Top 5 by lesson count so the bar chart has a real spread
// without becoming an unreadable wall of bars.
const totalCourses = computed(() => courses.value?.length ?? 0)
const totalLessons = computed(() => (courses.value ?? []).reduce((sum, c) => sum + c.lessons.length, 0))

const topCoursesByLessons = computed(() => {
  const list = [...(courses.value ?? [])].sort((a, b) => b.lessons.length - a.lessons.length).slice(0, 5)
  const max = list[0]?.lessons.length || 1
  return list.map((c) => ({ title: c.title, count: c.lessons.length, pct: Math.max(8, Math.round((c.lessons.length / max) * 100)) }))
})

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
</script>

<template>
  <div class="min-h-screen bg-canvas text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <!-- Nav — sticky, white/near-white, a real search trigger (opens the
         shared Cmd+K palette) standing in for Coursera's "What do you want
         to learn?" bar. -->
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

    <!-- Hero — the first thing anyone sees, so it carries the most design
         weight on the page. "Dossier" identity: a near-black field (not a
         colored gradient) so the one hot-pink accent glow and the HUD strip
         actually read as "the loud thing" against it, a bold display
         headline with one italic-serif accent phrase, and sharper corners
         than the old identity's rounded-pill banner. -->
    <section class="px-6 pt-8 sm:pt-12">
      <div
        class="reveal relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-canvas-dark px-6 py-16 sm:px-10 sm:py-20"
        style="--delay: 0s; box-shadow: 0 40px 80px -32px rgb(0 0 0 / 0.55), 0 1px 0 0 rgb(255 255 255 / 0.06) inset;"
      >
        <!-- Decorative layer only, clipped to the banner's own corners so
             it never interferes with the content/shadow layer below. One
             pink glow (the reference's single loud accent) + a faint top
             vignette + a touch of film grain (the reference's footage
             never reads as a flat vector fill) — no dot-grid texture, no
             second competing hue. -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden="true">
          <div class="absolute -top-24 right-1/4 size-[26rem] rounded-full bg-accent-500/25 blur-[110px]" />
          <div class="absolute -bottom-32 -left-20 size-[22rem] rounded-full bg-white/[0.05] blur-[90px]" />
          <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div
            class="absolute inset-0 opacity-[0.05] mix-blend-overlay"
            style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E&quot;);"
          />
        </div>

        <!-- HUD strip — the reference's "BAR 19.4 · 90 BPM · 50.9s" telemetry
             line made literal, pinned to the banner's top-right corner. -->
        <p class="hud pointer-events-none absolute right-6 top-5 hidden text-white/40 sm:block" aria-hidden="true">
          01 — MINDSPACE · {{ courses?.length ?? 0 }} COURSES · LIVE
        </p>

        <div class="relative z-10 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <div class="text-center lg:text-left">
            <span class="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pl-2 pr-3 text-xs font-medium text-zinc-200 ring-1 ring-inset ring-white/15">
              <span class="size-1.5 shrink-0 rounded-full bg-success-400" />
              {{ t('landing.badgeVerb') }} <span class="text-white/60">{{ t('landing.badgeTerm') }}</span>
            </span>
            <h1 class="font-display text-balance mt-5 text-[2.25rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              {{ t('landing.heroTitle') }} <span class="accent-phrase text-accent-400">for humans.</span>
            </h1>
            <p class="mx-auto mt-5 max-w-[30rem] text-balance text-base leading-relaxed text-zinc-300 lg:mx-0">
              {{ t('landing.heroBody') }}
            </p>

            <div class="mt-7 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <NuxtLink
                to="/courses"
                class="w-full rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgb(0_0_0/0.2),0_10px_28px_-8px_rgb(236_0_99/0.5)] transition-all hover:-translate-y-0.5 hover:bg-accent-400 hover:shadow-[0_1px_2px_rgb(0_0_0/0.2),0_14px_32px_-8px_rgb(236_0_99/0.6)] sm:w-auto"
              >
                {{ t('landing.startLearningFree') }}
              </NuxtLink>
              <NuxtLink
                to="/courses"
                class="group inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 transition-colors hover:text-white"
              >
                {{ t('landing.exploreCourses') }}
                <ArrowRight :size="14" :stroke-width="2" class="transition-transform group-hover:translate-x-1" />
              </NuxtLink>
            </div>
          </div>

          <div class="relative h-[17rem] overflow-visible rounded-2xl sm:h-[20rem]">
            <HeroAmbientScene />
            <HeroGameMap :courses="courses ?? []" />
            <p class="pointer-events-none absolute -bottom-6 left-1/2 w-full -translate-x-1/2 text-center text-xs font-medium text-zinc-400">
              {{ t('landing.mapHint') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Ecosystem cloud — the reference's "plugin cloud" scene: cards at
         varied depth/rotation instead of a flat chip row. Real logos,
         scattered with fixed (not random) offsets per slot. -->
    <section class="relative mx-auto max-w-4xl px-6 pb-10 pt-10 sm:pt-14">
      <p class="hud absolute right-6 top-2 text-zinc-300 dark:text-zinc-700">02 — STACK</p>
      <p class="text-center text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-600">
        {{ t('landing.ecosystemLabel') }}
      </p>
      <ul class="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-7">
        <li
          v-for="(tech, i) in ecosystem"
          :key="tech"
          class="transition-transform duration-200 hover:z-10 hover:!rotate-0 hover:!translate-y-0 hover:scale-110"
          :style="{ transform: `rotate(${CLOUD_OFFSETS[i]!.rotate}deg) translateY(${CLOUD_OFFSETS[i]!.y}px)` }"
        >
          <span class="flex flex-col items-center gap-1.5">
            <TechLogo :tech="tech" :size="40" />
            <span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-500">{{ TECH_LABELS[tech] }}</span>
          </span>
        </li>
      </ul>
    </section>

    <!-- How it works — the reference's "01/07" numbered-sequence +
         floating code-snippet pattern: a step counter, one confident
         claim, and a real endpoint shown bare (no IDE chrome), cycling
         automatically. Built from this API's own documented routes. -->
    <section class="relative overflow-hidden bg-canvas-dark px-6 py-16 sm:py-20">
      <p class="hud absolute right-6 top-5 text-white/30">03 — METHOD</p>
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute left-1/3 top-1/2 size-[20rem] -translate-y-1/2 rounded-full bg-accent-500/10 blur-[100px]" />
      </div>
      <div class="relative mx-auto max-w-2xl text-center">
        <p class="hud text-accent-400">{{ String(activeStep + 1).padStart(2, '0') }} / {{ String(methodSteps.length).padStart(2, '0') }}</p>
        <Transition name="fade" mode="out-in">
          <div :key="activeStep">
            <h2 class="font-display mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {{ methodSteps[activeStep]!.title }}
            </h2>
            <pre class="mt-6 overflow-x-auto whitespace-pre-wrap break-all text-left font-mono text-sm text-zinc-300"><span class="text-accent-400">{{ methodSteps[activeStep]!.method }}</span> {{ methodSteps[activeStep]!.path }}<template v-if="methodSteps[activeStep]!.body">
{{ methodSteps[activeStep]!.body }}</template></pre>
          </div>
        </Transition>
        <div class="mt-7 flex items-center justify-center gap-2">
          <button
            v-for="(step, i) in methodSteps"
            :key="step.title"
            type="button"
            class="h-1.5 rounded-full transition-all"
            :class="i === activeStep ? 'w-6 bg-accent-400' : 'w-1.5 bg-white/20 hover:bg-white/35'"
            :aria-label="`Step ${i + 1}: ${step.title}`"
            @click="activeStep = i"
          />
        </div>
      </div>
    </section>

    <!-- Course grid — Coursera's "New and popular" pattern: a level-filter
         pill bar over a real, filterable course grid. -->
    <section v-if="courses?.length" class="relative mx-auto max-w-6xl px-6 pb-20 pt-14">
      <p class="hud absolute right-6 top-6 text-zinc-300 dark:text-zinc-700">04 — CATALOG</p>
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

      <div v-if="filteredCourses.length" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="course in filteredCourses"
          :key="course.id"
          :to="firstLessonId(course) ? `/courses/${firstLessonId(course)}` : '/courses'"
          class="card group flex flex-col gap-4 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="levelBadgeClass[getCourseLevel(course)]"
            >
              <component :is="levelIcon[getCourseLevel(course)]" :size="13" :stroke-width="2" />
              {{ t(levelLabelKey[getCourseLevel(course)]) }}
            </span>
            <span class="hud shrink-0 text-zinc-400 dark:text-zinc-500">
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
      <p v-else class="rounded-2xl border border-dashed border-divider p-10 text-center text-sm text-zinc-500 dark:border-divider-dark dark:text-zinc-400">
        {{ t('landing.noLevelMatches') }}
      </p>
    </section>

    <!-- Stat dossier — the reference's literal "FILE NUMBER: BEN-00x"
         benchmark card, borrowed as closely as the content allows: a fixed
         pale card-stock surface regardless of site theme, a monospace file
         number top-left, a color-coded tag top-right, one giant real stat,
         and a bar-chart comparison underneath with the single relevant row
         tinted pink. Built from this catalog's own real numbers — no
         invented competitor comparisons. -->
    <section ref="statsTarget" class="relative mx-auto max-w-6xl px-6 pb-16">
      <p class="hud absolute right-6 top-0 text-zinc-300 dark:text-zinc-700">05 — DOSSIER</p>
      <h2 class="font-display mb-8 text-center text-2xl font-bold tracking-tight sm:text-3xl">{{ t('landing.whyMindspace') }}</h2>
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article class="dossier-card p-6">
          <div class="flex items-center justify-between">
            <p class="dossier-label">FILE NUMBER: CRS-01</p>
            <span class="dossier-tag bg-accent-100 text-accent-700">CATALOG</span>
          </div>
          <p class="mt-4 text-4xl font-extrabold tracking-tight">{{ totalCourses }} courses.</p>
          <p class="mt-1 text-sm text-zinc-500">Spread Beginner → Advanced, by level.</p>
          <div class="mt-5 space-y-2.5">
            <div v-for="row in levelCounts" :key="row.level" class="flex items-center gap-3 text-sm">
              <span class="w-24 shrink-0 font-medium text-zinc-600">{{ row.level }}</span>
              <span
                class="dossier-bar-track flex-1"
                :style="{ '--pct': (statsInView ? row.pct : 0) + '%', '--bar-color': row.level === 'Advanced' ? '#EC0063' : undefined }"
              />
              <span class="w-6 shrink-0 text-right font-mono text-xs text-zinc-500">{{ row.count }}</span>
            </div>
          </div>
        </article>

        <article class="dossier-card p-6">
          <div class="flex items-center justify-between">
            <p class="dossier-label">FILE NUMBER: LSN-01</p>
            <span class="dossier-tag bg-ai-100 text-ai-700">DEPTH</span>
          </div>
          <p class="mt-4 text-4xl font-extrabold tracking-tight">{{ totalLessons }} lessons.</p>
          <p class="mt-1 text-sm text-zinc-500">The 5 deepest courses in the catalog, by lesson count.</p>
          <div class="mt-5 space-y-2.5">
            <div v-for="(row, i) in topCoursesByLessons" :key="row.title" class="flex items-center gap-3 text-sm">
              <span class="w-24 shrink-0 truncate font-medium text-zinc-600">{{ row.title }}</span>
              <span
                class="dossier-bar-track flex-1"
                :style="{ '--pct': (statsInView ? row.pct : 0) + '%', '--bar-color': i === 0 ? '#EC0063' : undefined }"
              />
              <span class="w-6 shrink-0 text-right font-mono text-xs text-zinc-500">{{ row.count }}</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- Feature sequence — the reference's "FIG.0X — <one bold claim>"
         figure-caption pattern, recreated directly rather than as a
         generic icon-card grid: a small monospace figure number, one
         confident oversized statement (the feature's existing real copy,
         not a new tagline), and the supporting sentence given real room to
         breathe underneath. One per full-width row so each claim gets the
         same "one idea, fully stated" weight the reference gives every
         scene — not four equally-small tiles competing for attention. -->
    <section class="relative mx-auto max-w-4xl divide-y divide-divider border-y border-divider px-6 dark:divide-divider-dark dark:border-divider-dark">
      <p class="hud absolute -top-6 right-6 text-zinc-300 dark:text-zinc-700">06 — FEATURES</p>
      <article
        v-for="(feature, i) in features"
        :key="feature.title"
        class="grid grid-cols-1 gap-3 py-10 sm:grid-cols-[6rem_1fr] sm:gap-8 sm:py-12"
      >
        <p class="hud text-zinc-400 dark:text-zinc-600">FIG. 0{{ i + 1 }}</p>
        <div>
          <h3 class="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{{ feature.title }}</h3>
          <p class="mt-2.5 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">{{ feature.body }}</p>
        </div>
      </article>
    </section>

    <!-- Closing promo banner -->
    <section class="relative mx-auto max-w-6xl px-6 pb-20">
      <p class="hud absolute right-6 top-2 text-zinc-300 dark:text-zinc-700">07 — START</p>
      <div class="flex flex-col items-center gap-5 rounded-3xl border border-accent-100 bg-accent-50 px-6 py-10 text-center dark:border-accent-400/20 dark:bg-accent-400/[0.06] sm:flex-row sm:justify-between sm:px-10 sm:text-left">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent-700 dark:text-accent-400">{{ t('landing.ctaEyebrow') }}</p>
          <p class="font-display mt-1.5 text-xl font-bold tracking-tight">{{ t('landing.ctaTitle') }}</p>
          <p class="mt-1.5 max-w-md text-sm text-zinc-600 dark:text-zinc-400">{{ t('landing.ctaBody') }}</p>
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
