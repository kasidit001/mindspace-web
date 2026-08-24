<script setup lang="ts">
import { ArrowRight, Bot, Check, Code2, Command, Moon, Rocket, Sprout, Sun, Zap } from '@lucide/vue'

// Landing page has no shared layout (no sidebar/chat chrome) — it's the
// public entry point; /courses is where the actual app lives.
const { theme, toggle: toggleTheme } = useTheme()
const { data: courses } = useCourses()

const previewCourses = computed(() => (courses.value ?? []).slice(0, 2))

function firstLessonId(course: { lessons: { id: string; order: number }[] }): string | null {
  return [...course.lessons].sort((a, b) => a.order - b.order)[0]?.id ?? null
}

const levelIcon = {
  Beginner: Sprout,
  Intermediate: Zap,
  Advanced: Rocket
} as const

const features = [
  {
    icon: Bot,
    title: 'AI tutor, grounded in the material',
    body: 'Ask anything about a lesson. Answers cite the exact lessons they came from — no hallucinated APIs.'
  },
  {
    icon: Code2,
    title: 'Real, highlighted TypeScript',
    body: 'Every code block is syntax-highlighted, copy-ready, and numbered — rendered straight from lesson Markdown.'
  },
  {
    icon: Check,
    title: 'Progress that sticks',
    body: 'Lessons you finish are checked off automatically, so you always know exactly where you left off.'
  },
  {
    icon: Command,
    title: 'Find anything instantly',
    body: 'A Cmd+K spotlight search jumps straight to any lesson, or hands your question to the AI tutor.'
  }
]
</script>

<template>
  <div class="min-h-screen bg-canvas text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <!-- Nav -->
    <header class="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <span class="font-semibold tracking-tight">Mindspace</span>
      <div class="flex items-center gap-4">
        <button
          type="button"
          class="rounded-md border border-divider p-1.5 text-sm transition-colors hover:border-zinc-300 dark:border-divider-dark dark:hover:border-white/20"
          :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <component :is="theme === 'dark' ? Sun : Moon" :size="16" :stroke-width="1.75" />
        </button>
        <NuxtLink
          to="/courses"
          class="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        >
          Explore Courses
          <ArrowRight :size="14" :stroke-width="1.75" />
        </NuxtLink>
      </div>
    </header>

    <!-- Hero -->
    <section class="px-6 pb-24 pt-16 sm:pt-24">
      <div class="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="reveal text-center lg:text-left" style="--delay: 0s">
          <p class="font-mono text-xs font-medium uppercase tracking-[0.2em] text-accent-600 dark:text-accent-400">
            TypeScript · AI-Powered
          </p>
          <h1 class="text-balance mt-4 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Master TypeScript with an AI Tutor by your side.
          </h1>
          <p class="mx-auto mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400 lg:mx-0">
            Structured lessons, syntax-highlighted code, and an AI that actually knows the material —
            answers come with citations back to the lesson they're grounded in.
          </p>

          <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <NuxtLink
              to="/courses"
              class="w-full rounded-md bg-accent-600 px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-accent-700 sm:w-auto"
            >
              Start Learning Free
            </NuxtLink>
            <NuxtLink
              to="/courses"
              class="w-full rounded-md border border-divider px-6 py-2.5 text-base font-semibold text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-divider-dark dark:text-zinc-100 dark:hover:bg-white/5 sm:w-auto"
            >
              Explore Courses
            </NuxtLink>
          </div>
        </div>

        <!-- AI Tutor interactive demo — a JetBrains-style editor/terminal card
             frame (traffic lights, filename tab, mono prompt). Always dark,
             independent of the page theme, like an embedded code editor.
             It's a real preview of the actual chat UI, not a functional
             widget — it hands off to the live one in /courses. -->
        <NuxtLink
          to="/courses"
          class="reveal group block overflow-hidden rounded-md border border-divider-dark bg-canvas-dark font-mono text-white transition-colors hover:border-ai-600"
          style="--delay: 0.1s"
        >
          <div class="flex items-center gap-2 border-b border-divider-dark bg-white/[0.03] px-3 py-2.5">
            <span class="flex gap-1.5" aria-hidden="true">
              <span class="size-2.5 rounded-full bg-[#FF5F57]" />
              <span class="size-2.5 rounded-full bg-[#FEBC2E]" />
              <span class="size-2.5 rounded-full bg-[#28C840]" />
            </span>
            <span class="ml-1.5 text-xs text-zinc-400">ai-assistant.ts</span>
            <span class="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-zinc-400">preview</span>
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
            Try it yourself
            <ArrowRight :size="12" :stroke-width="1.75" />
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Course grid showcase -->
    <section v-if="previewCourses.length" class="mx-auto max-w-6xl px-6 pb-24">
      <div class="mb-6 flex items-end justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Start with a course</h2>
        <NuxtLink to="/courses" class="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:underline dark:text-accent-400">
          View all
          <ArrowRight :size="14" :stroke-width="1.75" />
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NuxtLink
          v-for="course in previewCourses"
          :key="course.id"
          :to="firstLessonId(course) ? `/courses/${firstLessonId(course)}` : '/courses'"
          class="flex items-center gap-4 rounded-md border border-divider p-5 transition-colors hover:border-accent-400 dark:border-divider-dark dark:hover:border-accent-600"
        >
          <span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 dark:bg-white/[0.06]">
            <component :is="levelIcon[getCourseLevel(course)]" :size="18" :stroke-width="1.75" />
          </span>
          <div class="min-w-0 flex-1">
            <h3 class="truncate font-semibold">{{ course.title }}</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">
              {{ course.lessons.length }} lesson{{ course.lessons.length === 1 ? '' : 's' }}
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
          class="rounded-md border border-divider p-5 transition-colors hover:border-accent-400 dark:border-divider-dark dark:hover:border-accent-600"
        >
          <div class="flex size-10 items-center justify-center rounded-md bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-400">
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
        Ready to dive in?
        <NuxtLink to="/courses" class="inline-flex items-center gap-1 font-semibold text-accent-600 hover:underline dark:text-accent-400">
          Open the courses
          <ArrowRight :size="14" :stroke-width="1.75" />
        </NuxtLink>
      </p>
    </footer>
  </div>
</template>
