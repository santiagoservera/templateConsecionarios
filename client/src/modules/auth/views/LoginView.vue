<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../store/authStore.js'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const email    = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)
const showPass = ref(false)

async function handleSubmit() {
  error.value   = ''
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    router.push(route.query.redirect || '/dashboard')
  } catch (err) {
    error.value = err.response?.data?.error ?? 'Credenciales incorrectas'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="animate-fade-in">

    <!-- Encabezado -->
    <div class="mb-8">
      <p class="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-2">Bienvenido de vuelta</p>
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Iniciá sesión en<br/>tu cuenta</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">Ingresá tus credenciales para continuar</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">

      <!-- Error -->
      <div
        v-if="error"
        class="flex items-center gap-2.5 rounded-xl
               bg-red-50 dark:bg-red-500/10
               border border-red-200 dark:border-red-500/20
               px-4 py-3"
      >
        <svg class="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
        </svg>
        <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- Email -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Email
        </label>
        <div class="relative">
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg class="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/>
            </svg>
          </div>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            placeholder="usuario@motoros.com"
            class="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all
                   border border-slate-200 dark:border-white/10
                   bg-slate-50 dark:bg-white/5
                   text-slate-900 dark:text-white
                   placeholder-slate-400 dark:placeholder-slate-500
                   focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-white/8
                   outline-none"
          />
        </div>
      </div>

      <!-- Contraseña -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Contraseña
        </label>
        <div class="relative">
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg class="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/>
            </svg>
          </div>
          <input
            v-model="password"
            :type="showPass ? 'text' : 'password'"
            autocomplete="current-password"
            required
            placeholder="••••••••"
            class="w-full pl-10 pr-12 py-3 rounded-xl text-sm transition-all
                   border border-slate-200 dark:border-white/10
                   bg-slate-50 dark:bg-white/5
                   text-slate-900 dark:text-white
                   placeholder-slate-400 dark:placeholder-slate-500
                   focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-white/8
                   outline-none"
          />
          <!-- Toggle mostrar/ocultar -->
          <button
            type="button"
            class="absolute right-3.5 top-1/2 -translate-y-1/2
                   text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300
                   transition-colors"
            @click="showPass = !showPass"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path v-if="showPass" stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/>
              <template v-else>
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </template>
            </svg>
          </button>
        </div>
      </div>

      <!-- Botón submit -->
      <button
        type="submit"
        :disabled="loading"
        class="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all mt-2
               bg-primary-500 hover:bg-primary-600
               text-white shadow-sm hover:shadow-glow
               active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span v-if="loading" class="flex items-center justify-center gap-2">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Ingresando...
        </span>
        <span v-else class="flex items-center justify-center gap-2">
          Ingresar
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
          </svg>
        </span>
      </button>

    </form>

    <!-- Footer -->
    <div class="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
      <p class="text-center text-xs text-slate-400 dark:text-slate-500">
        MotorOS &mdash; Sistema de gestión de concesionarias
      </p>
    </div>
  </div>
</template>
