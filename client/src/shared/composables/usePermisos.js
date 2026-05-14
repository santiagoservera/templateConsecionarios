import { computed } from 'vue'
import { useAuthStore } from '../../modules/auth/store/authStore.js'

/**
 * Composable para verificar permisos de acción por sección.
 *
 * Formato de permisosJson (nuevo):
 *   { "stock": ["ver","crear","editar","eliminar"], "clientes": ["ver","crear"] }
 *
 * Formato legacy (retrocompatible):
 *   ["stock", "clientes", "ventas"]  →  todas las acciones habilitadas para esas secciones
 */
export function usePermisos() {
  const authStore = useAuthStore()

  const permisos = computed(() => {
    try {
      return JSON.parse(authStore.user?.permisosJson ?? '{}')
    } catch {
      return {}
    }
  })

  /**
   * Verifica si el usuario puede realizar una acción en una sección.
   * ADMIN siempre puede todo.
   *
   * @param {string} seccion  - 'stock', 'indumentaria', 'clientes', etc.
   * @param {string} accion   - 'ver', 'crear', 'editar', 'eliminar'
   */
  function canDo(seccion, accion = 'ver') {
    if (authStore.userRole === 'ADMIN') return true

    const p = permisos.value

    // Formato legacy: array de secciones → todas las acciones habilitadas
    if (Array.isArray(p)) {
      return p.includes(seccion)
    }

    // Formato nuevo: objeto con acciones por sección
    const accionesSec = p[seccion]
    if (!accionesSec) return false
    return Array.isArray(accionesSec)
      ? accionesSec.includes(accion)
      : false
  }

  /** Devuelve true si el usuario puede VER la sección (para sidebar) */
  const canView  = (s) => canDo(s, 'ver')
  const canCreate = (s) => canDo(s, 'crear')
  const canEdit   = (s) => canDo(s, 'editar')
  const canDelete = (s) => canDo(s, 'eliminar')

  return { canDo, canView, canCreate, canEdit, canDelete, permisos }
}
