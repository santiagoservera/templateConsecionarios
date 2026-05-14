import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
})

// ── Request: inyectar Bearer token ────────────────────────────────────────────
// Se lee de localStorage directamente para evitar la dependencia circular
// axios ↔ authStore (authStore importa api, api importaría authStore).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dealeros_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response: manejar 401 con refresh + cola de requests pendientes ────────────
let isRefreshing = false
let pendingQueue = [] // [{ resolve, reject }]

const drainQueue = (error, newToken = null) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(newToken)
  )
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // Si ya hay un refresh en vuelo, encolar este request y esperar
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      // Import dinámico para romper la dependencia circular en tiempo de ejecución
      const { useAuthStore } = await import('../modules/auth/store/authStore.js')
      const authStore = useAuthStore()
      const newToken = await authStore.doRefresh()
      drainQueue(null, newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (refreshError) {
      drainQueue(refreshError)
      const { useAuthStore } = await import('../modules/auth/store/authStore.js')
      useAuthStore().logout()
      // Import dinámico del router por la misma razón
      const { default: router } = await import('../router/index.js')
      router.push('/login')
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
