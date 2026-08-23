<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error.statusCode === 404)

function retry() {
  clearError({ redirect: '/courses' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <p class="text-5xl" aria-hidden="true">{{ isNotFound ? '🧭' : '🔌' }}</p>

    <p class="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
      Error {{ error.statusCode }}
    </p>
    <h1 class="mt-2 text-2xl font-bold tracking-tight">
      {{ isNotFound ? "This page doesn't exist" : 'Something went wrong' }}
    </h1>
    <p class="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
      {{ isNotFound
        ? "The lesson or page you're looking for may have moved."
        : "That's on us — the app hit an unexpected error. It might also mean mindspace-api is offline." }}
    </p>

    <div class="mt-8 flex gap-3">
      <button
        type="button"
        class="rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700"
        @click="retry"
      >
        {{ isNotFound ? 'Go to courses' : 'Reconnect' }}
      </button>
      <NuxtLink
        to="/"
        class="rounded-md border border-divider px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-divider-dark dark:text-zinc-100 dark:hover:bg-white/5"
      >
        Home
      </NuxtLink>
    </div>
  </div>
</template>
