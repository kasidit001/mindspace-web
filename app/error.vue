<script setup lang="ts">
import { Compass, Unplug } from '@lucide/vue'
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t } = useLanguage()

const isNotFound = computed(() => props.error.statusCode === 404)

function retry() {
  clearError({ redirect: '/courses' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <component :is="isNotFound ? Compass : Unplug" :size="40" :stroke-width="1.5" class="text-zinc-400 dark:text-zinc-500" aria-hidden="true" />

    <p class="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
      {{ t('error.errorCode', { code: error.statusCode }) }}
    </p>
    <h1 class="mt-2 text-2xl font-bold tracking-tight">
      {{ isNotFound ? t('error.notFoundTitle') : t('error.genericTitle') }}
    </h1>
    <p class="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
      {{ isNotFound ? t('error.notFoundBody') : t('error.genericBody') }}
    </p>

    <div class="mt-8 flex gap-3">
      <button
        type="button"
        class="rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700"
        @click="retry"
      >
        {{ isNotFound ? t('error.goToCourses') : t('error.reconnect') }}
      </button>
      <NuxtLink
        to="/"
        class="rounded-md border border-divider px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-divider-dark dark:text-zinc-100 dark:hover:bg-white/5"
      >
        {{ t('error.home') }}
      </NuxtLink>
    </div>
  </div>
</template>
