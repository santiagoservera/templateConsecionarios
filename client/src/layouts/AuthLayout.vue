<script setup>
import { ref } from 'vue'

const isDark = ref(document.documentElement.classList.contains('dark'))

function toggleDark() {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('motoros-theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('motoros-theme', 'light')
  }
}
</script>

<template>
  <div class="min-h-screen flex transition-colors duration-300 bg-white dark:bg-[#0d0d14]">

    <!-- ── Panel izquierdo — brand animated ──────────────────────────────── -->
    <div class="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col bg-[#0F172A] relative overflow-hidden">

      <!-- Glow de fondo -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 left-0 w-80 h-80 bg-primary-500 rounded-full -translate-x-40 -translate-y-40 opacity-10 blur-3xl" />
        <div class="absolute bottom-0 right-0 w-64 h-64 bg-primary-600 rounded-full translate-x-32 translate-y-32 opacity-10 blur-3xl" />
      </div>

      <div class="relative z-10 flex flex-col h-full p-10">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-glow shrink-0">
            <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 12 8 8"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 12a5 5 0 0 1 5-5"/>
            </svg>
          </div>
          <div>
            <span class="text-xl font-bold text-white tracking-tight">MotorOS</span>
            <span class="block text-[10px] text-slate-500 font-medium tracking-widest uppercase">Concesionarias</span>
          </div>
        </div>

        <!-- Ilustración SVG animada -->
        <div class="flex-1 flex flex-col justify-center">
          <div class="mb-8">
            <!-- SVG animado: auto con líneas de velocidad -->
            <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" class="w-full max-w-xs mx-auto">

              <!-- Carretera -->
              <rect x="0" y="155" width="340" height="45" rx="4" fill="#1e293b"/>
              <rect x="0" y="155" width="340" height="2" fill="#334155"/>

              <!-- Líneas de carretera punteadas animadas -->
              <line class="speed-line-1" x1="40"  y1="178" x2="80"  y2="178" stroke="#f97316" stroke-width="2" stroke-dasharray="15 8" opacity="0.4"/>
              <line class="speed-line-2" x1="120" y1="178" x2="160" y2="178" stroke="#f97316" stroke-width="2" stroke-dasharray="15 8" opacity="0.4"/>
              <line class="speed-line-3" x1="200" y1="178" x2="240" y2="178" stroke="#f97316" stroke-width="2" stroke-dasharray="15 8" opacity="0.4"/>
              <line class="speed-line-4" x1="270" y1="178" x2="310" y2="178" stroke="#f97316" stroke-width="2" stroke-dasharray="15 8" opacity="0.4"/>

              <!-- Líneas de velocidad (stream) -->
              <line class="speed-line-1" x1="10"  y1="115" x2="65"  y2="115" stroke="#94a3b8" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/>
              <line class="speed-line-2" x1="10"  y1="125" x2="50"  y2="125" stroke="#94a3b8" stroke-width="1"   opacity="0.4" stroke-linecap="round"/>
              <line class="speed-line-3" x1="10"  y1="108" x2="45"  y2="108" stroke="#94a3b8" stroke-width="1"   opacity="0.3" stroke-linecap="round"/>
              <line class="speed-line-4" x1="10"  y1="135" x2="55"  y2="135" stroke="#94a3b8" stroke-width="1"   opacity="0.3" stroke-linecap="round"/>
              <line class="speed-line-5" x1="10"  y1="100" x2="40"  y2="100" stroke="#94a3b8" stroke-width="0.8" opacity="0.2" stroke-linecap="round"/>

              <!-- Glow del auto -->
              <ellipse class="glow-car" cx="156" cy="152" rx="80" ry="8" fill="#f97316" opacity="0.3"/>

              <!-- Grupo del auto (bouncing) -->
              <g class="car-group">
                <!-- Sombra del auto -->
                <ellipse cx="156" cy="150" rx="72" ry="6" fill="#000" opacity="0.25"/>

                <!-- Carrocería baja -->
                <rect x="72" y="120" width="168" height="28" rx="6" fill="#1e40af"/>
                <!-- Carrocería alta (cabina) -->
                <path d="M100 120 L118 94 L196 94 L214 120 Z" fill="#2563eb"/>
                <!-- Parabrisas -->
                <path d="M122 118 L136 98 L190 98 L204 118 Z" fill="#93c5fd" opacity="0.7"/>
                <!-- Ventana lateral trasera -->
                <path d="M104 118 L116 100 L136 100 L122 118 Z" fill="#60a5fa" opacity="0.5"/>

                <!-- Faros delanteros -->
                <rect x="235" y="124" width="6" height="10" rx="2" fill="#fbbf24"/>
                <rect x="237" y="124" width="6" height="10" rx="2" fill="#fef3c7" opacity="0.8"/>
                <!-- Faros traseros -->
                <rect x="71" y="124" width="6" height="10" rx="2" fill="#ef4444"/>

                <!-- Detalles decorativos -->
                <rect x="80" y="132" width="152" height="3" rx="1.5" fill="#3b82f6" opacity="0.5"/>

                <!-- Rueda izquierda -->
                <g class="wheel-l">
                  <circle cx="92" cy="142" r="14" fill="#0f172a"/>
                  <circle cx="92" cy="142" r="10" fill="#1e293b"/>
                  <circle cx="92" cy="142" r="5"  fill="#334155"/>
                  <!-- Rayos -->
                  <line x1="92" y1="132" x2="92" y2="152" stroke="#475569" stroke-width="2"/>
                  <line x1="82" y1="142" x2="102" y2="142" stroke="#475569" stroke-width="2"/>
                  <line x1="85" y1="135" x2="99" y2="149" stroke="#475569" stroke-width="1.5"/>
                  <line x1="99" y1="135" x2="85" y2="149" stroke="#475569" stroke-width="1.5"/>
                  <circle cx="92" cy="142" r="3" fill="#f97316"/>
                </g>

                <!-- Rueda derecha -->
                <g class="wheel-r">
                  <circle cx="220" cy="142" r="14" fill="#0f172a"/>
                  <circle cx="220" cy="142" r="10" fill="#1e293b"/>
                  <circle cx="220" cy="142" r="5"  fill="#334155"/>
                  <line x1="220" y1="132" x2="220" y2="152" stroke="#475569" stroke-width="2"/>
                  <line x1="210" y1="142" x2="230" y2="142" stroke="#475569" stroke-width="2"/>
                  <line x1="213" y1="135" x2="227" y2="149" stroke="#475569" stroke-width="1.5"/>
                  <line x1="227" y1="135" x2="213" y2="149" stroke="#475569" stroke-width="1.5"/>
                  <circle cx="220" cy="142" r="3" fill="#f97316"/>
                </g>
              </g>

              <!-- Anillos de pulso (velocidad) -->
              <circle class="pulse-1" cx="170" cy="130" r="55" fill="none" stroke="#f97316" stroke-width="1" opacity="0"/>
              <circle class="pulse-2" cx="170" cy="130" r="55" fill="none" stroke="#f97316" stroke-width="1" opacity="0"/>

              <!-- Métricas flotantes -->
              <g class="dash-1">
                <rect x="248" y="52" width="82" height="36" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
                <text x="257" y="67" font-family="monospace" font-size="9" fill="#94a3b8">VENTAS HOY</text>
                <text x="257" y="81" font-family="monospace" font-size="13" font-weight="bold" fill="#f97316">12</text>
              </g>
              <g class="dash-2">
                <rect x="8" y="44" width="88" height="36" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
                <text x="17" y="59" font-family="monospace" font-size="9" fill="#94a3b8">STOCK DISP.</text>
                <text x="17" y="73" font-family="monospace" font-size="13" font-weight="bold" fill="#34d399">23</text>
              </g>
              <g class="dash-3">
                <rect x="118" y="16" width="104" height="36" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
                <text x="127" y="31" font-family="monospace" font-size="9" fill="#94a3b8">FACTURADO</text>
                <text x="127" y="45" font-family="monospace" font-size="13" font-weight="bold" fill="#f97316">$274M</text>
              </g>
            </svg>
          </div>

          <h1 class="text-3xl font-bold text-white leading-tight mb-3">
            Gestión <span class="text-primary-500">premium</span><br/>para concesionarias
          </h1>
          <p class="text-slate-400 text-sm leading-relaxed max-w-xs">
            Control total de tu negocio: stock, clientes, leads y ventas en un solo lugar.
          </p>

          <!-- Features con íconos SVG -->
          <div class="mt-8 space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-7 h-7 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>
                </svg>
              </div>
              <span class="text-sm text-slate-400">Pipeline de leads en tiempo real</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"/>
                </svg>
              </div>
              <span class="text-sm text-slate-400">Reportes y métricas de rendimiento</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25"/>
                </svg>
              </div>
              <span class="text-sm text-slate-400">Gestión de stock con imágenes</span>
            </div>
          </div>
        </div>

        <p class="text-xs text-slate-600">© {{ new Date().getFullYear() }} MotorOS. Todos los derechos reservados.</p>
      </div>
    </div>

    <!-- ── Panel derecho — formulario ───────────────────────────────────── -->
    <div class="flex-1 flex flex-col">

      <!-- Toggle dark mode — top right -->
      <div class="flex justify-end p-4">
        <button
          class="w-9 h-9 rounded-xl flex items-center justify-center transition-all
                 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10
                 text-slate-500 dark:text-slate-400"
          :title="isDark ? 'Modo claro' : 'Modo oscuro'"
          @click="toggleDark"
        >
          <svg v-if="isDark" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/>
          </svg>
        </button>
      </div>

      <!-- Contenido centrado -->
      <div class="flex-1 flex items-center justify-center p-6">
        <div class="w-full max-w-sm">
          <!-- Logo mobile -->
          <div class="flex items-center gap-2.5 mb-10 lg:hidden">
            <div class="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 12 8 8"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <span class="font-bold text-slate-900 dark:text-white text-lg">MotorOS</span>
          </div>
          <RouterView />
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@keyframes speedLine {
  0%   { transform: translateX(0);     opacity: 0.7; }
  100% { transform: translateX(-120px); opacity: 0;   }
}
@keyframes carBounce {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-4px); }
}
@keyframes wheelSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes pulseRing {
  0%   { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(1.8); opacity: 0;   }
}
@keyframes dashFloat {
  0%, 100% { transform: translateY(0px);  opacity: 1;   }
  50%       { transform: translateY(-6px); opacity: 0.7; }
}
@keyframes glowPulse {
  0%, 100% { opacity: 0.25; }
  50%       { opacity: 0.55; }
}

