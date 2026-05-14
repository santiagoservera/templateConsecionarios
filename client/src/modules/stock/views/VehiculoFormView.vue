<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVehiculos } from '../composables/useVehiculos.js'

const route  = useRoute()
const router = useRouter()
const { vehiculo, loading, error, fetchVehiculo, createVehiculo, updateVehiculo } = useVehiculos()

const isEdit      = computed(() => !!route.params.id)
const submitLabel = computed(() => isEdit.value ? 'Guardar cambios' : 'Publicar')

const form = ref({
  tipo:'AUTO', marca:'', modelo:'', anio:new Date().getFullYear(),
  version:'', color:'', vinChasis:'', patente:'', km:0,
  combustible:'', transmision:'', tipoStock:'NUEVO',
  precioCosto:'', precioVenta:'', precioMinimo:'',
})
const serverError = ref('')

const COMBUSTIBLES  = ['Nafta','Diesel','GNC','Híbrido','Eléctrico']
const TRANSMISIONES = ['Manual','Automática','CVT','Secuencial']

// ── Fotos ─────────────────────────────────────────────────────────────────────
const fotosUrls      = ref([])
const fotoActiva     = ref(0)
const uploadingIdx   = ref(null)
const uploadError    = ref('')
const isDroppingFile = ref(false)

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const PRESET     = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

async function subirArchivo(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', PRESET)
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:'POST', body:fd })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Error al subir')
  return json.secure_url
}

async function onFileChange(fileOrEvent) {
  uploadError.value = ''
  const isEvent = fileOrEvent?.target !== undefined
  const files   = isEvent
    ? Array.from(fileOrEvent.target.files).filter(f => f.type?.startsWith('image/'))
    : [fileOrEvent].filter(f => f?.type?.startsWith('image/'))

  for (const file of files) {
    const idx = fotosUrls.value.length
    fotosUrls.value.push(null)
    uploadingIdx.value = idx
    try {
      const url = await subirArchivo(file)
      if (url) { fotosUrls.value[idx] = url; fotoActiva.value = idx }
      else fotosUrls.value.splice(idx, 1)
    } catch (err) { uploadError.value = err.message; fotosUrls.value.splice(idx, 1) }
    finally { uploadingIdx.value = null }
  }
  if (isEvent) fileOrEvent.target.value = ''
}

function eliminarFoto(idx) {
  fotosUrls.value.splice(idx, 1)
  fotoActiva.value = Math.min(fotoActiva.value, Math.max(fotosUrls.value.length - 1, 0))
}

const dragSrcIdx  = ref(null)
const dragOverIdx = ref(null)
function onDragStart(i)    { dragSrcIdx.value = i }
function onDragOver(e, i)  { e.preventDefault(); e.stopPropagation(); dragOverIdx.value = i }
function onDragLeave()     { dragOverIdx.value = null }
function onDragEnd()       { dragSrcIdx.value = null; dragOverIdx.value = null }
function onDrop(e, i) {
  e.preventDefault(); e.stopPropagation()
  if (dragSrcIdx.value === null || dragSrcIdx.value === i) { dragOverIdx.value = null; return }
  const arr = [...fotosUrls.value]; const [m] = arr.splice(dragSrcIdx.value, 1); arr.splice(i, 0, m)
  fotosUrls.value = arr; fotoActiva.value = i
  dragSrcIdx.value = null; dragOverIdx.value = null
}
function onDropFile(e) {
  e.preventDefault(); isDroppingFile.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file?.type.startsWith('image/')) onFileChange(file)
}
function onDZOver(e)  { if (e.dataTransfer?.types?.includes('Files')) { e.preventDefault(); isDroppingFile.value = true } }
function onDZLeave(e) { if (!e.currentTarget.contains(e.relatedTarget)) isDroppingFile.value = false }

const fotosValidas = computed(() => fotosUrls.value.filter(Boolean))
function prevFoto() { fotoActiva.value = (fotoActiva.value - 1 + fotosValidas.value.length) % fotosValidas.value.length }
function nextFoto() { fotoActiva.value = (fotoActiva.value + 1) % fotosValidas.value.length }

