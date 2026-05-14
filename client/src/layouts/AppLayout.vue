<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore }  from '../modules/auth/store/authStore.js'
import { usePermisos }   from '../shared/composables/usePermisos.js'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const { canDo } = usePermisos()

// ── Dark mode toggle ───────────────────────────────────────────────────────────
const isDark = ref(document.documentElement.classList.contains('dark'))

function toggleDark() {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('motoros-theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('motoros-theme', 'light')
  }
}

// ── Sidebar expand on hover ────────────────────────────────────────────────────
const sidebarHovered = ref(false)

// ── Navegación ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard',    to: '/dashboard',    icon: 'dashboard',    roles: ['ADMIN','GERENTE','VENDEDOR','CAJERO'], section: null },
  { label: 'Stock',        to: '/stock',         icon: 'stock',        roles: ['ADMIN','GERENTE','VENDEDOR','ASESOR'],         section: 'stock' },
  { label: 'Indumentaria', to: '/indumentaria',  icon: 'indumentaria', roles: ['ADMIN','GERENTE','VENDEDOR','CAJERO','ASESOR'], section: 'indumentaria' },
  { label: 'Clientes',     to: '/clientes',      icon: 'clientes',     roles: ['ADMIN','GERENTE','VENDEDOR','ASESOR'],         section: 'clientes' },
  { label: 'Leads',        to: '/leads',         icon: 'leads',        roles: ['ADMIN','GERENTE','VENDEDOR'],                  section: 'leads' },
  { label: 'Ventas',       to: '/ventas',        icon: 'ventas',       roles: ['ADMIN','GERENTE','VENDEDOR'],                  section: 'ventas' },
  { label: 'Planes DNI',   to: '/planes-pago',   icon: 'planesdni',    roles: ['ADMIN','GERENTE','VENDEDOR','CAJERO'],         section: 'planesDNI' },
  { label: 'Caja',         to: '/caja',          icon: 'caja',         roles: ['ADMIN','GERENTE','CAJERO'],                    section: 'caja' },
  { label: 'Postventa',    to: '/postventa',     icon: 'postventa',    roles: ['ADMIN','GERENTE','VENDEDOR'],                  section: 'postventa' },
  { label: 'Convenios',    to: '/convenios',     icon: 'convenios',    roles: ['ADMIN','GERENTE'],                             section: 'convenios' },
  { label: 'Seguros',      to: '/seguros',       icon: 'seguros',      roles: ['ADMIN','GERENTE','VENDEDOR','CAJERO','ASESOR'], section: 'seguros' },
  { label: 'Consignación', to: '/consignacion',  icon: 'consignacion', roles: ['ADMIN','GERENTE','VENDEDOR'],                  section: 'consignacion' },
  { label: 'Comisiones',   to: '/comisiones',    icon: 'comisiones',   roles: ['ADMIN','GERENTE','VENDEDOR'],                  section: 'comisiones' },
  { label: 'Reportes',     to: '/reportes',      icon: 'reportes',     roles: ['ADMIN','GERENTE'],                             section: 'reportes' },
  { label: 'Usuarios',     to: '/usuarios',      icon: 'usuarios',     roles: ['ADMIN'],                                       section: 'usuarios' },
  { label: 'Configuración',to: '/configuracion', icon: 'configuracion',roles: ['ADMIN'],                                       section: null },
]

// Color de ícono por sección (como en la imagen)
const ICON_COLOR = {
  dashboard:    'bg-primary-500',
  stock:        'bg-blue-500',
  indumentaria: 'bg-pink-500',
  clientes:     'bg-violet-500',
  leads:      'bg-cyan-500',
  ventas:     'bg-emerald-500',
  postventa:   'bg-amber-500',
  planesdni:   'bg-orange-600',
  caja:        'bg-emerald-600',
  seguros:     'bg-sky-600',
  convenios:    'bg-indigo-500',
  consignacion: 'bg-teal-500',
  comisiones:   'bg-amber-500',
  usuarios:     'bg-rose-500',
  reportes:     'bg-blue-600',
  configuracion:'bg-slate-500',
}

const visibleNavItems = computed(() =>
  NAV_ITEMS.filter(item => {
    if (!item.roles.includes(authStore.userRole)) return false
    if (authStore.userRole === 'ADMIN') return true
    if (!item.section) return true
    return canDo(item.section, 'ver')
  })
)

const isActive = (path) => route.path === path || route.path.startsWith(path + '/')

const userInitial = computed(() => authStore.user?.nombre?.charAt(0).toUpperCase() ?? '?')

const roleLabel = computed(() => {
  const labels = { ADMIN: 'Administrador', GERENTE: 'Gerente', VENDEDOR: 'Vendedor', ASESOR: 'Asesor' }
  return labels[authStore.userRole] ?? authStore.userRole
})

