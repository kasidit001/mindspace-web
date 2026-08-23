<script setup lang="ts">
// Landing page has no shared layout (no sidebar/chat chrome) — it's the
// public entry point; /courses is where the actual app lives.
const { theme, toggle: toggleTheme } = useTheme()
const { data: courses } = useCourses()

const previewCourses = computed(() => (courses.value ?? []).slice(0, 2))

function firstLessonId(course: { lessons: { id: string; order: number }[] }): string | null {
  return [...course.lessons].sort((a, b) => a.order - b.order)[0]?.id ?? null
}

const levelBadgeClass: Record<string, string> = {
  Beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  Advanced: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
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
  <div class="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <!-- Nav -->
    <header class="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <span class="font-bold tracking-tight">Mindspace</span>
      <div class="flex items-center gap-4">
        <button
          type="button"
          class="rounded-full border border-zinc-200 p-2 text-sm transition-colors hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20"
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
    <section class="bg-grain relative overflow-hidden px-6 pb-24 pt-16 sm:pt-24">
      <!-- Ambient dual-glow backdrop: emerald (learning) + indigo (AI) -->
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div class="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-[60%] rounded-full bg-emerald-400/30 blur-[120px] dark:bg-emerald-500/20" />
        <div class="absolute right-1/2 top-10 h-[26rem] w-[26rem] translate-x-[60%] rounded-full bg-indigo-400/25 blur-[120px] dark:bg-indigo-500/20" />
      </div>

      <div class="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="reveal text-center lg:text-left" style="--delay: 0s">
          <p class="font-mono text-xs font-medium uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            TypeScript · AI-Powered
          </p>
          <h1 class="text-balance mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Master TypeScript with an
            <span class="bg-gradient-to-r from-emerald-500 to-indigo-500 bg-clip-text text-transparent">AI Tutor</span>
            by your side.
          </h1>
          <p class="mx-auto mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400 lg:mx-0">
            Structured lessons, syntax-highlighted code, and an AI that actually knows the material —
            answers come with citations back to the lesson they're grounded in.
          </p>

          <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <NuxtLink
              to="/courses"
              class="group relative w-full overflow-hidden rounded-full bg-emerald-600 px-7 py-3.5 text-base font-semibold text-white shadow-glow transition hover:-translate-y-0.5 sm:w-auto"
            >
              <span class="relative z-10">Start Learning Free</span>
              <span class="absolute inset-0 -translate-x-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-transform duration-500 group-hover:translate-x-0" aria-hidden="true" />
            </NuxtLink>
            <NuxtLink
              to="/courses"
              class="w-full rounded-full border border-zinc-300 px-7 py-3.5 text-base font-semibold text-zinc-800 transition hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/15 dark:text-zinc-100 dark:hover:bg-white/5 sm:w-auto"
            >
              Explore Courses
            </NuxtLink>
          </div>
        </div>

        <!-- AI Tutor interactive demo — a real preview of the actual chat UI,
             not a functional widget: it hands off to the live one in /courses. -->
        <NuxtLink
          to="/courses"
          class="reveal glass-strong group relative block rounded-2xl p-5 shadow-2xl transition hover:-translate-y-1"
          style="--delay: 0.15s"
        >
          <header class="flex items-center gap-3 border-b border-zinc-200/70 pb-3 dark:border-white/10">
            <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm shadow-glow-indigo">✨</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold">AI Tutor</p>
              <p class="text-xs text-zinc-500 dark:text-zinc-400">Grounded in your lessons</p>
            </div>
            <span class="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-white/10 dark:text-zinc-400">preview</span>
          </header>

          <div class="space-y-3 pt-4 text-sm">
            <div class="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 px-3.5 py-2 text-white">
              What's the difference between <code class="font-mono">interface</code> and <code class="font-mono">type</code>?
            </div>
            <div class="max-w-[92%] rounded-2xl rounded-bl-md bg-zinc-100 px-3.5 py-2.5 dark:bg-white/[0.06]">
              <p>
                Both describe object shapes, but <code class="font-mono">interface</code>s can be
                re-opened and merged, while <code class="font-mono">type</code> aliases can express
                unions and other non-object shapes...
              </p>
              <p class="mt-2 border-t border-zinc-200 pt-2 text-xs text-indigo-600 dark:border-white/10 dark:text-indigo-400">
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
      <div class="mb-8 flex items-end justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Start with a course</h2>
        <NuxtLink to="/courses" class="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          View all →
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <NuxtLink
          v-for="course in previewCourses"
          :key="course.id"
          :to="firstLessonId(course) ? `/courses/${firstLessonId(course)}` : '/courses'"
          class="group relative block"
        >
          <div
            class="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-indigo-400 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-40"
            aria-hidden="true"
          />
          <div class="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-transparent group-hover:shadow-xl dark:border-white/10 dark:bg-zinc-900">
            <div class="flex items-start justify-between gap-3">
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="levelBadgeClass[getCourseLevel(course)]">
                {{ getCourseLevel(course) }}
              </span>
              <span class="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                {{ course.lessons.length }} lesson{{ course.lessons.length === 1 ? '' : 's' }}
              </span>
            </div>
            <h3 class="mt-4 text-lg font-semibold">{{ course.title }}</h3>
            <p v-if="course.description" class="mt-1.5 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
              {{ course.description }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Feature grid -->
    <section class="mx-auto max-w-6xl px-6 pb-28">
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="rounded-2xl border border-zinc-200 p-6 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg dark:border-white/10 dark:hover:border-emerald-700"
        >
          <div class="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-xl dark:bg-emerald-500/10">
            {{ feature.icon }}
          </div>
          <h2 class="mt-4 font-semibold">{{ feature.title }}</h2>
          <p class="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{{ feature.body }}</p>
        </article>
      </div>
    </section>

    <!-- Footer CTA -->
    <footer class="border-t border-zinc-200 px-6 py-10 text-center dark:border-white/10">
      <p class="text-sm text-zinc-500 dark:text-zinc-400">
        Ready to dive in?
        <NuxtLink to="/courses" class="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
          Open the courses →
        </NuxtLink>
      </p>
    </footer>
  </div>
</template>
