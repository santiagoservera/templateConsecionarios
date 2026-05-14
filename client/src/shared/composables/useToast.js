import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

const DURATION = { success: 3500, error: 5000, warning: 4000, info: 3500 }

export function useToast() {
  function add({ type = 'info', title, message, duration }) {
    const id = ++nextId
    toasts.value.push({ id, type, title, message, visible: true })

    const ms = duration ?? DURATION[type] ?? 3500
    setTimeout(() => remove(id), ms)

    return id
  }

  function remove(id) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      toasts.value[idx].visible = false
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 300)
    }
  }

  // Shortcuts
  const success = (title, message) => add({ type: 'success', title, message })
  const error   = (title, message) => add({ type: 'error',   title, message })
  const warning = (title, message) => add({ type: 'warning', title, message })
  const info    = (title, message) => add({ type: 'info',    title, message })

  return { toasts, add, remove, success, error, warning, info }
}
