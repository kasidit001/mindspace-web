<script setup lang="ts">
import { ArrowRight, Bot, Check, Code2, Command, Moon, Rocket, Sprout, Sun, Zap } from '@lucide/vue'

// Landing page has no shared layout (no sidebar/chat chrome) — it's the
// public entry point; /courses is where the actual app lives.
const { theme, toggle: toggleTheme } = useTheme()
const { data: courses } = useCourses()
const { t } = useLanguage()
const { user, logout } = useAuth()

const previewCourses = computed(() => (courses.value ?? []).slice(0, 2))

function firstLessonId(course: { lessons: { id: string; order: number }[] }): string | null {
  return [...course.lessons].sort((a, b) => a.order - b.order)[0]?.id ?? null
}

const levelIcon = {
  Beginner: Sprout,
  Intermediate: Zap,
  Advanced: Rocket
} as const

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
  <div class="bg-dots min-h-screen bg-canvas text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <!-- Nav -->
    <header class="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <span class="font-display font-bold tracking-tight">{{ t('common.brand') }}</span>
      <div class="flex items-center gap-3">
        <LanguageSwitcher />
        <button
          type="button"
          class="rounded-md border border-divider p-1.5 text-sm transition-colors hover:border-zinc-300 dark:border-divider-dark dark:hover:border-white/20"
          :aria-label="theme === 'dark' ? t('nav.switchToLight') : t('nav.switchToDark')"
          @click="toggleTheme"
        >
          <component :is="theme === 'dark' ? Sun : Moon" :size="16" :stroke-width="1.75" />
        </button>

        <template v-if="user">
          <span class="hidden text-sm text-zinc-500 dark:text-zinc-400 sm:inline">{{ t('auth.greeting', { name: user.name }) }}</span>
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
            class="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            {{ t('auth.logIn') }}
          </NuxtLink>
          <NuxtLink to="/signup" class="btn-neon rounded-md px-4 py-1.5 text-sm font-semibold">
            {{ t('auth.signUp') }}
          </NuxtLink>
        </template>
      </div>
    </header>

    <!-- Hero -->
    <section class="px-6 pb-40 pt-16 sm:pb-48 sm:pt-24">
      <div class="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="reveal text-center lg:text-left" style="--delay: 0s">
          <!-- Key-term badge: a black terminal chip with a green border,
               standing in for the old plain-text kicker line. -->
          <span class="inline-flex items-center gap-1.5 rounded-md border border-ai-500 bg-canvas-dark px-3 py-1.5 font-mono text-xs font-medium text-ai-400">
            {{ t('landing.badgeVerb') }} <span class="text-white">{{ t('landing.badgeTerm') }}</span>
          </span>
          <h1 class="font-display text-balance mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            {{ t('landing.heroTitle') }}
          </h1>
          <p class="mx-auto mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400 lg:mx-0">
            {{ t('landing.heroBody') }}
          </p>

          <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <NuxtLink
              to="/courses"
              class="btn-neon w-full rounded-md px-6 py-2.5 text-base font-semibold sm:w-auto"
            >
              {{ t('landing.startLearningFree') }}
            </NuxtLink>
            <NuxtLink
              to="/courses"
              class="w-full rounded-md border border-divider px-6 py-2.5 text-base font-semibold text-zinc-800 transition-colors hover:border-ai-500 hover:text-ai-700 dark:border-divider-dark dark:text-zinc-100 dark:hover:border-ai-400 dark:hover:text-ai-400 sm:w-auto"
            >
              {{ t('landing.exploreCourses') }}
            </NuxtLink>
          </div>
        </div>

        <!-- AI Tutor interactive demo — a terminal card frame (traffic
             lights, filename tab, mono prompt), surrounded by a permanent
             neon-green border glow. Always dark, independent of the page
             theme, like an embedded code editor. It's a real preview of the
             actual chat UI, not a functional widget — it hands off to the
             live one in /courses. -->
        <NuxtLink
          to="/courses"
          class="reveal glow-ai group block overflow-hidden rounded-2xl border border-divider-dark bg-canvas-dark font-mono text-white transition-transform duration-200 hover:-translate-y-1"
          style="--delay: 0.1s"
        >
          <div class="flex items-center gap-2 border-b border-divider-dark bg-white/[0.03] px-3 py-2.5">
            <span class="flex gap-1.5" aria-hidden="true">
              <span class="size-2.5 rounded-full bg-[#FF5F57]" />
              <span class="size-2.5 rounded-full bg-[#FEBC2E]" />
              <span class="size-2.5 rounded-full bg-[#28C840]" />
            </span>
            <span class="ml-1.5 text-xs text-zinc-400">ai-assistant.ts</span>
            <span class="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-zinc-400">{{ t('landing.preview') }}</span>
          </div>

          <div class="space-y-3 p-4 text-[13px] leading-relaxed">
            <p>
              <span class="text-ai-400">&gt;</span>
              What's the difference between <span class="text-accent-400">interface</span> and
              <span class="text-accent-400">type</span>?
            </p>
            <p class="text-zinc-400">
              <span class="text-ai-400">#</span> Both describe object shapes, but
              <span class="text-accent-400">interface</span>s can be re-opened and merged, while
              <span class="text-accent-400">type</span> aliases can express unions and other
              non-object shapes...
              <span class="inline-block h-3.5 w-1.5 -translate-y-0.5 animate-pulse bg-ai-400 align-middle" aria-hidden="true" />
            </p>
            <p class="border-t border-white/10 pt-2.5 text-[11px] text-ai-400">
              // TypeScript for JS Programmers — Interfaces &amp; Type Aliases
            </p>
          </div>

          <div class="flex items-center justify-center gap-1 border-t border-divider-dark px-4 py-2.5 text-center text-xs font-medium text-ai-400 group-hover:underline">
            {{ t('landing.tryItYourself') }}
            <ArrowRight :size="12" :stroke-width="1.75" />
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Floating CTA card — overlaps the hero/next-section boundary via a
         negative top margin, Codecademy's classic "quick start" overlay. -->
    <div class="reveal relative z-10 mx-auto -mt-28 max-w-3xl px-6 sm:-mt-32" style="--delay: 0.2s">
      <div class="glow-accent flex flex-col items-center gap-5 rounded-2xl border border-divider bg-surface p-6 text-center dark:border-divider-dark dark:bg-surface-dark sm:flex-row sm:justify-between sm:p-8 sm:text-left">
        <div>
          <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-ai-700 dark:text-ai-400">
            {{ t('landing.ctaEyebrow') }}
          </p>
          <p class="font-display mt-1.5 text-lg font-bold tracking-tight">{{ t('landing.ctaTitle') }}</p>
          <p class="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{{ t('landing.ctaBody') }}</p>
        </div>
        <NuxtLink to="/courses" class="btn-neon w-full shrink-0 rounded-md px-6 py-2.5 text-base font-semibold sm:w-auto">
          {{ t('landing.ctaButton') }}
        </NuxtLink>
      </div>
    </div>

    <!-- Ecosystem strip — the real tooling learners end up using, not
         fabricated customer logos. Dim by default, sharpens on hover. -->
    <section class="mx-auto max-w-4xl px-6 pb-20 pt-16">
      <p class="text-center font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-600">
        {{ t('landing.ecosystemLabel') }}
      </p>
      <ul class="mt-5 flex flex-wrap items-center justify-center gap-x-9 gap-y-3">
        <li
          v-for="tech in ecosystem"
          :key="tech"
          class="font-mono text-lg font-bold tracking-tight text-zinc-400 opacity-50 transition-opacity hover:opacity-100 dark:text-zinc-500"
        >
          {{ tech }}
        </li>
      </ul>
    </section>

    <!-- Course grid showcase -->
    <section v-if="previewCourses.length" class="mx-auto max-w-6xl px-6 pb-24">
      <div class="mb-6 flex items-end justify-between">
        <h2 class="font-display text-2xl font-bold tracking-tight">{{ t('landing.startWithACourse') }}</h2>
        <NuxtLink to="/courses" class="inline-flex items-center gap-1 text-sm font-medium text-accent-700 hover:underline dark:text-accent-400">
          {{ t('landing.viewAll') }}
          <ArrowRight :size="14" :stroke-width="1.75" />
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NuxtLink
          v-for="course in previewCourses"
          :key="course.id"
          :to="firstLessonId(course) ? `/courses/${firstLessonId(course)}` : '/courses'"
          class="flex items-center gap-4 rounded-md border border-divider bg-surface p-5 transition-colors hover:border-accent-600 dark:border-divider-dark dark:bg-surface-dark dark:hover:border-accent-400"
        >
          <span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 dark:bg-white/[0.06]">
            <component :is="levelIcon[getCourseLevel(course)]" :size="18" :stroke-width="1.75" />
          </span>
          <div class="min-w-0 flex-1">
            <h3 class="truncate font-semibold">{{ course.title }}</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">
              {{ course.lessons.length }} {{ t(course.lessons.length === 1 ? 'common.lesson' : 'common.lessons') }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Feature grid -->
    <section class="mx-auto max-w-6xl px-6 pb-28">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="rounded-md border border-divider bg-surface p-5 transition-colors hover:border-accent-600 dark:border-divider-dark dark:bg-surface-dark dark:hover:border-accent-400"
        >
          <div class="flex size-10 items-center justify-center rounded-md bg-accent-50 text-accent-700 dark:bg-accent-400/10 dark:text-accent-400">
            <component :is="feature.icon" :size="18" :stroke-width="1.75" />
          </div>
          <h2 class="mt-3.5 font-semibold">{{ feature.title }}</h2>
          <p class="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{{ feature.body }}</p>
        </article>
      </div>
    </section>

    <!-- Footer CTA -->
    <footer class="border-t border-divider px-6 py-10 text-center dark:border-divider-dark">
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
