Auditá el dark mode de todos los archivos Vue en `client/src`. Buscá y corregí todos los elementos que tengan clases de color, fondo o borde en modo claro sin su contraparte `dark:`.

## Convenciones del proyecto

| Light | Dark correcto |
|-------|--------------|
| `bg-white` | `dark:bg-[#1a1a2e]` |
| `bg-slate-50` | `dark:bg-white/5` |
| `border-slate-100` | `dark:border-white/5` |
| `border-slate-200` | `dark:border-white/10` |
| `text-slate-900` / `text-slate-800` | `dark:text-white` |
| `text-slate-700` / `text-slate-600` | `dark:text-slate-200` o `dark:text-slate-300` |
| `text-slate-500` / `text-slate-400` | `dark:text-slate-400` o `dark:text-slate-500` |
| `divide-slate-100` | `dark:divide-white/5` |
| `hover:bg-slate-50` | `dark:hover:bg-white/5` |
| `hover:text-slate-700` | `dark:hover:text-slate-300` |
| inputs/selects | agregar `dark:border-white/10 dark:bg-[#1a1a2e] dark:text-white dark:placeholder-slate-500` |
| botón cancelar | agregar `dark:text-slate-300 dark:border-white/10 dark:hover:bg-white/5` |
| dropdown/popup | `dark:bg-[#1a1a2e] dark:border-white/10` |

**IMPORTANTE:** Los valores de opacidad válidos en Tailwind son múltiplos de 5 (5, 10, 15...). Nunca usar `/2` o `/3` — usar `bg-white/[0.03]` para valores arbitrarios.

## Proceso

1. Usá Grep para buscar en `client/src/**/*.vue` las clases problemáticas sin `dark:` en la misma línea.
2. Para cada archivo con issues, leelo completo para entender el contexto.
3. Corregí todos los issues en lote usando Edit (no uno por uno).
4. Al terminar, reportá un resumen de qué archivos se modificaron y qué se corrigió.

Empezá por los archivos que el usuario usa más: vistas de listado y detalle, modales frecuentes, componentes compartidos.
