<script setup>
import { ref, computed, onMounted } from 'vue'
import { useIndumentaria } from '../../stock/composables/useIndumentaria.js'
import { useCategorias }   from '../../stock/composables/useCategorias.js'
import { usePermisos }     from '../../../shared/composables/usePermisos.js'
import { useToast }        from '../../../shared/composables/useToast.js'
import AppSelect      from '../../../shared/components/AppSelect.vue'
import AppPagination  from '../../../shared/components/AppPagination.vue'
import AppModal       from '../../../shared/components/AppModal.vue'
import AppImportModal from '../../../shared/components/AppImportModal.vue'
import { currency, number } from '../../../shared/utils/format.js'
import api from '../../../plugins/axios.js'

const showImport = ref(false)

const toast = useToast()
const { canDo } = usePermisos()

const { items, loading, error, meta, fetchItems, createItem, updateItem, removeItem } = useIndumentaria()
const { categorias, loading: loadingCat, fetchCategorias, createCategoria, updateCategoria, deleteCategoria, categoriasOptions, categoriasFilterOptions } = useCategorias()

// ── Vista ──────────────────────────────────────────────────────────────────────
const viewMode = ref('grid')

// ── Filters ────────────────────────────────────────────────────────────────────
const search  = ref('')
const filters = ref({ categoria: '', talla: '', page: 1, pageSize: 20 })

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { filters.value.page = 1; load() }, 300)
}

const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'UNICA']

const tallaFilterOptions = computed(() => [
  { value: '', label: 'Talla (todas)' },
  ...TALLAS.map(t => ({ value: t, label: t })),
])
const tallaFormOptions = computed(() => [
  { value: '', label: 'Sin talla' },
  ...TALLAS.map(t => ({ value: t, label: t })),
])

// Colores de categoría
const CAT_COLORS = [
  'bg-pink-500/15 text-pink-700 dark:text-pink-400',
  'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'bg-rose-500/15 text-rose-700 dark:text-rose-400',
]
const catColorMap = computed(() => {
  const m = {}
  categorias.value.forEach((c, i) => { m[c.nombre] = CAT_COLORS[i % CAT_COLORS.length] })
  return m
})
const getCatColor = (nombre) => catColorMap.value[nombre] ?? 'bg-slate-500/15 text-slate-600 dark:text-slate-400'

// ── Venta de indumentaria ──────────────────────────────────────────────────────
const showVentaModal  = ref(false)
const ventaItem       = ref(null)
const ventaCantidad   = ref(1)
const ventaSaving     = ref(false)
const ventaError      = ref('')
const sesionActiva    = ref(null)   // sesión de caja activa si existe

async function abrirVenta(item) {
  ventaItem.value     = item
  ventaCantidad.value = 1
  ventaError.value    = ''
  showVentaModal.value = true
  // Verificar si hay caja abierta
  try {
    const { data } = await api.get('/caja/activa')
    sesionActiva.value = data.data
  } catch { sesionActiva.value = null }
}

async function confirmarVenta() {
  if (!ventaCantidad.value || ventaCantidad.value < 1) {
    ventaError.value = 'Ingresá una cantidad válida'
    return
  }
  if (ventaCantidad.value > ventaItem.value.cantidad) {
    ventaError.value = `Stock insuficiente. Disponible: ${ventaItem.value.cantidad}`
    return
  }
  ventaSaving.value = true
  ventaError.value  = ''
  try {
    await api.post(`/indumentaria/${ventaItem.value.id}/vender`, {
      cantidad:     Number(ventaCantidad.value),
      sesionCajaId: sesionActiva.value?.id ?? undefined,
    })
    const total = currency(Number(ventaItem.value.precioVenta) * ventaCantidad.value)
    toast.success('Venta registrada', `${ventaCantidad.value}x ${ventaItem.value.nombre} — ${total}`)
    showVentaModal.value = false
    load()
  } catch (err) {
    ventaError.value = err.response?.data?.error ?? 'Error al registrar la venta'
  } finally {
    ventaSaving.value = false
  }
}

function load()          { fetchItems({ ...filters.value, q: search.value || undefined }) }
function applyFilters()  { filters.value.page = 1; load() }
function clearFilters()  { search.value = ''; filters.value = { categoria:'', talla:'', page:1, pageSize:20 }; load() }
function changePage(p)   { filters.value.page = p; load() }

