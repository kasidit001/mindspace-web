<script setup lang="ts">
// Shared brand mark: a monogram tile + wordmark, used everywhere the brand
// previously rendered as plain text (nav, auth pages). There's no image
// asset for a logo, so this is a small, deliberately-designed lockup
// rather than bare bold text pretending to be a logo.
const { t } = useLanguage()

withDefaults(defineProps<{ size?: 'sm' | 'md' }>(), { size: 'md' })
</script>

<template>
  <span class="inline-flex min-w-0 items-center gap-2">
    <span
      class="flex shrink-0 items-center justify-center rounded-lg bg-accent-500 font-bold leading-none text-white"
      :class="size === 'sm' ? 'size-5 text-[11px]' : 'size-6 text-xs'"
      aria-hidden="true"
    >M</span>
    <span class="font-display truncate font-bold tracking-tight" :class="size === 'sm' ? 'text-sm' : 'text-base'">
      {{ t('common.brand') }}
    </span>
  </span>
</template>
