<script setup lang="ts">
import { Check, CircleAlert, FlaskConical, Lightbulb, LoaderCircle, Play, Send, Terminal, X } from '@lucide/vue'
import type { LessonLab } from '~/types/course'
import type { CodeLabResult, CodePreviewResult } from '~/utils/runCodeLab'

const props = defineProps<{ labs: LessonLab[] }>()
const emit = defineEmits<{ passed: [] }>()

const { t } = useLanguage()
const progress = useProgressStore()

const activeIndex = ref(0)
const activeLab = computed<LessonLab>(() => props.labs[activeIndex.value]!)

// Per-lab state, keyed by lab id, so switching the active lab (or coming
// back to one already attempted) doesn't lose anything.
const codeByLab = reactive<Record<string, string>>(
  Object.fromEntries(props.labs.map((l) => [l.id, l.starterCode]))
)
const resultByLab = reactive<Record<string, CodeLabResult | null>>(
  Object.fromEntries(props.labs.map((l) => [l.id, null]))
)
const runningByLab = reactive<Record<string, boolean>>(
  Object.fromEntries(props.labs.map((l) => [l.id, false]))
)
// "Run Code" (ungraded — just execute and show console output) is kept
// separate from "Submit Answer" (graded, below) so trying code out doesn't
// get conflated with an actual attempt.
const previewByLab = reactive<Record<string, CodePreviewResult | null>>(
  Object.fromEntries(props.labs.map((l) => [l.id, null]))
)
const previewRunningByLab = reactive<Record<string, boolean>>(
  Object.fromEntries(props.labs.map((l) => [l.id, false]))
)
const passedLabIds = ref(new Set<string>())

const activeCode = computed({
  get: () => codeByLab[activeLab.value.id]!,
  set: (v: string) => { codeByLab[activeLab.value.id] = v }
})
const activeResult = computed(() => resultByLab[activeLab.value.id] ?? null)
const activeRunning = computed(() => runningByLab[activeLab.value.id] ?? false)
const activePreview = computed(() => previewByLab[activeLab.value.id] ?? null)
const activePreviewRunning = computed(() => previewRunningByLab[activeLab.value.id] ?? false)

const passedCount = computed(() => activeResult.value?.checks.filter((c) => c.pass).length ?? 0)
const totalCount = computed(() => activeResult.value?.checks.length ?? 0)
const activeAllPassed = computed(() => activeResult.value?.ok && totalCount.value > 0 && passedCount.value === totalCount.value)

const allLabsPassed = computed(() => props.labs.every((l) => passedLabIds.value.has(l.id)))
watch(allLabsPassed, (passed) => {
  if (passed) emit('passed')
})

async function runPreview() {
  const lab = activeLab.value
  previewRunningByLab[lab.id] = true
  previewByLab[lab.id] = null
  try {
    previewByLab[lab.id] = await runCodePreview(codeByLab[lab.id]!)
  } finally {
    previewRunningByLab[lab.id] = false
  }
}

async function submitAnswer() {
  const lab = activeLab.value
  runningByLab[lab.id] = true
  resultByLab[lab.id] = null
  try {
    const result = await runCodeLab(codeByLab[lab.id]!, lab.testCode)
    resultByLab[lab.id] = result
    const total = result.checks.length
    const pass = result.ok && total > 0 && result.checks.every((c) => c.pass)
    if (pass) {
      const next = new Set(passedLabIds.value)
      next.add(lab.id)
      passedLabIds.value = next
    }
  } finally {
    runningByLab[lab.id] = false
  }
}

function revealHint(lab: LessonLab) {
  progress.useHint(lab.id)
}

// Tab inserts two spaces instead of moving focus out of the textarea.
function onTab(event: KeyboardEvent) {
  event.preventDefault()
  const el = event.target as HTMLTextAreaElement
  const start = el.selectionStart
  const end = el.selectionEnd
  activeCode.value = activeCode.value.slice(0, start) + '  ' + activeCode.value.slice(end)
  nextTick(() => {
    el.selectionStart = el.selectionEnd = start + 2
  })
}

