<script setup>
import { computed } from 'vue'

const props = defineProps({
  page:     { type: Number, required: true },
  total:    { type: Number, required: true },
  pageSize: { type: Number, default: 20 },
})

const emit = defineEmits(['update:page'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const from = computed(() => Math.min((props.page - 1) * props.pageSize + 1, props.total))
const to   = computed(() => Math.min(props.page * props.pageSize, props.total))

const pages = computed(() => {
  const tp = totalPages.value
  if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1)
  const cur = props.page
  const result = [1]
  if (cur > 3) result.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(tp - 1, cur + 1); i++) result.push(i)
  if (cur < tp - 2) result.push('...')
  result.push(tp)
  return result
})

const go = (p) => {
  if (p >= 1 && p <= totalPages.value && p !== props.page) emit('update:page', p)
}
</script>

<template>
  <div v-if="total > 0" class="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
    <p class="text-sm text-slate-400 dark:text-slate-500">
      Mostrando
      <span class="font-semibold text-slate-600 dark:text-slate-300 font-mono">{{ from }}–{{ to }}</span>
      de
      <span class="font-semibold text-slate-600 dark:text-slate-300 font-mono">{{ total }}</span>
    </p>

    <div class="flex items-center gap-1">
      <button
        class="px-3 py-1.5 rounded-xl text-sm font-medium transition-all
               text-slate-600 dark:text-slate-400
               disabled:opacity-30 disabled:cursor-not-allowed
               hover:bg-slate-100 dark:hover:bg-white/5"
        :disabled="page <= 1"
        @click="go(page - 1)"
      >
        ← Ant
      </button>

      <template v-for="(p, i) in pages" :key="i">
        <span v-if="p === '...'" class="px-2 py-1.5 text-sm text-slate-300 dark:text-slate-600 select-none">…</span>
        <button
          v-else
          class="w-9 h-9 rounded-xl text-sm font-semibold transition-all"
          :class="p === page
            ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'"
          @click="go(p)"
        >
          {{ p }}
        </button>
      </template>

      <button
        class="px-3 py-1.5 rounded-xl text-sm font-medium transition-all
               text-slate-600 dark:text-slate-400
               disabled:opacity-30 disabled:cursor-not-allowed
               hover:bg-slate-100 dark:hover:bg-white/5"
        :disabled="page >= totalPages"
        @click="go(page + 1)"
      >
        Sig →
      </button>
    </div>
  </div>
</template>
