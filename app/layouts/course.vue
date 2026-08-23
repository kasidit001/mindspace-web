<script setup lang="ts">
const { data: courses, status, error } = useCourses()
const route = useRoute()
const progress = useProgressStore()
const paletteOpen = useCommandPaletteOpen()

const sidebarOpen = ref(false)

// Avoid a hydration mismatch: the server never knows localStorage progress,
// so only render checkmarks once mounted on the client.
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

// Close the mobile drawer whenever the route changes (i.e. a lesson was picked).
watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  }
)
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <!-- Backdrop for the mobile sidebar drawer -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/30 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Left sidebar: courses & lessons -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-72 shrink-0 transform overflow-y-auto border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950 lg:static lg:z-auto lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        <div>
          <NuxtLink to="/courses" class="text-lg font-bold">Mindspace</NuxtLink>
          <p class="text-xs text-slate-500 dark:text-slate-400">Courses</p>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
          aria-label="Close sidebar"
          @click="sidebarOpen = false"
        >
          ✕
        </button>
      </div>

      <button
        type="button"
        class="mx-2 mt-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5 text-left text-sm text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
        @click="paletteOpen = true"
      >
        <span aria-hidden="true">🔎</span>
        <span class="flex-1">Search lessons…</span>
        <kbd class="rounded border border-slate-300 px-1 text-[10px] dark:border-slate-600">⌘K</kbd>
      </button>

      <p v-if="status === 'pending'" class="px-4 py-3 text-sm text-slate-500">Loading courses…</p>
      <p v-else-if="error" class="px-4 py-3 text-sm text-red-600 dark:text-red-400">
        Couldn't load courses. Is mindspace-api running on port 8080?
      </p>

      <nav v-else class="px-2 py-2">
        <div v-for="course in courses" :key="course.id" class="mb-4">
          <p class="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {{ course.title }}
          </p>
          <ul>
            <li v-for="lesson in course.lessons" :key="lesson.id">
              <NuxtLink
                :to="`/courses/${lesson.id}`"
                class="flex items-center gap-2 rounded-md border-l-2 px-2.5 py-1.5 text-sm transition-colors duration-150"
                :class="route.params.lessonId === lesson.id
                  ? 'border-emerald-500 bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'border-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800'"
              >
                <span class="flex-1 truncate">{{ lesson.order }}. {{ lesson.title }}</span>
                <span
                  v-if="mounted && progress.isCompleted(lesson.id)"
                  class="shrink-0 text-emerald-500"
                  title="Completed"
                  aria-label="Completed"
                >
                  ✓
                </span>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <p v-if="courses && courses.length === 0" class="px-2 py-1 text-sm text-slate-500">
          No courses yet.
        </p>
      </nav>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Mobile top bar: reopen the sidebar drawer -->
      <div class="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 lg:hidden">
        <button
          type="button"
          class="text-xl leading-none text-slate-600 dark:text-slate-300"
          aria-label="Open sidebar"
          @click="sidebarOpen = true"
        >
          ☰
        </button>
        <span class="font-semibold">Mindspace</span>
      </div>

      <!-- Main content -->
      <main class="min-w-0 flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>

    <!-- AI chat drawer, available everywhere in the course layout -->
    <ChatDrawer />
  </div>
</template>
