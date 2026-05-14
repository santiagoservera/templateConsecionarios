<script setup>
import { computed, ref } from 'vue'
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { default: '' },
  options:     { type: Array,   default: () => [] },
  placeholder: { type: String,  default: 'Seleccionar...' },
  disabled:    { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

const normalizedOptions = computed(() =>
  props.options.map((o) =>
    typeof o === 'object' ? o : { value: o, label: o }
  )
)

const selectedLabel = computed(() => {
  const found = normalizedOptions.value.find(
    (o) => String(o.value) === String(props.modelValue)
  )
  return found?.label ?? null
})

// ── Posicionamiento del dropdown fuera del overflow del modal ─────────────────
const triggerRef    = ref(null)
const dropdownStyle = ref({})

function updatePosition() {
  const el = triggerRef.value?.$el ?? triggerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()

  // Si no hay espacio abajo, abrir hacia arriba
  const spaceBelow = window.innerHeight - rect.bottom
  const openUp     = spaceBelow < 260 && rect.top > 260

  dropdownStyle.value = {
    left:  rect.left  + 'px',
    width: rect.width + 'px',
    ...(openUp
      ? { bottom: (window.innerHeight - rect.top + 4) + 'px' }
      : { top:    (rect.bottom + 4) + 'px' }
    ),
  }
}
</script>

<template>
  <Listbox
    :model-value="modelValue"
    :disabled="disabled"
    v-bind="$attrs"
    @update:model-value="(v) => { emit('update:modelValue', v); emit('change', v) }"
  >
    <div class="relative w-full">

      <!-- Botón (campo cerrado) -->
      <ListboxButton
        ref="triggerRef"
        class="w-full flex items-center justify-between gap-2
               rounded-xl border px-3.5 py-2.5 text-sm text-left
               transition-colors focus:outline-none
               border-slate-200 dark:border-white/10
               bg-white dark:bg-[#1a1a2e]
               hover:border-slate-300 dark:hover:border-white/20
               focus:border-primary-500 focus:ring-1 focus:ring-primary-500
               disabled:opacity-50 disabled:cursor-not-allowed
               cursor-pointer"
        @click="updatePosition"
      >
        <span
          class="truncate"
          :class="selectedLabel
            ? 'text-slate-900 dark:text-white'
            : 'text-slate-400 dark:text-slate-500'"
        >
          {{ selectedLabel ?? placeholder }}
        </span>

        <svg
          class="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500 transition-transform ui-open:rotate-180"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7"/>
        </svg>
      </ListboxButton>

      <!-- Dropdown teleportado al body para escapar del overflow del modal -->
      <Teleport to="body">
        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-1"
        >
          <ListboxOptions
            class="fixed z-[9999] origin-top overflow-auto
                   rounded-xl border shadow-xl
                   max-h-60 focus:outline-none
                   bg-white dark:bg-[#1a1a2e]
                   border-slate-200 dark:border-white/10"
            :style="dropdownStyle"
          >
            <ListboxOption
              v-for="opt in normalizedOptions"
              :key="String(opt.value)"
              :value="opt.value"
              v-slot="{ active, selected }"
            >
              <li
                class="flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm cursor-pointer select-none transition-colors"
                :class="[
                  active
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'text-slate-700 dark:text-slate-200',
                  selected && !active ? 'bg-slate-50 dark:bg-white/5' : ''
                ]"
              >
                <span :class="selected ? 'font-medium' : ''">{{ opt.label }}</span>
                <svg
                  v-if="selected"
                  class="w-4 h-4 shrink-0 text-primary-500"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                </svg>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </Transition>
      </Teleport>

    </div>
  </Listbox>
</template>
