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

// Also jump to the latest message when the panel is (re)opened.
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
  <!-- Backdrop (mobile only — on desktop the panel docks inline, it
       doesn't need to block interaction with the rest of the page) -->
  <div
    v-if="open"
    class="fixed inset-0 z-30 bg-black/20 lg:hidden"
    @click="open = false"
  />

  <!-- Panel: fixed overlay on mobile, a real (width-animated) flex column
       on desktop — this is what keeps it from ever obstructing content. -->
  <aside
    class="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm shrink-0 translate-x-0 flex-col border-l border-divider bg-canvas transition-[width,transform] duration-200 dark:border-divider-dark dark:bg-canvas-dark lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:overflow-hidden lg:border-l"
    :class="open ? 'translate-x-0 lg:w-[360px]' : 'translate-x-full lg:w-0 lg:border-l-0'"
  >
    <div class="flex h-full w-full flex-col lg:w-[360px]">
      <header class="flex h-12 shrink-0 items-center gap-2 border-b border-divider px-3 dark:border-divider-dark">
        <span class="flex size-6 shrink-0 items-center justify-center rounded-md bg-ai-600 text-xs text-white">✨</span>
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-semibold text-zinc-900 dark:text-white">AI Assistant</h2>
        </div>
        <button
          type="button"
          class="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          aria-label="Close AI Assistant"
          @click="open = false"
        >
          ✕
        </button>
      </header>

      <div ref="scrollEl" class="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <!-- Friendly welcome state -->
        <div v-if="exchanges.length === 0" class="rounded-md border border-divider p-3 text-sm dark:border-divider-dark">
          <p class="font-medium text-zinc-800 dark:text-zinc-100">👋 Hey, I'm your AI tutor.</p>
          <p class="mt-1.5 text-zinc-500 dark:text-zinc-400">
            Ask me anything about the lessons — I'll answer grounded in the actual course content,
            with citations back to where it came from.
          </p>
        </div>

        <div v-for="ex in exchanges" :key="ex.id" class="space-y-1.5">
          <div class="ml-auto max-w-[85%] rounded-md bg-ai-600 px-3 py-2 text-sm text-white">
            {{ ex.question }}
          </div>

          <div class="max-w-[92%] rounded-md border border-divider px-3 py-2 text-sm text-zinc-800 dark:border-divider-dark dark:text-zinc-100">
            <!-- Skeleton loading state while waiting for the AI response -->
            <div v-if="ex.pending" class="space-y-2 py-0.5" aria-label="Waiting for answer">
              <div class="h-3 w-4/5 animate-pulse rounded-md bg-zinc-200 dark:bg-white/10" />
              <div class="h-3 w-3/5 animate-pulse rounded-md bg-zinc-200 dark:bg-white/10" style="animation-delay: 100ms" />
              <div class="h-3 w-2/5 animate-pulse rounded-md bg-zinc-200 dark:bg-white/10" style="animation-delay: 200ms" />
            </div>
            <p v-else-if="ex.error" class="text-red-600 dark:text-red-400">{{ ex.error }}</p>
            <template v-else>
              <p class="whitespace-pre-wrap">{{ ex.answer }}</p>
              <div v-if="ex.references.length" class="mt-2 border-t border-divider pt-2 dark:border-divider-dark">
                <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  References
                </p>
                <ul class="space-y-1">
                  <li v-for="ref in ex.references" :key="ref.lessonId">
                    <NuxtLink
                      :to="`/courses/${ref.lessonId}`"
                      class="text-xs text-ai-600 underline decoration-dotted hover:text-ai-500 dark:text-ai-400"
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

      <form class="flex items-end gap-2 border-t border-divider p-2.5 dark:border-divider-dark" @submit.prevent="submit">
        <textarea
          v-model="question"
          rows="1"
          placeholder="Ask about this course…"
          class="flex-1 resize-none rounded-md border border-divider bg-white px-2.5 py-1.5 text-sm focus:border-ai-500 focus:outline-none dark:border-divider-dark dark:bg-white/[0.04] dark:text-white"
          @keydown.enter.exact.prevent="submit"
        />
        <button
          type="submit"
          class="shrink-0 rounded-md bg-ai-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-ai-700 disabled:opacity-50"
          :disabled="!question.trim()"
        >
          Send
        </button>
      </form>
    </div>
  </aside>
</template>
