/** Formatea un valor como moneda ARS sin decimales (ej: $22.500.000) */
export const currency = (value) =>
  new Intl.NumberFormat('es-AR', {
    style:                 'currency',
    currency:              'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))

/** Formatea un número con separadores locales (ej: 35.000) */
export const number = (value) =>
  new Intl.NumberFormat('es-AR').format(Number(value ?? 0))

/** Formatea una fecha ISO como dd/mm/yyyy */
export const date = (value) =>
  value
    ? new Intl.DateTimeFormat('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }).format(new Date(value))
    : '—'

/** Formatea una fecha + hora */
export const datetime = (value) =>
  value
    ? new Intl.DateTimeFormat('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date(value))
    : '—'
