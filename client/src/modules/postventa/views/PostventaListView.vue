<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePostventa } from '../composables/usePostventa.js'
import { useServices } from '../composables/useServices.js'
import { useToast }    from '../../../shared/composables/useToast.js'
import { usePermisos } from '../../../shared/composables/usePermisos.js'
import AppTable from '../../../shared/components/AppTable.vue'
import AppBadge from '../../../shared/components/AppBadge.vue'
import AppPagination from '../../../shared/components/AppPagination.vue'
import AppModal from '../../../shared/components/AppModal.vue'
import AppSelect from '../../../shared/components/AppSelect.vue'
import { useExport } from '../../../shared/composables/useExport.js'
import api from '../../../plugins/axios.js'
import { date as formatDate, number } from '../../../shared/utils/format.js'

const { exporting, exportToExcel } = useExport()

function exportar() {
  exportToExcel(casos.value, [
    { label: 'Cliente',         value: r => `${r.cliente?.nombre ?? ''} ${r.cliente?.apellido ?? ''}`.trim() },
    { label: 'Vehículo',        value: r => `${r.venta?.vehiculo?.marca ?? ''} ${r.venta?.vehiculo?.modelo ?? ''} ${r.venta?.vehiculo?.anio ?? ''}`.trim() },
    { label: 'Tipo',            value: r => r.tipo },
    { label: 'Descripción',     value: r => r.descripcion },
    { label: 'Estado',          value: r => r.estado },
    { label: 'Fecha contacto',  value: r => formatDate(r.fechaContacto) },
    { label: 'Fecha resolución',value: r => r.fechaResolucion ? formatDate(r.fechaResolucion) : '' },
  ], 'postventa')
}

const router    = useRouter()
const toast     = useToast()
const { canDo } = usePermisos()

// ── Tab activa ─────────────────────────────────────────────────────────────────
const tab = ref('casos') // 'casos' | 'services'

// ── Postventa ──────────────────────────────────────────────────────────────────
const { casos, loading, error, meta, fetchCasos, createCaso } = usePostventa()

// ── Services ───────────────────────────────────────────────────────────────────
const { services, loading: loadingSrv, error: errorSrv, meta: metaSrv, fetchServices, createService, updateService } = useServices()

const filtersSrv   = ref({ estado: '', tipoService: '', page: 1, pageSize: 20 })

// ── Calendario de services ─────────────────────────────────────────────────────
const viewSrv    = ref('lista')       // 'lista' | 'calendario'
const calView    = ref('mensual')     // 'mensual' | 'semanal'
const calYear    = ref(new Date().getFullYear())
const calMonth   = ref(new Date().getMonth() + 1)
const calWeekOff = ref(0)            // semanas desde la semana actual
const calServices    = ref([])
const loadingCal     = ref(false)
const diaSeleccionado = ref(null)    // para mensual: día number
const fechaSeleccionada = ref(null)  // para semanal: Date object

const MESES_CAL   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const hoy = new Date(); hoy.setHours(0,0,0,0)

// ── Vista semanal ──────────────────────────────────────────────────────────────
const calWeekDays = computed(() => {
  const ref = new Date(); ref.setHours(0,0,0,0)
  const dow = (ref.getDay() + 6) % 7  // 0=Lun
  const lunes = new Date(ref)
  lunes.setDate(ref.getDate() - dow + calWeekOff.value * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes); d.setDate(lunes.getDate() + i); return d
  })
})

// Agrupación por clave yyyy-mm-dd para cualquier vista
function keyFecha(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}
const servicesPorFecha = computed(() => {
  const map = {}
  calServices.value.forEach(s => {
    if (!s.fechaProximoService) return
    const k = keyFecha(new Date(s.fechaProximoService))
    if (!map[k]) map[k] = []
    map[k].push(s)
  })
  return map
})

// Alias para vista mensual (compatible con código existente)
const servicesPorDia = computed(() => {
  const map = {}
  calServices.value.forEach(s => {
    if (!s.fechaProximoService) return
    const d = new Date(s.fechaProximoService)
    if (d.getFullYear() === calYear.value && d.getMonth() + 1 === calMonth.value) {
      const day = d.getDate()
      if (!map[day]) map[day] = []
      map[day].push(s)
    }
  })
  return map
})

async function cargarCalendario() {
  loadingCal.value = true
  diaSeleccionado.value  = null
  fechaSeleccionada.value = null
  try {
    let params = { pageSize: 200 }
    if (calView.value === 'mensual') {
      params.mes = calMonth.value; params.anio = calYear.value
    } else {
      const days = calWeekDays.value
      params.fechaDesde = days[0].toISOString().slice(0,10)
      params.fechaHasta = days[6].toISOString().slice(0,10)
    }
    const { data } = await api.get('/services', { params })
    calServices.value = data.data ?? []
  } catch { calServices.value = [] }
  finally { loadingCal.value = false }
}

// Navegación mensual
function prevMes() {
  if (calMonth.value === 1) { calMonth.value = 12; calYear.value-- }
  else calMonth.value--
  cargarCalendario()
}
function nextMes() {
  if (calMonth.value === 12) { calMonth.value = 1; calYear.value++ }
  else calMonth.value++
  cargarCalendario()
}

// Navegación semanal
function prevSemana() { calWeekOff.value--; cargarCalendario() }
function nextSemana() { calWeekOff.value++; cargarCalendario() }

// Grilla mensual
const calDias = computed(() => {
  const primero = new Date(calYear.value, calMonth.value - 1, 1)
  const ultimo  = new Date(calYear.value, calMonth.value, 0).getDate()
  const primerDia = (primero.getDay() + 6) % 7
  const dias = []
  for (let i = 0; i < primerDia; i++) {
    const d = new Date(calYear.value, calMonth.value - 1, -primerDia + i + 1)
    dias.push({ dia: d.getDate(), mes: 'prev', fecha: d })
  }
  for (let d = 1; d <= ultimo; d++)
    dias.push({ dia: d, mes: 'actual', fecha: new Date(calYear.value, calMonth.value - 1, d) })
  while (dias.length % 7 !== 0) {
    const d = dias.length - primerDia - ultimo + 1
    dias.push({ dia: d, mes: 'next', fecha: new Date(calYear.value, calMonth.value, d) })
  }
  return dias
})

const serviciosDiaSeleccionado = computed(() =>
  diaSeleccionado.value ? (servicesPorDia.value[diaSeleccionado.value] ?? []) : []
)
const serviciosFechaSeleccionada = computed(() =>
  fechaSeleccionada.value ? (servicesPorFecha.value[keyFecha(fechaSeleccionada.value)] ?? []) : []
)

// ── Calendario semanal con horas ───────────────────────────────────────────────
const HORA_INI  = 7
const HORA_FIN  = 20
const SLOT_H    = 60   // px por hora
const HORAS     = Array.from({ length: HORA_FIN - HORA_INI }, (_, i) => HORA_INI + i)

