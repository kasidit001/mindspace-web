<script setup lang="ts">
// Landing page has no shared layout (no sidebar/chat chrome) — it's the
// public entry point; /courses is where the actual app lives.
const { theme, toggle: toggleTheme } = useTheme()
const { data: courses } = useCourses()

const previewCourses = computed(() => (courses.value ?? []).slice(0, 2))

function firstLessonId(course: { lessons: { id: string; order: number }[] }): string | null {
  return [...course.lessons].sort((a, b) => a.order - b.order)[0]?.id ?? null
}

const levelIcon: Record<string, string> = {
  Beginner: '🌱',
  Intermediate: '⚡',
  Advanced: '🚀'
}

const features = [
  {
    icon: '🤖',
    title: 'AI tutor, grounded in the material',
    body: 'Ask anything about a lesson. Answers cite the exact lessons they came from — no hallucinated APIs.'
  },
  {
    icon: '💡',
    title: 'Real, highlighted TypeScript',
    body: 'Every code block is syntax-highlighted, copy-ready, and numbered — rendered straight from lesson Markdown.'
  },
  {
    icon: '✓',
    title: 'Progress that sticks',
    body: 'Lessons you finish are checked off automatically, so you always know exactly where you left off.'
  },
  {
    icon: '⌘',
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
          class="rounded border border-divider p-1.5 text-sm transition-colors hover:border-zinc-300 dark:border-divider-dark dark:hover:border-white/20"
          :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <span aria-hidden="true">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
        </button>
        <NuxtLink
          to="/courses"
          class="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        >
          Explore Courses →
        </NuxtLink>
      </div>
    </header>

    <!-- Hero -->
    <section class="px-6 pb-24 pt-16 sm:pt-24">
      <div class="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="reveal text-center lg:text-left" style="--delay: 0s">
          <p class="font-mono text-xs font-medium uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
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
              class="w-full rounded bg-emerald-600 px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-emerald-700 sm:w-auto"
            >
              Start Learning Free
            </NuxtLink>
            <NuxtLink
              to="/courses"
              class="w-full rounded border border-divider px-6 py-2.5 text-base font-semibold text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-divider-dark dark:text-zinc-100 dark:hover:bg-white/5 sm:w-auto"
            >
              Explore Courses
            </NuxtLink>
          </div>
        </div>

        <!-- AI Tutor interactive demo — a real preview of the actual chat UI,
             not a functional widget: it hands off to the live one in /courses. -->
        <NuxtLink
          to="/courses"
          class="reveal group block rounded border border-divider p-5 transition-colors hover:border-indigo-400 dark:border-divider-dark dark:hover:border-indigo-600"
          style="--delay: 0.1s"
        >
          <header class="flex items-center gap-3 border-b border-divider pb-3 dark:border-divider-dark">
            <span class="flex size-7 shrink-0 items-center justify-center rounded bg-indigo-600 text-xs text-white">✨</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold">AI Assistant</p>
              <p class="text-xs text-zinc-500 dark:text-zinc-400">Grounded in your lessons</p>
            </div>
            <span class="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-white/10 dark:text-zinc-400">preview</span>
          </header>

          <div class="space-y-2.5 pt-4 text-sm">
            <div class="ml-auto max-w-[85%] rounded-md bg-indigo-600 px-3 py-2 text-white">
              What's the difference between <code class="font-mono">interface</code> and <code class="font-mono">type</code>?
            </div>
            <div class="max-w-[92%] rounded-md border border-divider px-3 py-2 dark:border-divider-dark">
              <p>
                Both describe object shapes, but <code class="font-mono">interface</code>s can be
                re-opened and merged, while <code class="font-mono">type</code> aliases can express
                unions and other non-object shapes...
              </p>
              <p class="mt-2 border-t border-divider pt-2 text-xs text-indigo-600 dark:border-divider-dark dark:text-indigo-400">
                TypeScript for JS Programmers — Interfaces &amp; Type Aliases
              </p>
            </div>
          </div>

          <p class="mt-4 text-center text-xs font-medium text-indigo-600 group-hover:underline dark:text-indigo-400">
            Try it yourself →
          </p>
        </NuxtLink>
      </div>
    </section>

    <!-- Course grid showcase -->
    <section v-if="previewCourses.length" class="mx-auto max-w-6xl px-6 pb-24">
      <div class="mb-6 flex items-end justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Start with a course</h2>
        <NuxtLink to="/courses" class="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          View all →
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NuxtLink
          v-for="course in previewCourses"
          :key="course.id"
          :to="firstLessonId(course) ? `/courses/${firstLessonId(course)}` : '/courses'"
          class="flex items-center gap-4 rounded border border-divider p-5 transition-colors hover:border-emerald-400 dark:border-divider-dark dark:hover:border-emerald-600"
        >
          <span class="flex size-10 shrink-0 items-center justify-center rounded bg-zinc-100 text-xl dark:bg-white/[0.06]">
            {{ levelIcon[getCourseLevel(course)] }}
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
          class="rounded border border-divider p-5 transition-colors hover:border-emerald-400 dark:border-divider-dark dark:hover:border-emerald-600"
        >
          <div class="flex size-10 items-center justify-center rounded bg-emerald-50 text-lg dark:bg-emerald-500/10">
            {{ feature.icon }}
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
        <NuxtLink to="/courses" class="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
          Open the courses →
        </NuxtLink>
      </p>
    </footer>
  </div>
</template>
