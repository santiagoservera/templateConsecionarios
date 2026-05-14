<script setup>
import { computed } from 'vue'

// Cada valor tiene clases light + dark explícitas para que Tailwind JIT las detecte
const COLOR_MAP = {
  DISPONIBLE:      'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/20',
  RESERVADO:       'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/20',
  VENDIDO:         'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10',
  EN_PREPARACION:  'bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:ring-sky-500/20',
  EN_CONSIGNACION: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-400 dark:ring-violet-500/20',
  NUEVO:           'bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/20',
  CONTACTADO:      'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:ring-cyan-500/20',
  INTERESADO:      'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:ring-indigo-500/20',
  NEGOCIACION:     'bg-orange-100 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:ring-orange-500/20',
  GANADO:          'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/20',
  PERDIDO:         'bg-red-100 text-red-600 ring-1 ring-red-200 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/20',
  RESERVA:         'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/20',
  EN_TRAMITE:      'bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:ring-sky-500/20',
  ENTREGADO:       'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/20',
  CANCELADO:       'bg-red-100 text-red-600 ring-1 ring-red-200 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/20',
  ABIERTO:         'bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/20',
  EN_GESTION:      'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/20',
  CERRADO:         'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10',
  PENDIENTE:       'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/20',
  APROBADO:        'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/20',
  RECHAZADO:       'bg-red-100 text-red-600 ring-1 ring-red-200 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/20',
  LIQUIDADA:       'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/20',
  AUTO:            'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10',
  MOTO:            'bg-blue-100 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/20',
  USADO:           'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10',
  CONSIGNACION:    'bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-400 dark:ring-violet-500/20',
  CONTADO:         'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/20',
  FINANCIADO:      'bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/20',
  MIXTO:           'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:ring-indigo-500/20',
  EN_CURSO:        'bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:ring-sky-500/20',
  COMPLETADO:      'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/20',
  ACTIVO:          'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/20',
  INACTIVO:        'bg-slate-100 text-slate-400 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-500 dark:ring-white/10',
}

const LABEL_MAP = {
  DISPONIBLE:'Disponible', RESERVADO:'Reservado', VENDIDO:'Vendido',
  EN_PREPARACION:'En preparación', EN_CONSIGNACION:'En consignación',
  NUEVO:'Nuevo', CONTACTADO:'Contactado', INTERESADO:'Interesado',
  NEGOCIACION:'Negociación', GANADO:'Ganado', PERDIDO:'Perdido',
  RESERVA:'Reserva', EN_TRAMITE:'En trámite', ENTREGADO:'Entregado', CANCELADO:'Cancelado',
  ABIERTO:'Abierto', EN_GESTION:'En gestión', CERRADO:'Cerrado',
  PENDIENTE:'Pendiente', APROBADO:'Aprobado', RECHAZADO:'Rechazado', LIQUIDADA:'Liquidada',
  AUTO:'Auto', MOTO:'Moto', USADO:'Usado', CONSIGNACION:'Consignación',
  CONTADO:'Contado', FINANCIADO:'Financiado', MIXTO:'Mixto',
  EN_CURSO:'En curso', COMPLETADO:'Completado',
  ACTIVO:'Activo', INACTIVO:'Inactivo',
}

const props = defineProps({
  value: { type: String, required: true },
  label: { type: String, default: null },
  size:  { type: String, default: 'sm' },
})

const colorClass   = computed(() => COLOR_MAP[props.value] ?? 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10')
const displayLabel = computed(() => props.label ?? LABEL_MAP[props.value] ?? props.value)
</script>

<template>
  <span
    class="inline-flex items-center font-medium rounded-full whitespace-nowrap"
    :class="[colorClass, size==='xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs']"
  >
    {{ displayLabel }}
  </span>
</template>
