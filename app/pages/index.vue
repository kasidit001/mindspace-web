<script setup lang="ts">
import { ArrowRight, Bot, Check, Code2, Command, Moon, Rocket, Search, Sprout, Sun, Zap } from '@lucide/vue'

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

// Ecosystem strip — the actual JS/TS tooling learners end up using, not
// fabricated customer logos.
const ecosystem = ['TypeScript', 'JavaScript', 'React', 'Node.js', 'Next.js', 'Vue']
</script>

<template>
  <div class="min-h-screen bg-canvas text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <!-- Nav — sticky, white/near-white, a real search trigger (opens the
         shared Cmd+K palette) standing in for Coursera's "What do you want
         to learn?" bar. -->
    <header class="sticky top-0 z-20 border-b border-divider bg-canvas/85 backdrop-blur-md dark:border-divider-dark dark:bg-canvas-dark/85">
      <div class="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3.5 sm:gap-5">
        <AppLogo class="shrink-0" />

        <nav class="hidden shrink-0 items-center gap-5 text-sm font-medium text-zinc-600 dark:text-zinc-300 md:flex">
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
    </header>

    <!-- Hero — the first thing anyone sees, so it carries the most design
         weight on the page. Premium-SaaS conventions over the earlier
         "promo banner" treatment: one confident typographic move instead of
         several competing decorative ones (dot-grid pattern, two equal
         pill buttons), a lot more resting space around every element, and a
         restrained two-tone gradient with a soft vignette instead of a flat
         fill — the kind of quiet polish that reads as considered rather
         than templated. -->
    <section class="px-6 pt-14 sm:pt-20">
      <div
        class="reveal relative mx-auto max-w-6xl overflow-hidden rounded-[2.25rem] bg-gradient-to-b from-accent-600 to-ai-900 px-6 py-20 dark:from-accent-700 dark:to-ai-900 sm:px-12 sm:py-28"
        style="--delay: 0s; box-shadow: 0 40px 80px -32px rgb(49 46 129 / 0.45), 0 1px 0 0 rgb(255 255 255 / 0.08) inset;"
      >
        <!-- Decorative layer only, clipped to the banner's own corners so
             it never interferes with the content/shadow layer below. Two
             soft, low-opacity glows and a faint top vignette read as
             ambient light rather than a "pattern" — no dot-grid texture,
             which skewed more playful/gamified than premium-corporate. -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.25rem]" aria-hidden="true">
          <div class="absolute -top-24 left-1/4 size-[28rem] rounded-full bg-white/[0.07] blur-[100px]" />
          <div class="absolute -bottom-40 -right-24 size-[32rem] rounded-full bg-ai-300/20 blur-[110px]" />
          <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </div>

        <div class="relative z-10 grid items-center gap-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <div class="text-center lg:text-left">
            <span class="inline-flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-2.5 pr-3.5 text-[13px] font-medium text-indigo-50 ring-1 ring-inset ring-white/15">
              <span class="size-1.5 shrink-0 rounded-full bg-success-400" />
              {{ t('landing.badgeVerb') }} <span class="text-white/60">{{ t('landing.badgeTerm') }}</span>
            </span>
            <h1 class="font-display text-balance mt-7 text-[2.75rem] font-semibold leading-[1.18] tracking-normal text-white sm:text-6xl lg:text-[3.4rem]">
              {{ t('landing.heroTitle') }}
            </h1>
            <p class="mx-auto mt-6 max-w-[34rem] text-balance text-lg leading-relaxed text-indigo-100/80 lg:mx-0">
              {{ t('landing.heroBody') }}
            </p>

            <div class="mt-11 flex flex-col items-center gap-6 sm:flex-row sm:justify-center lg:justify-start">
              <NuxtLink
                to="/courses"
                class="w-full rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-accent-700 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_28px_-8px_rgb(0_0_0/0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_36px_-8px_rgb(0_0_0/0.4)] sm:w-auto"
              >
                {{ t('landing.startLearningFree') }}
              </NuxtLink>
              <NuxtLink
                to="/courses"
                class="group inline-flex items-center gap-1.5 text-base font-semibold text-white/90 transition-colors hover:text-white"
              >
                {{ t('landing.exploreCourses') }}
                <ArrowRight :size="16" :stroke-width="2" class="transition-transform group-hover:translate-x-1" />
              </NuxtLink>
            </div>
          </div>

          <div class="relative h-[22rem] overflow-visible rounded-2xl sm:h-[26rem]">
            <HeroGameMap :courses="courses ?? []" />
            <p class="pointer-events-none absolute -bottom-8 left-1/2 w-full -translate-x-1/2 text-center text-xs font-medium text-indigo-100/50">
              {{ t('landing.mapHint') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Ecosystem strip — the real tooling learners end up using, rendered
         as chips instead of a flat text list. Pulled close to the hero
         (small top padding, no separating rule/background change) so it
         reads as the hero's closing line, not a new section starting. -->
    <section class="mx-auto max-w-4xl px-6 pb-4 pt-5 sm:pt-6">
      <p class="text-center text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-600">
        {{ t('landing.ecosystemLabel') }}
      </p>
      <ul class="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <li v-for="tech in ecosystem" :key="tech">
          <span class="inline-block rounded-full border border-divider bg-surface px-4 py-1.5 font-display text-sm font-semibold tracking-tight text-zinc-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent-200 hover:text-accent-700 dark:border-divider-dark dark:bg-surface-dark dark:text-zinc-300 dark:hover:border-accent-400/40 dark:hover:text-accent-400">
            {{ tech }}
          </span>
        </li>
      </ul>
    </section>

    <!-- Course grid — Coursera's "New and popular" pattern: a level-filter
         pill bar over a real, filterable course grid. -->
    <section v-if="courses?.length" class="mx-auto max-w-6xl px-6 pb-20 pt-14">
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
            <span class="shrink-0 text-xs font-medium text-zinc-400 dark:text-zinc-500">
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

    <!-- Feature grid -->
    <section class="mx-auto max-w-6xl px-6 pb-24">
      <h2 class="font-display mb-8 text-center text-2xl font-bold tracking-tight sm:text-3xl">{{ t('landing.whyMindspace') }}</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div class="flex size-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-400/10 dark:text-accent-400">
            <component :is="feature.icon" :size="18" :stroke-width="1.75" />
          </div>
          <h3 class="mt-3.5 font-semibold">{{ feature.title }}</h3>
          <p class="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{{ feature.body }}</p>
        </article>
      </div>
    </section>

    <!-- Closing promo banner -->
    <section class="mx-auto max-w-6xl px-6 pb-20">
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
