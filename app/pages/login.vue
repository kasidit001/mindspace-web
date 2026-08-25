<script setup lang="ts">
import { Lock } from '@lucide/vue'

// Standalone page, like index.vue — no sidebar/chat chrome.
const { t } = useLanguage()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const submitting = ref(false)

async function submit() {
  if (!email.value.trim() || !password.value) return
  submitting.value = true
  // No backend yet (see useAuth) — the password is intentionally never read
  // past this point, just required so the form feels real.
  login(email.value)
  password.value = ''
  await navigateTo('/courses')
}
</script>

<template>
  <div class="bg-dots flex min-h-screen items-center justify-center bg-canvas px-6 py-16 text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <div class="reveal w-full max-w-md">
      <NuxtLink to="/" class="font-display mb-8 flex items-center justify-center gap-1 text-lg font-bold tracking-tight">
        {{ t('common.brand') }}
      </NuxtLink>

      <div class="glow-accent rounded-2xl border border-divider bg-surface p-8 dark:border-divider-dark dark:bg-surface-dark">
        <h1 class="font-display text-2xl font-bold tracking-tight">{{ t('auth.loginTitle') }}</h1>
        <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{{ t('auth.loginSubtitle') }}</p>

        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <label class="block">
            <span class="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{{ t('auth.email') }}</span>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="w-full rounded-md border border-divider bg-white px-3 py-2 text-sm focus:border-accent-500 focus:outline-none dark:border-divider-dark dark:bg-white/[0.04] dark:text-white"
            >
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{{ t('auth.password') }}</span>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              minlength="6"
              class="w-full rounded-md border border-divider bg-white px-3 py-2 text-sm focus:border-accent-500 focus:outline-none dark:border-divider-dark dark:bg-white/[0.04] dark:text-white"
            >
          </label>

          <button
            type="submit"
            class="btn-neon w-full rounded-md px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            :disabled="submitting"
          >
            {{ t('auth.logIn') }}
          </button>
        </form>

        <p class="mt-5 flex items-start gap-1.5 rounded-md bg-ai-400/10 px-3 py-2 font-mono text-[11px] leading-relaxed text-ai-700 dark:text-ai-400">
          <Lock :size="12" :stroke-width="2" class="mt-0.5 shrink-0" />
          {{ t('auth.demoNotice') }}
        </p>
      </div>

      <p class="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {{ t('auth.noAccount') }}
        <NuxtLink to="/signup" class="font-semibold text-accent-700 hover:underline dark:text-accent-400">
          {{ t('auth.signUp') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
