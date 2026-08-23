<script setup lang="ts">
const { data: courses } = useCourses()
const { ask } = useChatAsk()

const open = useCommandPaletteOpen()
const chatOpen = useChatDrawerOpen()

const query = ref('')
const activeIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)

interface LessonItem {
  type: 'lesson'
  id: string
  title: string
  courseTitle: string
}
interface AskItem {
  type: 'ask'
  query: string
}
type PaletteItem = LessonItem | AskItem

const allLessons = computed<LessonItem[]>(() =>
  (courses.value ?? []).flatMap((course) =>
    course.lessons.map((lesson) => ({
      type: 'lesson' as const,
      id: lesson.id,
      title: lesson.title,
      courseTitle: course.title
    }))
  )
)

const filteredLessons = computed(() => {
  const q = query.value.trim().toLowerCase()
  const source = !q
    ? allLessons.value
    : allLessons.value.filter(
        (l) => l.title.toLowerCase().includes(q) || l.courseTitle.toLowerCase().includes(q)
      )
  return source.slice(0, 8)
})

const items = computed<PaletteItem[]>(() => {
  const trimmed = query.value.trim()
  return trimmed ? [...filteredLessons.value, { type: 'ask', query: trimmed }] : filteredLessons.value
})

watch(items, () => {
  activeIndex.value = 0
})

function close() {
  open.value = false
  query.value = ''
  activeIndex.value = 0
}

async function selectItem(item: PaletteItem | undefined) {
  if (!item) return
  if (item.type === 'lesson') {
    close()
    await navigateTo(`/courses/${item.id}`)
  } else {
    const q = item.query
    close()
    chatOpen.value = true
    await ask(q)
  }
}

function onKeydownGlobal(e: KeyboardEvent) {
  const isMod = e.metaKey || e.ctrlKey
  if (isMod && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
  } else if (e.key === 'Escape' && open.value) {
    close()
  }
}

function onKeydownInput(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, items.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    selectItem(items.value[activeIndex.value])
  }
}

watch(open, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    inputEl.value?.focus()
  }
})

onMounted(() => window.addEventListener('keydown', onKeydownGlobal))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydownGlobal))
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex justify-center bg-black/40 px-4 pt-[12vh]"
    @click.self="close"
  >
    <div class="h-fit w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div class="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <span class="text-slate-400" aria-hidden="true">🔎</span>
        <input
          ref="inputEl"
          v-model="query"
          type="text"
          placeholder="Search lessons, or ask the AI tutor…"
          class="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
          @keydown="onKeydownInput"
        >
        <kbd class="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-600">esc</kbd>
      </div>

      <ul class="max-h-80 overflow-y-auto py-2" role="listbox">
        <li v-if="filteredLessons.length === 0 && !query.trim()" class="px-4 py-6 text-center text-sm text-slate-500">
          No lessons available yet.
        </li>

        <li v-for="(item, i) in items" :key="item.type === 'lesson' ? item.id : 'ask'">
          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm"
            :class="i === activeIndex ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'"
            @mouseenter="activeIndex = i"
            @click="selectItem(item)"
          >
            <template v-if="item.type === 'lesson'">
              <span aria-hidden="true">📄</span>
              <span class="flex-1 truncate">
                <span class="text-slate-900 dark:text-white">{{ item.title }}</span>
                <span class="ml-2 text-xs text-slate-500 dark:text-slate-400">{{ item.courseTitle }}</span>
              </span>
            </template>
            <template v-else>
              <span aria-hidden="true">💬</span>
              <span class="flex-1 truncate text-slate-900 dark:text-white">
                Ask AI Tutor: <span class="italic text-slate-600 dark:text-slate-300">“{{ item.query }}”</span>
              </span>
            </template>
            <kbd
              v-if="i === activeIndex"
              class="rounded border border-emerald-300 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
            >
              ↵
            </kbd>
          </button>
        </li>
      </ul>

      <div class="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800">
        <kbd class="rounded border border-slate-300 px-1 dark:border-slate-600">↑↓</kbd> navigate ·
        <kbd class="rounded border border-slate-300 px-1 dark:border-slate-600">↵</kbd> select ·
        <kbd class="rounded border border-slate-300 px-1 dark:border-slate-600">esc</kbd> close
      </div>
    </div>
  </div>
</template>
