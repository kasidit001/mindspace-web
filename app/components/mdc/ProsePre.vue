<script setup lang="ts">
import { CheckCircle2, Copy } from '@lucide/vue'

// Overrides @nuxtjs/mdc's default <ProsePre> to render a "dark terminal"
// card — traffic lights, filename tab, line numbers, copy button — always
// dark regardless of the page theme (the literal `dark` class below forces
// shiki's --shiki-dark variant via the `.dark .shiki` rule in tailwind.css,
// the same trick the landing-page terminal mockup uses). Auto-picked up
// because it lives at ~/components/mdc/ProsePre.vue (see @nuxtjs/mdc's
// component-override convention).
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
  <div class="dark group my-0 overflow-hidden rounded-xl border border-divider-dark bg-canvas-dark font-mono text-white">
    <!-- Terminal titlebar: traffic lights + filename tab + copy button -->
    <div class="flex items-center gap-2 border-b border-divider-dark bg-white/[0.03] px-3 py-2">
      <span class="flex shrink-0 gap-1.5" aria-hidden="true">
        <span class="size-2.5 rounded-full bg-[#FF5F57]" />
        <span class="size-2.5 rounded-full bg-[#FEBC2E]" />
        <span class="size-2.5 rounded-full bg-[#28C840]" />
      </span>
      <span v-if="filename || language" class="ml-1 truncate text-xs text-zinc-400">{{ filename || language }}</span>
      <button
        type="button"
        class="ml-auto flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[0.7rem] text-zinc-400 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 hover:text-white"
        :class="copied ? 'text-ai-400' : ''"
        @click="copy"
      >
        <component :is="copied ? CheckCircle2 : Copy" :size="13" :stroke-width="1.75" />
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>

    <pre
      :class="[$props.class, 'overflow-x-auto p-3.5 text-[0.85rem] leading-relaxed']"
    ><slot /></pre>
  </div>
</template>
