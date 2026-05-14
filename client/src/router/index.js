import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../modules/auth/store/authStore.js'

import authRoutes      from '../modules/auth/routes.js'
import stockRoutes     from '../modules/stock/routes.js'
import clientesRoutes  from '../modules/clientes/routes.js'
import leadsRoutes     from '../modules/leads/routes.js'
import ventasRoutes    from '../modules/ventas/routes.js'
import reportesRoutes  from '../modules/reportes/routes.js'
import usuariosRoutes  from '../modules/usuarios/routes.js'
import postventaRoutes  from '../modules/postventa/routes.js'
import conveniosRoutes  from '../modules/convenios/routes.js'
import planesPagoRoutes from '../modules/planes-pago/routes.js'
import cajaRoutes       from '../modules/caja/routes.js'
import segurosRoutes      from '../modules/seguros/routes.js'
import indumentariaRoutes    from '../modules/indumentaria/routes.js'
import consignacionRoutes    from '../modules/consignacion/routes.js'
import comisionesRoutes      from '../modules/comisiones/routes.js'
import configuracionRoutes   from '../modules/configuracion/routes.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    ...authRoutes,
    ...stockRoutes,
    ...clientesRoutes,
    ...leadsRoutes,
    ...ventasRoutes,
    ...reportesRoutes,
    ...usuariosRoutes,
    ...postventaRoutes,
    ...conveniosRoutes,
      ...planesPagoRoutes,
    ...cajaRoutes,
    ...segurosRoutes,
    ...indumentariaRoutes,
    ...consignacionRoutes,
    ...comisionesRoutes,
    ...configuracionRoutes,
    // Catch-all: cualquier ruta desconocida va al dashboard (o al login si no está autenticado)
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

// ── Navigation guard global ────────────────────────────────────────────────────
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // 1. Ruta protegida y no autenticado → login (guardando el destino para post-login)
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  // 2. Ruta con restricción de rol y el usuario no tiene el rol requerido
  if (to.meta.roles?.length && !to.meta.roles.includes(authStore.userRole)) {
    return next('/dashboard')
  }

  // 3. Usuario ya autenticado intentando acceder al login → dashboard
  if (to.path === '/login' && authStore.isAuthenticated) {
    return next('/dashboard')
  }

  next()
})

export default router
