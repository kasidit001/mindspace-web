<script setup lang="ts">
// Light, card-based "enterprise SaaS" shell for Home/Explore/My Courses —
// a horizontal top navbar instead of the old always-dark left rail, so the
// page itself (not the chrome) carries the visual weight. Kept as its own
// layout rather than a course.vue variant since the two serve different
// jobs: course.vue is the lesson-reading chrome (chat drawer, lesson
// tree), this is the account-level "your learning" overview.
//
// Deliberately just three nav links — "Learning & Explore" only, not a
// catch-all site nav — so this stays a quick, low-cognitive-load switcher
// rather than growing back into the dense, nested-syllabus sidebar
// course.vue uses while actually reading a lesson (Skill Map etc. stay
// reachable from there instead).
import { ChevronDown, Compass, GraduationCap, LayoutDashboard, LogOut } from '@lucide/vue'

const route = useRoute()
const { t } = useLanguage()
const { user, logout } = useAuth()

const navItems = computed(() => [
  { to: '/dashboard', label: t('dashboard.navDashboard'), icon: LayoutDashboard },
  { to: '/courses', label: t('dashboard.navExplore'), icon: Compass },
  { to: '/my-courses', label: t('dashboard.navMyCourses'), icon: GraduationCap }
])

function isActive(to: string) {
  return route.path === to
}

const initials = computed(() => {
  const name = user.value?.name?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name[0]!.toUpperCase()
})

const profileOpen = ref(false)
watch(() => route.fullPath, () => { profileOpen.value = false })
</script>

<template>
  <div class="min-h-screen bg-canvas text-zinc-900 dark:bg-canvas-dark dark:text-zinc-100">
    <header class="sticky top-0 z-30 border-b border-divider bg-surface dark:border-divider-dark dark:bg-surface-dark">
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-1 px-6">
        <NuxtLink to="/" class="mr-4 flex shrink-0 items-center">
          <AppLogo />
        </NuxtLink>

        <nav class="flex items-center gap-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
            :class="isActive(item.to)
              ? 'bg-accent-50 text-accent-700 dark:bg-accent-400/10 dark:text-accent-400'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white'"
          >
            <component :is="item.icon" :size="16" :stroke-width="1.9" />
            <span class="hidden sm:inline">{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <div class="ml-auto flex shrink-0 items-center gap-3">
          <template v-if="user">
            <div class="relative">
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                :aria-label="t('nav.yourProgress')"
                @click="profileOpen = !profileOpen"
              >
                <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
                  {{ initials }}
                </span>
                <ChevronDown :size="14" :stroke-width="2" class="hidden text-zinc-400 sm:block" />
              </button>

              <div v-if="profileOpen" class="fixed inset-0 z-40" @click="profileOpen = false" />

              <div v-if="profileOpen" class="card absolute right-0 z-50 mt-2 w-60 p-3 text-sm">
                <p class="truncate font-semibold text-zinc-900 dark:text-white">{{ user.name }}</p>
                <p class="truncate text-xs text-zinc-500 dark:text-zinc-400">{{ user.email }}</p>
                <hr class="my-2.5 border-divider dark:border-divider-dark">
                <button
                  type="button"
                  class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
                  @click="logout"
                >
                  <LogOut :size="15" :stroke-width="1.9" />
                  {{ t('auth.logOut') }}
                </button>
              </div>
            </div>
          </template>
          <NuxtLink v-else to="/login" class="btn-primary shrink-0 rounded-lg px-4 py-2 text-sm font-semibold">
            {{ t('auth.logIn') }}
          </NuxtLink>
        </div>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>