// Line-number gutter for the editor: a scroll-synced column, not a real
// editor — no syntax highlighting, just enough to stop feeling like a bare
// <textarea> for anything more than a couple of lines.
const gutterEl = ref<HTMLElement | null>(null)
const lineCount = computed(() => Math.max(1, activeCode.value.split('\n').length))
function syncGutterScroll(event: Event) {
  if (gutterEl.value) gutterEl.value.scrollTop = (event.target as HTMLTextAreaElement).scrollTop
}
</script>

<template>
  <div class="not-prose overflow-hidden rounded-xl border border-divider dark:border-divider-dark">
    <div class="flex items-center justify-between gap-2 border-b border-divider px-4 py-2.5 dark:border-divider-dark">
      <span class="flex items-center gap-2 text-sm font-semibold">
        <FlaskConical :size="15" :stroke-width="1.9" class="text-ai-600 dark:text-ai-400" />
        {{ t('lab.title') }}
      </span>

      <!-- Progress dots — one per lab in this lesson, clickable, only shown
           when there's more than one to navigate between. -->
      <div v-if="labs.length > 1" class="flex items-center gap-1.5">
        <button
          v-for="(lab, i) in labs"
          :key="lab.id"
          type="button"
          class="size-2.5 rounded-full transition-colors"
          :class="[
            passedLabIds.has(lab.id)
              ? 'bg-success-500'
              : i === activeIndex ? 'bg-accent-500' : 'bg-zinc-300 dark:bg-white/20'
          ]"
          :aria-label="t('lab.goToLab', { n: i + 1 })"
          :aria-current="i === activeIndex"
          @click="activeIndex = i"
        />
        <span class="ml-1 text-xs text-zinc-500 dark:text-zinc-400">{{ t('lab.labProgress', { current: activeIndex + 1, total: labs.length }) }}</span>
      </div>
    </div>

    <!-- Two columns on larger screens: instructions/hint on the left,
         editor + results on the right — stacked on mobile. -->
    <div class="flex flex-col md:flex-row">
      <div class="shrink-0 border-b border-divider p-4 dark:border-divider-dark md:w-64 md:border-b-0 md:border-r">
        <h3 class="font-semibold">{{ activeLab.title }}</h3>
        <p class="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{{ activeLab.instructions }}</p>

        <template v-if="activeLab.hint">
          <p v-if="progress.hasUsedHint(activeLab.id)" class="mt-4 flex items-start gap-1.5 rounded-md bg-ai-50 p-2.5 text-xs text-ai-800 dark:bg-ai-400/10 dark:text-ai-300">
            <Lightbulb :size="13" :stroke-width="1.9" class="mt-0.5 shrink-0" />
            {{ activeLab.hint }}
          </p>
          <button
            v-else
            type="button"
            class="mt-4 inline-flex items-center gap-1.5 rounded-md border border-divider px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-ai-400 hover:text-ai-700 dark:border-divider-dark dark:text-zinc-300 dark:hover:text-ai-400"
            @click="revealHint(activeLab)"
          >
            <Lightbulb :size="13" :stroke-width="1.9" />
            {{ t('lab.viewHint', { cost: HINT_POINT_COST }) }}
          </button>
        </template>
      </div>

      <div class="min-w-0 flex-1 p-4">
        <div class="flex overflow-hidden rounded-lg bg-zinc-900">
          <div
            ref="gutterEl"
            class="select-none overflow-hidden px-2.5 py-4 text-right font-mono text-[13px] leading-6 text-zinc-600"
          >
            <div v-for="n in lineCount" :key="n">{{ n }}</div>
          </div>
          <textarea
            v-model="activeCode"
            spellcheck="false"
            autocapitalize="off"
            autocorrect="off"
            class="h-48 flex-1 resize-y bg-transparent py-4 pr-4 font-mono text-[13px] leading-6 text-zinc-100 outline-none"
            @keydown.tab="onTab"
            @scroll="syncGutterScroll"
          />
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md border border-divider px-4 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-60 dark:border-divider-dark dark:text-zinc-200"
            :disabled="activePreviewRunning"
            @click="runPreview"
          >
            <component :is="activePreviewRunning ? LoaderCircle : Play" :size="14" :stroke-width="2" :class="activePreviewRunning && 'animate-spin'" />
            {{ activePreviewRunning ? t('lab.running') : t('lab.runCode') }}
          </button>

          <button
            type="button"
            class="btn-primary inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
            :disabled="activeRunning"
            @click="submitAnswer"
          >
            <component :is="activeRunning ? LoaderCircle : Send" :size="14" :stroke-width="2" :class="activeRunning && 'animate-spin'" />
            {{ activeRunning ? t('lab.running') : t('lab.submitAnswer') }}
          </button>

          <p v-if="activeResult && !activeResult.ok && activeResult.timedOut" class="text-sm font-medium text-critical-600 dark:text-critical-400">
            {{ t('lab.timeout') }}
          </p>
          <p v-else-if="activeAllPassed" class="text-sm font-medium text-success-700 dark:text-success-400">
            {{ t('lab.allPassed') }}
          </p>
          <p v-else-if="activeResult && activeResult.ok" class="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {{ t('lab.somePassed', { passed: passedCount, total: totalCount }) }}
          </p>
        </div>

        <!-- Console Output — the result of "Run Code": whatever the code
             logged, or why it failed to run. Independent of Submit
             Answer's pass/fail checks below. -->
        <div v-if="activePreview" class="mt-3 rounded-md border border-divider dark:border-divider-dark">
          <div class="flex items-center gap-1.5 border-b border-divider px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:border-divider-dark dark:text-zinc-400">
            <Terminal :size="12" :stroke-width="2" />
            {{ t('lab.consoleOutput') }}
          </div>
          <div class="p-3 font-mono text-xs">
            <p v-if="!activePreview.ok && activePreview.timedOut" class="text-critical-600 dark:text-critical-400">{{ t('lab.timeout') }}</p>
            <p v-else-if="!activePreview.ok && activePreview.error" class="text-critical-600 dark:text-critical-400">{{ activePreview.error }}</p>
            <template v-else-if="activePreview.logs.length">
              <p v-for="(line, i) in activePreview.logs" :key="i" class="text-zinc-700 dark:text-zinc-300">{{ line }}</p>
            </template>
            <p v-else class="text-zinc-400 dark:text-zinc-500">{{ t('lab.noOutput') }}</p>
          </div>
        </div>

        <div
          v-if="activeResult && !activeResult.ok && !activeResult.timedOut && activeResult.error"
          class="mt-3 flex items-start gap-2 rounded-md border border-critical-200 bg-critical-50 p-3 text-sm text-critical-700 dark:border-critical-900/50 dark:bg-critical-900/20 dark:text-critical-400"
        >
          <CircleAlert :size="15" :stroke-width="1.9" class="mt-0.5 shrink-0" />
          <div>
            <p class="font-medium">{{ t('lab.errorTitle') }}</p>
            <p class="mt-0.5 font-mono text-xs">{{ activeResult.error }}</p>
          </div>
        </div>

        <ul v-if="activeResult && activeResult.checks.length" class="mt-3 space-y-1.5">
          <li
            v-for="(check, i) in activeResult.checks"
            :key="i"
            class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
            :class="check.pass
              ? 'border-success-400/30 bg-success-50 dark:border-success-400/20 dark:bg-success-400/10'
              : 'border-critical-200 bg-critical-50 dark:border-critical-900/40 dark:bg-critical-900/10'"
          >
            <component
              :is="check.pass ? Check : X"
              :size="15"
              :stroke-width="2.25"
              class="mt-0.5 shrink-0"
              :class="check.pass ? 'text-success-600 dark:text-success-400' : 'text-critical-600 dark:text-critical-400'"
            />
            <div class="min-w-0 flex-1">
              <p :class="check.pass ? 'text-success-700 dark:text-success-400' : 'text-critical-800 dark:text-critical-300'">
                {{ check.label }}
              </p>
              <p v-if="!check.pass" class="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {{ t('lab.expected') }}: {{ JSON.stringify(check.expected) }} · {{ t('lab.actual') }}: {{ JSON.stringify(check.actual) }}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
