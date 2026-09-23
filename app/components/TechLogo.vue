<script setup lang="ts">
// The technology's official logo (vendored — see ~/utils/techLogos) on a
// plate: white so the brand colors read as intended, dark for React.
import { TECH_LABELS, type TechId } from '~/utils/courseTech'
import { TECH_LOGOS, techLogoPlate } from '~/utils/techLogos'

const props = withDefaults(defineProps<{ tech: TechId; size?: number; rounded?: boolean }>(), {
  size: 36,
  rounded: true
})

const logo = computed(() => TECH_LOGOS[props.tech])
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center shadow-lg ring-1 ring-black/5 dark:ring-white/15"
    :class="rounded ? 'rounded-[22%]' : ''"
    :style="{ backgroundColor: techLogoPlate(tech), width: `${size}px`, height: `${size}px` }"
    :title="TECH_LABELS[tech]"
  >
    <!-- Static, vendored SVG markup (not user input), so v-html is safe here.
         The box is wider than tall so wide marks (Go's wordmark) get more of
         the tile; square/tall logos are still height-limited (aspect kept). -->
    <svg
      :viewBox="`0 0 ${logo.width} ${logo.height}`"
      :width="size * 0.8"
      :height="size * 0.62"
      role="img"
      :aria-label="TECH_LABELS[tech]"
      v-html="logo.body"
    />
  </span>
</template>