.speed-line-1 { animation: speedLine 1.2s linear infinite 0s;   }
.speed-line-2 { animation: speedLine 1.2s linear infinite 0.2s; }
.speed-line-3 { animation: speedLine 1.2s linear infinite 0.5s; }
.speed-line-4 { animation: speedLine 1.2s linear infinite 0.8s; }
.speed-line-5 { animation: speedLine 1.2s linear infinite 1.0s; }

.car-group { animation: carBounce 2s ease-in-out infinite; }

.wheel-l {
  animation: wheelSpin 0.8s linear infinite;
  transform-origin: 92px 142px;
}
.wheel-r {
  animation: wheelSpin 0.8s linear infinite;
  transform-origin: 220px 142px;
}

.pulse-1 {
  animation: pulseRing 2s ease-out infinite 0s;
  transform-origin: 170px 130px;
}
.pulse-2 {
  animation: pulseRing 2s ease-out infinite 0.7s;
  transform-origin: 170px 130px;
}

.dash-1  { animation: dashFloat 3s ease-in-out infinite 0s;   }
.dash-2  { animation: dashFloat 3s ease-in-out infinite 0.5s; }
.dash-3  { animation: dashFloat 3s ease-in-out infinite 1.0s; }
.glow-car { animation: glowPulse 2s ease-in-out infinite; }
</style>
