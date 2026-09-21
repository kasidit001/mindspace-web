<script setup lang="ts">
// Standalone page, like index.vue — no sidebar/chat chrome.
const { t } = useLanguage()
const { signup } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const errorKey = ref<string | null>(null)
// The free-tier API sleeps when idle, so the first request can take ~a minute.
const slow = ref(false)

const mismatch = computed(() =>
  confirmPassword.value.length > 0 && password.value !== confirmPassword.value
)

async function submit() {
  if (!name.value.trim() || !email.value.trim() || !password.value || mismatch.value) return
  submitting.value = true
  errorKey.value = null
  const slowTimer = setTimeout(() => { slow.value = true }, 5000)
  try {
    await signup({ name: name.value.trim(), email: email.value.trim(), password: password.value })
    password.value = ''
    confirmPassword.value = ''
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
            :disabled="submitting || mismatch"
          >
            {{ t('auth.signUp') }}
          </button>
          <p v-if="slow" class="text-center text-xs text-zinc-500 dark:text-zinc-400">{{ t('auth.slowServer') }}</p>
        </form>

        <SocialLoginButtons mode="signup" />
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
