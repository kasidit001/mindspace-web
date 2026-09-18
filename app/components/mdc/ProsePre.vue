<script setup lang="ts">
import { CheckCircle2, Copy } from '@lucide/vue'

// Overrides @nuxtjs/mdc's default <ProsePre> to render code as a "listing"
// plate — a thin violet top rule (the AI accent — this is the material the
// AI tutor grounds its answers in), a small-caps caption bar, then the code
// itself — instead of a macOS terminal window. Always dark (the literal
// `dark` class below forces shiki's --shiki-dark variant via the
// `.dark .shiki` rule in tailwind.css) so a code listing reads as a
// distinct exhibit regardless of the page theme. Auto-picked up because it
// lives at ~/components/mdc/ProsePre.vue (see @nuxtjs/mdc's component-
// override convention).
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
  <!-- ```mermaid fences render as an actual diagram, not as code text.
       ClientOnly because mermaid needs the DOM to lay itself out. -->
  <ClientOnly v-if="language === 'mermaid'">
    <MermaidDiagram :code="code" />
    <template #fallback>
      <div class="my-4 h-32 animate-pulse rounded-lg border border-divider bg-surface dark:border-divider-dark dark:bg-surface-dark" />
    </template>
  </ClientOnly>

  <div v-else class="dark group my-0 overflow-hidden rounded-lg border-t-[3px] border-ai-500 bg-canvas-dark text-white">
    <!-- Caption bar: small-caps "Listing" label + filename, like a plate
         caption under a figure, instead of macOS traffic lights. -->
    <div class="flex items-center gap-2.5 border-b border-white/10 px-3.5 py-2">
      <span class="font-display shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-ai-400">Listing</span>
      <span v-if="filename || language" class="truncate font-mono text-xs text-zinc-400">{{ filename || language }}</span>
      <button
        type="button"
        class="ml-auto flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-sans text-[0.7rem] uppercase tracking-wide text-zinc-500 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 hover:text-white"
        :class="copied ? 'text-ai-400' : ''"
        @click="copy"
      >
        <component :is="copied ? CheckCircle2 : Copy" :size="13" :stroke-width="1.75" />
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>

    <pre
      :class="[$props.class, 'overflow-x-auto p-3.5 font-mono text-[0.85rem] leading-relaxed']"
    ><slot /></pre>
  </div>
</template>
