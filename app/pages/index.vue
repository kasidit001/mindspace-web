<script setup lang="ts">
import { ArrowRight, Bot, Check, Code2, Command, Menu, Moon, Rocket, Search, Sprout, Sun, X, Zap } from '@lucide/vue'
import { TECH_LABELS, type TechId } from '~/utils/courseTech'

// Landing page has no shared layout (no sidebar/chat chrome) — it's the
// public entry point; /courses is where the actual app lives.
//
// "Atelier" redesign: retires the previous "Dossier" identity's bold
// editorial-showreel treatment (dark glowing hero, HUD telemetry labels,
// gamified benchmark cards, a busy isometric hero illustration) in favor
// of a quiet, unhurried layout — one serif display face, a single
// restrained accent, and generous whitespace standing in for density.
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

// A quiet "by the numbers" line — three real figures from the catalog,
// replacing the old gamified benchmark cards. No invented comparisons.
const totalCourses = computed(() => courses.value?.length ?? 0)
const totalLessons = computed(() => (courses.value ?? []).reduce((sum, c) => sum + c.lessons.length, 0))
const totalTech = computed(() => ecosystem.length)
</script>

<template>
  <div class="min-h-screen bg-canvas text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <!-- Nav — sticky, quiet paper tone, a real search trigger (opens the
         shared Cmd+K palette) standing in for a decorative search box. -->
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

    <!-- Hero — quiet, centered, type-led. No dark glowing panel, no
         illustration competing with the headline: the one thing that
         should draw the eye here is the sentence itself. -->
    <section class="reveal px-6 pb-20 pt-20 text-center sm:pb-28 sm:pt-28" style="--delay: 0s">
      <span class="inline-flex items-center gap-2 rounded-full border border-divider px-3 py-1 text-xs font-medium text-zinc-500 dark:border-divider-dark dark:text-zinc-400">
        {{ t('landing.badgeVerb') }} <span class="text-zinc-400 dark:text-zinc-500">{{ t('landing.badgeTerm') }}</span>
      </span>
      <h1 class="font-display text-balance mx-auto mt-7 max-w-3xl text-[2.5rem] font-medium leading-[1.12] tracking-tight sm:text-6xl">
        {{ t('landing.heroTitle') }} <span class="accent-phrase text-accent-600 dark:text-accent-400">for humans.</span>
      </h1>
      <p class="text-balance mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
        {{ t('landing.heroBody') }}
      </p>

      <div class="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <NuxtLink to="/courses" class="btn-primary w-full rounded-full px-6 py-2.5 text-sm font-semibold sm:w-auto">
          {{ t('landing.startLearningFree') }}
        </NuxtLink>
        <NuxtLink
          to="/courses"
          class="group inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        >
          {{ t('landing.exploreCourses') }}
          <ArrowRight :size="14" :stroke-width="2" class="transition-transform group-hover:translate-x-1" />
        </NuxtLink>
      </div>
    </section>

    <!-- Ecosystem — a single quiet row of the real logos this platform
         teaches, no scatter/rotation, no telemetry label. -->
    <section class="mx-auto max-w-4xl px-6 pb-16 sm:pb-20">
      <p class="text-center text-xs font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-600">
        {{ t('landing.ecosystemLabel') }}
      </p>
      <ul class="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-6">
        <li v-for="tech in ecosystem" :key="tech">
          <span class="flex flex-col items-center gap-1.5 opacity-70 grayscale transition-all duration-200 hover:opacity-100 hover:grayscale-0">
            <TechLogo :tech="tech" :size="32" />
            <span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-500">{{ TECH_LABELS[tech] }}</span>
          </span>
        </li>
      </ul>
    </section>

    <!-- How it works — a quiet bordered panel (not a dark glowing one): a
         step counter in plain text, one confident claim, and a real
         endpoint shown bare, cycling automatically. -->
    <section class="px-6 pb-16 sm:pb-20">
      <div class="card mx-auto max-w-2xl px-6 py-12 text-center sm:px-10">
        <p class="text-xs font-medium tracking-[0.1em] text-accent-600 dark:text-accent-400">
          {{ String(activeStep + 1).padStart(2, '0') }} / {{ String(methodSteps.length).padStart(2, '0') }}
        </p>
        <div v-for="(step, i) in methodSteps" v-show="i === activeStep" :key="step.title">
          <h2 class="font-display mt-3 text-xl font-medium tracking-tight sm:text-2xl">
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
         course grid. Badges are quiet outline chips now, not bright fills. -->
    <section v-if="courses?.length" class="relative mx-auto max-w-6xl px-6 pb-20">
      <div class="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <h2 class="font-display text-2xl font-medium tracking-tight sm:text-3xl">{{ t('landing.startWithACourse') }}</h2>
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
            <span class="inline-flex items-center gap-1.5 rounded-full border border-divider px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:border-divider-dark dark:text-zinc-300">
              <component :is="levelIcon[getCourseLevel(course)]" :size="13" :stroke-width="2" />
              {{ t(levelLabelKey[getCourseLevel(course)]) }}
            </span>
            <span class="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
              {{ course.lessons.length }} {{ t(course.lessons.length === 1 ? 'common.lesson' : 'common.lessons') }}
            </span>
          </div>

          <div>
            <h3 class="font-display text-lg font-medium tracking-tight">{{ course.title }}</h3>
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

    <!-- By the numbers — three quiet real figures, replacing the old
         gamified benchmark cards. One serif number per stat, no bars,
         no tags, no comparison chart. -->
    <section class="border-y border-divider px-6 py-14 dark:border-divider-dark sm:py-16">
      <div class="mx-auto grid max-w-4xl grid-cols-1 gap-10 text-center sm:grid-cols-3">
        <div>
          <p class="font-display text-4xl font-medium tracking-tight sm:text-5xl">{{ totalCourses }}</p>
          <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Courses, Beginner to Advanced</p>
        </div>
        <div>
          <p class="font-display text-4xl font-medium tracking-tight sm:text-5xl">{{ totalLessons }}</p>
          <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Lessons across the catalog</p>
        </div>
        <div>
          <p class="font-display text-4xl font-medium tracking-tight sm:text-5xl">{{ totalTech }}</p>
          <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Technologies taught</p>
        </div>
      </div>
    </section>

    <!-- Feature sequence — one confident claim per full-width row, a
         quiet serif numeral in place of the old monospace HUD label. -->
    <section class="relative mx-auto max-w-4xl divide-y divide-divider px-6 dark:divide-divider-dark">
      <article
        v-for="(feature, i) in features"
        :key="feature.title"
        class="grid grid-cols-1 gap-3 py-10 sm:grid-cols-[5rem_1fr] sm:gap-8 sm:py-12"
      >
        <p class="font-display text-2xl font-medium text-zinc-300 dark:text-zinc-700">0{{ i + 1 }}</p>
        <div>
          <h3 class="font-display text-2xl font-medium tracking-tight sm:text-3xl">{{ feature.title }}</h3>
          <p class="mt-2.5 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">{{ feature.body }}</p>
        </div>
      </article>
    </section>

    <!-- Closing banner — quiet centered block, thin border, no filled
         color panel. -->
    <section class="mx-auto max-w-2xl px-6 py-20 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.15em] text-accent-700 dark:text-accent-400">{{ t('landing.ctaEyebrow') }}</p>
      <p class="font-display mt-2 text-2xl font-medium tracking-tight sm:text-3xl">{{ t('landing.ctaTitle') }}</p>
      <p class="mx-auto mt-2.5 max-w-md text-sm text-zinc-600 dark:text-zinc-400">{{ t('landing.ctaBody') }}</p>
      <NuxtLink to="/courses" class="btn-primary mt-7 inline-block rounded-full px-7 py-3 text-base font-semibold">
        {{ t('landing.ctaButton') }}
      </NuxtLink>
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
