<script setup lang="ts">
// Standalone page, like index.vue — no sidebar/chat chrome.
const { t } = useLanguage()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorKey = ref<string | null>(null)
// The free-tier API sleeps when idle, so the first request can take ~a minute.
const slow = ref(false)

async function submit() {
  if (!email.value.trim() || !password.value) return
  submitting.value = true
  errorKey.value = null
  const slowTimer = setTimeout(() => { slow.value = true }, 5000)
  try {
    await login({ email: email.value.trim(), password: password.value })
    password.value = ''
    await navigateTo('/dashboard')
  } catch (err) {
    errorKey.value = authErrorKey(err)
  } finally {
    clearTimeout(slowTimer)
    slow.value = false
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-canvas px-6 py-16 text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <div class="reveal w-full max-w-md">
      <NuxtLink to="/" class="mb-8 flex items-center justify-center">
        <AppLogo />
      </NuxtLink>

      <div class="card p-8">
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
            <PasswordInput v-model="password" autocomplete="current-password" />
          </label>

          <p
            v-if="errorKey"
            role="alert"
            class="rounded-md bg-critical-400/10 px-3 py-2 text-xs text-critical-600 dark:text-critical-400"
          >
            {{ t(errorKey) }}
          </p>

          <button
            type="submit"
            class="btn-primary w-full rounded-md px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            :disabled="submitting"
          >
            {{ t('auth.logIn') }}
          </button>
          <p v-if="slow" class="text-center text-xs text-zinc-500 dark:text-zinc-400">{{ t('auth.slowServer') }}</p>
        </form>

        <SocialLoginButtons mode="login" />
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