// ── Fotos Cloudinary ───────────────────────────────────────────────────────────
const uploadingFoto = ref(false)
const CLOUD_URL     = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`
const PRESET        = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

function getFotos(item) {
  try { return JSON.parse(item.fotosJson ?? '[]') } catch { return [] }
}
function firstFoto(item) { return getFotos(item)[0] ?? null }

async function handleFotoUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploadingFoto.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', PRESET)
    const res  = await fetch(CLOUD_URL, { method: 'POST', body: fd })
    const data = await res.json()
    const fotos = getFotos({ fotosJson: formInd.value.fotosJson })
    formInd.value.fotosJson = JSON.stringify([...fotos, data.secure_url])
    formFotoIdx.value = fotos.length   // saltar a la foto recién subida
    toast.success('Foto subida')
  } catch {
    toast.error('Error', 'No se pudo subir la foto')
  } finally {
    uploadingFoto.value = false
    e.target.value = ''
  }
}

function removeFoto(url) {
  const fotos = getFotos({ fotosJson: formInd.value.fotosJson }).filter(f => f !== url)
  formInd.value.fotosJson = JSON.stringify(fotos)
  formFotoIdx.value = Math.min(formFotoIdx.value, Math.max(fotos.length - 1, 0))
}

// ── Drop zone para archivos externos (drag desde el escritorio) ───────────────
const isDroppingFile = ref(false)

function onFileDropZoneDragOver(e) {
  // Solo activar si lo que se arrastra son archivos (no thumbnails internos)
  if (e.dataTransfer?.types?.includes('Files')) {
    e.preventDefault()
    isDroppingFile.value = true
  }
}
function onFileDropZoneDragLeave(e) {
  // Ignorar si el cursor va hacia un hijo interno
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDroppingFile.value = false
  }
}
async function onFileDropZoneDrop(e) {
  e.preventDefault()
  isDroppingFile.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  uploadingFoto.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', PRESET)
    const res  = await fetch(CLOUD_URL, { method: 'POST', body: fd })
    const data = await res.json()
    const fotos = formFotos()
    formInd.value.fotosJson = JSON.stringify([...fotos, data.secure_url])
    formFotoIdx.value = fotos.length
    toast.success('Foto subida')
  } catch {
    toast.error('Error', 'No se pudo subir la foto')
  } finally {
    uploadingFoto.value = false
  }
}

// ── Drag & drop para reordenar fotos ──────────────────────────────────────────
const dragSrcIdx  = ref(null)
const dragOverIdx = ref(null)

function onDragStart(i)    { dragSrcIdx.value = i }
function onDragOver(e, i)  { e.preventDefault(); e.stopPropagation(); dragOverIdx.value = i }
function onDragLeave()     { dragOverIdx.value = null }
function onDrop(e, i) {
  e.preventDefault(); e.stopPropagation()
  if (dragSrcIdx.value === null || dragSrcIdx.value === i) { dragOverIdx.value = null; return }
  const fotos = [...formFotos()]
  const [moved] = fotos.splice(dragSrcIdx.value, 1)
  fotos.splice(i, 0, moved)
  formInd.value.fotosJson = JSON.stringify(fotos)
  formFotoIdx.value = i          // seguir viendo la foto que moviste
  dragSrcIdx.value  = null
  dragOverIdx.value = null
}
function onDragEnd() { dragSrcIdx.value = null; dragOverIdx.value = null }

onMounted(() => { load(); fetchCategorias(false) })

// ── Panel de categorías ────────────────────────────────────────────────────────
const showCatPanel = ref(false)
const showCatModal = ref(false)
const editandoCat  = ref(null)
const catNombre    = ref('')
const catError     = ref('')
const catSaving    = ref(false)

function abrirCrearCat()  { editandoCat.value = null; catNombre.value = ''; catError.value = ''; showCatModal.value = true }
function abrirEditarCat(c){ editandoCat.value = c; catNombre.value = c.nombre; catError.value = ''; showCatModal.value = true }

async function guardarCat() {
  if (!catNombre.value.trim()) { catError.value = 'El nombre es requerido'; return }
  catSaving.value = true; catError.value = ''
  try {
    if (editandoCat.value) {
      await updateCategoria(editandoCat.value.id, { nombre: catNombre.value.trim() })
      toast.success('Actualizado', 'Categoría actualizada')
    } else {
      await createCategoria(catNombre.value.trim())
      toast.success('Creada', `Categoría "${catNombre.value.trim()}" agregada`)
    }
    showCatModal.value = false
    fetchCategorias(false)
  } catch (err) { catError.value = err.response?.data?.error ?? 'Error al guardar' }
  finally { catSaving.value = false }
}

async function toggleCat(c) {
  try { await updateCategoria(c.id, { activo: !c.activo }); fetchCategorias(false) }
  catch { toast.error('Error', 'No se pudo actualizar') }
}

async function eliminarCat(c) {
  try { await deleteCategoria(c.id); toast.success('Eliminada', c.nombre); fetchCategorias(false) }
  catch (err) { toast.error('Error', err.response?.data?.error ?? 'No se pudo eliminar') }
}

// ── Modal detalle (Marketplace style) ────────────────────────────────────────
const showDetail  = ref(false)
const detailItem  = ref(null)
const detailFoto  = ref(0)   // índice de la foto activa en el detalle

function abrirDetalle(item) {
  detailItem.value = item
  detailFoto.value = 0
  showDetail.value = true
}
function detailFotos() { return getFotos(detailItem.value ?? {}) }
function prevFoto() { detailFoto.value = (detailFoto.value - 1 + detailFotos().length) % detailFotos().length }
function nextFoto() { detailFoto.value = (detailFoto.value + 1) % detailFotos().length }

function editarDesdeDetalle() {
  showDetail.value = false
  abrirEditar(detailItem.value)
}
function eliminarDesdeDetalle() {
  itemAEliminar.value = detailItem.value
  showDetail.value = false
}

// ── Modal ítem ─────────────────────────────────────────────────────────────────
const showModal   = ref(false)
const editandoInd = ref(null)
const savingInd   = ref(false)
const modalError  = ref('')
const formFotoIdx = ref(0)   // foto activa en el form

function formFotos()    { return getFotos({ fotosJson: formInd.value.fotosJson }) }
function formPrevFoto() { formFotoIdx.value = (formFotoIdx.value - 1 + formFotos().length) % formFotos().length }
function formNextFoto() { formFotoIdx.value = (formFotoIdx.value + 1) % formFotos().length }

const formInd = ref({
  nombre:'', descripcion:'', categoria:'', talla:'',
  color:'', marca:'', cantidad:0, precioCosto:'', precioVenta:'', fotosJson:''
})

function abrirCrear() {
  editandoInd.value = null
  formFotoIdx.value = 0
  formInd.value = { nombre:'', descripcion:'', categoria: categoriasOptions.value[0]?.value ?? '', talla:'', color:'', marca:'', cantidad:0, precioCosto:'', precioVenta:'', fotosJson:'' }
  modalError.value = ''; showModal.value = true
}

function abrirEditar(item) {
  editandoInd.value = item
  formFotoIdx.value = 0
  formInd.value = {
    nombre:      item.nombre,
    descripcion: item.descripcion ?? '',
    categoria:   item.categoria,
    talla:       item.talla ?? '',
    color:       item.color ?? '',
    marca:       item.marca ?? '',
    cantidad:    item.cantidad,
    precioCosto: Number(item.precioCosto),
    precioVenta: Number(item.precioVenta),
    fotosJson:   item.fotosJson ?? '',
  }
  modalError.value = ''; showModal.value = true
}

async function guardarInd() {
  if (!formInd.value.nombre.trim())   { modalError.value = 'El nombre es requerido'; return }
  if (!formInd.value.precioCosto)     { modalError.value = 'El precio de costo es requerido'; return }
  if (!formInd.value.precioVenta)     { modalError.value = 'El precio de venta es requerido'; return }
  savingInd.value = true; modalError.value = ''
  try {
    const payload = {
      nombre:      formInd.value.nombre.trim(),
      descripcion: formInd.value.descripcion.trim() || undefined,
      categoria:   formInd.value.categoria,
      talla:       formInd.value.talla || undefined,
      color:       formInd.value.color.trim() || undefined,
      marca:       formInd.value.marca.trim() || undefined,
      cantidad:    Number(formInd.value.cantidad),
      precioCosto: Number(formInd.value.precioCosto),
      precioVenta: Number(formInd.value.precioVenta),
      fotosJson:   formInd.value.fotosJson || undefined,
    }
    if (editandoInd.value) {
      await updateItem(editandoInd.value.id, payload)
      toast.success('Actualizado', 'Ítem actualizado')
    } else {
      await createItem(payload)
      toast.success('Creado', 'Ítem agregado al stock')
    }
    showModal.value = false
    load()
  } catch (err) { modalError.value = err.response?.data?.error ?? 'Error al guardar' }
  finally { savingInd.value = false }
}

// ── Eliminar ───────────────────────────────────────────────────────────────────
const itemAEliminar   = ref(null)
const eliminandoInd   = ref(false)
const showEliminarInd = computed({
  get: () => !!itemAEliminar.value,
  set: (v) => { if (!v) itemAEliminar.value = null }
})

async function confirmarEliminar() {
  eliminandoInd.value = true
  try {
    await removeItem(itemAEliminar.value.id)
    toast.success('Desactivado', itemAEliminar.value.nombre)
    itemAEliminar.value = null
    load()
  } catch (err) { toast.error('Error', err.response?.data?.error ?? 'No se pudo eliminar') }
  finally { eliminandoInd.value = false }
}

// Clases input reutilizables
const inputCls = 'w-full rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-primary-500 focus:ring-primary-500'
</script>

<template>
  <div class="p-6 space-y-5 animate-fade-in">

    <!-- Encabezado -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Indumentaria</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          <span class="font-mono font-semibold text-slate-700 dark:text-slate-300">{{ meta.total }}</span>
          ítem{{ meta.total !== 1 ? 's' : '' }} en stock
        </p>
      </div>
      <div class="flex items-center gap-2">
        <!-- Categorías (solo quien puede editar) -->
        <button v-if="canDo('indumentaria','editar')"
          class="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2.5 rounded-xl border transition-all"
          :class="showCatPanel
            ? 'bg-slate-900 dark:bg-white/10 text-white border-transparent'
            : 'bg-white dark:bg-[#1a1a2e] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'"
          @click="showCatPanel = !showCatPanel"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z"/>
          </svg>
          Categorías
        </button>
        <template v-if="canDo('indumentaria','crear')">
          <button
            class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 px-3.5 py-2.5 rounded-xl transition-all"
            @click="showImport = true"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/>
            </svg>
            Importar Excel
          </button>
          <button
            class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-glow active:scale-[0.98]"
            @click="abrirCrear">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Nuevo ítem
          </button>
        </template>
      </div>
    </div>

    <!-- Panel de categorías -->
    <div v-if="showCatPanel && canDo('indumentaria','editar')" class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none overflow-hidden">
      <div class="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Categorías</h3>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Personalizá las categorías para tus productos.</p>
        </div>
        <button
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
          @click="abrirCrearCat"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Nueva
        </button>
      </div>
      <div v-if="loadingCat" class="flex justify-center py-6">
        <svg class="w-5 h-5 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
      </div>
      <div v-else class="flex flex-wrap gap-2 p-4">
        <div v-for="cat in categorias" :key="cat.id"
          class="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all group"
          :class="cat.activo ? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5' : 'border-dashed border-slate-200 dark:border-white/10 opacity-50'">
          <span class="font-medium text-slate-800 dark:text-slate-200">{{ cat.nombre }}</span>
          <div class="flex items-center gap-1 ml-1">
            <button class="p-0.5 rounded text-slate-400 dark:text-slate-500 hover:text-primary-500 transition-colors" title="Renombrar" @click="abrirEditarCat(cat)">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z"/></svg>
            </button>
            <button class="p-0.5 rounded transition-colors" :class="cat.activo ? 'text-slate-400 dark:text-slate-500 hover:text-amber-500' : 'text-emerald-500 hover:text-emerald-600'" :title="cat.activo ? 'Desactivar' : 'Activar'" @click="toggleCat(cat)">
              <svg v-if="cat.activo" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
              <svg v-else class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
            </button>
            <button v-if="!cat.activo" class="p-0.5 rounded text-red-400 hover:text-red-600 transition-colors" title="Eliminar" @click="eliminarCat(cat)">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
            </button>
          </div>
        </div>
        <div v-if="!categorias.length" class="text-sm text-slate-400 dark:text-slate-500 italic py-1">Sin categorías aún.</div>
      </div>
    </div>

    <!-- Buscador + filtros -->
    <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/5 shadow-card dark:shadow-none p-4 space-y-3">
      <div class="relative">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
        </svg>
        <input v-model="search" type="text" placeholder="Buscar por nombre, marca, descripción..."
          class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          @input="onSearchInput"/>
        <button v-if="search" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" @click="search=''; applyFilters()">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="flex gap-3 items-center flex-wrap">
        <AppSelect v-model="filters.categoria" :options="categoriasFilterOptions" @change="applyFilters"/>
        <AppSelect v-model="filters.talla" :options="tallaFilterOptions" @change="applyFilters"/>
        <!-- Toggle vista -->
        <div class="ml-auto flex items-center bg-slate-100 dark:bg-white/5 rounded-xl p-1 gap-0.5">
          <button class="p-1.5 rounded-lg transition-all" :class="viewMode==='grid' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'" @click="viewMode='grid'" title="Cards">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg>
          </button>
          <button class="p-1.5 rounded-lg transition-all" :class="viewMode==='list' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'" @click="viewMode='list'" title="Lista">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></svg>
          </button>
        </div>
        <button v-if="search || filters.categoria || filters.talla"
          class="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          @click="clearFilters">Limpiar</button>
      </div>
    </div>

    <div v-if="error" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{{ error }}</div>
    <div v-if="loading" class="flex justify-center py-16">
      <svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
    </div>

    <div v-else-if="!items.length" class="text-center py-20 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none">
      <svg class="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z"/>
      </svg>
      <p class="font-medium text-slate-500 dark:text-slate-400">Sin ítems de indumentaria</p>
      <p class="text-sm mt-1 text-slate-400">Ajustá los filtros o agregá uno nuevo.</p>
    </div>

    <!-- Vista GRID (cards) -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <div v-for="item in items" :key="item.id"
        class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-card dark:shadow-none hover:shadow-card-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col cursor-pointer"
        @click="abrirDetalle(item)">
        <!-- Foto -->
        <div class="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/3 relative overflow-hidden">
          <img v-if="firstFoto(item)" :src="firstFoto(item)" :alt="item.nombre" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
          <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2">
            <svg class="w-10 h-10 text-slate-300 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"/>
            </svg>
            <span class="text-xs text-slate-300 dark:text-white/20 font-medium">Sin foto</span>
          </div>
          <!-- Badge stock -->
          <div class="absolute top-2 right-2">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
              :class="item.cantidad === 0 ? 'bg-red-100 text-red-600' : item.cantidad <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'">
              {{ item.cantidad }} ud.
            </span>
          </div>
        </div>
        <!-- Info -->
        <div class="p-3 flex flex-col flex-1">
          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md self-start mb-1.5" :class="getCatColor(item.categoria)">{{ item.categoria }}</span>
          <p class="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2">{{ item.nombre }}</p>
          <div class="flex gap-1.5 mt-1.5 flex-wrap">
            <span v-if="item.talla" class="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded font-mono">{{ item.talla }}</span>
            <span v-if="item.color" class="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">{{ item.color }}</span>
            <span v-if="item.marca" class="text-[10px] text-slate-400 dark:text-slate-500">{{ item.marca }}</span>
          </div>
          <div class="mt-auto pt-2.5 flex items-center justify-between">
            <p class="text-sm font-bold text-slate-900 dark:text-white font-mono">{{ currency(item.precioVenta) }}</p>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <!-- Vender rápido -->
              <button v-if="item.cantidad > 0" class="p-1 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors" title="Vender" @click.stop="abrirVenta(item)">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/></svg>
              </button>
              <button v-if="canDo('indumentaria','editar')" class="p-1 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors" @click.stop="abrirEditar(item)">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/></svg>
              </button>
              <button v-if="canDo('indumentaria','eliminar')" class="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" @click.stop="itemAEliminar = item">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista LISTA -->
    <div v-else class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-card dark:shadow-none overflow-hidden">
      <div v-for="item in items" :key="item.id"
        class="flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-white/3 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
        @click="abrirDetalle(item)">
        <!-- Miniatura -->
        <div class="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-white/5 shrink-0">
          <img v-if="firstFoto(item)" :src="firstFoto(item)" :alt="item.nombre" class="w-full h-full object-cover"/>
          <div v-else class="w-full h-full flex items-center justify-center">
            <svg class="w-5 h-5 text-slate-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223"/></svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md" :class="getCatColor(item.categoria)">{{ item.categoria }}</span>
            <span v-if="item.talla" class="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md font-mono">{{ item.talla }}</span>
            <span v-if="item.color" class="text-[10px] text-slate-400 dark:text-slate-500">· {{ item.color }}</span>
          </div>
          <p class="font-semibold text-slate-900 dark:text-white text-sm">{{ item.nombre }}</p>
          <p v-if="item.marca" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ item.marca }}</p>
        </div>
        <div class="text-center shrink-0 w-14">
          <p class="text-xl font-bold font-mono" :class="item.cantidad === 0 ? 'text-red-500' : item.cantidad <= 3 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'">{{ item.cantidad }}</p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500">unid.</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-base font-bold text-slate-900 dark:text-white font-mono">{{ currency(item.precioVenta) }}</p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500">precio venta</p>
        </div>
        <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button v-if="canDo('indumentaria','editar')" class="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors" @click.stop="abrirEditar(item)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/></svg>
          </button>
          <button v-if="canDo('indumentaria','eliminar')" class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" @click.stop="itemAEliminar = item">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
          </button>
        </div>
      </div>
    </div>

    <AppPagination v-if="!loading" :page="meta.page" :total="meta.total" :page-size="meta.pageSize" @update:page="changePage"/>

    <!-- ── Modal DETALLE estilo Marketplace ─────────────────────────────────── -->
    <AppModal v-model="showDetail" title="" size="xl">
      <div v-if="detailItem" class="flex gap-0 -mx-6 -mt-5 min-h-[420px]">

        <!-- Columna izquierda: galería -->
        <div class="w-[55%] bg-slate-950 rounded-bl-2xl relative overflow-hidden flex-shrink-0 flex flex-col">
          <!-- Foto principal -->
          <div class="flex-1 flex items-center justify-center relative min-h-[300px]">
            <img v-if="detailFotos()[detailFoto]" :src="detailFotos()[detailFoto]" :alt="detailItem.nombre"
              class="w-full h-full object-contain max-h-[380px]"/>
            <div v-else class="flex flex-col items-center gap-3 text-white/20">
              <svg class="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="0.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"/>
              </svg>
              <p class="text-sm">Sin fotos</p>
            </div>

            <!-- Flechas de navegación -->
            <template v-if="detailFotos().length > 1">
              <button
                class="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                @click.stop="prevFoto">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
              </button>
              <button
                class="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                @click.stop="nextFoto">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
              </button>
            </template>
          </div>

          <!-- Tiras de miniaturas -->
          <div v-if="detailFotos().length > 1" class="flex gap-2 p-3 justify-center bg-black/30">
            <button v-for="(url, i) in detailFotos()" :key="i"
              class="w-10 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0"
              :class="i === detailFoto ? 'border-primary-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-75'"
              @click.stop="detailFoto = i">
              <img :src="url" class="w-full h-full object-cover"/>
            </button>
          </div>
        </div>

        <!-- Columna derecha: info -->
        <div class="flex-1 flex flex-col p-6 overflow-y-auto">
          <!-- Precio -->
          <div class="mb-4">
            <p class="text-3xl font-bold text-slate-900 dark:text-white font-mono">{{ currency(detailItem.precioVenta) }}</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Precio de venta · Costo: {{ currency(detailItem.precioCosto) }}</p>
          </div>

          <!-- Nombre + categoría -->
          <h2 class="text-lg font-bold text-slate-900 dark:text-white leading-snug mb-2">{{ detailItem.nombre }}</h2>
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full" :class="getCatColor(detailItem.categoria)">{{ detailItem.categoria }}</span>
            <span v-if="detailItem.talla" class="text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full">Talla {{ detailItem.talla }}</span>
            <span v-if="detailItem.color" class="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full">{{ detailItem.color }}</span>
            <span v-if="detailItem.marca" class="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full">{{ detailItem.marca }}</span>
          </div>

          <!-- Stock -->
          <div class="flex items-center gap-3 p-3 rounded-xl mb-4"
            :class="detailItem.cantidad === 0
              ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20'
              : detailItem.cantidad <= 3
                ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20'
                : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20'">
            <span class="text-3xl font-bold font-mono"
              :class="detailItem.cantidad === 0 ? 'text-red-500' : detailItem.cantidad <= 3 ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'">
              {{ detailItem.cantidad }}
            </span>
            <div>
              <p class="text-sm font-semibold"
                :class="detailItem.cantidad === 0 ? 'text-red-700 dark:text-red-400' : detailItem.cantidad <= 3 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'">
                {{ detailItem.cantidad === 0 ? 'Sin stock' : detailItem.cantidad <= 3 ? 'Stock bajo' : 'En stock' }}
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ detailItem.cantidad }} unidad{{ detailItem.cantidad !== 1 ? 'es' : '' }} disponible{{ detailItem.cantidad !== 1 ? 's' : '' }}</p>
            </div>
          </div>

          <!-- Descripción -->
          <div v-if="detailItem.descripcion" class="mb-4">
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Descripción</p>
            <p class="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{{ detailItem.descripcion }}</p>
          </div>

          <!-- Spacer -->
          <div class="flex-1"/>

          <!-- Acciones -->
          <div class="flex gap-2 pt-4 border-t border-slate-200 dark:border-white/10">
            <!-- Vender (principal) -->
            <button
              class="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-glow active:scale-[0.98] disabled:opacity-50"
              :disabled="detailItem?.cantidad === 0"
              @click="abrirVenta(detailItem); showDetail = false">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>
              </svg>
              {{ detailItem?.cantidad === 0 ? 'Sin stock' : 'Vender' }}
            </button>
            <button v-if="canDo('indumentaria','editar')"
              class="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 border border-primary-200 dark:border-primary-500/20 px-4 py-2.5 rounded-xl transition-all"
              @click="editarDesdeDetalle">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/></svg>
              Editar
            </button>
            <button v-if="canDo('indumentaria','eliminar')"
              class="inline-flex items-center justify-center gap-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-2.5 rounded-xl transition-all"
              @click="eliminarDesdeDetalle">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
            </button>
          </div>
        </div>
      </div>
      <template #footer="{}"><span/></template>
    </AppModal>

    <!-- ── Modal CREAR / EDITAR — layout Marketplace ────────────────────────── -->
    <AppModal v-model="showModal" title="" size="xl">
      <div class="flex gap-0 -mx-6 -mt-5 min-h-[480px]">

        <!-- Columna izquierda: galería editable + drop zone -->
        <div class="w-[45%] bg-slate-950 rounded-bl-2xl flex-shrink-0 flex flex-col overflow-hidden relative"
          @dragover="onFileDropZoneDragOver"
          @dragleave="onFileDropZoneDragLeave"
          @drop="onFileDropZoneDrop">

          <!-- Overlay cuando se arrastra un archivo desde fuera -->
          <div v-if="isDroppingFile"
            class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-primary-500/20 border-4 border-dashed border-primary-400 rounded-bl-2xl pointer-events-none">
            <svg class="w-12 h-12 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/>
            </svg>
            <p class="text-primary-300 font-semibold text-sm">Soltá para agregar la foto</p>
          </div>

          <!-- Preview foto activa -->
          <div class="flex-1 relative flex items-center justify-center min-h-[260px]">
            <img
              v-if="formFotos().length"
              :src="formFotos()[formFotoIdx]"
              :key="formFotoIdx"
              class="w-full h-full object-contain max-h-[340px] transition-opacity duration-150"
            />
            <div v-else class="flex flex-col items-center gap-3 text-white/20 select-none">
              <svg class="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="0.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
              </svg>
              <p class="text-sm">Sin fotos aún</p>
              <p class="text-xs text-white/10">Subí fotos desde abajo</p>
            </div>

            <!-- Flechas (solo si hay más de 1 foto) -->
            <template v-if="formFotos().length > 1">
              <button type="button"
                class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                @click.stop="formPrevFoto">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
              </button>
              <button type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                @click.stop="formNextFoto">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
              </button>
              <!-- Contador -->
              <div class="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-mono px-2 py-0.5 rounded-full backdrop-blur-sm">
                {{ formFotoIdx + 1 }} / {{ formFotos().length }}
              </div>
            </template>
          </div>

          <!-- Strip de fotos + agregar -->
          <div class="p-3 bg-black/40 flex gap-2 flex-wrap items-center">
            <div
              v-for="(url, i) in formFotos()" :key="url"
              draggable="true"
              class="relative group w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
              :class="[
                i === formFotoIdx ? 'border-primary-400 ring-1 ring-primary-400/50' : 'border-white/20 hover:border-white/50',
                dragSrcIdx === i  ? 'opacity-40 scale-95' : '',
                dragOverIdx === i && dragSrcIdx !== i ? 'border-primary-300 scale-105 ring-2 ring-primary-400/40' : '',
              ]"
              @click.stop="formFotoIdx = i"
              @dragstart="onDragStart(i)"
              @dragover="onDragOver($event, i)"
              @dragleave="onDragLeave"
              @drop="onDrop($event, i)"
              @dragend="onDragEnd">
              <img :src="url" class="w-full h-full object-cover pointer-events-none"/>
              <!-- Ícono drag (hint visual) -->
              <div class="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-70 transition-opacity">
                <svg class="w-3 h-3 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM16 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM16 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                </svg>
              </div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <button type="button"
                  class="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow"
                  @click.stop="removeFoto(url)">×</button>
              </div>
            </div>

            <!-- Botón agregar foto -->
            <label class="w-14 h-14 rounded-lg border-2 border-dashed border-white/20 hover:border-primary-400 transition-colors flex flex-col items-center justify-center cursor-pointer gap-0.5 flex-shrink-0">
              <svg v-if="!uploadingFoto" class="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
              <svg v-else class="w-5 h-5 animate-spin text-primary-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              <span class="text-[9px] text-white/30">Foto</span>
              <input type="file" accept="image/*" class="sr-only" :disabled="uploadingFoto" @change="handleFotoUpload"/>
            </label>
          </div>

          <!-- Título sobre el fondo oscuro -->
          <div class="px-4 py-3 bg-black/50">
            <p class="text-xs font-semibold text-white/50 uppercase tracking-wider">
              {{ editandoInd ? 'Editando producto' : 'Nuevo producto' }}
            </p>
            <p class="text-white/80 text-sm font-medium truncate mt-0.5">{{ formInd.nombre || 'Sin nombre aún...' }}</p>
          </div>
        </div>

        <!-- Columna derecha: formulario -->
        <div class="flex-1 flex flex-col overflow-y-auto">
          <div class="flex-1 p-6 space-y-4">

            <p v-if="modalError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">{{ modalError }}</p>

            <!-- Nombre -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nombre *</label>
              <input v-model="formInd.nombre" type="text" placeholder="Ej: Campera Ford Racing Talle M" :class="inputCls"/>
            </div>

            <!-- Categoría + Talla -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Categoría</label>
                <AppSelect v-model="formInd.categoria" :options="categoriasOptions"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Talla</label>
                <AppSelect v-model="formInd.talla" :options="tallaFormOptions"/>
              </div>
            </div>

            <!-- Marca + Color -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Marca</label>
                <input v-model="formInd.marca" type="text" placeholder="Ford, Adidas..." :class="inputCls"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Color</label>
                <input v-model="formInd.color" type="text" placeholder="Negro, Rojo..." :class="inputCls"/>
              </div>
            </div>

            <!-- Stock -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Stock</label>
              <input v-model.number="formInd.cantidad" type="number" min="0" :class="inputCls"/>
            </div>

            <!-- Precios en card visual -->
            <div class="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <div class="bg-slate-50 dark:bg-white/[0.03] px-4 py-2.5 border-b border-slate-200 dark:border-white/10">
                <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Precios</p>
              </div>
              <div class="grid grid-cols-2 divide-x divide-slate-200 dark:divide-white/10">
                <div class="p-4">
                  <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Costo *</p>
                  <div class="relative">
                    <span class="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-medium">$</span>
                    <input v-model.number="formInd.precioCosto" type="number" min="0" step="0.01" placeholder="0.00"
                      class="w-full pl-4 bg-transparent text-slate-900 dark:text-white text-lg font-bold font-mono border-0 border-b border-slate-200 dark:border-white/10 focus:outline-none focus:border-primary-500 pb-1"/>
                  </div>
                </div>
                <div class="p-4">
                  <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Venta *</p>
                  <div class="relative">
                    <span class="absolute left-0 top-1/2 -translate-y-1/2 text-primary-500 text-sm font-medium">$</span>
                    <input v-model.number="formInd.precioVenta" type="number" min="0" step="0.01" placeholder="0.00"
                      class="w-full pl-4 bg-transparent text-primary-600 dark:text-primary-400 text-lg font-bold font-mono border-0 border-b border-slate-200 dark:border-white/10 focus:outline-none focus:border-primary-500 pb-1"/>
                  </div>
                </div>
              </div>
            </div>

            <!-- Descripción -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
              <textarea v-model="formInd.descripcion" rows="3" placeholder="Materiales, detalles, características..." :class="inputCls + ' resize-none'"/>
            </div>
          </div>

          <!-- Footer pegado abajo -->
          <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] rounded-br-2xl">
            <button
              class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              @click="showModal = false">
              Cancelar
            </button>
            <button
              class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow active:scale-[0.98]"
              :disabled="savingInd" @click="guardarInd">
              {{ savingInd ? 'Guardando...' : editandoInd ? 'Guardar cambios' : 'Agregar producto' }}
            </button>
          </div>
        </div>
      </div>
      <template #footer="{}"><span/></template>
    </AppModal>

    <!-- Modal confirmar eliminar -->
    <AppModal v-model="showEliminarInd" title="Desactivar ítem" size="sm">
      <p class="text-sm text-slate-700 dark:text-slate-300">
        ¿Desactivar <strong class="text-slate-900 dark:text-white">{{ itemAEliminar?.nombre }}</strong> del stock?
      </p>
      <template #footer>
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="showEliminarInd = false">Cancelar</button>
        <button class="text-sm bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-colors" :disabled="eliminandoInd" @click="confirmarEliminar">
          {{ eliminandoInd ? 'Desactivando...' : 'Desactivar' }}
        </button>
      </template>
    </AppModal>

    <!-- Modal categoría -->
    <AppModal v-model="showCatModal" :title="editandoCat ? 'Renombrar categoría' : 'Nueva categoría'" size="sm">
      <div class="space-y-3">
        <p v-if="catError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2">{{ catError }}</p>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre *</label>
          <input v-model="catNombre" type="text" placeholder="Ej: Electrónica, Perfumería..." :class="inputCls" @keyup.enter="guardarCat"/>
        </div>
      </div>
      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow" :disabled="catSaving" @click="guardarCat">
          {{ catSaving ? 'Guardando...' : editandoCat ? 'Renombrar' : 'Crear' }}
        </button>
      </template>
    </AppModal>

    <AppImportModal v-model="showImport" type="indumentaria" @done="applyFilters" />

    <!-- ── Modal VENTA ───────────────────────────────────────────────────────── -->
    <AppModal v-model="showVentaModal" title="Registrar venta" size="sm">
      <div v-if="ventaItem" class="space-y-4">
        <p v-if="ventaError" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-2.5">{{ ventaError }}</p>

        <!-- Producto -->
        <div class="flex items-center gap-3 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3 border border-slate-200 dark:border-white/10">
          <div class="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-white/10 shrink-0">
            <img v-if="firstFoto(ventaItem)" :src="firstFoto(ventaItem)" class="w-full h-full object-cover"/>
            <div v-else class="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-lg font-bold">
              {{ ventaItem.nombre.charAt(0) }}
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ ventaItem.nombre }}</p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" :class="getCatColor(ventaItem.categoria)">{{ ventaItem.categoria }}</span>
              <span v-if="ventaItem.talla" class="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{{ ventaItem.talla }}</span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500">Stock: {{ ventaItem.cantidad }} ud.</span>
            </div>
          </div>
          <p class="text-base font-bold text-slate-900 dark:text-white font-mono shrink-0">{{ currency(ventaItem.precioVenta) }}</p>
        </div>

        <!-- Cantidad -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cantidad a vender</label>
          <div class="flex items-center gap-3">
            <button type="button"
              class="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
              :disabled="ventaCantidad <= 1"
              @click="ventaCantidad = Math.max(1, ventaCantidad - 1)">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/></svg>
            </button>
            <input v-model.number="ventaCantidad" type="number" min="1" :max="ventaItem.cantidad"
              class="flex-1 text-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white text-lg font-bold py-2 focus:outline-none focus:border-primary-500"/>
            <button type="button"
              class="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
              :disabled="ventaCantidad >= ventaItem.cantidad"
              @click="ventaCantidad = Math.min(ventaItem.cantidad, ventaCantidad + 1)">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            </button>
          </div>
        </div>

        <!-- Total -->
        <div class="flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
          <span class="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Total a cobrar</span>
          <span class="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
            {{ currency(Number(ventaItem.precioVenta) * ventaCantidad) }}
          </span>
        </div>

        <!-- Info caja -->
        <div class="flex items-center gap-2 text-xs rounded-xl px-3 py-2.5"
          :class="sesionActiva ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9"/>
          </svg>
          <span v-if="sesionActiva">
            Caja abierta — se registrará como ingreso automáticamente.
          </span>
          <span v-else>
            Sin caja abierta — solo se descontará del stock sin registrar en caja.
          </span>
        </div>
      </div>

      <template #footer="{ close }">
        <button class="text-sm text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="close">Cancelar</button>
        <button
          class="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow"
          :disabled="ventaSaving" @click="confirmarVenta">
          {{ ventaSaving ? 'Registrando...' : 'Confirmar venta' }}
        </button>
      </template>
    </AppModal>

  </div>
</template>
