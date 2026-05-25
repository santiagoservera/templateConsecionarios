<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoles } from '../composables/useRoles.js'
import { useAuthStore } from '../../auth/store/authStore.js'
import AppModal from '../../../shared/components/AppModal.vue'

const authStore = useAuthStore()

const { roles, loading, error, fetchRoles, createRol, updateRol, deleteRol } = useRoles()

onMounted(fetchRoles)

const SECCIONES = [
  { key: 'stock',        label: 'Stock (Vehículos)' },
  { key: 'indumentaria', label: 'Indumentaria' },
  { key: 'clientes',     label: 'Clientes' },
  { key: 'leads',        label: 'Leads' },
  { key: 'ventas',       label: 'Ventas' },
  { key: 'planesDNI',    label: 'Planes DNI' },
  { key: 'postventa',    label: 'Postventa' },
  { key: 'caja',         label: 'Caja' },
  { key: 'convenios',    label: 'Convenios' },
  { key: 'seguros',      label: 'Seguros' },
  { key: 'consignacion', label: 'Consignación' },
  { key: 'comisiones',   label: 'Comisiones' },
  { key: 'reportes',     label: 'Reportes' },
  { key: 'usuarios',     label: 'Usuarios' },
]
const ACCIONES = ['ver','crear','editar','eliminar']
const ACCION_LABEL = { ver:'Ver', crear:'Crear', editar:'Editar', eliminar:'Eliminar' }

// ── Helper: parsear permisos (nuevo formato objeto) ───────────────────────────
function parsePermisos(json) {
  try {
    const p = JSON.parse(json ?? '{}')
    // Backward compat: si es array, convertir a objeto con todas las acciones
    if (Array.isArray(p)) {
      return Object.fromEntries(p.map(s => [s, [...ACCIONES]]))
    }
    return p
  } catch { return {} }
}

// Estadísticas del rol: cuenta secciones y acciones
function statsPermisos(p) {
  const secs = Object.keys(p).length
  const acts = Object.values(p).reduce((a, v) => a + (Array.isArray(v) ? v.length : 0), 0)
  return { secs, acts }
}

// ── Modal crear / editar ───────────────────────────────────────────────────────
const showModal   = ref(false)
const editando    = ref(null)
const modalError  = ref('')
const modalSaving = ref(false)

// form.permisos = { stock: ['ver','crear'], clientes: ['ver'], ... }
const form = ref({ nombre: '', descripcion: '', permisos: {} })

function initEmptyPermisos() {
  return Object.fromEntries(SECCIONES.map(s => [s.key, []]))
}

function abrirCrear() {
  editando.value   = null
  form.value       = { nombre: '', descripcion: '', permisos: initEmptyPermisos() }
  modalError.value = ''
  showModal.value  = true
}

function abrirEditar(rol) {
  editando.value   = rol
  const parsed     = parsePermisos(rol.permisos)
  // Asegurar que todas las secciones existan en el form
  const permisos   = initEmptyPermisos()
  for (const sec of SECCIONES) {
    permisos[sec.key] = parsed[sec.key] ?? []
  }
  form.value = { nombre: rol.nombre, descripcion: rol.descripcion ?? '', permisos }
  modalError.value = ''
  showModal.value  = true
}

const esRolDelSistema = (rol) => rol.esDefault

// Toggle una acción de una sección
function toggleAccion(seccion, accion) {
  const arr = form.value.permisos[seccion] ?? []
  if (arr.includes(accion)) {
    form.value.permisos[seccion] = arr.filter(a => a !== accion)
  } else {
    form.value.permisos[seccion] = [...arr, accion]
    // Si se activa cualquier acción que no sea 'ver', auto-activar 'ver'
    if (accion !== 'ver' && !form.value.permisos[seccion].includes('ver')) {
      form.value.permisos[seccion].push('ver')
    }
  }
}

// Toggle toda una sección (todas las acciones o ninguna)
function toggleSeccion(seccion) {
  const arr = form.value.permisos[seccion] ?? []
  form.value.permisos[seccion] = arr.length === ACCIONES.length ? [] : [...ACCIONES]
}

// Permisos limpios (sin secciones vacías)
function permisosLimpios() {
  const clean = {}
  for (const [sec, acts] of Object.entries(form.value.permisos)) {
    if (Array.isArray(acts) && acts.length > 0) clean[sec] = acts
  }
  return clean
}

async function guardar() {
  if (!form.value.nombre.trim()) { modalError.value = 'El nombre es requerido'; return }
  const permisos = permisosLimpios()
  if (!Object.keys(permisos).length) { modalError.value = 'Asigná al menos una sección con permisos'; return }
  modalError.value  = ''
  modalSaving.value = true
  try {
    const payload = {
      nombre:      form.value.nombre.trim(),
      descripcion: form.value.descripcion.trim() || undefined,
      permisos,
    }
    if (editando.value) {
      await updateRol(editando.value.id, payload)
      await authStore.fetchMe()
    } else {
      await createRol(payload)
    }
    showModal.value = false
    fetchRoles()
  } catch (err) {
    modalError.value = err.response?.data?.error ?? 'Error al guardar'
  } finally {
    modalSaving.value = false
  }
}

