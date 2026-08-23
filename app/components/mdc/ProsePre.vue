<script setup lang="ts">
// Overrides @nuxtjs/mdc's default <ProsePre> to add a copy-to-clipboard
// button, a filename/language chip, and line numbers (via the `line`
// attribute shiki already stamps on each line span — see tailwind.css).
// Auto-picked up because it lives at ~/components/mdc/ProsePre.vue (see
// @nuxtjs/mdc's component-override convention).
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
      class="flex items-center justify-between rounded-t border border-b-0 border-divider bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-500 dark:border-divider-dark dark:bg-white/[0.03] dark:text-zinc-400"
    >
      <span>{{ filename || language }}</span>
    </div>

    <pre
      :class="[
        $props.class,
        'overflow-x-auto rounded-md border border-divider bg-zinc-50 p-3.5 font-mono text-[0.85rem] leading-relaxed dark:border-divider-dark dark:bg-white/[0.03]',
        filename || language ? 'rounded-t-none' : ''
      ]"
    ><slot /></pre>

    <button
      type="button"
      class="absolute right-2 flex items-center gap-1 rounded-md border border-divider bg-white px-2 py-1 font-mono text-[0.7rem] text-zinc-500 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 hover:text-zinc-800 dark:border-divider-dark dark:bg-canvas-dark dark:text-zinc-400 dark:hover:text-zinc-100"
      :class="[
        filename || language ? 'top-11' : 'top-2',
        copied ? 'text-accent-600 dark:text-accent-400' : ''
      ]"
      @click="copy"
    >
      <span aria-hidden="true">{{ copied ? '✓' : '⧉' }}</span>
      {{ copied ? 'Copied' : 'Copy' }}
    </button>
  </div>
</template>
