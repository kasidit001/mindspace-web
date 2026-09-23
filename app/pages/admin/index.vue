<script setup lang="ts">
import { ShieldAlert } from '@lucide/vue'

// SYSTEM_ADMIN-only page. Gated by the `admin` middleware (a UI convenience,
// not access control — see it). mindspace-api has no admin users endpoint
// yet, so this only lists the signed-in admin's own account — once the API
// exposes something like GET /api/admin/users (with a server-side role
// check), swap `rows` below for a real fetch, keeping the same columns.
definePageMeta({ layout: 'course', middleware: 'admin' })

const { t } = useLanguage()
const { user } = useAuth()

const rows = computed(() => (user.value ? [user.value] : []))

const AVATAR_COLORS = [
  'bg-accent-100 text-accent-700 dark:bg-accent-400/15 dark:text-accent-400',
  'bg-ai-100 text-ai-700 dark:bg-ai-400/15 dark:text-ai-400',
  'bg-success-50 text-success-700 dark:bg-success-400/15 dark:text-success-400'
]

function avatarColor(email: string): string {
  let hash = 0
  for (const ch of email) hash = (hash + ch.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-10">
    <h1 class="font-display text-2xl font-bold tracking-tight">{{ t('admin.title') }}</h1>
    <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{{ t('admin.subtitle') }}</p>

    <p class="mt-5 flex items-start gap-1.5 rounded-lg bg-info-50 px-3 py-2 text-[11px] leading-relaxed text-info-700 dark:bg-info-400/10 dark:text-info-400">
      <ShieldAlert :size="12" :stroke-width="2" class="mt-0.5 shrink-0" />
      {{ t('admin.pendingApiNotice') }}
    </p>

    <div class="card mt-6 overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-divider text-xs uppercase tracking-wide text-zinc-500 dark:border-divider-dark dark:text-zinc-400">
          <tr>
            <th class="px-5 py-3 font-medium">{{ t('admin.colName') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('admin.colEmail') }}</th>
            <th class="px-5 py-3 font-medium">{{ t('admin.colRole') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-divider dark:divide-divider-dark">
          <tr v-for="row in rows" :key="row.email" class="transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]">
            <td class="px-5 py-3">
              <div class="flex items-center gap-2.5">
                <span
                  class="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  :class="avatarColor(row.email)"
                >
                  {{ row.name.charAt(0).toUpperCase() }}
                </span>
                <span class="truncate font-medium text-zinc-900 dark:text-white">{{ row.name }}</span>
              </div>
            </td>
            <td class="truncate px-5 py-3 text-zinc-600 dark:text-zinc-400">{{ row.email }}</td>
            <td class="px-5 py-3">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="row.role === 'SYSTEM_ADMIN'
                  ? 'bg-accent-50 text-accent-700 dark:bg-accent-400/15 dark:text-accent-400'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300'"
              >
                {{ row.role === 'SYSTEM_ADMIN' ? t('auth.roleAdmin') : t('auth.roleUser') }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