// ── Eliminar ───────────────────────────────────────────────────────────────────
const rolAEliminar    = ref(null)
const eliminando      = ref(false)
const eliminarError   = ref('')

const showEliminar = computed({
  get: () => !!rolAEliminar.value,
  set: (val) => { if (!val) { rolAEliminar.value = null; eliminarError.value = '' } },
})

function pedirEliminar(rol) {
  rolAEliminar.value = rol
  eliminarError.value = ''
}

async function confirmarEliminar() {
  eliminando.value = true
  eliminarError.value = ''
  try {
    await deleteRol(rolAEliminar.value.id)
    rolAEliminar.value = null
    fetchRoles()
  } catch (err) {
    eliminarError.value = err.response?.data?.error ?? 'Error al eliminar'
  } finally {
    eliminando.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-6 animate-fade-in">

    <!-- Tabs -->
    <div class="flex gap-0.5 border-b border-slate-200 dark:border-white/10">
      <router-link
        to="/usuarios"
        class="px-5 py-2.5 text-sm font-medium transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        active-class=""
      >
        Usuarios
      </router-link>
      <router-link
        to="/usuarios/roles"
        class="px-5 py-2.5 text-sm font-medium transition-colors relative text-primary-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:rounded-t"
      >
        Roles
      </router-link>
      <router-link
        to="/usuarios/vendedores"
        class="px-5 py-2.5 text-sm font-medium transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      >
        Vendedores
      </router-link>
    </div>

    <!-- Encabezado -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Roles y permisos</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Los roles del sistema son de solo lectura. Podés crear roles personalizados con secciones a medida.
        </p>
      </div>
      <button
        class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-glow active:scale-[0.98] shrink-0"
        @click="abrirCrear"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nuevo rol
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>

    <!-- Lista de roles -->
    <div v-else class="space-y-3">

      <!-- Empty state -->
      <div v-if="!roles.length" class="text-center py-16 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none">
        <div class="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
          </svg>
        </div>
        <p class="font-medium text-slate-500 dark:text-slate-400">No hay roles definidos.</p>
      </div>

      <!-- Cards de roles -->
      <div
        v-for="rol in roles"
        :key="rol.id"
        class="bg-white dark:bg-[#1a1a2e] rounded-2xl border shadow-card dark:shadow-none transition-all"
        :class="rol.esDefault
          ? 'border-slate-200 dark:border-white/10'
          : 'border-slate-200 dark:border-white/10 hover:border-primary-200 dark:hover:border-primary-500/30 hover:shadow-card-md'"
      >
        <div class="p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">

              <!-- Nombre + badge tipo -->
              <div class="flex items-center gap-2.5 mb-2">
                <!-- Ícono -->
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                  :class="rol.esDefault ? 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400' : 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400'"
                >
                  {{ rol.nombre.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ rol.nombre }}</h3>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                      :class="rol.esDefault
                        ? 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                        : 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-200 dark:ring-primary-500/30'"
                    >
                      {{ rol.esDefault ? 'Sistema' : 'Personalizado' }}
                    </span>
                  </div>
                  <p v-if="rol.descripcion" class="text-xs text-slate-400 mt-0.5">{{ rol.descripcion }}</p>
                </div>
              </div>

              <!-- Resumen de permisos: chips por sección con acciones -->
              <div class="flex flex-wrap gap-1.5 mt-3">
                <template v-for="(acts, sec) in parsePermisos(rol.permisos)" :key="sec">
                  <span v-if="acts.length" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                    <span class="font-semibold">{{ SECCIONES.find(s=>s.key===sec)?.label ?? sec }}</span>
                    <span class="text-slate-400 dark:text-slate-500">{{ acts.join(' · ') }}</span>
                  </span>
                </template>
                <span v-if="!Object.values(parsePermisos(rol.permisos)).some(a=>a.length)" class="text-xs text-slate-400 italic">Sin permisos</span>
              </div>

            </div>

            <!-- Acciones -->
            <div class="shrink-0 flex flex-col items-end gap-2">
              <button
                class="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 px-3 py-1.5 rounded-lg transition-colors"
                @click="abrirEditar(rol)"
              >
                Editar accesos
              </button>
              <button
                v-if="rol.nombre !== 'ADMIN'"
                class="text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                @click="pedirEliminar(rol)"
              >
                Eliminar
              </button>
              <span v-else class="text-[10px] text-slate-400 dark:text-slate-500 font-medium bg-slate-50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10">
                No eliminable
              </span>
            </div>

          </div>
        </div>

        <!-- Footer con cantidad de secciones -->
        <div class="px-5 py-2.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] rounded-b-2xl flex items-center justify-between">
          <span class="text-[11px] text-slate-400 dark:text-slate-500">
            <span class="font-semibold text-slate-600 dark:text-slate-300 font-mono">{{ statsPermisos(parsePermisos(rol.permisos)).secs }}</span>
            secc. ·
            <span class="font-semibold text-slate-600 dark:text-slate-300 font-mono">{{ statsPermisos(parsePermisos(rol.permisos)).acts }}</span>
            acciones
          </span>
          <div class="w-24 h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-500 transition-all"
              :style="{ width: `${(statsPermisos(parsePermisos(rol.permisos)).secs / SECCIONES.length) * 100}%` }"
            />
          </div>
        </div>
      </div>

    </div>

    <!-- Modal crear / editar rol -->
    <AppModal v-model="showModal" :title="editando ? `Editar accesos — ${editando.nombre}` : 'Nuevo rol'" size="lg">
      <div class="space-y-5">
        <p v-if="modalError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">{{ modalError }}</p>

        <!-- Aviso rol del sistema -->
        <div v-if="editando && esRolDelSistema(editando)" class="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3">
          <svg class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
          </svg>
          <p class="text-xs text-amber-700 dark:text-amber-400">
            Rol del sistema — los cambios se aplican a <strong>todos los usuarios con este rol</strong>.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div v-if="!editando" class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre *</label>
            <input v-model="form.nombre" type="text" placeholder="Ej: Supervisor de ventas"
              class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"/>
          </div>
          <div :class="editando ? 'col-span-2' : 'col-span-2 sm:col-span-1'">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descripción</label>
            <input v-model="form.descripcion" type="text" placeholder="Descripción opcional..."
              class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"/>
          </div>
        </div>

        <!-- Matriz sección × acción -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Permisos por sección</label>
            <span class="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {{ statsPermisos(form.permisos).secs }} secc · {{ statsPermisos(form.permisos).acts }} acciones
            </span>
          </div>

          <div class="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <!-- Header de acciones -->
            <div class="grid bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 px-4 py-2"
              style="grid-template-columns: 1fr repeat(4, 5rem)">
              <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sección</span>
              <span v-for="a in ACCIONES" :key="a"
                class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                {{ ACCION_LABEL[a] }}
              </span>
            </div>

            <!-- Filas de secciones -->
            <div v-for="sec in SECCIONES" :key="sec.key"
              class="grid items-center px-4 py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
              style="grid-template-columns: 1fr repeat(4, 5rem)">

              <!-- Nombre de sección + toggle total -->
              <button
                type="button"
                class="text-left flex items-center gap-2 group/sec"
                @click="toggleSeccion(sec.key)"
              >
                <span class="text-sm font-medium transition-colors"
                  :class="(form.permisos[sec.key]?.length ?? 0) > 0
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500'">
                  {{ sec.label }}
                </span>
                <span v-if="(form.permisos[sec.key]?.length ?? 0) === ACCIONES.length"
                  class="text-[10px] text-primary-500 font-semibold opacity-0 group-hover/sec:opacity-100 transition-opacity">
                  todo
                </span>
              </button>

              <!-- Checkboxes por acción -->
              <div v-for="accion in ACCIONES" :key="accion" class="flex justify-center">
                <button
                  type="button"
                  class="w-5 h-5 rounded flex items-center justify-center transition-all border"
                  :class="form.permisos[sec.key]?.includes(accion)
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : 'border-slate-300 dark:border-white/20 hover:border-primary-400 dark:hover:border-primary-500/50'"
                  @click="toggleAccion(sec.key, accion)"
                >
                  <svg v-if="form.permisos[sec.key]?.includes(accion)" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
            Hacé clic en el nombre de una sección para activar/desactivar todas sus acciones.
            Al marcar crear/editar/eliminar se activa "Ver" automáticamente.
          </p>
        </div>
      </div>

      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">
          Cancelar
        </button>
        <button class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow" :disabled="modalSaving" @click="guardar">
          {{ modalSaving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear rol' }}
        </button>
      </template>
    </AppModal>

    <!-- Modal confirmar eliminación -->
    <AppModal v-model="showEliminar" title="Eliminar rol" size="sm">
      <div class="space-y-3">
        <p class="text-sm text-slate-700 dark:text-slate-300">
          ¿Eliminar el rol <strong class="text-slate-900 dark:text-white">{{ rolAEliminar?.nombre }}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <p v-if="rolAEliminar?.esDefault" class="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3">
          Este es un rol del sistema. Los usuarios que lo tengan asignado perderán ese rol.
        </p>
        <p v-if="eliminarError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
          {{ eliminarError }}
        </p>
      </div>
      <template #footer>
        <button
          class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          @click="showEliminar = false"
        >
          Cancelar
        </button>
        <button
          class="text-sm bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-colors"
          :disabled="eliminando"
          @click="confirmarEliminar"
        >
          {{ eliminando ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
