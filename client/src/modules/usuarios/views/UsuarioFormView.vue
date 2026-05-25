<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUsuarios } from '../composables/useUsuarios.js'
import { useRoles } from '../composables/useRoles.js'
import AppSelect from '../../../shared/components/AppSelect.vue'

const route  = useRoute()
const router = useRouter()
const { fetchUsuario, createUsuario, updateUsuario } = useUsuarios()
const { roles, fetchRoles } = useRoles()

const isEdit  = computed(() => !!route.params.id)
const loading = ref(false)
const saving  = ref(false)
const error   = ref('')

const form = ref({
  nombre:   '',
  email:    '',
  password: '',
  rol:      'VENDEDOR',
  activo:   true,
  rolId:    null,
})

const ROLES_LABEL = { ADMIN: 'Administrador', GERENTE: 'Gerente', VENDEDOR: 'Vendedor', CAJERO: 'Cajero', ASESOR: 'Asesor' }

const rolOptions = computed(() =>
  Object.keys(ROLES_LABEL).map(r => ({ value: r, label: ROLES_LABEL[r] }))
)

// Solo roles personalizados para el select adicional
const rolesPersonalizados = computed(() => roles.value.filter(r => !r.esDefault))
const rolPersonalizadoOptions = computed(() => [
  { value: null, label: 'Sin rol personalizado' },
  ...rolesPersonalizados.value.map(r => ({ value: r.id, label: r.nombre })),
])

// Permisos efectivos del rol seleccionado (para mostrar como referencia)
const permisosDelRol = computed(() => {
  if (form.value.rolId) {
    const custom = roles.value.find(r => r.id === Number(form.value.rolId))
    return custom ? JSON.parse(custom.permisos ?? '{}') : {}
  }
  const system = roles.value.find(r => r.nombre === form.value.rol)
  return system ? JSON.parse(system.permisos ?? '{}') : {}
})

onMounted(async () => {
  await fetchRoles()
  if (!isEdit.value) return
  loading.value = true
  try {
    const data = await fetchUsuario(route.params.id)
    form.value.nombre = data.nombre
    form.value.email  = data.email
    form.value.rol    = data.rol
    form.value.activo = data.activo
    form.value.rolId  = data.rolId ?? null
  } catch {
    error.value = 'No se pudo cargar el usuario'
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  if (!form.value.nombre || !form.value.email) {
    error.value = 'Nombre y email son requeridos'
    return
  }
  if (!isEdit.value && form.value.password.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }

  // Permisos se derivan del rol seleccionado automáticamente
  const rolRef = form.value.rolId
    ? roles.value.find(r => r.id === Number(form.value.rolId))
    : roles.value.find(r => r.nombre === form.value.rol)

  const payload = {
    nombre:       form.value.nombre,
    email:        form.value.email,
    rol:          form.value.rol,
    activo:       form.value.activo,
    permisosJson: rolRef?.permisos ?? '{}',
    rolId:        form.value.rolId ? Number(form.value.rolId) : null,
  }
  if (!isEdit.value || form.value.password) payload.password = form.value.password

  saving.value = true
  try {
    isEdit.value
      ? await updateUsuario(route.params.id, payload)
      : await createUsuario(payload)
    router.push('/usuarios')
  } catch (err) {
    error.value = err.response?.data?.error ?? 'Error al guardar'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto">

    <!-- Encabezado -->
    <div class="flex items-center gap-3 mb-6">
      <button
        class="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        @click="router.push('/usuarios')"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{{ isEdit ? 'Editar usuario' : 'Nuevo usuario' }}</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ isEdit ? 'Actualizá los datos del usuario' : 'Completá los datos para crear un usuario' }}</p>
      </div>
    </div>

    <!-- Cargando -->
    <div v-if="loading" class="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">Cargando...</div>

    <form v-else class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/5 p-6 space-y-5" @submit.prevent="save">

      <!-- Error global -->
      <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>

      <!-- Nombre + Email -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre *</label>
          <input
            v-model="form.nombre"
            type="text"
            required
            placeholder="Juan García"
            class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email *</label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="juan@dealeros.com"
            class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
      </div>

      <!-- Password -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Contraseña {{ isEdit ? '(dejá en blanco para no cambiar)' : '*' }}
        </label>
        <input
          v-model="form.password"
          type="password"
          :required="!isEdit"
          placeholder="Mínimo 8 caracteres"
          autocomplete="new-password"
          class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <!-- Rol + Activo -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Rol *</label>
          <AppSelect v-model="form.rol" :options="rolOptions" />
        </div>
        <div class="flex flex-col justify-end pb-0.5">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Estado</label>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
              :class="form.activo ? 'bg-primary-600' : 'bg-slate-300'"
              @click="form.activo = !form.activo"
            >
              <span
                class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200"
                :class="form.activo ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
            <span class="text-sm text-slate-700 dark:text-slate-300">{{ form.activo ? 'Activo' : 'Inactivo' }}</span>
          </div>
        </div>
      </div>

      <!-- Rol personalizado (opcional) -->
      <div v-if="rolesPersonalizados.length">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Rol personalizado
          <span class="text-slate-400 dark:text-slate-500 font-normal">(opcional)</span>
        </label>
        <AppSelect v-model="form.rolId" :options="rolPersonalizadoOptions" />
      </div>

      <!-- Secciones del rol (solo lectura, derivadas automáticamente) -->
      <div class="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4">
        <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          Accesos incluidos en este rol
        </p>
        <div v-if="Object.keys(permisosDelRol).length" class="flex flex-wrap gap-1.5">
          <span
            v-for="(acciones, seccion) in permisosDelRol"
            :key="seccion"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10"
          >
            <span class="font-semibold capitalize">{{ seccion }}</span>
            <span class="text-slate-400 dark:text-slate-500">{{ Array.isArray(acciones) ? acciones.join(' · ') : '' }}</span>
          </span>
        </div>
        <p v-else class="text-xs text-slate-400 dark:text-slate-500 italic">
          Sin permisos definidos para este rol.
        </p>
        <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
          Los accesos se derivan automáticamente del rol seleccionado. Para personalizar, asigná un rol personalizado.
        </p>
      </div>

      <!-- Acciones -->
      <div class="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
        <button
          type="button"
          class="text-sm text-slate-600 dark:text-slate-400 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          @click="router.push('/usuarios')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow"
          :disabled="saving"
        >
          {{ saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario' }}
        </button>
      </div>

    </form>
  </div>
</template>
