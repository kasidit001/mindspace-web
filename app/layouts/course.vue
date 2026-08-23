<script setup lang="ts">
const { data: courses, status, error } = useCourses()
const route = useRoute()
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <!-- Left sidebar: courses & lessons -->
    <aside class="w-72 shrink-0 overflow-y-auto border-r border-slate-200 dark:border-slate-800">
      <div class="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        <NuxtLink to="/courses" class="text-lg font-bold">Mindspace</NuxtLink>
        <p class="text-xs text-slate-500 dark:text-slate-400">Courses</p>
      </div>

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
                class="block rounded-md border-l-2 px-2.5 py-1.5 text-sm transition-colors duration-150"
                :class="route.params.lessonId === lesson.id
                  ? 'border-emerald-500 bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'border-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800'"
              >
                {{ lesson.order }}. {{ lesson.title }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <p v-if="courses && courses.length === 0" class="px-2 py-1 text-sm text-slate-500">
          No courses yet.
        </p>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>

    <!-- AI chat drawer, available everywhere in the course layout -->
    <ChatDrawer />
  </div>
</template>
