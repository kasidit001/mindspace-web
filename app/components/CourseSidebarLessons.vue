<script setup lang="ts">
import { Check } from '@lucide/vue'
import type { LessonSummary } from '~/types/course'
import { CONTENT_TYPE_ICONS } from '~/utils/contentType'

defineProps<{ lessons: LessonSummary[] }>()

const route = useRoute()
const progress = useProgressStore()
const { t, lang } = useLanguage()

// Server-rendered progress would be wrong (localStorage is client-only), so
// checkmarks/the progress rail only switch on once mounted.
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <ul class="relative">
    <li v-for="lesson in lessons" :key="lesson.id" class="relative">
      <NuxtLink
        :to="`/courses/${lesson.id}`"
        class="group relative flex items-center gap-2.5 py-1.5 pl-4 pr-2.5 text-[13px] leading-5 transition-colors duration-100"
        :class="route.params.lessonId === lesson.id
          ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-white/[0.06] dark:text-white'
          : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-white/[0.04]'"
      >
        <!-- Progress rail: a continuous line down the lesson list — green
             where completed, indigo at the current lesson, dim elsewhere. -->
        <span
          class="absolute inset-y-0 left-0 w-0.5"
          :class="mounted && progress.isCompleted(lesson.id)
            ? 'bg-success-500'
            : route.params.lessonId === lesson.id
              ? 'bg-accent-500'
              : 'bg-divider dark:bg-divider-dark'"
          aria-hidden="true"
        />
        <!-- Marker: what the lesson actually is (article/video/lab) rather
             than its position — the list order already shows position, so a
             plain sequence number here was redundant and, out of visual
             order in a bug we hit, actively misleading. A checkmark takes
             over once complete. -->
        <span
          class="flex size-5 shrink-0 items-center justify-center rounded-md"
          :class="mounted && progress.isCompleted(lesson.id)
            ? 'bg-success-500 text-white'
            : route.params.lessonId === lesson.id
              ? 'bg-accent-500 text-white'
              : 'border border-divider text-zinc-400 dark:border-divider-dark dark:text-zinc-500'"
        >
          <Check v-if="mounted && progress.isCompleted(lesson.id)" :size="12" :stroke-width="2.25" :aria-label="t('sidebar.completed')" />
          <component
            :is="CONTENT_TYPE_ICONS[lesson.contentType]"
            v-else
            :size="11"
            :stroke-width="2"
            :aria-label="t(`dashboard.contentType.${lesson.contentType}`)"
          />
        </span>
        <span class="flex-1 truncate">{{ pickLocalized(lesson.titleEn, lesson.titleTh, lang) }}</span>
      </NuxtLink>
    </li>
  </ul>
</template>
