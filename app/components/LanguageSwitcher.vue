<script setup lang="ts">
import { Globe } from '@lucide/vue'

const { lang, setLang, t } = useLanguage()
</script>

<template>
  <div
    class="inline-flex shrink-0 items-center gap-1 rounded-md border border-divider px-1.5 py-1 text-xs font-medium text-zinc-500 dark:border-divider-dark dark:text-zinc-400"
    role="group"
    :aria-label="t('nav.language')"
  >
    <Globe :size="14" :stroke-width="1.75" class="shrink-0 text-zinc-400" />
    <button
      type="button"
      class="rounded px-1 transition-colors"
      :class="lang === 'en' ? 'font-semibold text-accent-700 dark:text-accent-400' : 'hover:text-zinc-900 dark:hover:text-white'"
      :aria-pressed="lang === 'en'"
      @click="setLang('en')"
    >
      EN
    </button>
    <span class="text-zinc-300 dark:text-zinc-600" aria-hidden="true">|</span>
    <button
      type="button"
      class="rounded px-1 transition-colors"
      :class="lang === 'th' ? 'font-semibold text-accent-700 dark:text-accent-400' : 'hover:text-zinc-900 dark:hover:text-white'"
      :aria-pressed="lang === 'th'"
      @click="setLang('th')"
    >
      TH
    </button>
  </div>
</template>
