<script setup lang="ts">
// Shared social-auth block for login.vue and signup.vue. Real OAuth isn't
// wired up yet (no provider Client ID/Secret registered on the API side),
// so clicking a button surfaces an explicit "not connected yet" message
// instead of either doing nothing (a dead button) or pretending to sign
// the user in. Swap `handleClick` for real `navigateTo` redirects to the
// API's OAuth start routes once those exist.
const { t } = useLanguage()

const props = defineProps<{ mode: 'signup' | 'login' }>()

const pendingProvider = ref<string | null>(null)

const providers = [
  { id: 'Google', labelKey: 'auth.continueWithGoogle' },
  { id: 'Facebook', labelKey: 'auth.continueWithFacebook' },
  { id: 'Apple', labelKey: 'auth.continueWithApple' }
] as const

function handleClick(providerId: string) {
  pendingProvider.value = providerId
}
</script>

<template>
  <div>
    <div class="my-5 flex items-center gap-3 text-xs font-medium text-zinc-400 dark:text-zinc-500">
      <span class="h-px flex-1 bg-divider dark:bg-divider-dark" />
      {{ t(props.mode === 'signup' ? 'auth.orRegisterUsing' : 'auth.orLogInUsing') }}
      <span class="h-px flex-1 bg-divider dark:bg-divider-dark" />
    </div>

    <div class="space-y-2.5">
      <button
        v-for="provider in providers"
        :key="provider.id"
        type="button"
        class="flex w-full items-center justify-center gap-2.5 rounded-md border border-divider bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-divider-dark dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
        @click="handleClick(provider.id)"
      >
        <svg v-if="provider.id === 'Google'" viewBox="0 0 24 24" class="size-4 shrink-0" aria-hidden="true">
          <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.94H1.27v3.1A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.28 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.27a12 12 0 0 0 0 10.8l4.01-3.1Z" />
          <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.6l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75Z" />
        </svg>
        <svg v-else-if="provider.id === 'Facebook'" viewBox="0 0 24 24" class="size-4 shrink-0" aria-hidden="true">
          <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.86v-8.39H7.08V12h3.04V9.36c0-3 1.79-4.66 4.53-4.66 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.39A12 12 0 0 0 24 12Z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" class="size-4 shrink-0 fill-black dark:fill-white" aria-hidden="true">
          <path d="M16.36 1.43c0 1.14-.42 2.2-1.24 3.12-.99 1.1-2.19 1.74-3.5 1.63-.05-.1-.09-.61-.09-1 0-1.14.44-2.2 1.24-3.06.92-.98 2.15-1.6 3.46-1.71.05.34.13.68.13 1.02Zm4.14 15.84c-.6 1.36-.89 1.97-1.66 3.17-1.08 1.68-2.6 3.77-4.48 3.79-1.67.02-2.1-1.09-4.37-1.08-2.27.01-2.74 1.1-4.41 1.09-1.88-.02-3.32-1.91-4.4-3.59-3.01-4.67-3.33-10.15-1.47-13.07 1.32-2.08 3.4-3.3 5.36-3.3 2 0 3.25 1.1 4.9 1.1 1.6 0 2.57-1.1 4.9-1.1 1.75 0 3.6.95 4.92 2.6-4.32 2.37-3.62 8.55.71 10.39Z" />
        </svg>
        {{ t(provider.labelKey) }}
      </button>
    </div>

    <p v-if="pendingProvider" class="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
      {{ t('auth.socialComingSoon', { provider: pendingProvider }) }}
    </p>
  </div>
</template>
