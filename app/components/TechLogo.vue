<script setup lang="ts">
// Simplified, recognizable marks for each tech's own real brand — the same
// spirit as the open "simple-icons"/"devicon" sets used across dev tools and
// docs for accurate technology identification, not a pixel-exact trace of
// any single artist's copyrighted artwork. Colors sourced from
// ~/utils/courseTech's shared palette so this stays consistent with
// HeroGameMap.vue's TECH_ICONS.
import { TECH_BADGES, type TechId } from '~/utils/courseTech'

const props = withDefaults(defineProps<{ tech: TechId; size?: number; rounded?: boolean }>(), {
  size: 36,
  rounded: true
})

const badge = computed(() => TECH_BADGES[props.tech])
// Python's real mark is two-tone (blue + yellow) with no background color of
// its own — badge.bg IS one of the snake's colors, so filling the wrapper
// with it would make that snake invisible. Every other mark's badge.bg is
// genuinely a background color distinct from its mark, so this is the one
// exception rather than a reason to change the shared convention.
const wrapperBg = computed(() => (props.tech === 'python' ? '#FFFFFF' : badge.value.bg))
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center shadow-lg ring-1 ring-white/15"
    :class="rounded ? 'rounded-[22%]' : ''"
    :style="{ backgroundColor: wrapperBg, width: `${size}px`, height: `${size}px` }"
    :title="badge.label"
  >
    <svg viewBox="0 0 64 64" :width="size * 0.62" :height="size * 0.62" aria-hidden="true">
      <!-- TypeScript: the real wordmark — bold "TS" in the language's own blue. -->
      <text
        v-if="tech === 'ts'"
        x="32" y="45" text-anchor="middle"
        font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="34"
        :fill="badge.mark"
      >TS</text>

      <!-- JavaScript: same wordmark convention. -->
      <text
        v-else-if="tech === 'js'"
        x="32" y="45" text-anchor="middle"
        font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="30"
        :fill="badge.mark"
      >JS</text>

      <!-- React: three elliptical orbits crossing at 60°, plus the nucleus dot. -->
      <g v-else-if="tech === 'react'" :fill="'none'" :stroke="badge.mark" stroke-width="3.2">
        <ellipse cx="32" cy="32" rx="24" ry="9.5" />
        <ellipse cx="32" cy="32" rx="24" ry="9.5" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="24" ry="9.5" transform="rotate(120 32 32)" />
        <circle cx="32" cy="32" r="4.4" :fill="badge.mark" stroke="none" />
      </g>

      <!-- Go: the gopher's face — round head, oval eyes, a nose. -->
      <g v-else-if="tech === 'go'">
        <ellipse cx="32" cy="34" rx="19" ry="16" :fill="badge.mark" />
        <ellipse cx="23" cy="26" rx="6.5" ry="7.5" :fill="badge.mark" :stroke="badge.bg" stroke-width="2" />
        <ellipse cx="41" cy="26" rx="6.5" ry="7.5" :fill="badge.mark" :stroke="badge.bg" stroke-width="2" />
        <circle cx="23" cy="27.5" r="2.6" fill="#1B1B1B" />
        <circle cx="41" cy="27.5" r="2.6" fill="#1B1B1B" />
        <ellipse cx="32" cy="38" rx="4" ry="3" :fill="badge.bg" />
      </g>

      <!-- Docker: stacked containers riding a curved hull. -->
      <g v-else-if="tech === 'docker'" :fill="badge.mark">
        <rect x="14" y="24" width="9" height="8" rx="1.3" />
        <rect x="25" y="24" width="9" height="8" rx="1.3" />
        <rect x="36" y="24" width="9" height="8" rx="1.3" />
        <rect x="25" y="14" width="9" height="8" rx="1.3" />
        <rect x="36" y="34" width="9" height="8" rx="1.3" />
        <path d="M8 34 C8 34 12 44 32 44 C48 44 54 37 56 34 C50 32 8 32 8 34 Z" />
      </g>

      <!-- Vue: the chevron "V" wordmark. -->
      <path
        v-else-if="tech === 'vue'"
        d="M6 12 L32 54 L58 12 L46 12 L32 36 L18 12 Z"
        :fill="badge.mark"
      />

      <!-- Python: two interlocking snakes, simplified to rounded bands. -->
      <g v-else-if="tech === 'python'">
        <path d="M32 8 C20 8 21 14 21 14 L21 20 L33 20 L33 22 L16 22 C16 22 8 21 8 33 C8 45 15 44 15 44 L19 44 L19 38 C19 38 19 31 26 31 L38 31 C38 31 44 31 44 25 L44 15 C44 15 45 8 32 8 Z" :fill="badge.bg" />
        <circle cx="17.5" cy="14.5" r="2.2" :fill="badge.mark" />
        <path d="M32 56 C44 56 43 50 43 50 L43 44 L31 44 L31 42 L48 42 C48 42 56 43 56 31 C56 19 49 20 49 20 L45 20 L45 26 C45 26 45 33 38 33 L26 33 C26 33 20 33 20 39 L20 49 C20 49 19 56 32 56 Z" :fill="badge.mark" />
        <circle cx="46.5" cy="49.5" r="2.2" :fill="badge.bg" />
      </g>

      <!-- Node.js: the hexagon shell. -->
      <path
        v-else-if="tech === 'node'"
        d="M32 6 L56 19 V45 L32 58 L8 45 V19 Z"
        fill="none" :stroke="badge.mark" stroke-width="3.5"
      />
    </svg>
  </span>
</template>
