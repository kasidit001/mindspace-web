<script setup lang="ts">
import { splitTitleSegments } from '~/utils/titleSegments'

const props = defineProps<{ text: string }>()
const segments = computed(() => splitTitleSegments(props.text))
</script>

<template><template v-for="(seg, i) in segments" :key="i"><code v-if="seg.code" class="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/10">{{ seg.text }}</code><template v-else>{{ seg.text }}</template></template></template>
