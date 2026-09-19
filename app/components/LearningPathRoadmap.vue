<script setup lang="ts">
// A vertical node-flow roadmap — same visual language regardless of where
// it's used (the Home mini-widget today; a future full /map alternate view
// could reuse it). Nodes are real: 'lesson' nodes carry a real lesson's
// actual content_type (see mindspace-api's Lesson model — every lesson is
// 'article' today, since video/lab reader experiences don't exist yet), and
// 'badge' nodes are real thresholds from ~/utils/badges — never a
// fabricated "exam" or "CTF" node with nothing behind it.
import { Check, FileText, Play, Terminal, Trophy } from '@lucide/vue'
import type { LessonContentType } from '~/types/course'

export type RoadmapNodeState = 'completed' | 'current' | 'locked'

export interface RoadmapNode {
  id: string
  kind: 'lesson' | 'badge'
  title: string
  caption?: string
  contentType?: LessonContentType
  state: RoadmapNodeState
  to?: string
}

defineProps<{ nodes: RoadmapNode[] }>()

const { t } = useLanguage()

const CONTENT_TYPE_ICONS: Record<LessonContentType, typeof Play> = {
  article: FileText,
  video: Play,
  advlab: Terminal,
  ctf: Terminal
}
</script>

<template>
  <ol class="flex flex-col">
    <li v-for="(node, i) in nodes" :key="node.id" class="flex gap-3">
      <div class="flex flex-col items-center">
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-full"
          :class="[
            node.kind === 'badge'
              ? 'bg-warning-500 text-white'
              : node.state === 'completed'
                ? 'bg-success-500 text-white'
                : node.state === 'current'
                  ? 'bg-accent-500 text-white shadow-[0_0_0_5px_rgba(99,102,241,0.18)]'
                  : 'bg-zinc-100 text-zinc-400 dark:bg-white/[0.06] dark:text-zinc-600'
          ]"
        >
          <Check v-if="node.state === 'completed' && node.kind === 'lesson'" :size="15" :stroke-width="2.5" />
          <Trophy v-else-if="node.kind === 'badge'" :size="14" :stroke-width="2" />
          <component v-else :is="CONTENT_TYPE_ICONS[node.contentType ?? 'article']" :size="14" :stroke-width="2" />
        </span>
        <span
          v-if="i < nodes.length - 1"
          class="my-1 w-0.5 flex-1"
          :class="node.state === 'completed' ? 'bg-success-400' : 'border-l-2 border-dashed border-zinc-200 dark:border-white/10'"
          aria-hidden="true"
        />
      </div>
      <component
        :is="node.to ? 'NuxtLink' : 'div'"
        :to="node.to"
        class="min-w-0 flex-1 pb-6 pt-0.5 last:pb-0"
      >
        <p
          class="text-[10px] font-semibold uppercase tracking-wide"
          :class="node.state === 'locked' ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-400 dark:text-zinc-500'"
        >
          {{ node.kind === 'badge' ? t('dashboard.pathBadgeLabel') : t(`dashboard.contentType.${node.contentType ?? 'article'}`) }}
        </p>
        <p
          class="truncate text-sm font-semibold"
          :class="node.state === 'locked' ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-white'"
        >{{ node.title }}</p>
        <p v-if="node.caption" class="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{{ node.caption }}</p>
      </component>
    </li>
  </ol>
</template>
