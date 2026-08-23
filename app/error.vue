<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error.statusCode === 404)

function retry() {
  clearError({ redirect: '/courses' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <div class="relative">
      <div class="absolute inset-0 -z-10 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" aria-hidden="true" />
      <p class="text-6xl" aria-hidden="true">{{ isNotFound ? '🧭' : '🔌' }}</p>
    </div>

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
        class="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        @click="retry"
      >
        {{ isNotFound ? 'Go to courses' : 'Reconnect' }}
      </button>
      <NuxtLink
        to="/"
        class="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-white/15 dark:text-zinc-100 dark:hover:bg-white/5"
      >
        Home
      </NuxtLink>
    </div>
  </div>
</template>
