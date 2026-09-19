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

    <!-- Hero — a rounded gradient promo banner (Coursera's signature shape)
         instead of a full-bleed dramatic hero. The AI Tutor preview card is
         a real preview of the actual chat UI, not a functional widget — it
         hands off to the live one in /courses. -->
    <section class="px-6 pt-10 sm:pt-14">
      <div
        class="reveal relative mx-auto max-w-6xl rounded-[2rem] bg-gradient-to-br from-accent-600 via-accent-600 to-ai-700 px-6 py-14 shadow-[0_28px_64px_-24px_rgb(79,70,229,0.5)] dark:from-accent-700 dark:via-accent-700 dark:to-ai-900 sm:px-10 sm:py-20"
        style="--delay: 0s"
      >
        <!-- Decorative layer only — clipped to the banner's rounded corners
             in its own wrapper so it never clips the content layer below
             (the AI Tutor card is rotated + has its own shadow; clipping it
             against this same boundary would hard-cut its shadow/corner). -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]" aria-hidden="true">
          <div class="absolute -left-20 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
          <div class="absolute -bottom-32 -right-16 size-96 rounded-full bg-ai-300/30 blur-3xl" />
          <div
            class="absolute inset-0 opacity-[0.12]"
            style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 22px 22px;"
          />
        </div>

        <div class="relative z-10 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div class="text-center lg:text-left">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white ring-1 ring-inset ring-white/25">
              {{ t('landing.badgeVerb') }} <span class="opacity-90">{{ t('landing.badgeTerm') }}</span>
            </span>
            <h1 class="font-display text-balance mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.15rem]">
              {{ t('landing.heroTitle') }}
            </h1>
            <p class="mx-auto mt-5 max-w-lg text-base text-indigo-100/90 sm:text-lg lg:mx-0">
              {{ t('landing.heroBody') }}
            </p>

            <div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <NuxtLink
                to="/courses"
                class="w-full rounded-full bg-white px-6 py-2.5 text-base font-semibold text-accent-700 shadow-lg shadow-black/10 transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                {{ t('landing.startLearningFree') }}
              </NuxtLink>
              <NuxtLink
                to="/courses"
                class="w-full rounded-full border border-white/40 px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                {{ t('landing.exploreCourses') }}
              </NuxtLink>
            </div>
          </div>

          <div class="relative h-[22rem] overflow-visible rounded-2xl sm:h-[26rem]">
            <HeroGameMap :courses="courses ?? []" />
            <p class="pointer-events-none absolute -bottom-7 left-1/2 w-full -translate-x-1/2 text-center text-xs text-indigo-100/70">
              {{ t('landing.mapHint') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Ecosystem strip — the real tooling learners end up using, rendered
         as chips instead of a flat text list. -->
    <section class="mx-auto max-w-4xl px-6 pb-4 pt-14 sm:pt-20">
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
