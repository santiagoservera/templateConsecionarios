import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../../../plugins/axios.js'

const LS_TOKEN   = 'dealeros_token'
const LS_REFRESH = 'dealeros_refresh'
const LS_USER    = 'dealeros_user'

export const useAuthStore = defineStore('auth', () => {
  // ── Estado (hidratado desde localStorage para persistencia entre recargas) ──
  const token        = ref(localStorage.getItem(LS_TOKEN) ?? null)
  const refreshToken = ref(localStorage.getItem(LS_REFRESH) ?? null)
  const user         = ref(JSON.parse(localStorage.getItem(LS_USER) ?? 'null'))

  // ── Computed ──────────────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value)
  const userRole        = computed(() => user.value?.rol  ?? null)
  const userName        = computed(() => user.value?.nombre ?? '')

  // ── Helper interno ────────────────────────────────────────────────────────────
  function _persist(accessToken, newRefreshToken, userData) {
    token.value = accessToken
    localStorage.setItem(LS_TOKEN, accessToken)

    if (newRefreshToken) {
      refreshToken.value = newRefreshToken
      localStorage.setItem(LS_REFRESH, newRefreshToken)
    }
    if (userData) {
      user.value = userData
      localStorage.setItem(LS_USER, JSON.stringify(userData))
    }
  }

  // ── Acciones ──────────────────────────────────────────────────────────────────

  /**
   * Login: llama a POST /auth/login y persiste tokens + datos del usuario.
   */
  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    const { accessToken, refreshToken: rt, user: userData } = data.data
    _persist(accessToken, rt, userData)
    return userData
  }

  /**
   * doRefresh: llamado por el interceptor de axios cuando el accessToken expira.
   * Devuelve el nuevo accessToken o lanza un error que dispara el logout.
   */
  async function doRefresh() {
    const { data } = await api.post('/auth/refresh', {
      refreshToken: refreshToken.value,
    })
    const newToken = data.data.accessToken
    token.value = newToken
    localStorage.setItem(LS_TOKEN, newToken)
    return newToken
  }

  /**
   * fetchMe: refresca los datos del usuario autenticado desde el servidor.
   */
  async function fetchMe() {
    const { data } = await api.get('/auth/me')
    user.value = data.data
    localStorage.setItem(LS_USER, JSON.stringify(data.data))
    return data.data
  }

  /**
   * logout: limpia todo el estado de sesión.
   */
  function logout() {
    token.value        = null
    refreshToken.value = null
    user.value         = null
    localStorage.removeItem(LS_TOKEN)
    localStorage.removeItem(LS_REFRESH)
    localStorage.removeItem(LS_USER)
  }

  return {
    token,
    refreshToken,
    user,
    isAuthenticated,
    userRole,
    userName,
    login,
    doRefresh,
    fetchMe,
    logout,
  }
})
