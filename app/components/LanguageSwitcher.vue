<script setup lang="ts">
import { Globe } from '@lucide/vue'

const { lang, setLang, t } = useLanguage()
</script>

<template>
  <div
    class="inline-flex shrink-0 items-center gap-1 rounded-md border border-divider p-1 text-xs font-semibold text-zinc-500 dark:border-divider-dark dark:text-zinc-400"
    role="group"
    :aria-label="t('nav.language')"
  >
    <Globe :size="14" :stroke-width="1.75" class="mx-1 shrink-0 text-zinc-400" />
    <button
      type="button"
      class="rounded px-2 py-0.5 transition-colors"
      :class="lang === 'en'
        ? 'bg-accent-500 text-white shadow-sm'
        : 'hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white'"
      :aria-pressed="lang === 'en'"
      @click="setLang('en')"
    >
      EN
    </button>
    <button
      type="button"
      class="rounded px-2 py-0.5 transition-colors"
      :class="lang === 'th'
        ? 'bg-accent-500 text-white shadow-sm'
        : 'hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white'"
      :aria-pressed="lang === 'th'"
      @click="setLang('th')"
    >
      TH
    </button>
  </div>
</template>
