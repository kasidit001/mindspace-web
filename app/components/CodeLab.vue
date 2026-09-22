<script setup lang="ts">
import { Check, CircleAlert, FlaskConical, LoaderCircle, Play, X } from '@lucide/vue'
import type { CodeLabResult } from '~/utils/runCodeLab'

const props = defineProps<{ starterCode: string; testCode: string }>()
const emit = defineEmits<{ passed: [] }>()

const { t } = useLanguage()

const code = ref(props.starterCode)
const running = ref(false)
const result = ref<CodeLabResult | null>(null)

const passedCount = computed(() => result.value?.checks.filter((c) => c.pass).length ?? 0)
const totalCount = computed(() => result.value?.checks.length ?? 0)
const allPassed = computed(() => result.value?.ok && totalCount.value > 0 && passedCount.value === totalCount.value)

watch(allPassed, (passed) => {
  if (passed) emit('passed')
})

async function runTests() {
  running.value = true
  result.value = null
  try {
    result.value = await runCodeLab(code.value, props.testCode)
  } finally {
    running.value = false
  }
}

// Tab inserts two spaces instead of moving focus out of the textarea —
// without this, the editor is unusable for anything indentation-sensitive.
function onTab(event: KeyboardEvent) {
  event.preventDefault()
  const el = event.target as HTMLTextAreaElement
  const start = el.selectionStart
  const end = el.selectionEnd
  code.value = code.value.slice(0, start) + '  ' + code.value.slice(end)
  nextTick(() => {
    el.selectionStart = el.selectionEnd = start + 2
  })
}
</script>

<template>
  <div class="not-prose rounded-xl border border-divider dark:border-divider-dark">
    <div class="flex items-center gap-2 border-b border-divider px-4 py-2.5 dark:border-divider-dark">
      <FlaskConical :size="15" :stroke-width="1.9" class="text-ai-600 dark:text-ai-400" />
      <span class="text-sm font-semibold">{{ t('lab.title') }}</span>
    </div>

    <p class="px-4 pt-3 text-sm text-zinc-600 dark:text-zinc-400">{{ t('lab.instructions') }}</p>

    <textarea
      v-model="code"
      spellcheck="false"
      autocapitalize="off"
      autocorrect="off"
      class="m-4 h-48 w-[calc(100%-2rem)] resize-y rounded-lg bg-zinc-900 p-4 font-mono text-[13px] leading-6 text-zinc-100 outline-none focus:ring-2 focus:ring-accent-500/40"
      @keydown.tab="onTab"
    />

    <div class="flex items-center gap-3 px-4 pb-4">
      <button
        type="button"
        class="btn-primary inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
        :disabled="running"
        @click="runTests"
      >
        <component :is="running ? LoaderCircle : Play" :size="14" :stroke-width="2" :class="running && 'animate-spin'" />
        {{ running ? t('lab.running') : t('lab.runTests') }}
      </button>

      <p v-if="result && !result.ok && result.timedOut" class="text-sm font-medium text-critical-600 dark:text-critical-400">
        {{ t('lab.timeout') }}
      </p>
      <p v-else-if="allPassed" class="text-sm font-medium text-success-700 dark:text-success-400">
        {{ t('lab.allPassed') }}
      </p>
      <p v-else-if="result && result.ok" class="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {{ t('lab.somePassed', { passed: passedCount, total: totalCount }) }}
      </p>
    </div>

    <!-- Fatal error (bad syntax, an uncaught throw) — distinct from a normal
         run with failing assertions. -->
    <div
      v-if="result && !result.ok && !result.timedOut && result.error"
      class="mx-4 mb-4 flex items-start gap-2 rounded-md border border-critical-200 bg-critical-50 p-3 text-sm text-critical-700 dark:border-critical-900/50 dark:bg-critical-900/20 dark:text-critical-400"
    >
      <CircleAlert :size="15" :stroke-width="1.9" class="mt-0.5 shrink-0" />
      <div>
        <p class="font-medium">{{ t('lab.errorTitle') }}</p>
        <p class="mt-0.5 font-mono text-xs">{{ result.error }}</p>
      </div>
    </div>

    <ul v-if="result && result.checks.length" class="space-y-1.5 px-4 pb-4">
      <li
        v-for="(check, i) in result.checks"
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
</template>
