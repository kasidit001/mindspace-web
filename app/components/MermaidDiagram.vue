<script setup lang="ts">
// Renders a ```mermaid fenced code block as an actual SVG diagram, instead of
// as highlighted code text. Used by ProsePre.vue, which special-cases
// language === 'mermaid' to render this component with the raw source
// instead of its usual terminal-card code display.
//
// Client-only: mermaid measures text via the DOM to lay out the diagram, so
// this can't run during SSR. The parent wraps us in <ClientOnly>.
const props = defineProps<{
  code: string
}>()

const { theme } = useTheme()

const containerRef = ref<HTMLElement | null>(null)
const errorMessage = ref<string | null>(null)

// One counter shared across every diagram on the page — mermaid.render needs
// a unique id per call, and multiple lessons/diagrams can be mounted at once.
let instanceId = 0

async function draw() {
  if (!containerRef.value) return
  errorMessage.value = null

  try {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({
      startOnLoad: false,
      theme: theme.value === 'dark' ? 'dark' : 'neutral',
      securityLevel: 'strict',
      fontFamily: 'inherit'
    })

    instanceId += 1
    const id = `mermaid-${Date.now()}-${instanceId}`
    const { svg } = await mermaid.render(id, props.code.trim())
    if (containerRef.value) containerRef.value.innerHTML = svg
  } catch (err) {
    // Malformed diagram source shouldn't take down the whole lesson page —
    // show the raw source as a fallback instead.
    errorMessage.value = err instanceof Error ? err.message : 'Failed to render diagram'
  }
}

onMounted(draw)
watch(() => [props.code, theme.value], draw)
</script>

<template>
  <div class="my-4 overflow-x-auto rounded-xl border border-divider bg-surface p-4 dark:border-divider-dark dark:bg-surface-dark">
    <div ref="containerRef" class="flex justify-center [&_svg]:max-w-full" />
    <div v-if="errorMessage" class="space-y-2">
      <p class="text-sm text-critical-500">Diagram failed to render: {{ errorMessage }}</p>
      <pre class="overflow-x-auto rounded-md bg-canvas-dark p-3 font-mono text-xs text-white">{{ code }}</pre>
    </div>
  </div>
</template>
