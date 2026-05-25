<script setup>
import { ref, onMounted } from 'vue'
import { useConfiguracion } from '../composables/useConfiguracion.js'
import { useToast } from '../../../shared/composables/useToast.js'
import { datetime } from '../../../shared/utils/format.js'
import AppSelect from '../../../shared/components/AppSelect.vue'

const toast = useToast()
const { config, loading, error, fetchConfig, updateConfig } = useConfiguracion()

const form   = ref({ nombreConcesionaria: '', comisionPctDefault: 2, moneda: 'ARS', direccion: '', telefono: '', email: '', afipCuit: '', afipPuntoVenta: 1, afipCondicionIva: 'RESPONSABLE_INSCRIPTO', afipIvaAlicuota: 21 })
const saving = ref(false)

onMounted(async () => {
  await fetchConfig()
  if (config.value) {
    form.value = {
      nombreConcesionaria: config.value.nombreConcesionaria ?? '',
      comisionPctDefault:  Number(config.value.comisionPctDefault) ?? 2,
      moneda:              config.value.moneda ?? 'ARS',
      direccion:           config.value.direccion ?? '',
      telefono:            config.value.telefono  ?? '',
      email:               config.value.email     ?? '',
      afipCuit:            config.value.afipCuit  ?? '',
      afipPuntoVenta:      Number(config.value.afipPuntoVenta) ?? 1,
      afipCondicionIva:    config.value.afipCondicionIva ?? 'RESPONSABLE_INSCRIPTO',
      afipIvaAlicuota:     Number(config.value.afipIvaAlicuota) ?? 21,
    }
  }
})

async function guardar() {
  saving.value = true
  try {
    await updateConfig({
      nombreConcesionaria: form.value.nombreConcesionaria,
      comisionPctDefault:  Number(form.value.comisionPctDefault),
      moneda:              form.value.moneda,
      direccion:           form.value.direccion || null,
      telefono:            form.value.telefono  || null,
      email:               form.value.email     || null,
      afipCuit:            form.value.afipCuit  || null,
      afipPuntoVenta:      Number(form.value.afipPuntoVenta),
      afipCondicionIva:    form.value.afipCondicionIva,
      afipIvaAlicuota:     Number(form.value.afipIvaAlicuota),
    })
    toast.success('Configuración guardada', 'Los cambios se aplicaron correctamente')
  } catch (err) {
    toast.error('Error', err.response?.data?.error ?? 'No se pudo guardar')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-6 animate-fade-in max-w-3xl mx-auto">

    <!-- Encabezado -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Configuración</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Parámetros globales del concesionario</p>
      </div>
      <p v-if="config?.updatedAt" class="text-xs text-slate-400 dark:text-slate-500 shrink-0">
        Última edición {{ datetime(config.updatedAt) }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <svg class="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>

    <template v-else>

      <!-- ── Sección: Identidad del concesionario ── -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <!-- Header de sección -->
        <div class="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-white/10">
          <div class="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-white">Identidad del concesionario</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">Nombre y datos de contacto</p>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <!-- Nombre -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre *</label>
            <input v-model="form.nombreConcesionaria" type="text" placeholder="Ej: Concesionario Norte S.A."
              class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm px-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Teléfono -->
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Teléfono</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <svg class="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/>
                  </svg>
                </div>
                <input v-model="form.telefono" type="text" placeholder="+54 11 1234-5678"
                  class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm pl-10 pr-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors" />
              </div>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <svg class="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/>
                  </svg>
                </div>
                <input v-model="form.email" type="email" placeholder="contacto@concesionario.com"
                  class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm pl-10 pr-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors" />
              </div>
            </div>
          </div>

          <!-- Dirección -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Dirección</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/>
                </svg>
              </div>
              <input v-model="form.direccion" type="text" placeholder="Av. Principal 1234, Buenos Aires"
                class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm pl-10 pr-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Sección: Parámetros de negocio ── -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div class="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-white/10">
          <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-white">Parámetros de negocio</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">Reglas financieras aplicadas al sistema</p>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <!-- Comisión -->
            <div class="bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/10 p-4">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Comisión por defecto</p>
                  <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Se usa cuando el vendedor no tiene % propio</p>
                </div>
                <span class="text-2xl font-bold text-primary-500 leading-none">{{ form.comisionPctDefault }}%</span>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model="form.comisionPctDefault"
                  type="range" min="0" max="20" step="0.5"
                  class="flex-1 h-1.5 rounded-full accent-primary-500 cursor-pointer"
                />
              </div>
              <div class="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-0.5">
                <span>0%</span><span>5%</span><span>10%</span><span>15%</span><span>20%</span>
              </div>
            </div>

            <!-- Moneda -->
            <div class="bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/10 p-4">
              <p class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-0.5">Moneda</p>
              <p class="text-xs text-slate-400 dark:text-slate-500 mb-3">Código ISO (3 caracteres)</p>
              <input v-model="form.moneda" type="text" maxlength="3" placeholder="ARS"
                class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm px-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors uppercase font-mono tracking-widest" />
              <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-2">Ej: ARS, USD, EUR</p>
            </div>

          </div>
        </div>
      </div>

      <!-- ── Sección: AFIP / Facturación ── -->
      <div class="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div class="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-white/10">
          <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-white">AFIP / Facturación electrónica</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">Datos del emisor para emitir comprobantes electrónicos</p>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <!-- Modo actual -->
          <div class="flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10">
            <svg class="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
            </svg>
            <div class="text-xs text-amber-700 dark:text-amber-400">
              <strong>Modo actual:</strong> configurado por variable de entorno <code class="bg-amber-100 dark:bg-amber-500/20 px-1 py-0.5 rounded font-mono">AFIP_MODE</code> en el servidor.
              Para pasar a sandbox/producción, colocá los certificados en <code class="font-mono bg-amber-100 dark:bg-amber-500/20 px-1 rounded">server/certs/</code> y cambiá <code class="font-mono bg-amber-100 dark:bg-amber-500/20 px-1 rounded">AFIP_MODE=sandbox</code>.
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">CUIT del emisor</label>
              <input v-model="form.afipCuit" type="text" placeholder="20-12345678-9"
                class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm px-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 font-mono" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Punto de venta</label>
              <input v-model="form.afipPuntoVenta" type="number" min="1" max="9999"
                class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 font-mono" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Condición IVA del emisor</label>
              <AppSelect v-model="form.afipCondicionIva" :options="[
                { value: 'RESPONSABLE_INSCRIPTO', label: 'Responsable Inscripto — emite A o B' },
                { value: 'MONOTRIBUTO',           label: 'Monotributista — emite C' },
              ]" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Alícuota IVA (%)</label>
              <input v-model="form.afipIvaAlicuota" type="number" min="0" max="27" step="0.5"
                class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Estándar para vehículos: 21%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Botón guardar -->
      <div class="flex justify-end">
        <button
          class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-glow active:scale-[0.98] disabled:opacity-60"
          :disabled="saving"
          @click="guardar"
        >
          <svg v-if="!saving" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>

    </template>
  </div>
</template>
