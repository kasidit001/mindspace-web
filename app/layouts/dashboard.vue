<script setup lang="ts">
// Distinct from layouts/course.vue's sidebar (which follows the site-wide
// light/dark toggle) — this sidebar is deliberately always-dark, the
// classic enterprise-SaaS split (dark rail, light workspace), independent
// of whatever theme the rest of the app is in. Kept as its own layout
// rather than a course.vue variant since the two serve different jobs:
// course.vue is the lesson-reading chrome (chat drawer, lesson tree),
// this is the account-level "your learning" overview.
import { BookOpen, LayoutDashboard, LogOut, Waypoints } from '@lucide/vue'

const route = useRoute()
const { t } = useLanguage()
const { user, logout } = useAuth()

const navItems = computed(() => [
  { to: '/dashboard', label: t('dashboard.navDashboard'), icon: LayoutDashboard },
  { to: '/courses', label: t('nav.courses'), icon: BookOpen },
  { to: '/map', label: t('nav.skillMap'), icon: Waypoints }
])

function isActive(to: string) {
  return to === '/dashboard' ? route.path === to : route.path.startsWith(to)
}

const initials = computed(() => {
  const name = user.value?.name?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name[0]!.toUpperCase()
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-canvas text-zinc-900">
    <aside class="flex w-64 shrink-0 flex-col bg-[#0B0E16] px-4 py-5 text-zinc-100">
      <NuxtLink to="/" class="flex items-center px-2 text-white">
        <AppLogo />
      </NuxtLink>

      <nav class="mt-8 flex-1 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          :class="isActive(item.to)
            ? 'bg-white/10 text-white'
            : 'text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100'"
        >
          <component :is="item.icon" :size="17" :stroke-width="1.9" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="mt-auto border-t border-white/10 pt-4">
        <div v-if="user" class="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
            {{ initials }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-white">{{ user.name }}</p>
            <p class="truncate text-xs text-zinc-500">{{ user.email }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
            :aria-label="t('auth.logOut')"
            @click="logout"
          >
            <LogOut :size="15" :stroke-width="1.9" />
          </button>
        </div>
        <NuxtLink
          v-else
          to="/login"
          class="block rounded-lg bg-white/10 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-white/[0.15]"
        >
          {{ t('auth.logIn') }}
        </NuxtLink>
      </div>
    </aside>

    <main class="min-w-0 flex-1 overflow-y-auto bg-canvas">
      <slot />
    </main>
  </div>
</template>
