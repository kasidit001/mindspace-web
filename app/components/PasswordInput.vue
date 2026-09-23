<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'

const props = withDefaults(defineProps<{
  modelValue: string
  autocomplete: 'current-password' | 'new-password'
  error?: boolean
}>(), {
  error: false
})

defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useLanguage()

const visible = ref(false)
</script>

<template>
  <div class="relative">
    <input
      :value="props.modelValue"
      :type="visible ? 'text' : 'password'"
      :autocomplete="props.autocomplete"
      required
      minlength="6"
      class="w-full rounded-md border px-3 py-2 pr-10 text-sm focus:outline-none dark:bg-white/[0.04] dark:text-white"
      :class="error
        ? 'border-critical-400 focus:border-critical-500 dark:border-critical-600'
        : 'border-divider bg-white focus:border-accent-500 dark:border-divider-dark'"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <button
      type="button"
      class="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
      :aria-label="visible ? t('auth.hidePassword') : t('auth.showPassword')"
      tabindex="-1"
      @click="visible = !visible"
    >
      <component :is="visible ? EyeOff : Eye" :size="16" :stroke-width="1.75" />
    </button>
  </div>
</template>