const pageTitle = computed(() => {
  const found = NAV_ITEMS.find(item => route.path === item.to || route.path.startsWith(item.to + '/'))
  return found?.label ?? 'MotorOS'
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0d0d14] transition-colors duration-300">

    <!-- ── Sidebar ──────────────────────────────────────────────────────────── -->
    <aside
      class="flex flex-col shrink-0 z-30 transition-all duration-300 ease-in-out
             bg-[#0F172A] dark:bg-[#0a0a12] border-r border-white/5"
      :class="sidebarHovered ? 'w-52' : 'w-16'"
      @mouseenter="sidebarHovered = true"
      @mouseleave="sidebarHovered = false"
    >
      <!-- Logo -->
      <div class="flex items-center h-16 px-3 shrink-0 border-b border-white/5 overflow-hidden">
        <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shrink-0 shadow-glow">
          <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 12 8 8"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 12a5 5 0 0 1 5-5"/>
          </svg>
        </div>
        <div v-if="sidebarHovered" class="ml-3 overflow-hidden whitespace-nowrap transition-all">
          <p class="text-sm font-bold text-white leading-tight">MotorOS</p>
          <p class="text-[10px] text-slate-500 uppercase tracking-widest">Concesionarias</p>
        </div>
      </div>

      <!-- Nav items -->
      <nav class="flex-1 py-4 space-y-1 px-2 overflow-hidden">
        <div v-for="item in visibleNavItems" :key="item.to" class="relative group/nav">
          <router-link
            :to="item.to"
            class="flex items-center gap-3 h-10 rounded-xl transition-all duration-150 overflow-hidden"
            :class="[
              isActive(item.to)
                ? 'bg-white/10'
                : 'hover:bg-white/5',
              sidebarHovered ? 'px-2.5' : 'px-2.5 justify-start',
            ]"
          >
            <!-- Ícono con color -->
            <div
              class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
              :class="[
                ICON_COLOR[item.icon] ?? 'bg-slate-600',
                isActive(item.to) ? 'opacity-100' : 'opacity-70 group-hover/nav:opacity-100',
              ]"
            >
              <!-- dashboard -->
              <svg v-if="item.icon==='dashboard'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/>
              </svg>
              <!-- stock -->
              <svg v-else-if="item.icon==='stock'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
              </svg>
              <!-- indumentaria -->
              <svg v-else-if="item.icon==='indumentaria'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z"/>
              </svg>
              <!-- clientes -->
              <svg v-else-if="item.icon==='clientes'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
              </svg>
              <!-- leads -->
              <svg v-else-if="item.icon==='leads'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>
              </svg>
              <!-- ventas -->
              <svg v-else-if="item.icon==='ventas'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </svg>
              <!-- planesdni -->
              <svg v-else-if="item.icon==='planesdni'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"/>
              </svg>
              <!-- caja -->
              <svg v-else-if="item.icon==='caja'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75"/>
              </svg>
              <!-- seguros -->
              <svg v-else-if="item.icon==='seguros'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
              </svg>
              <!-- postventa -->
              <svg v-else-if="item.icon==='postventa'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"/>
              </svg>
              <!-- consignacion -->
              <svg v-else-if="item.icon==='consignacion'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
              </svg>
              <!-- comisiones -->
              <svg v-else-if="item.icon==='comisiones'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>
              <!-- reportes -->
              <svg v-else-if="item.icon==='reportes'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>
              </svg>
              <!-- configuracion -->
              <svg v-else-if="item.icon==='configuracion'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </svg>
              <!-- convenios -->
              <svg v-else-if="item.icon==='convenios'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"/>
              </svg>
              <!-- usuarios -->
              <svg v-else class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              </svg>
            </div>

            <!-- Label (solo cuando hover) -->
            <span
              v-if="sidebarHovered"
              class="text-sm font-medium whitespace-nowrap overflow-hidden transition-all"
              :class="isActive(item.to) ? 'text-white' : 'text-slate-400'"
            >
              {{ item.label }}
            </span>

            <!-- Dot activo -->
            <div v-if="isActive(item.to) && sidebarHovered" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
          </router-link>
        </div>
      </nav>

      <!-- Avatar usuario -->
      <div class="border-t border-white/5 p-2 shrink-0">
        <button
          class="w-full flex items-center gap-3 h-10 px-1.5 rounded-xl hover:bg-white/5 transition-colors overflow-hidden"
          @click="handleLogout"
          title="Cerrar sesión"
        >
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {{ userInitial }}
          </div>
          <div v-if="sidebarHovered" class="min-w-0 text-left">
            <p class="text-xs font-semibold text-white truncate leading-tight">{{ authStore.userName }}</p>
            <p class="text-[10px] text-slate-500 truncate">{{ roleLabel }}</p>
          </div>
        </button>
      </div>
    </aside>

    <!-- ── Área principal ──────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- Header -->
      <header class="h-14 flex items-center px-5 gap-4 shrink-0
                     bg-white/80 dark:bg-[#0d0d14]/90 backdrop-blur-sm
                     border-b border-slate-200 dark:border-white/5">

        <!-- Título de página -->
        <h2 class="text-sm font-semibold text-slate-900 dark:text-white">{{ pageTitle }}</h2>

        <div class="flex-1" />

        <!-- Controles del header -->
        <div class="flex items-center gap-2">

          <!-- Toggle dark mode -->
          <button
            class="w-9 h-9 rounded-xl flex items-center justify-center transition-all
                   bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10
                   text-slate-500 dark:text-slate-400"
            :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            @click="toggleDark"
          >
            <!-- Sol (light mode) -->
            <svg v-if="isDark" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/>
            </svg>
            <!-- Luna (dark mode) -->
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/>
            </svg>
          </button>

          <!-- Separador -->
          <div class="w-px h-5 bg-slate-200 dark:bg-white/10" />

          <!-- Usuario + logout -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">{{ authStore.userName }}</span>
            <button
              class="w-9 h-9 rounded-xl flex items-center justify-center transition-all
                     bg-slate-100 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-500/10
                     text-slate-400 hover:text-red-500 dark:hover:text-red-400"
              title="Cerrar sesión"
              @click="handleLogout"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Contenido -->
      <main class="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0d0d14] transition-colors duration-300">
        <router-view />
      </main>
    </div>

  </div>
</template>
