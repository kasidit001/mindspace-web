<script setup lang="ts">
import { ShieldAlert } from '@lucide/vue'

// SYSTEM_ADMIN-only preview of the API's upcoming User table. Gated by the
// `admin` middleware; not wired to mindspace-api yet (see useAuth) — once
// the API exposes something like GET /api/admin/users, swap `rows` below
// for a real fetch (useFetch/useAsyncData), keeping the same columns.
definePageMeta({ layout: 'course', middleware: 'admin' })

const { t } = useLanguage()
const { user } = useAuth()

const rows = computed(() => (user.value ? [user.value] : []))
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-10">
    <h1 class="font-display text-2xl font-bold tracking-tight">{{ t('admin.title') }}</h1>
    <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{{ t('admin.subtitle') }}</p>

    <p class="mt-5 flex items-start gap-1.5 rounded-md bg-ai-400/10 px-3 py-2 font-mono text-[11px] leading-relaxed text-ai-700 dark:text-ai-400">
      <ShieldAlert :size="12" :stroke-width="2" class="mt-0.5 shrink-0" />
      {{ t('admin.pendingApiNotice') }}
    </p>

    <div class="mt-6 overflow-hidden rounded-2xl border border-divider dark:border-divider-dark">
      <table class="w-full text-left text-sm">
        <thead class="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400">
          <tr>
            <th class="px-4 py-2.5 font-medium">{{ t('admin.colName') }}</th>
            <th class="px-4 py-2.5 font-medium">{{ t('admin.colEmail') }}</th>
            <th class="px-4 py-2.5 font-medium">{{ t('admin.colRole') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-divider dark:divide-divider-dark">
          <tr v-for="row in rows" :key="row.email">
            <td class="truncate px-4 py-2.5 font-medium text-zinc-900 dark:text-white">{{ row.name }}</td>
            <td class="truncate px-4 py-2.5 text-zinc-600 dark:text-zinc-400">{{ row.email }}</td>
            <td class="px-4 py-2.5">
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="row.role === 'SYSTEM_ADMIN'
                  ? 'bg-accent-400 text-[#241F00]'
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
