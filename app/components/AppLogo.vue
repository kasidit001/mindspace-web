<script setup lang="ts">
// Shared brand mark: an icon tile + wordmark, used everywhere the brand
// renders (nav, auth pages). The icon is an ascending three-node path —
// rising dots read as both "learning progress" and "connected knowledge"
// (mind + space) — rather than a literal letter standing in for a logo.
// Kept as inline SVG (not an <img>) so it inherits currentColor-free fixed
// white strokes and stays crisp at any tile size; `public/favicon.svg`
// mirrors this exact mark for the browser tab icon.
const { t } = useLanguage()

withDefaults(defineProps<{ size?: 'sm' | 'md' }>(), { size: 'md' })
</script>

<template>
  <span class="inline-flex min-w-0 items-center gap-2">
    <svg
      viewBox="0 0 24 24"
      class="shrink-0 rounded-lg bg-accent-500"
      :class="size === 'sm' ? 'size-5' : 'size-6'"
      aria-hidden="true"
    >
      <path d="M6 18L12 12L18 6" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="6" cy="18" r="1.75" fill="white" />
      <circle cx="12" cy="12" r="1.75" fill="white" />
      <circle cx="18" cy="6" r="2.25" fill="white" />
    </svg>
    <span class="font-display truncate font-bold tracking-tight" :class="size === 'sm' ? 'text-sm' : 'text-base'">
      {{ t('common.brand') }}
    </span>
  </span>
</template>