onMounted(async () => {
  if (!isEdit.value) return
  await fetchVehiculo(route.params.id)
  if (vehiculo.value) {
    Object.keys(form.value).forEach(k => { if (vehiculo.value[k] != null) form.value[k] = vehiculo.value[k] })
    try { fotosUrls.value = JSON.parse(vehiculo.value.fotosJson ?? '[]') } catch { fotosUrls.value = [] }
  }
})

async function handleSubmit() {
  serverError.value = ''
  if (!form.value.marca || !form.value.modelo) { serverError.value = 'Marca y modelo son requeridos'; return }
  if (!form.value.precioCosto || !form.value.precioVenta) { serverError.value = 'Los precios son requeridos'; return }
  const payload = {
    tipo:form.value.tipo, marca:form.value.marca, modelo:form.value.modelo, anio:Number(form.value.anio),
    tipoStock:form.value.tipoStock, precioCosto:Number(form.value.precioCosto),
    precioVenta:Number(form.value.precioVenta), km:Number(form.value.km)||0,
    fotosJson:JSON.stringify(fotosUrls.value.filter(Boolean)),
  }
  ;['version','color','vinChasis','patente','combustible','transmision'].forEach(k => { if (form.value[k]) payload[k] = form.value[k] })
  if (form.value.precioMinimo) payload.precioMinimo = Number(form.value.precioMinimo)
  try {
    if (isEdit.value) { await updateVehiculo(route.params.id, payload); router.replace(`/stock/${route.params.id}`) }
    else { const c = await createVehiculo(payload); router.replace(`/stock/${c.id}`) }
  } catch (err) { serverError.value = err.response?.data?.error ?? 'Error al guardar' }
}

// Navegación explícita — nunca usar router.back() porque puede regresar al form
function goBack() {
  router.replace(isEdit.value ? `/stock/${route.params.id}` : '/stock')
}

const inp = 'w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm px-3 py-2 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors'
</script>

