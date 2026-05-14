<script setup>
import { useToast } from '../composables/useToast.js'

const { toasts, remove } = useToast()

const CONFIG = {
  success: {
    bar:  'bg-emerald-500',
    icon: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    title: 'text-slate-900 dark:text-white',
  },
  error: {
    bar:  'bg-red-500',
    icon: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
    title: 'text-slate-900 dark:text-white',
  },
  warning: {
    bar:  'bg-amber-500',
    icon: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    title: 'text-slate-900 dark:text-white',
  },
  info: {
    bar:  'bg-blue-500',
    icon: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    title: 'text-slate-900 dark:text-white',
  },
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none" style="max-width: 360px; width: calc(100vw - 2rem);">
      <TransitionGroup
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-x-8 scale-95"
        enter-to-class="opacity-100 translate-x-0 scale-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 translate-x-0 scale-100"
        leave-to-class="opacity-0 translate-x-8 scale-95"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 rounded-2xl p-4 pr-3 shadow-card-lg
                 bg-white dark:bg-[#1e1e35] border border-slate-200 dark:border-white/10
                 cursor-pointer select-none relative overflow-hidden"
          @click="remove(toast.id)"
        >
          <!-- Barra de color lateral -->
          <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" :class="CONFIG[toast.type]?.bar" />

          <!-- Ícono -->
          <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ml-1" :class="CONFIG[toast.type]?.icon">
            <!-- success -->
            <svg v-if="toast.type==='success'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
            </svg>
            <!-- error -->
            <svg v-else-if="toast.type==='error'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
            </svg>
            <!-- warning -->
            <svg v-else-if="toast.type==='warning'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
            </svg>
            <!-- info -->
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/>
            </svg>
          </div>

          <!-- Texto -->
          <div class="flex-1 min-w-0 pt-0.5">
            <p class="text-sm font-semibold leading-tight" :class="CONFIG[toast.type]?.title">{{ toast.title }}</p>
            <p v-if="toast.message" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{{ toast.message }}</p>
          </div>

          <!-- Cerrar -->
          <button
            class="p-1 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors shrink-0"
            @click.stop="remove(toast.id)"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
