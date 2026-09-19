<script setup lang="ts">
// A brand-colored badge, not a traced reproduction of any project's actual
// logo artwork — same convention as HeroGameMap.vue's TECH_ICONS, sourced
// from the shared ~/utils/courseTech palette so both stay consistent.
import { TECH_BADGES, type TechId } from '~/utils/courseTech'

const props = withDefaults(defineProps<{ tech: TechId; size?: number }>(), { size: 36 })

const badge = computed(() => TECH_BADGES[props.tech])
const fontSize = computed(() => (badge.value.label.length > 4 ? props.size * 0.26 : props.size * 0.34))
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-xl font-display font-bold leading-none shadow-lg ring-1 ring-white/15"
    :style="{
      backgroundColor: badge.bg,
      color: badge.mark,
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${fontSize}px`
    }"
    :title="badge.label"
  >{{ badge.label }}</span>
</template>