<template>
  <!-- Overlay — tapa el contenido de la app sin navegar afuera -->
  <div class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

    <!-- Contenedor tipo modal, altura fija -->
    <div class="w-full max-w-5xl h-[88vh] bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-200 dark:border-white/10 shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <button class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0" @click="goBack()">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
          <div class="min-w-0">
            <p class="text-sm font-bold text-slate-900 dark:text-white truncate">
              {{ form.marca && form.modelo ? `${form.marca} ${form.modelo} ${form.anio}` : (isEdit ? 'Editar vehículo' : 'Nuevo vehículo') }}
            </p>
            <p class="text-[11px] text-slate-400 dark:text-slate-500">{{ isEdit ? 'Editando ficha' : 'Completá los datos para publicar' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" class="text-sm text-slate-600 dark:text-slate-300 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" @click="goBack()">
            Cancelar
          </button>
          <button
            class="text-sm bg-primary-500 hover:bg-primary-600 text-white px-4 py-1.5 rounded-xl font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-glow active:scale-[0.98]"
            :disabled="loading || uploadingIdx !== null"
            @click="handleSubmit">
            {{ loading ? 'Guardando...' : uploadingIdx !== null ? 'Subiendo...' : submitLabel }}
          </button>
        </div>
      </div>

      <!-- Cuerpo: dos columnas que nunca desbordan -->
      <div class="flex flex-1 min-h-0">

        <!-- ── Galería ── -->
        <div class="w-[42%] bg-slate-950 flex flex-col shrink-0 relative"
          @dragover="onDZOver" @dragleave="onDZLeave" @drop="onDropFile">

          <div v-if="isDroppingFile" class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-primary-500/20 border-4 border-dashed border-primary-400 pointer-events-none">
            <svg class="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/></svg>
            <p class="text-primary-300 font-semibold text-sm">Soltá para agregar</p>
          </div>

          <!-- Preview -->
          <div class="flex-1 relative flex items-center justify-center overflow-hidden">
            <img v-if="fotosValidas[fotoActiva]" :src="fotosValidas[fotoActiva]" :key="fotoActiva" class="w-full h-full object-contain"/>
            <div v-else class="flex flex-col items-center gap-3 text-white/15 select-none p-6 text-center">
              <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="0.7">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25"/>
              </svg>
              <p class="text-sm font-medium text-white/25">Sin fotos · Arrastrá acá o usá +</p>
            </div>
            <template v-if="fotosValidas.length > 1">
              <button type="button" class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors" @click="prevFoto">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
              </button>
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors" @click="nextFoto">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
              </button>
              <span class="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">{{ fotoActiva + 1 }}/{{ fotosValidas.length }}</span>
            </template>
          </div>

          <!-- Strip -->
          <div class="px-3 py-2 bg-black/40 flex gap-1.5 items-center overflow-x-auto shrink-0">
            <div v-for="(url, i) in fotosUrls" :key="i" draggable="true"
              class="relative group w-11 h-11 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-grab active:cursor-grabbing"
              :class="[
                url && i === fotoActiva ? 'border-primary-400' : 'border-white/20 hover:border-white/40',
                dragSrcIdx === i ? 'opacity-40 scale-90' : '',
                dragOverIdx === i && dragSrcIdx !== i ? 'border-primary-300 scale-110' : '',
              ]"
              @click="url && (fotoActiva = i)"
              @dragstart="onDragStart(i)" @dragover="onDragOver($event,i)"
              @dragleave="onDragLeave" @drop="onDrop($event,i)" @dragend="onDragEnd">
              <div v-if="!url" class="w-full h-full bg-slate-800 flex items-center justify-center">
                <svg class="w-4 h-4 animate-spin text-primary-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              </div>
              <img v-else :src="url" class="w-full h-full object-cover pointer-events-none"/>
              <span v-if="url && i === 0" class="absolute bottom-0 inset-x-0 text-center text-[8px] bg-primary-500/80 text-white font-semibold py-px">Principal</span>
              <button v-if="url" type="button" class="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" @click.stop="eliminarFoto(i)">×</button>
            </div>
            <label class="w-11 h-11 rounded-lg border-2 border-dashed border-white/20 hover:border-primary-400 transition-colors flex flex-col items-center justify-center cursor-pointer gap-0.5 flex-shrink-0">
              <svg class="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
              <span class="text-[8px] text-white/30">Foto</span>
              <input type="file" accept="image/*" multiple class="sr-only" @change="onFileChange"/>
            </label>
          </div>
          <div v-if="uploadError" class="px-3 py-1 bg-red-900/40 text-xs text-red-400 shrink-0">{{ uploadError }}</div>
        </div>

        <!-- ── Formulario scrolleable internamente ── -->
        <div class="flex-1 overflow-y-auto min-h-0">
          <div class="p-4 space-y-3">

            <div v-if="serverError || error" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-2 text-sm text-red-700 dark:text-red-400">{{ serverError || error }}</div>

            <!-- Tipo + Stock en fila -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/10 p-3">
                <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Tipo</p>
                <div class="grid grid-cols-2 gap-1.5">
                  <button v-for="opt in [{v:'AUTO',label:'Auto'},{v:'MOTO',label:'Moto'}]" :key="opt.v" type="button"
                    class="py-1.5 rounded-lg border text-xs font-semibold transition-all"
                    :class="form.tipo === opt.v ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-primary-300'"
                    @click="form.tipo = opt.v">{{ opt.label }}</button>
                </div>
              </div>
              <div class="bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/10 p-3">
                <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Stock</p>
                <div class="grid grid-cols-3 gap-1">
                  <button v-for="opt in [{v:'NUEVO',label:'Nuevo'},{v:'USADO',label:'Usado'},{v:'CONSIGNACION',label:'Consig.'}]"
                    :key="opt.v" type="button"
                    class="py-1.5 rounded-lg border text-[11px] font-semibold transition-all text-center"
                    :class="form.tipoStock === opt.v ? 'bg-slate-800 dark:bg-white/20 border-slate-800 dark:border-white/20 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300'"
                    @click="form.tipoStock = opt.v">{{ opt.label }}</button>
                </div>
              </div>
            </div>

            <!-- Identidad -->
            <div class="bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/10 p-3">
              <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">Identidad</p>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">Marca *</label>
                  <input v-model="form.marca" type="text" placeholder="Toyota, Ford..." :class="inp"/>
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">Modelo *</label>
                  <input v-model="form.modelo" type="text" placeholder="Corolla, Ranger..." :class="inp"/>
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">Versión</label>
                  <input v-model="form.version" type="text" placeholder="XEI CVT..." :class="inp"/>
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">Año *</label>
                  <input v-model="form.anio" type="number" min="1900" :max="new Date().getFullYear()+2" :class="inp"/>
                </div>
              </div>
            </div>

            <!-- Ficha técnica -->
            <div class="bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/10 p-3 space-y-2.5">
              <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ficha técnica</p>
              <div>
                <label class="block text-[10px] font-semibold text-slate-400 mb-1.5">Combustible</label>
                <div class="flex flex-wrap gap-1.5">
                  <button v-for="c in COMBUSTIBLES" :key="c" type="button"
                    class="text-[11px] px-2.5 py-1 rounded-full border transition-all font-medium"
                    :class="form.combustible === c ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-primary-300'"
                    @click="form.combustible = form.combustible === c ? '' : c">{{ c }}</button>
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-semibold text-slate-400 mb-1.5">Transmisión</label>
                <div class="flex flex-wrap gap-1.5">
                  <button v-for="t in TRANSMISIONES" :key="t" type="button"
                    class="text-[11px] px-2.5 py-1 rounded-full border transition-all font-medium"
                    :class="form.transmision === t ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-primary-300'"
                    @click="form.transmision = form.transmision === t ? '' : t">{{ t }}</button>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">Color</label>
                  <input v-model="form.color" type="text" placeholder="Blanco, Gris..." :class="inp"/>
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">Kilómetros</label>
                  <input v-model="form.km" type="number" min="0" placeholder="0" :class="inp"/>
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">Patente</label>
                  <input v-model="form.patente" type="text" placeholder="AB123CD" :class="inp + ' font-mono uppercase'"/>
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">VIN / Chasis</label>
                  <input v-model="form.vinChasis" type="text" placeholder="Opcional" :class="inp + ' font-mono'"/>
                </div>
              </div>
            </div>

            <!-- Precios -->
            <div class="bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pt-2.5 pb-2">Precios</p>
              <div class="grid grid-cols-3 divide-x divide-slate-200 dark:divide-white/5 border-t border-slate-200 dark:border-white/10">
                <div class="p-3">
                  <p class="text-[10px] text-slate-400 mb-1">Costo *</p>
                  <div class="relative">
                    <span class="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                    <input v-model="form.precioCosto" type="number" min="0" step="any" placeholder="0"
                      class="w-full pl-4 bg-transparent text-slate-900 dark:text-white text-sm font-bold font-mono border-0 border-b border-slate-200 dark:border-white/10 focus:outline-none focus:border-primary-500 pb-0.5"/>
                  </div>
                </div>
                <div class="p-3">
                  <p class="text-[10px] text-slate-400 mb-1">Venta *</p>
                  <div class="relative">
                    <span class="absolute left-0 top-1/2 -translate-y-1/2 text-primary-500 text-xs">$</span>
                    <input v-model="form.precioVenta" type="number" min="0" step="any" placeholder="0"
                      class="w-full pl-4 bg-transparent text-primary-600 dark:text-primary-400 text-sm font-bold font-mono border-0 border-b border-slate-200 dark:border-white/10 focus:outline-none focus:border-primary-500 pb-0.5"/>
                  </div>
                </div>
                <div class="p-3">
                  <p class="text-[10px] text-slate-400 mb-1">Mínimo</p>
                  <div class="relative">
                    <span class="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 text-xs">$</span>
                    <input v-model="form.precioMinimo" type="number" min="0" step="any" placeholder="Opcional"
                      class="w-full pl-4 bg-transparent text-slate-500 dark:text-slate-400 text-sm font-bold font-mono border-0 border-b border-slate-200 dark:border-white/10 focus:outline-none focus:border-primary-500 pb-0.5"/>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>
