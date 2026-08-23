<script setup lang="ts">
// Landing page has no shared layout (no sidebar/chat chrome) — it's the
// public entry point; /courses is where the actual app lives.
const features = [
  {
    icon: '🤖',
    title: 'AI tutor, grounded in the material',
    body: 'Ask anything about a lesson. Answers cite the exact lessons they came from — no hallucinated APIs.'
  },
  {
    icon: '💡',
    title: 'Real, highlighted TypeScript',
    body: 'Every code block is syntax-highlighted and copy-ready, rendered straight from Markdown lesson content.'
  },
  {
    icon: '✓',
    title: 'Progress that sticks',
    body: 'Lessons you finish are checked off in the sidebar automatically, so you always know where you left off.'
  },
  {
    icon: '⌘',
    title: 'Find anything instantly',
    body: 'A Cmd+K spotlight search jumps straight to any lesson, or hands your question to the AI tutor.'
  }
]
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <!-- Nav -->
    <header class="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <span class="text-lg font-bold">Mindspace</span>
      <NuxtLink
        to="/courses"
        class="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        Explore Courses →
      </NuxtLink>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden px-6 pb-28 pt-16 sm:pt-24">
      <!-- Ambient glow backdrop -->
      <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center" aria-hidden="true">
        <div class="h-[32rem] w-[32rem] rounded-full bg-emerald-400/30 blur-[120px] dark:bg-emerald-500/20" />
      </div>

      <div class="mx-auto max-w-3xl text-center">
        <h1 class="text-balance text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          Master TypeScript with an
          <span class="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">AI Tutor</span>
          by your side.
        </h1>
        <p class="mx-auto mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-400">
          Structured lessons, syntax-highlighted code, and an AI that actually knows the material —
          answers come with citations back to the lesson they're grounded in.
        </p>

        <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <NuxtLink
            to="/courses"
            class="w-full rounded-full bg-emerald-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-600/30 sm:w-auto"
          >
            Start Learning Free
          </NuxtLink>
          <NuxtLink
            to="/courses"
            class="w-full rounded-full border border-slate-300 px-7 py-3.5 text-base font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900 sm:w-auto"
          >
            Explore Courses
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Feature grid -->
    <section class="mx-auto max-w-6xl px-6 pb-28">
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg dark:border-slate-800 dark:hover:border-emerald-700"
        >
          <div class="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-xl dark:bg-emerald-900/30">
            {{ feature.icon }}
          </div>
          <h2 class="mt-4 font-semibold">{{ feature.title }}</h2>
          <p class="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{{ feature.body }}</p>
        </article>
      </div>
    </section>

    <!-- Footer CTA -->
    <footer class="border-t border-slate-200 px-6 py-10 text-center dark:border-slate-800">
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Ready to dive in?
        <NuxtLink to="/courses" class="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
          Open the courses →
        </NuxtLink>
      </p>
    </footer>
  </div>
</template>
