<script setup lang="ts">
const { exchanges, ask } = useChatAsk()
const open = useChatDrawerOpen()

const question = ref('')
const scrollEl = ref<HTMLElement | null>(null)

function scrollToBottom() {
  scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
}

// Auto-scroll whenever the conversation changes: a new question is added,
// an answer streams in, or pending/error state flips.
watch(exchanges, () => nextTick(scrollToBottom), { deep: true })

// Also jump to the latest message when the drawer is (re)opened.
watch(open, (isOpen) => {
  if (isOpen) nextTick(scrollToBottom)
})

async function submit() {
  const q = question.value
  if (!q.trim()) return
  question.value = ''
  await ask(q)
}
</script>

<template>
  <!-- Floating toggle button -->
  <button
    type="button"
    class="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-glow-indigo transition hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500"
    @click="open = !open"
  >
    <span aria-hidden="true">✨</span>
    <span>{{ open ? 'Close' : 'Ask AI Tutor' }}</span>
  </button>

  <!-- Backdrop -->
  <div
    v-if="open"
    class="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
    @click="open = false"
  />

  <!-- Floating glass drawer -->
  <aside
    class="glass-strong fixed inset-y-4 right-4 z-40 flex w-full max-w-sm flex-col rounded-2xl shadow-2xl transition-all duration-300"
    :class="open ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0'"
  >
    <header class="flex items-center gap-3 border-b border-zinc-200/70 px-4 py-3.5 dark:border-white/10">
      <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm shadow-glow-indigo">
        ✨
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="text-sm font-semibold text-zinc-900 dark:text-white">AI Tutor</h2>
        <p class="truncate text-xs text-zinc-500 dark:text-zinc-400">Grounded in your lessons</p>
      </div>
      <button
        type="button"
        class="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        aria-label="Close AI tutor"
        @click="open = false"
      >
        ✕
      </button>
    </header>

    <div ref="scrollEl" class="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-4">
      <!-- Friendly welcome state -->
      <div v-if="exchanges.length === 0" class="rounded-xl border border-dashed border-zinc-200 p-4 text-sm dark:border-white/10">
        <p class="font-medium text-zinc-800 dark:text-zinc-100">👋 Hey, I'm your AI tutor.</p>
        <p class="mt-1.5 text-zinc-500 dark:text-zinc-400">
          Ask me anything about the lessons — I'll answer grounded in the actual course content,
          with citations back to where it came from.
        </p>
      </div>

      <div v-for="ex in exchanges" :key="ex.id" class="space-y-2">
        <div class="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 px-3.5 py-2 text-sm text-white">
          {{ ex.question }}
        </div>

        <div class="max-w-[90%] rounded-2xl rounded-bl-md bg-zinc-100 px-3.5 py-2.5 text-sm text-zinc-800 dark:bg-white/[0.06] dark:text-zinc-100">
          <!-- Skeleton loading state while waiting for the AI response -->
          <div v-if="ex.pending" class="space-y-2 py-0.5" aria-label="Waiting for answer">
            <div class="h-3 w-4/5 animate-pulse rounded bg-zinc-300 dark:bg-white/15" />
            <div class="h-3 w-3/5 animate-pulse rounded bg-zinc-300 dark:bg-white/15" style="animation-delay: 100ms" />
            <div class="h-3 w-2/5 animate-pulse rounded bg-zinc-300 dark:bg-white/15" style="animation-delay: 200ms" />
          </div>
          <p v-else-if="ex.error" class="text-red-600 dark:text-red-400">{{ ex.error }}</p>
          <template v-else>
            <p class="whitespace-pre-wrap">{{ ex.answer }}</p>
            <div v-if="ex.references.length" class="mt-3 border-t border-zinc-200 pt-2 dark:border-white/10">
              <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                References
              </p>
              <ul class="space-y-1">
                <li v-for="ref in ex.references" :key="ref.lessonId">
                  <NuxtLink
                    :to="`/courses/${ref.lessonId}`"
                    class="text-xs text-indigo-600 underline decoration-dotted hover:text-indigo-500 dark:text-indigo-400"
                    @click="open = false"
                  >
                    {{ ref.courseTitle }} — {{ ref.lessonTitle }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </div>
    </div>

    <form class="flex items-end gap-2 border-t border-zinc-200/70 p-3 dark:border-white/10" @submit.prevent="submit">
      <textarea
        v-model="question"
        rows="1"
        placeholder="Ask about this course…"
        class="flex-1 resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
        @keydown.enter.exact.prevent="submit"
      />
      <button
        type="submit"
        class="shrink-0 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 px-3.5 py-2 text-sm font-semibold text-white hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
        :disabled="!question.trim()"
      >
        Send
      </button>
    </form>
  </aside>
</template>