function eventTop(srv) {
  const d = new Date(srv.fechaProximoService)
  return ((d.getHours() - HORA_INI) + d.getMinutes() / 60) * SLOT_H
}
function eventStyle(srv) {
  return { top: eventTop(srv) + 'px', height: SLOT_H * 0.85 + 'px' }
}
function fmtHora(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

// Detalle al clickear un service del calendario
const servicioDetalle = ref(null)

function colorAlerta(srv) {
  const p = srv.fechaProximoService ? new Date(srv.fechaProximoService) : null
  if (!p || srv.estado !== 'PENDIENTE') return 'bg-slate-400'
  const diff = Math.ceil((p - hoy) / 86400000)
  return diff < 0 ? 'bg-red-500' : diff <= 7 ? 'bg-amber-500' : 'bg-emerald-500'
}
function colorDia(srv) { return colorAlerta(srv) }

function chipClass(srv) {
  if (srv._alerta === 'VENCIDO') return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
  if (srv._alerta === 'PROXIMO') return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
  return 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
}

// ── Drag & drop con confirmación ──────────────────────────────────────────────
const dragSrvId      = ref(null)
const dropTarget     = ref(null)
const pendingMove    = ref(null)   // { id, srvLabel, oldIso, newIso }
const showMoveConfirm = ref(false)
const movingSrv       = ref(false)

// Preview mientras se arrastra sobre la columna
const dragPreview = ref(null)  // { dayKey, top, label }

function onCalDragStart(srvId)  { dragSrvId.value = srvId; dragPreview.value = null }
function onCalDragEnd()         { dragSrvId.value = null; dropTarget.value = null; dragPreview.value = null }
function onCalDragLeave()       { dropTarget.value = null; dragPreview.value = null }

/** Calcula la posición Y relativa al elemento considerando el scroll del contenedor */
function relYInColumn(e) {
  const rect      = e.currentTarget.getBoundingClientRect()
  // getBoundingClientRect ya considera el scroll del viewport, pero el contenedor
  // tiene su propio scroll — lo compensamos buscando el ancestro scrolleable
  const scrollEl  = e.currentTarget.closest('.overflow-y-auto')
  const scrollTop = scrollEl ? scrollEl.scrollTop : 0
  const containerRect = scrollEl ? scrollEl.getBoundingClientRect() : { top: 0 }
  // relY dentro del elemento lógico (no recortado por el scroll)
  return e.clientY - containerRect.top + scrollTop - (rect.top - containerRect.top + scrollTop)
}

/** Snap a 5 minutos */
function snapMin(mins) {
  const raw = (mins / SLOT_H) * 60
  const hour   = Math.min(Math.max(Math.floor(raw / 60) + HORA_INI, HORA_INI), HORA_FIN - 1)
  const minute = Math.min(Math.round((raw % 60) / 5) * 5, 55)
  return { hour, minute, topPx: (hour - HORA_INI + minute / 60) * SLOT_H }
}

function onCalDragOver(e, key, dayDate) {
  e.preventDefault()
  dropTarget.value = key
  if (calView.value === 'semanal' && dragSrvId.value) {
    const y   = Math.max(0, relYInColumn(e))
    const { hour, minute, topPx } = snapMin(y)
    dragPreview.value = {
      dayKey: key,
      top:    topPx,
      label:  `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,
    }
  }
}

/** Calcula la hora/minuto del punto de drop según la posición Y en la columna */
function calcDropTime(e, dayDate) {
  const y = Math.max(0, relYInColumn(e))
  const { hour, minute } = snapMin(y)
  return new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), hour, minute)
}

function onCalDrop(e, dayDate) {
  e.preventDefault()
  dropTarget.value = null
  if (!dragSrvId.value) return

  const id  = dragSrvId.value; dragSrvId.value = null
  const srv = calServices.value.find(s => s.id === id)
  if (!srv) return

  const newDate = calcDropTime(e, dayDate)
  const newIso  = newDate.toISOString()
  const oldIso  = srv.fechaProximoService

  // Sin cambio — ignorar
  if (oldIso && Math.abs(new Date(newIso) - new Date(oldIso)) < 60000) return

  const label = `${srv.venta?.vehiculo?.marca ?? srv.vehiculo?.marca ?? ''} ${srv.venta?.vehiculo?.modelo ?? srv.vehiculo?.modelo ?? ''}`.trim()
  pendingMove.value = { id, label, oldIso, newIso, srv }
  showMoveConfirm.value = true
}

async function confirmarMover() {
  if (!pendingMove.value) return
  movingSrv.value = true
  try {
    const { id, newIso, srv } = pendingMove.value
    await updateService(id, { fechaProximoService: newIso })
    if (srv) srv.fechaProximoService = newIso   // actualizar localmente
    toast.success('Service reprogramado')
    showMoveConfirm.value = false
    pendingMove.value = null
  } catch { toast.error('Error', 'No se pudo reprogramar') }
  finally { movingSrv.value = false }
}
const TIPOS_SRV    = ['REVISION', 'MANTENIMIENTO', 'GARANTIA', 'OTRO']
const ESTADOS_SRV  = ['PENDIENTE', 'REALIZADO', 'CANCELADO']
const LABEL_TIPO_SRV = { REVISION: 'Revisión', MANTENIMIENTO: 'Mantenimiento', GARANTIA: 'Garantía', OTRO: 'Otro' }
const LABEL_EST_SRV  = { PENDIENTE: 'Pendiente', REALIZADO: 'Realizado', CANCELADO: 'Cancelado' }
const TIPO_SRV_COLOR = {
  REVISION:     'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  MANTENIMIENTO:'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  GARANTIA:     'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  OTRO:         'bg-slate-100 text-slate-600 dark:text-slate-400',
}
const ALERTA_STYLE = {
  VENCIDO: 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/30',
  PROXIMO: 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30',
}

function loadServices() { fetchServices({ ...filtersSrv.value }) }
function applyFiltersSrv() { filtersSrv.value.page = 1; loadServices() }
function clearFiltersSrv() { filtersSrv.value = { estado: '', tipoService: '', page: 1, pageSize: 20 }; loadServices() }
function changePageSrv(p) { filtersSrv.value.page = p; loadServices() }

const diasHastaProximo = (srv) => {
  if (!srv.fechaProximoService) return null
  return Math.ceil((new Date(srv.fechaProximoService).getTime() - Date.now()) / 86400000)
}

// ── Modal nuevo service ────────────────────────────────────────────────────────
const showSrvModal    = ref(false)
const editandoSrv     = ref(null)
const srvError        = ref('')
const srvSaving       = ref(false)

const ventaSearchSrv     = ref('')
const ventasPreloadedSrv = ref([])
const loadingVentasSrv   = ref(false)
const ventaSelSrv        = ref(null)

// Filtrado instantáneo client-side
const ventasFiltradas = computed(() => {
  const q = ventaSearchSrv.value.trim().toLowerCase()
  if (!q) return ventasPreloadedSrv.value.slice(0, 10)
  return ventasPreloadedSrv.value.filter(v => {
    const nombre   = `${v.cliente?.nombre ?? ''} ${v.cliente?.apellido ?? ''}`.toLowerCase()
    const vehiculo = `${v.vehiculo?.marca ?? ''} ${v.vehiculo?.modelo ?? ''}`.toLowerCase()
    return nombre.includes(q) || vehiculo.includes(q)
  }).slice(0, 10)
})

async function precargarVentas() {
  if (ventasPreloadedSrv.value.length) return
  loadingVentasSrv.value = true
  try {
    const { data } = await api.get('/ventas', { params: { pageSize: 100 } })
    ventasPreloadedSrv.value = data.data ?? []
  } catch { ventasPreloadedSrv.value = [] }
  finally { loadingVentasSrv.value = false }
}

function seleccionarVentaSrv(v) {
  ventaSelSrv.value    = v
  ventaSearchSrv.value = `${v.cliente?.nombre} ${v.cliente?.apellido} — ${v.vehiculo?.marca} ${v.vehiculo?.modelo} ${v.vehiculo?.anio}`
}

const formSrv = ref({
  tipoService: 'MANTENIMIENTO', descripcion: '',
  kmActual: '', kmProximoService: '',
  fechaService: new Date().toISOString().slice(0, 10),
  fechaProximoService: '', observaciones: ''
})

function abrirCrearSrv() {
  editandoSrv.value    = null
  ventaSelSrv.value    = null
  ventaSearchSrv.value = ''
  formSrv.value = {
    tipoService: 'MANTENIMIENTO', descripcion: '',
    kmActual: '', kmProximoService: '',
    fechaService: new Date().toISOString().slice(0, 10),
    fechaProximoService: '', observaciones: ''
  }
  srvError.value     = ''
  showSrvModal.value = true
  precargarVentas()
}

function abrirEditarSrv(srv) {
  editandoSrv.value   = srv
  ventaSelSrv.value   = { id: srv.ventaId, cliente: srv.venta?.cliente, vehiculo: srv.venta?.vehiculo }
  ventaSearchSrv.value = `${srv.venta?.cliente?.nombre} ${srv.venta?.cliente?.apellido} — ${srv.venta?.vehiculo?.marca} ${srv.venta?.vehiculo?.modelo} ${srv.venta?.vehiculo?.anio}`
  formSrv.value = {
    tipoService:         srv.tipoService,
    descripcion:         srv.descripcion,
    kmActual:            srv.kmActual ?? '',
    kmProximoService:    srv.kmProximoService ?? '',
    fechaService:        new Date(srv.fechaService).toISOString().slice(0, 10),
    fechaProximoService: srv.fechaProximoService ? new Date(srv.fechaProximoService).toISOString().slice(0, 10) : '',
    observaciones:       srv.observaciones ?? '',
  }
  srvError.value    = ''
  showSrvModal.value = true
}

async function guardarSrv() {
  if (!editandoSrv.value && !ventaSelSrv.value) { srvError.value = 'Seleccioná una venta'; return }
  if (!formSrv.value.descripcion.trim())          { srvError.value = 'La descripción es requerida'; return }
  srvError.value = ''
  srvSaving.value = true
  try {
    const payload = {
      tipoService:  formSrv.value.tipoService,
      descripcion:  formSrv.value.descripcion.trim(),
      kmActual:     formSrv.value.kmActual     ? Number(formSrv.value.kmActual)     : undefined,
      kmProximoService: formSrv.value.kmProximoService ? Number(formSrv.value.kmProximoService) : undefined,
      fechaService: new Date(formSrv.value.fechaService).toISOString(),
      fechaProximoService: formSrv.value.fechaProximoService
        ? new Date(formSrv.value.fechaProximoService).toISOString()
        : null,
      observaciones: formSrv.value.observaciones.trim() || undefined,
    }
    if (editandoSrv.value) {
      await updateService(editandoSrv.value.id, payload)
      toast.success('Actualizado', 'Service actualizado correctamente')
    } else {
      await createService({ ...payload, ventaId: ventaSelSrv.value.id })
      toast.success('Creado', 'Service registrado correctamente')
    }
    showSrvModal.value = false
    loadServices()
  } catch (err) {
    srvError.value = err.response?.data?.error ?? 'Error al guardar'
  } finally {
    srvSaving.value = false
  }
}

// ── Marcar realizado rápido ────────────────────────────────────────────────────
async function marcarRealizado(srv) {
  try {
    await updateService(srv.id, { estado: 'REALIZADO' })
    toast.success('Realizado', `Service de ${srv.venta?.cliente?.nombre} marcado como realizado`)
    loadServices()
  } catch {
    toast.error('Error', 'No se pudo actualizar')
  }
}

// ── Filtros ────────────────────────────────────────────────────────────────────
const filters = ref({ estado: '', tipo: '', fechaDesde: '', fechaHasta: '', page: 1, pageSize: 20 })

const TIPOS   = ['GARANTIA', 'RECLAMO', 'CONSULTA', 'SEGUIMIENTO']
const ESTADOS = ['ABIERTO', 'EN_GESTION', 'CERRADO']
const LABEL_TIPO   = { GARANTIA: 'Garantía', RECLAMO: 'Reclamo', CONSULTA: 'Consulta', SEGUIMIENTO: 'Seguimiento' }
const LABEL_ESTADO = { ABIERTO: 'Abierto', EN_GESTION: 'En gestión', CERRADO: 'Cerrado' }

const estadoOptions = computed(() => [
  { value: '', label: 'Estado (todos)' },
  ...ESTADOS.map(e => ({ value: e, label: LABEL_ESTADO[e] })),
])

const tipoOptions = computed(() => [
  { value: '', label: 'Tipo (todos)' },
  ...TIPOS.map(t => ({ value: t, label: LABEL_TIPO[t] })),
])

const estadoSrvOptions = computed(() => [
  { value: '', label: 'Estado (todos)' },
  ...ESTADOS_SRV.map(e => ({ value: e, label: LABEL_EST_SRV[e] })),
])

const tipoSrvOptions = computed(() => [
  { value: '', label: 'Tipo (todos)' },
  ...TIPOS_SRV.map(t => ({ value: t, label: LABEL_TIPO_SRV[t] })),
])

const tipoSrvFormOptions = computed(() =>
  TIPOS_SRV.map(t => ({ value: t, label: LABEL_TIPO_SRV[t] }))
)

const tipoFormOptions = computed(() =>
  TIPOS.map(t => ({ value: t, label: LABEL_TIPO[t] }))
)

function load() {
  fetchCasos({ ...filters.value })
}

function applyFilters() {
  filters.value.page = 1
  load()
}

function clearFilters() {
  filters.value = { estado: '', tipo: '', fechaDesde: '', fechaHasta: '', page: 1, pageSize: 20 }
  load()
}

function changePage(p) {
  filters.value.page = p
  load()
}

onMounted(() => { load(); loadServices() })

watch([tab, viewSrv], ([t, v]) => {
  if (t === 'services' && v === 'calendario' && !calServices.value.length) {
    cargarCalendario()
  }
})

// ── Modal nuevo caso ───────────────────────────────────────────────────────────
const showModal    = ref(false)
const modalError   = ref('')
const modalSaving  = ref(false)

// Búsqueda de venta
const ventaSearch  = ref('')
const ventasFound  = ref([])
const ventaSeleccionada = ref(null)
let searchTimeout  = null

async function buscarVentas() {
  clearTimeout(searchTimeout)
  if (!ventaSearch.value.trim()) { ventasFound.value = []; return }
  searchTimeout = setTimeout(async () => {
    try {
      const { data } = await api.get('/ventas', { params: { clienteNombre: ventaSearch.value, pageSize: 8 } })
      ventasFound.value = data.data ?? []
    } catch {
      ventasFound.value = []
    }
  }, 300)
}

function seleccionarVenta(v) {
  ventaSeleccionada.value = v
  ventaSearch.value = `${v.cliente?.nombre} ${v.cliente?.apellido} — ${v.vehiculo?.marca} ${v.vehiculo?.modelo} ${v.vehiculo?.anio}`
  ventasFound.value = []
}

const newForm = ref({ tipo: 'GARANTIA', descripcion: '' })

function openModal() {
  ventaSearch.value = ''
  ventasFound.value = []
  ventaSeleccionada.value = null
  newForm.value = { tipo: 'GARANTIA', descripcion: '' }
  modalError.value = ''
  showModal.value = true
}

async function saveCaso() {
  if (!ventaSeleccionada.value) { modalError.value = 'Seleccioná una venta'; return }
  if (!newForm.value.descripcion.trim()) { modalError.value = 'La descripción es requerida'; return }
  modalError.value  = ''
  modalSaving.value = true
  try {
    await createCaso({
      ventaId:     ventaSeleccionada.value.id,
      clienteId:   ventaSeleccionada.value.cliente.id,
      tipo:        newForm.value.tipo,
      descripcion: newForm.value.descripcion,
    })
    toast.success('Caso creado', 'El caso de postventa fue registrado.')
    showModal.value = false
    load()
  } catch (err) {
    modalError.value = err.response?.data?.error ?? 'Error al guardar'
    toast.error('Error', err.response?.data?.error ?? 'Ocurrió un error')
  } finally {
    modalSaving.value = false
  }
}

// ── Columnas ───────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'cliente',       label: 'Cliente' },
  { key: 'vehiculo',      label: 'Vehículo' },
  { key: 'tipo',          label: 'Tipo' },
  { key: 'estado',        label: 'Estado' },
  { key: 'fechaContacto', label: 'Fecha contacto' },
  { key: 'fechaResolucion', label: 'Resolución' },
]
</script>

<template>
  <div class="p-6 space-y-5">

    <!-- Tabs -->
    <div class="flex gap-0.5 border-b border-slate-200 dark:border-white/10">
      <button
        class="px-5 py-2.5 text-sm font-medium transition-colors relative"
        :class="tab === 'casos'
          ? 'text-primary-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:rounded-t'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
        @click="tab = 'casos'"
      >
        Casos
        <span class="ml-1.5 text-[10px] font-mono bg-slate-100 dark:bg-white/10 text-slate-500 px-1.5 py-0.5 rounded-full">{{ meta.total }}</span>
      </button>
      <button
        class="px-5 py-2.5 text-sm font-medium transition-colors relative"
        :class="tab === 'services'
          ? 'text-primary-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:rounded-t'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
        @click="tab = 'services'"
      >
        Services
        <span class="ml-1.5 text-[10px] font-mono bg-slate-100 dark:bg-white/10 text-slate-500 px-1.5 py-0.5 rounded-full">{{ metaSrv.total }}</span>
      </button>
    </div>

    <!-- ══════════════════ TAB CASOS ══════════════════ -->
    <template v-if="tab === 'casos'">

    <!-- Encabezado -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Postventa</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ meta.total }} caso{{ meta.total !== 1 ? 's' : '' }} en total</p>
      </div>
      <button v-if="canDo('postventa','crear')"
        class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-glow active:scale-[0.98]"
        @click="openModal"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nuevo caso
      </button>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/5 p-4">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label class="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5">Estado</label>
          <AppSelect v-model="filters.estado" :options="estadoOptions" />
        </div>
        <div>
          <label class="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5">Tipo</label>
          <AppSelect v-model="filters.tipo" :options="tipoOptions" />
        </div>
        <div>
          <label class="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5">Fecha desde</label>
          <input v-model="filters.fechaDesde" type="date"
            class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500 transition-colors"/>
        </div>
        <div>
          <label class="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5">Fecha hasta</label>
          <input v-model="filters.fechaHasta" type="date"
            class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500 transition-colors"/>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 mt-3">
        <button
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          :disabled="exporting || !casos.length"
          @click="exportar"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
          </svg>
          {{ exporting ? 'Exportando...' : 'Exportar Excel' }}
        </button>
        <div class="flex gap-2">
        <button
          class="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          @click="clearFilters"
        >
          Limpiar
        </button>
        <button
          class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-4 py-1.5 rounded-xl transition-all shadow-sm hover:shadow-glow"
          @click="applyFilters"
        >
          Filtrar
        </button>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>

    <!-- Tabla -->
    <AppTable
      :columns="COLUMNS"
      :rows="casos"
      :loading="loading"
      clickable
      @row-click="(row) => router.push(`/postventa/${row.id}`)"
    >
      <template #cell-cliente="{ row }">
        <span class="font-medium text-slate-800 dark:text-slate-100">
          {{ row.cliente?.apellido }}, {{ row.cliente?.nombre }}
        </span>
      </template>

      <template #cell-vehiculo="{ row }">
        <span class="text-slate-600 dark:text-slate-400">
          {{ row.venta?.vehiculo ? `${row.venta.vehiculo.marca} ${row.venta.vehiculo.modelo} ${row.venta.vehiculo.anio}` : '—' }}
        </span>
      </template>

      <template #cell-tipo="{ value }">
        <AppBadge :value="value" :label="LABEL_TIPO[value]" size="xs" />
      </template>

      <template #cell-estado="{ value }">
        <AppBadge :value="value" :label="LABEL_ESTADO[value]" size="xs" />
      </template>

      <template #cell-fechaContacto="{ value }">
        {{ value ? formatDate(value) : '—' }}
      </template>

      <template #cell-fechaResolucion="{ value }">
        {{ value ? formatDate(value) : '—' }}
      </template>

      <template #empty>
        No hay casos de postventa. Usá los filtros o creá uno nuevo.
      </template>
    </AppTable>

    <!-- Paginación -->
    <AppPagination
      v-if="!loading"
      :page="meta.page"
      :total="meta.total"
      :page-size="meta.pageSize"
      @update:page="changePage"
    />

    </template>
    <!-- ══════════════════ TAB SERVICES ══════════════════ -->
    <template v-if="tab === 'services'">

      <!-- Encabezado services -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Services y mantenimiento</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Seguimiento de mantenimiento periódico y garantía por vehículo.</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Toggle lista / calendario -->
          <div class="flex items-center bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-xl p-1">
            <button class="p-1.5 rounded-lg transition-all" :class="viewSrv==='lista' ? 'bg-slate-900 dark:bg-white/10 text-white' : 'text-slate-400 hover:text-slate-600'" @click="viewSrv='lista'" title="Lista">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></svg>
            </button>
            <button class="p-1.5 rounded-lg transition-all" :class="viewSrv==='calendario' ? 'bg-slate-900 dark:bg-white/10 text-white' : 'text-slate-400 hover:text-slate-600'" @click="viewSrv='calendario'; cargarCalendario()" title="Calendario">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/></svg>
            </button>
          </div>
          <button
            class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-glow active:scale-[0.98]"
            @click="abrirCrearSrv">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Nuevo service
          </button>
        </div>
      </div>

      <!-- ── VISTA CALENDARIO ─────────────────────────────────────────────── -->
      <template v-if="viewSrv === 'calendario'">
        <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">

          <!-- Barra de navegación + toggle mensual/semanal -->
          <div class="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-white/10">
            <!-- Prev -->
            <button class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors"
              @click="calView === 'mensual' ? prevMes() : prevSemana()">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
            </button>

            <!-- Título período -->
            <div class="text-center">
              <p class="text-sm font-bold text-slate-900 dark:text-white">
                <template v-if="calView === 'mensual'">{{ MESES_CAL[calMonth - 1] }} {{ calYear }}</template>
                <template v-else>
                  {{ calWeekDays[0].getDate() }} {{ MESES_CAL[calWeekDays[0].getMonth()] }}
                  — {{ calWeekDays[6].getDate() }} {{ MESES_CAL[calWeekDays[6].getMonth()] }} {{ calWeekDays[6].getFullYear() }}
                </template>
              </p>
              <p class="text-[11px] text-slate-400 dark:text-slate-500">{{ calServices.length }} service{{ calServices.length !== 1 ? 's' : '' }}</p>
            </div>

            <!-- Toggle mensual/semanal + Next -->
            <div class="flex items-center gap-2">
              <div class="flex items-center bg-slate-100 dark:bg-white/5 rounded-lg p-0.5 text-xs">
                <button class="px-2.5 py-1 rounded-md font-medium transition-all"
                  :class="calView === 'mensual' ? 'bg-white dark:bg-white/10 shadow text-slate-900 dark:text-white' : 'text-slate-400'"
                  @click="calView = 'mensual'; cargarCalendario()">Mes</button>
                <button class="px-2.5 py-1 rounded-md font-medium transition-all"
                  :class="calView === 'semanal' ? 'bg-white dark:bg-white/10 shadow text-slate-900 dark:text-white' : 'text-slate-400'"
                  @click="calView = 'semanal'; cargarCalendario()">Semana</button>
              </div>
              <button class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors"
                @click="calView === 'mensual' ? nextMes() : nextSemana()">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
              </button>
            </div>
          </div>

          <!-- Cabecera días de semana -->
          <div class="grid grid-cols-7 border-b border-slate-200 dark:border-white/10">
            <div v-for="(d, i) in DIAS_SEMANA" :key="d"
              class="py-2 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
              :class="calView === 'semanal' && calWeekDays[i] ? 'flex flex-col items-center gap-0.5' : ''">
              {{ d }}
              <template v-if="calView === 'semanal' && calWeekDays[i]">
                <span class="text-base font-bold leading-none"
                  :class="keyFecha(calWeekDays[i]) === keyFecha(hoy) ? 'text-primary-500' : 'text-slate-700 dark:text-slate-200'">
                  {{ calWeekDays[i].getDate() }}
                </span>
              </template>
            </div>
          </div>

          <div v-if="loadingCal" class="flex justify-center py-16">
            <svg class="w-7 h-7 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
          </div>

          <!-- ── GRID MENSUAL ── -->
          <div v-else-if="calView === 'mensual'" class="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-white/5">
            <div v-for="dia in calDias" :key="`${dia.mes}-${dia.dia}`"
              class="min-h-[90px] p-2 transition-colors relative"
              :class="[
                dia.mes !== 'actual' ? 'bg-slate-50/50 dark:bg-white/[0.01] cursor-default' : 'cursor-pointer hover:bg-primary-50/30 dark:hover:bg-primary-500/5',
                diaSeleccionado === dia.dia && dia.mes === 'actual' ? 'bg-primary-50 dark:bg-primary-500/10' : '',
                dropTarget === keyFecha(dia.fecha) ? 'bg-primary-100 dark:bg-primary-500/20 ring-2 ring-inset ring-primary-400' : '',
                keyFecha(dia.fecha) === keyFecha(hoy) && dia.mes === 'actual' ? 'border-t-2 border-primary-500' : '',
              ]"
              @click="dia.mes === 'actual' && (diaSeleccionado = diaSeleccionado === dia.dia ? null : dia.dia)"
              @dragover="dia.mes === 'actual' && onCalDragOver($event, keyFecha(dia.fecha), dia.fecha)"
              @dragleave="onCalDragLeave"
              @drop="dia.mes === 'actual' && onCalDrop($event, dia.fecha)">
              <!-- Número día -->
              <span class="text-xs font-bold mb-1"
                :class="dia.mes !== 'actual' ? 'text-slate-200 dark:text-white/10 block' : 'block text-slate-600 dark:text-slate-300'">
                {{ dia.dia }}
              </span>
              <!-- Eventos -->
              <div v-if="dia.mes === 'actual' && servicesPorDia[dia.dia]" class="flex flex-col gap-0.5">
                <div v-for="srv in servicesPorDia[dia.dia].slice(0, 3)" :key="srv.id"
                  draggable="true"
                  class="text-[10px] px-1.5 py-0.5 rounded font-medium truncate cursor-grab active:cursor-grabbing select-none flex items-center gap-1 group/chip"
                  :class="chipClass(srv)"
                  @dragstart.stop="onCalDragStart(srv.id)"
                  @dragend.stop="onCalDragEnd"
                  @click.stop>
                  <svg class="w-2.5 h-2.5 shrink-0 opacity-50 group-hover/chip:opacity-100" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM16 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM16 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                  </svg>
                  <span class="truncate">{{ srv.venta?.vehiculo?.marca ?? srv.vehiculo?.marca ?? 'Service' }} {{ srv.venta?.vehiculo?.modelo ?? srv.vehiculo?.modelo ?? '' }}</span>
                </div>
                <span v-if="servicesPorDia[dia.dia].length > 3" class="text-[9px] text-slate-400 pl-1">+{{ servicesPorDia[dia.dia].length - 3 }} más</span>
              </div>
            </div>
          </div>

          <!-- ── GRID SEMANAL CON HORAS ── -->
          <div v-else class="flex overflow-hidden" style="max-height:640px">
            <!-- Scroll wrapper -->
            <div class="flex flex-1 overflow-y-auto">
              <!-- Columna de horas -->
              <div class="w-14 shrink-0 border-r border-slate-200 dark:border-white/10">
                <div v-for="h in HORAS" :key="h"
                  :style="{ height: SLOT_H + 'px' }"
                  class="flex items-start justify-end pr-2 pt-1 border-b border-slate-200 dark:border-white/10">
                  <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500 leading-none">{{ String(h).padStart(2,'0') }}:00</span>
                </div>
              </div>

              <!-- Columnas de días -->
              <div class="flex flex-1 divide-x divide-slate-100 dark:divide-white/5">
                <div v-for="dayDate in calWeekDays" :key="keyFecha(dayDate)"
                  class="flex-1 relative transition-colors"
                  :style="{ height: HORAS.length * SLOT_H + 'px' }"
                  :class="[
                    dropTarget === keyFecha(dayDate) ? 'bg-primary-50/60 dark:bg-primary-500/10' : '',
                    keyFecha(dayDate) === keyFecha(hoy) ? 'bg-blue-50/30 dark:bg-blue-500/5' : '',
                  ]"
                  @dragover="onCalDragOver($event, keyFecha(dayDate), dayDate)"
                  @dragleave="onCalDragLeave"
                  @drop="onCalDrop($event, dayDate)">

                  <!-- Líneas de horas -->
                  <div v-for="h in HORAS" :key="h"
                    class="absolute w-full border-b border-slate-200 dark:border-white/10"
                    :style="{ top: (h - HORA_INI) * SLOT_H + 'px', height: SLOT_H + 'px' }"/>

                  <!-- Línea de preview de drop (donde va a caer el evento) -->
                  <div v-if="dragSrvId && dragPreview?.dayKey === keyFecha(dayDate)"
                    class="absolute left-0 right-0 z-30 pointer-events-none flex items-center gap-1"
                    :style="{ top: dragPreview.top + 'px' }">
                    <span class="bg-primary-500 text-white text-[10px] font-mono font-bold px-1.5 py-px rounded-r-md shadow-sm shrink-0">
                      {{ dragPreview.label }}
                    </span>
                    <div class="flex-1 h-0.5 bg-primary-500 opacity-80"/>
                  </div>

                  <!-- Línea del momento actual -->
                  <div v-if="keyFecha(dayDate) === keyFecha(hoy)"
                    class="absolute w-full flex items-center z-10 pointer-events-none"
                    :style="{ top: ((new Date().getHours() - HORA_INI) + new Date().getMinutes()/60) * SLOT_H + 'px' }">
                    <div class="w-2 h-2 rounded-full bg-primary-500 -ml-1 shrink-0"/>
                    <div class="flex-1 h-px bg-primary-500"/>
                  </div>

                  <!-- Eventos posicionados -->
                  <div v-for="srv in servicesPorFecha[keyFecha(dayDate)]" :key="srv.id"
                    draggable="true"
                    class="absolute left-1 right-1 rounded-lg px-2 py-1.5 cursor-grab active:cursor-grabbing select-none overflow-hidden border-l-[3px] shadow-sm hover:shadow-md transition-all z-20 group/ev"
                    :class="srv._alerta === 'VENCIDO'
                      ? 'bg-red-50 dark:bg-red-500/15 border-l-red-500'
                      : srv._alerta === 'PROXIMO'
                        ? 'bg-amber-50 dark:bg-amber-500/15 border-l-amber-500'
                        : 'bg-emerald-50 dark:bg-emerald-500/10 border-l-emerald-500'"
                    :style="[eventStyle(srv), dragSrvId === srv.id ? 'opacity:0.35;transform:scale(0.96)' : '']"
                    @dragstart.stop="onCalDragStart(srv.id)"
                    @dragend.stop="onCalDragEnd"
                    @click.stop="servicioDetalle = servicioDetalle?.id === srv.id ? null : srv">

                    <!-- Hora -->
                    <p class="text-[10px] font-bold font-mono leading-none mb-0.5"
                      :class="srv._alerta === 'VENCIDO' ? 'text-red-600 dark:text-red-400' : srv._alerta === 'PROXIMO' ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'">
                      {{ fmtHora(srv.fechaProximoService) }}
                    </p>
                    <!-- Vehículo -->
                    <p class="text-[11px] font-semibold text-slate-900 dark:text-white truncate leading-snug">
                      {{ srv.venta?.vehiculo?.marca ?? srv.vehiculo?.marca }} {{ srv.venta?.vehiculo?.modelo ?? srv.vehiculo?.modelo }}
                    </p>
                    <!-- Cliente (solo si hay espacio) -->
                    <p v-if="SLOT_H >= 60 && srv.venta?.cliente" class="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {{ srv.venta.cliente.nombre }} {{ srv.venta.cliente.apellido }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel detalle mensual -->
        <div v-if="calView === 'mensual' && diaSeleccionado && serviciosDiaSeleccionado.length"
          class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">
              {{ diaSeleccionado }} de {{ MESES_CAL[calMonth - 1] }} — {{ serviciosDiaSeleccionado.length }} service{{ serviciosDiaSeleccionado.length !== 1 ? 's' : '' }}
            </h4>
            <button class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" @click="diaSeleccionado = null">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="divide-y divide-slate-200 dark:divide-white/5">
            <div v-for="srv in serviciosDiaSeleccionado" :key="srv.id" class="px-5 py-4 flex items-start gap-4">
              <div class="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" :class="colorDia(srv)"/>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <span v-if="srv.fechaProximoService" class="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">{{ fmtHora(srv.fechaProximoService) }}</span>
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md" :class="TIPO_SRV_COLOR[srv.tipoService]">{{ LABEL_TIPO_SRV[srv.tipoService] }}</span>
                </div>
                <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ srv.venta?.vehiculo?.marca ?? srv.vehiculo?.marca }} {{ srv.venta?.vehiculo?.modelo ?? srv.vehiculo?.modelo }} {{ srv.venta?.vehiculo?.anio ?? srv.vehiculo?.anio }}</p>
                <p v-if="srv.venta?.cliente" class="text-xs text-primary-600 dark:text-primary-400 mt-0.5">{{ srv.venta.cliente.nombre }} {{ srv.venta.cliente.apellido }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ srv.descripcion }}</p>
                <p v-if="srv.kmProximoService" class="text-[10px] text-slate-400 mt-1">Próx. service: {{ srv.kmProximoService.toLocaleString() }} km</p>
              </div>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                :class="srv._alerta === 'VENCIDO' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : srv._alerta === 'PROXIMO' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'">
                {{ srv._alerta === 'VENCIDO' ? 'Vencido' : srv._alerta === 'PROXIMO' ? 'Próximo' : 'Programado' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Panel detalle semanal — aparece al clickear un evento -->
        <div v-if="calView === 'semanal' && servicioDetalle"
          class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-3 h-3 rounded-full shrink-0" :class="colorDia(servicioDetalle)"/>
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">Detalle del service</h4>
            </div>
            <button class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" @click="servicioDetalle = null">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Fecha y hora</p>
              <p class="text-sm font-bold text-slate-900 dark:text-white">
                {{ servicioDetalle.fechaProximoService ? new Date(servicioDetalle.fechaProximoService).toLocaleDateString('es-AR', { day:'2-digit', month:'short' }) : '—' }}
              </p>
              <p class="text-sm font-mono text-primary-500">{{ servicioDetalle.fechaProximoService ? fmtHora(servicioDetalle.fechaProximoService) : '—' }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Vehículo</p>
              <p class="text-sm font-bold text-slate-900 dark:text-white">{{ servicioDetalle.venta?.vehiculo?.marca ?? servicioDetalle.vehiculo?.marca }} {{ servicioDetalle.venta?.vehiculo?.modelo ?? servicioDetalle.vehiculo?.modelo }}</p>
              <p class="text-xs text-slate-400 dark:text-slate-500">{{ servicioDetalle.venta?.vehiculo?.anio ?? servicioDetalle.vehiculo?.anio }}</p>
            </div>
            <div v-if="servicioDetalle.venta?.cliente">
              <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Cliente</p>
              <p class="text-sm font-bold text-slate-900 dark:text-white">{{ servicioDetalle.venta.cliente.nombre }} {{ servicioDetalle.venta.cliente.apellido }}</p>
              <p v-if="servicioDetalle.venta.cliente.telefono" class="text-xs text-slate-400 dark:text-slate-500">{{ servicioDetalle.venta.cliente.telefono }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Tipo</p>
              <span class="text-xs font-semibold px-2 py-1 rounded-lg" :class="TIPO_SRV_COLOR[servicioDetalle.tipoService]">{{ LABEL_TIPO_SRV[servicioDetalle.tipoService] }}</span>
              <p v-if="servicioDetalle.kmProximoService" class="text-xs text-slate-400 dark:text-slate-500 mt-1">{{ servicioDetalle.kmProximoService.toLocaleString() }} km</p>
            </div>
            <div class="col-span-2 sm:col-span-4">
              <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Descripción</p>
              <p class="text-sm text-slate-700 dark:text-slate-200">{{ servicioDetalle.descripcion }}</p>
            </div>
          </div>
        </div>
      </template>

      <!-- ── VISTA LISTA ──────────────────────────────────────────────────── -->
      <template v-if="viewSrv === 'lista'">
      <!-- Filtros services -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/5 p-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AppSelect v-model="filtersSrv.estado" :options="estadoSrvOptions" @change="applyFiltersSrv" />
          <AppSelect v-model="filtersSrv.tipoService" :options="tipoSrvOptions" @change="applyFiltersSrv" />
        </div>
        <div class="flex justify-end gap-2 mt-3">
          <button class="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" @click="clearFiltersSrv">Limpiar</button>
          <button class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-4 py-1.5 rounded-xl transition-all shadow-sm" @click="applyFiltersSrv">Filtrar</button>
        </div>
      </div>

      <div v-if="errorSrv" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ errorSrv }}</div>

      <div v-if="loadingSrv" class="flex justify-center py-16">
        <svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>

      <div v-else-if="!services.length" class="text-center py-20 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10">
        <svg class="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
        </svg>
        <p class="font-medium text-slate-500 dark:text-slate-400">Sin services registrados</p>
        <p class="text-sm mt-1 text-slate-400">Registrá el primer service de un vehículo vendido.</p>
      </div>

      <!-- Lista de services -->
      <div v-else class="space-y-3">
        <div
          v-for="srv in services"
          :key="srv.id"
          class="bg-white dark:bg-[#1a1a2e] rounded-2xl border shadow-card dark:shadow-none overflow-hidden transition-all hover:shadow-card-lg dark:hover:bg-[#1e1e35] group"
          :class="srv._alerta ? ALERTA_STYLE[srv._alerta] : 'border-slate-200 dark:border-white/10'"
        >
          <div class="px-5 py-4 flex items-start gap-4">

            <!-- Badge tipo -->
            <div class="shrink-0 mt-0.5">
              <span class="text-[10px] font-semibold px-2.5 py-1 rounded-lg" :class="TIPO_SRV_COLOR[srv.tipoService]">
                {{ LABEL_TIPO_SRV[srv.tipoService] }}
              </span>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-0.5">
                <span class="text-sm font-bold text-slate-900 dark:text-white">
                  {{ srv.venta?.cliente?.apellido }}, {{ srv.venta?.cliente?.nombre }}
                </span>
                <!-- Alerta vencimiento -->
                <span v-if="srv._alerta === 'VENCIDO'" class="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/20">
                  <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/></svg>
                  Service vencido
                </span>
                <span v-else-if="srv._alerta === 'PROXIMO'" class="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
                  ⚡ Vence en {{ diasHastaProximo(srv) }}d
                </span>
              </div>

              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ srv.venta?.vehiculo?.marca }} {{ srv.venta?.vehiculo?.modelo }} {{ srv.venta?.vehiculo?.anio }}
                <span v-if="srv.venta?.vehiculo?.patente" class="font-mono bg-slate-100 dark:bg-white/10 px-1.5 rounded ml-1">{{ srv.venta.vehiculo.patente }}</span>
              </p>

              <p class="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-snug">{{ srv.descripcion }}</p>

              <!-- Km + próximo service -->
              <div class="flex flex-wrap gap-3 mt-2">
                <span v-if="srv.kmActual" class="text-[10px] text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md font-mono">
                  {{ number(srv.kmActual) }} km actuales
                </span>
                <span v-if="srv.kmProximoService" class="text-[10px] text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md font-mono">
                  Próx. service a {{ number(srv.kmProximoService) }} km
                </span>
                <span v-if="srv.fechaProximoService" class="text-[10px] text-slate-400">
                  · Fecha próximo: <strong class="text-slate-600 dark:text-slate-300">{{ formatDate(srv.fechaProximoService) }}</strong>
                </span>
              </div>
            </div>

            <!-- Derecha: fecha + estado + acciones -->
            <div class="shrink-0 text-right flex flex-col items-end gap-2">
              <span class="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                :class="{
                  'bg-amber-500/15 text-amber-700 dark:text-amber-400': srv.estado === 'PENDIENTE',
                  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400': srv.estado === 'REALIZADO',
                  'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400': srv.estado === 'CANCELADO',
                }">
                {{ LABEL_EST_SRV[srv.estado] }}
              </span>
              <p class="text-[10px] text-slate-400">{{ formatDate(srv.fechaService) }}</p>

              <!-- Acciones -->
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button v-if="srv.estado === 'PENDIENTE'"
                  class="text-[10px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
                  @click="marcarRealizado(srv)"
                >
                  ✓ Realizado
                </button>
                <button
                  class="text-[10px] font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
                  @click="abrirEditarSrv(srv)"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppPagination v-if="!loadingSrv" :page="metaSrv.page" :total="metaSrv.total" :page-size="metaSrv.pageSize" @update:page="changePageSrv"/>

      </template> <!-- /lista -->
    </template> <!-- /tab services -->

    <!-- Modal confirmación reprogramar service -->
    <AppModal v-model="showMoveConfirm" title="Reprogramar service" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-slate-700 dark:text-slate-300">
          ¿Reprogramar el service de
          <strong class="text-slate-900 dark:text-white">{{ pendingMove?.label }}</strong>?
        </p>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-slate-50 dark:bg-white/5 rounded-xl p-3 text-center">
            <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Antes</p>
            <p class="text-sm font-bold text-slate-700 dark:text-slate-300 line-through">
              {{ pendingMove?.oldIso ? new Date(pendingMove.oldIso).toLocaleDateString('es-AR', { day:'2-digit', month:'short' }) : '—' }}
            </p>
            <p class="text-xs font-mono text-slate-500 dark:text-slate-400">{{ pendingMove?.oldIso ? fmtHora(pendingMove.oldIso) : '' }}</p>
          </div>
          <div class="bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/20 rounded-xl p-3 text-center">
            <p class="text-[10px] font-semibold text-primary-500 uppercase tracking-wider mb-1">Después</p>
            <p class="text-sm font-bold text-primary-700 dark:text-primary-300">
              {{ pendingMove?.newIso ? new Date(pendingMove.newIso).toLocaleDateString('es-AR', { day:'2-digit', month:'short' }) : '—' }}
            </p>
            <p class="text-xs font-mono font-bold text-primary-500">{{ pendingMove?.newIso ? fmtHora(pendingMove.newIso) : '' }}</p>
          </div>
        </div>
      </div>
      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          @click="close(); pendingMove = null">Cancelar</button>
        <button class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow"
          :disabled="movingSrv" @click="confirmarMover">
          {{ movingSrv ? 'Guardando...' : 'Confirmar' }}
        </button>
      </template>
    </AppModal>

    <!-- Modal nuevo caso -->
    <AppModal v-model="showModal" title="Nuevo caso de postventa" size="md">
      <div class="space-y-4">
        <p v-if="modalError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2">{{ modalError }}</p>

        <!-- Buscar venta -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Venta (buscar por cliente) *</label>
          <div class="relative">
            <input
              v-model="ventaSearch"
              type="text"
              placeholder="Escribí el nombre del cliente..."
              class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"
              @input="buscarVentas"
            />
            <!-- Dropdown resultados -->
            <div
              v-if="ventasFound.length"
              class="absolute z-10 w-full mt-1 bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg max-h-48 overflow-y-auto"
            >
              <button
                v-for="v in ventasFound"
                :key="v.id"
                type="button"
                class="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-200 dark:border-white/10 last:border-0"
                @click="seleccionarVenta(v)"
              >
                <span class="font-medium text-slate-800 dark:text-slate-200">{{ v.cliente?.nombre }} {{ v.cliente?.apellido }}</span>
                <span class="text-slate-500 dark:text-slate-400 ml-2">— {{ v.vehiculo?.marca }} {{ v.vehiculo?.modelo }} {{ v.vehiculo?.anio }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tipo -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tipo *</label>
          <AppSelect v-model="newForm.tipo" :options="tipoFormOptions" />
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descripción *</label>
          <textarea
            v-model="newForm.descripcion"
            rows="3"
            placeholder="Describí el motivo del contacto..."
            class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
      </div>

      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-400 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">
          Cancelar
        </button>
        <button
          class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow"
          :disabled="modalSaving"
          @click="saveCaso"
        >
          {{ modalSaving ? 'Guardando...' : 'Crear caso' }}
        </button>
      </template>
    </AppModal>

    <!-- Modal crear / editar service -->
    <AppModal v-model="showSrvModal" :title="editandoSrv ? 'Editar service' : 'Nuevo service'" size="md">
      <div class="space-y-4">
        <p v-if="srvError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2">{{ srvError }}</p>

        <!-- Buscar venta (solo al crear) -->
        <div v-if="!editandoSrv">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Venta / Vehículo *</label>
          <div class="relative">
            <input
              v-model="ventaSearchSrv"
              type="text"
              placeholder="Escribí el nombre del cliente o vehículo..."
              class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <div v-if="loadingVentasSrv" class="absolute right-3 top-2.5">
              <svg class="w-4 h-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </div>
            <div v-if="!ventaSelSrv && ventasFiltradas.length" class="absolute z-10 w-full mt-1 bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg max-h-52 overflow-y-auto">
              <button v-for="v in ventasFiltradas" :key="v.id" type="button"
                class="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-200 dark:border-white/10 last:border-0"
                @click="seleccionarVentaSrv(v)">
                <span class="font-medium text-slate-800 dark:text-slate-200">{{ v.cliente?.nombre }} {{ v.cliente?.apellido }}</span>
                <span class="text-slate-500 dark:text-slate-400 ml-2 text-xs">— {{ v.vehiculo?.marca }} {{ v.vehiculo?.modelo }} {{ v.vehiculo?.anio }}</span>
              </button>
            </div>
          </div>
          <p v-if="ventaSelSrv" class="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
            {{ ventaSelSrv.cliente?.nombre }} {{ ventaSelSrv.cliente?.apellido }} — {{ ventaSelSrv.vehiculo?.marca }} {{ ventaSelSrv.vehiculo?.modelo }}
            <button type="button" class="ml-1 text-slate-400 hover:text-red-500" @click="ventaSelSrv = null; ventaSearchSrv = ''">✕</button>
          </p>
        </div>
        <div v-else class="bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
          {{ editandoSrv.venta?.cliente?.nombre }} {{ editandoSrv.venta?.cliente?.apellido }} — {{ editandoSrv.venta?.vehiculo?.marca }} {{ editandoSrv.venta?.vehiculo?.modelo }}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tipo de service</label>
            <AppSelect v-model="formSrv.tipoService" :options="tipoSrvFormOptions" />
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descripción *</label>
            <textarea v-model="formSrv.descripcion" rows="2" placeholder="Ej: Cambio de aceite y filtro, revisión frenos..." class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500 resize-none"/>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha del service</label>
            <input v-model="formSrv.fechaService" type="date" class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"/>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha próximo service</label>
            <input v-model="formSrv.fechaProximoService" type="date" class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"/>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Km actuales</label>
            <input v-model.number="formSrv.kmActual" type="number" min="0" placeholder="Ej: 25000" class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"/>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Próximo service (km)</label>
            <input v-model.number="formSrv.kmProximoService" type="number" min="0" placeholder="Ej: 35000" class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500"/>
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Observaciones</label>
            <textarea v-model="formSrv.observaciones" rows="2" placeholder="Notas adicionales..." class="w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500 resize-none"/>
          </div>
        </div>
      </div>

      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow" :disabled="srvSaving" @click="guardarSrv">
          {{ srvSaving ? 'Guardando...' : editandoSrv ? 'Guardar cambios' : 'Registrar service' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
