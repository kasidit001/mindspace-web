<script setup lang="ts">
const { exchanges, ask } = useChatAsk()

const open = ref(false)
const question = ref('')
const scrollEl = ref<HTMLElement | null>(null)

async function submit() {
  const q = question.value
  if (!q.trim()) return
  question.value = ''
  await ask(q)
  await nextTick()
  scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
}
</script>

<template>
  <!-- Floating toggle button -->
  <button
    type="button"
    class="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500"
    @click="open = !open"
  >
    <span aria-hidden="true">💬</span>
    <span>{{ open ? 'Close' : 'Ask AI Tutor' }}</span>
  </button>

  <!-- Backdrop (mobile) -->
  <div
    v-if="open"
    class="fixed inset-0 z-30 bg-black/30 lg:hidden"
    @click="open = false"
  />

  <!-- Drawer -->
  <aside
    class="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900"
    :class="open ? 'translate-x-0' : 'translate-x-full'"
  >
    <header class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <h2 class="text-sm font-semibold text-slate-900 dark:text-white">AI Tutor</h2>
      <button
        type="button"
        class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        @click="open = false"
      >
        ✕
      </button>
    </header>

    <div ref="scrollEl" class="flex-1 space-y-4 overflow-y-auto px-4 py-4">
      <p v-if="exchanges.length === 0" class="text-sm text-slate-500 dark:text-slate-400">
        Ask a question about the course content — answers are grounded in the lessons and cite their sources.
      </p>

      <div v-for="ex in exchanges" :key="ex.id" class="space-y-2">
        <div class="ml-auto max-w-[85%] rounded-lg rounded-br-none bg-emerald-600 px-3 py-2 text-sm text-white">
          {{ ex.question }}
        </div>

        <div class="max-w-[90%] rounded-lg rounded-bl-none bg-slate-100 px-3 py-2 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100">
          <p v-if="ex.pending" class="animate-pulse text-slate-500 dark:text-slate-400">Thinking…</p>
          <p v-else-if="ex.error" class="text-red-600 dark:text-red-400">{{ ex.error }}</p>
          <template v-else>
            <p class="whitespace-pre-wrap">{{ ex.answer }}</p>
            <div v-if="ex.references.length" class="mt-3 border-t border-slate-200 pt-2 dark:border-slate-700">
              <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                References
              </p>
              <ul class="space-y-1">
                <li v-for="ref in ex.references" :key="ref.lessonId">
                  <NuxtLink
                    :to="`/courses/${ref.lessonId}`"
                    class="text-xs text-emerald-700 underline decoration-dotted hover:text-emerald-600 dark:text-emerald-400"
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

    <form class="flex items-end gap-2 border-t border-slate-200 p-3 dark:border-slate-800" @submit.prevent="submit">
      <textarea
        v-model="question"
        rows="1"
        placeholder="Ask about this course…"
        class="flex-1 resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        @keydown.enter.exact.prevent="submit"
      />
      <button
        type="submit"
        class="shrink-0 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        :disabled="!question.trim()"
      >
        Send
      </button>
    </form>
  </aside>
</template>
