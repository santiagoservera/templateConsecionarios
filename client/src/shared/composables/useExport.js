import { ref } from 'vue'
import * as XLSX from 'xlsx'

/**
 * Exporta un array de datos a Excel (.xlsx).
 * @param {Array}  rows     - Datos a exportar
 * @param {Array}  columns  - [{ label: 'Nombre columna', value: (row) => row.campo }]
 * @param {string} filename - Nombre del archivo sin extensión
 */
export function useExport() {
  const exporting = ref(false)

  function exportToExcel(rows, columns, filename = 'exportacion') {
    if (!rows?.length) return
    exporting.value = true

    try {
      // Construir array de objetos planos para la hoja
      const data = rows.map(row =>
        Object.fromEntries(columns.map(col => [col.label, col.value(row) ?? '']))
      )

      const ws = XLSX.utils.json_to_sheet(data)

      // Ancho automático de columnas
      const colWidths = columns.map(col => ({
        wch: Math.max(col.label.length, ...data.map(r => String(r[col.label] ?? '').length), 10),
      }))
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Datos')

      const fecha = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `${filename}_${fecha}.xlsx`)
    } finally {
      exporting.value = false
    }
  }

  return { exporting, exportToExcel }
}
