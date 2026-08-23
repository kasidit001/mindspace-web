<script setup lang="ts">
// Overrides @nuxtjs/mdc's default <ProsePre> to add a copy-to-clipboard
// button and a filename/language chip. Auto-picked up because it lives at
// ~/components/mdc/ProsePre.vue (see @nuxtjs/mdc's component-override
// convention).
const props = withDefaults(
  defineProps<{
    code?: string
    language?: string | null
    filename?: string | null
    highlights?: number[]
    meta?: string | null
    class?: string | null
  }>(),
  {
    code: '',
    language: null,
    filename: null,
    highlights: () => [],
    meta: null,
    class: null
  }
)

const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | null = null

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    if (resetTimer) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    // Clipboard API unavailable (e.g. insecure context) — fail silently.
  }
}
</script>

<template>
  <div class="group relative my-0">
    <div
      v-if="filename || language"
      class="flex items-center justify-between rounded-t-lg border border-b-0 border-slate-200 bg-slate-50 px-4 py-1.5 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
    >
      <span>{{ filename || language }}</span>
    </div>

    <pre
      :class="[
        $props.class,
        'overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed dark:border-slate-700 dark:bg-slate-900/60',
        filename || language ? 'rounded-t-none' : ''
      ]"
    ><slot /></pre>

    <button
      type="button"
      class="absolute right-2 rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-xs text-slate-500 opacity-0 shadow-sm transition-opacity focus:opacity-100 group-hover:opacity-100 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:text-slate-100"
      :class="filename || language ? 'top-11' : 'top-2'"
      @click="copy"
    >
      {{ copied ? 'Copied!' : 'Copy' }}
    </button>
  </div>
</template>
