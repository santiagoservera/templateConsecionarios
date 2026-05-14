<script setup>
defineProps({
  columns:   { type: Array,   required: true },
  rows:      { type: Array,   default: () => [] },
  loading:   { type: Boolean, default: false },
  rowKey:    { type: String,  default: 'id' },
  clickable: { type: Boolean, default: false },
})

const emit = defineEmits(['row-click'])
</script>

<template>
  <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/5 shadow-card dark:shadow-none bg-white dark:bg-[#1a1a2e]">
    <table class="min-w-full">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <thead>
        <tr class="border-b border-slate-200 dark:border-white/10"
            style="background: transparent;">
          <th
            v-for="col in columns"
            :key="col.key"
            scope="col"
            class="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest
                   text-slate-400 dark:text-slate-500
                   bg-slate-50 dark:bg-[#14141f]
                   first:rounded-tl-2xl last:rounded-tr-2xl"
            :class="col.headerClass"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>

      <!-- ── Body ──────────────────────────────────────────────────────── -->
      <tbody>

        <!-- Loading -->
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-5 py-14 text-center">
            <div class="flex items-center justify-center gap-2.5">
              <svg class="w-5 h-5 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <span class="text-sm font-medium text-slate-400 dark:text-slate-500">Cargando...</span>
            </div>
          </td>
        </tr>

        <!-- Empty -->
        <tr v-else-if="!rows.length">
          <td :colspan="columns.length" class="px-5 py-14 text-center text-sm text-slate-400 dark:text-slate-500">
            <slot name="empty">Sin resultados para mostrar.</slot>
          </td>
        </tr>

        <!-- Filas de datos -->
        <tr
          v-else
          v-for="(row, rowIdx) in rows"
          :key="row[rowKey]"
          class="group transition-all duration-100"
          :class="[
            rowIdx < rows.length - 1
              ? 'border-b border-slate-200 dark:border-white/10'
              : '',
            clickable
              ? 'cursor-pointer hover:bg-primary-50/60 dark:hover:bg-primary-500/5'
              : 'hover:bg-slate-50/60 dark:hover:bg-white/3',
          ]"
          @click="clickable && emit('row-click', row)"
        >
          <td
            v-for="(col, colIdx) in columns"
            :key="col.key"
            class="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300 transition-colors duration-100"
            :class="[
              col.class,
              // Borde izquierdo naranja en el primer TD cuando es clickable
              colIdx === 0 && clickable
                ? 'border-l-2 border-l-transparent group-hover:border-l-primary-500'
                : '',
            ]"
          >
            <slot :name="`cell-${col.key}`" :value="row[col.key]" :row="row">
              {{ row[col.key] ?? '—' }}
            </slot>
          </td>
        </tr>

      </tbody>
    </table>
  </div>
</template>
