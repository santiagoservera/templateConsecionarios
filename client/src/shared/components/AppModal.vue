<script setup>
import { watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title:      { type: String,  default: '' },
  size:       { type: String,  default: 'md' },
})

const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)

watch(() => props.modelValue, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

const SIZE_CLASSES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm" @click="close" />

        <!-- Panel -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
        >
          <div
            v-if="modelValue"
            class="relative z-10 w-full flex flex-col max-h-[90vh] rounded-2xl overflow-hidden
                   bg-white dark:bg-[#1a1a2e]
                   border border-slate-200 dark:border-white/10
                   shadow-card-lg dark:shadow-2xl"
            :class="SIZE_CLASSES[size] || SIZE_CLASSES.md"
          >
            <!-- Accent line -->
            <div class="h-0.5 bg-gradient-to-r from-primary-500 to-orange-400 shrink-0" />

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
              <h3 class="text-base font-semibold text-slate-900 dark:text-white">{{ title }}</h3>
              <button
                class="p-1.5 rounded-lg transition-colors
                       text-slate-400 hover:text-slate-600 hover:bg-slate-100
                       dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-white/5"
                aria-label="Cerrar"
                @click="close"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-5">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-white/10 shrink-0
                     bg-slate-50 dark:bg-white/[0.03] rounded-b-2xl"
            >
              <slot name="footer" :close="close" />
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
