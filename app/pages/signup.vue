<script setup lang="ts">
import { Lock } from '@lucide/vue'

// Standalone page, like index.vue — no sidebar/chat chrome.
const { t } = useLanguage()
const { login } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

const mismatch = computed(() =>
  confirmPassword.value.length > 0 && password.value !== confirmPassword.value
)

async function submit() {
  if (!name.value.trim() || !email.value.trim() || !password.value || mismatch.value) return
  submitting.value = true
  // No backend yet (see useAuth) — the password is intentionally never read
  // past this point, just required so the form feels real.
  login(email.value, name.value)
  password.value = ''
  confirmPassword.value = ''
  await navigateTo('/courses')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-canvas px-6 py-16 text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <div class="reveal w-full max-w-md">
      <NuxtLink to="/" class="mb-8 flex items-center justify-center">
        <AppLogo />
      </NuxtLink>

      <div class="card p-8">
        <h1 class="font-display text-2xl font-bold tracking-tight">{{ t('auth.signupTitle') }}</h1>
        <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{{ t('auth.signupSubtitle') }}</p>

        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <label class="block">
            <span class="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{{ t('auth.fullName') }}</span>
            <input
              v-model="name"
              type="text"
              autocomplete="name"
              required
              class="w-full rounded-md border border-divider bg-white px-3 py-2 text-sm focus:border-accent-500 focus:outline-none dark:border-divider-dark dark:bg-white/[0.04] dark:text-white"
            >
          </label>
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
              autocomplete="new-password"
              required
              minlength="6"
              class="w-full rounded-md border border-divider bg-white px-3 py-2 text-sm focus:border-accent-500 focus:outline-none dark:border-divider-dark dark:bg-white/[0.04] dark:text-white"
            >
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{{ t('auth.confirmPassword') }}</span>
            <input
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              minlength="6"
              class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none dark:bg-white/[0.04] dark:text-white"
              :class="mismatch
                ? 'border-critical-400 focus:border-critical-500 dark:border-critical-600'
                : 'border-divider bg-white focus:border-accent-500 dark:border-divider-dark'"
            >
            <span v-if="mismatch" class="mt-1 block text-xs text-critical-600 dark:text-critical-400">
              {{ t('auth.passwordMismatch') }}
            </span>
          </label>

          <button
            type="submit"
            class="btn-primary w-full rounded-md px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            :disabled="submitting || mismatch"
          >
            {{ t('auth.signUp') }}
          </button>
        </form>

        <SocialLoginButtons mode="signup" />

        <p class="mt-5 flex items-start gap-1.5 rounded-lg bg-info-50 px-3 py-2 text-[11px] leading-relaxed text-info-700 dark:bg-info-400/10 dark:text-info-400">
          <Lock :size="12" :stroke-width="2" class="mt-0.5 shrink-0" />
          {{ t('auth.demoNotice') }}
        </p>
      </div>

      <p class="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {{ t('auth.haveAccount') }}
        <NuxtLink to="/login" class="font-semibold text-accent-700 hover:underline dark:text-accent-400">
          {{ t('auth.logIn') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
