# CLAUDE.md — DealerOS

Sistema de gestión de concesionarios de vehículos (autos y motos). Full-stack monorepo con carpetas `client/` (Vue 3) y `server/` (Node.js + Express + Prisma + SQL Server).

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Vue 3 (Composition API), Vite, Pinia, Vue Router 4, Axios |
| UI Components | HeadlessUI Vue (modales, dropdowns accesibles) |
| Estilos | Tailwind CSS 3 (dark mode por clase, paleta naranja primario) |
| Exportación | xlsx (export a Excel) |
| Backend | Node.js, Express 4, Prisma ORM 5 |
| Base de datos | SQL Server (con shadow DB para migraciones) |
| Auth | JWT (access 15m + refresh 7d), bcryptjs |
| Validación | Zod (backend), validación reactiva manual (frontend) |
| Imágenes | Cloudinary (upload directo desde cliente) |
| Facturación | AFIP SDK (`@afipsdk/afip.js`), PDFKit, QRCode |

---

## Módulos del sistema

### Frontend (`client/src/modules/`)

| Módulo | Ruta base | Descripción |
|--------|-----------|-------------|
| `auth` | `/login` | Login, refresh token, store de sesión |
| `stock` | `/stock` | ABM vehículos, fotos Cloudinary, gastos |
| `clientes` | `/clientes` | ABM clientes, historial |
| `leads` | `/leads` | Pipeline CRM, kanban por etapas |
| `ventas` | `/ventas` | Wizard 4 pasos, permuta, financiamiento, documentos |
| `postventa` | `/postventa` | Garantías, reclamos, consultas, seguimiento |
| `comisiones` | `/comisiones` | Liquidación de comisiones por vendedor |
| `consignacion` | `/consignacion` | Vehículos recibidos en consignación |
| `convenios` | `/convenios` | Convenios con bancos y planes de cuotas |
| `planes-pago` | `/planes-pago` | Planes de pago DNI (financiamiento propio) |
| `caja` | `/caja` | Sesiones de caja, movimientos INGRESO/EGRESO |
| `seguros` | `/seguros` | Pólizas de seguro, coberturas, vencimientos |
| `indumentaria` | `/indumentaria` | Stock de ropa/accesorios/merchandising |
| `reportes` | `/reportes` | Dashboards y reportes exportables |
| `usuarios` | `/usuarios` | ABM usuarios, roles y permisos |
| `configuracion` | `/configuracion` | Config del sistema, datos AFIP, comisión default |

### Backend (`server/src/modules/`)

| Módulo | Prefijo API | Descripción |
|--------|-------------|-------------|
| `auth` | `/api/v1/auth` | Login, refresh, logout |
| `usuarios` | `/api/v1/usuarios` | ABM usuarios |
| `roles` | `/api/v1/roles` | ABM roles con permisos JSON |
| `clientes` | `/api/v1/clientes` | ABM clientes |
| `vehiculos` | `/api/v1/vehiculos` | ABM vehículos + gastos + fotos |
| `leads` | `/api/v1/leads` | CRM leads |
| `ventas` | `/api/v1/ventas` | Ventas + permuta + financiamiento + documentos |
| `postventa` | `/api/v1/postventa` | Postventa |
| `comisiones` | `/api/v1/comisiones` | Liquidación comisiones |
| `consignacion` | `/api/v1/consignacion` | Consignaciones |
| `convenios-bancos` | `/api/v1/convenios-bancos` | Convenios y planes de cuotas |
| `planes-pago` | `/api/v1/planes-pago` | Planes de pago DNI |
| `caja` | `/api/v1/caja` | Sesiones y movimientos de caja |
| `seguros` | `/api/v1/seguros` | Pólizas de seguro |
| `indumentaria` | `/api/v1/indumentaria` | Stock indumentaria |
| `services` | `/api/v1/services` | Services y mantenimientos de vehículos |
| `reportes` | `/api/v1/reportes` | Reportes y métricas |
| `configuracion` | `/api/v1/configuracion` | Config del sistema (singleton id=1) |
| `facturacion` | `/api/v1/facturacion` | Facturación electrónica AFIP |

---

## Estructura de directorios

```
dealeros/
├── client/src/
│   ├── layouts/          # AppLayout.vue (autenticado), AuthLayout.vue
│   ├── modules/          # Un directorio por módulo (ver tabla arriba)
│   │   └── {modulo}/
│   │       ├── views/        # Vistas (List, Detail, Form)
│   │       ├── components/   # Componentes del módulo
│   │       ├── composables/  # use{Modulo}.js — llamadas API + estado local
│   │       ├── store/        # Pinia stores (si el módulo lo necesita)
│   │       └── routes.js
│   ├── plugins/axios.js  # Cliente Axios + interceptores JWT auto-refresh
│   ├── router/index.js   # Rutas + guards de auth + acceso por rol
│   └── shared/
│       ├── components/   # AppTable, AppModal, AppBadge, AppPagination, AppToast, AppSelect
│       ├── composables/  # useToast
│       └── utils/format.js  # currency(), date(), datetime(), number()
│
└── server/src/
    ├── app.js            # Setup Express, CORS, montaje de rutas, error handler global
    ├── server.js         # Punto de entrada, listen
    ├── modules/          # Un directorio por módulo (ver tabla arriba)
    │   └── {modulo}/
    │       ├── {modulo}.controller.js
    │       ├── {modulo}.service.js
    │       ├── {modulo}.routes.js
    │       └── {modulo}.validator.js
    ├── prisma/
    │   ├── schema.prisma
    │   ├── seed.js
    │   └── migrations/
    └── shared/
        ├── middleware/   # auth.middleware.js, role.middleware.js, error.middleware.js
        ├── utils/        # response helpers (ok, fail), pagination.helper.js
        └── validators/validate.js  # Middleware factory Zod
```

---

## Convenciones de código

### Frontend

- **Componentes**: PascalCase (`ClienteListView.vue`, `AppTable.vue`)
- **Composables**: `use{Feature}.js` — exponen `{ data, loading, error, fetch, create, ... }`
- **Stores Pinia**: `{feature}Store.js`, composition API (`defineStore('id', () => { ... })`)
- **Rutas por módulo**: `routes.js` en cada módulo, importadas en `router/index.js`
- **Estilos**: Solo Tailwind utility classes. Dark mode con `dark:` prefix. Sin CSS inline ni scoped si Tailwind alcanza.
- **Llamadas a la API**: Siempre en composables, nunca directamente en componentes

### Backend

- **Patrón**: Routes → Middleware → Controller → Service → Prisma
- **Middleware en rutas**:
  ```js
  router.post('/', authMiddleware, authorize('ADMIN', 'GERENTE'), validate(schema), controller.create)
  ```
- **Respuestas**: Usar helpers `ok(res, data, meta)` y `fail(res, error, status)`
- **Errores custom**: `const e = new Error('msg'); e.statusCode = 404; throw e;`
- **Transacciones**: Usar `prisma.$transaction([...])` cuando se tocan múltiples tablas
- **Validación**: Siempre con Zod (`validate(schema)` middleware) antes del controller

---

## Formato de respuesta API

```json
// Éxito
{ "success": true, "data": { ... }, "meta": { "total": 100, "page": 1, "pageSize": 20, "totalPages": 5 } }

// Error
{ "success": false, "error": "Mensaje de error" }

// Validación fallida (422)
{ "success": false, "error": "Datos inválidos", "details": { "campo": ["mensaje"] } }
```

---

## Autenticación

- **Access token**: 15 minutos, almacenado en `localStorage`
- **Refresh token**: 7 días, almacenado en `localStorage`
- **Interceptor Axios**: En 401, intenta refresh automático y encola peticiones en espera
- **Guard de rutas**: `router/index.js` valida token antes de cada navegación
- **Roles**: `ADMIN` > `GERENTE` > `VENDEDOR` > `ASESOR`
- **Payload JWT**: `{ sub, rol, nombre, email, iat, exp }`

---

## Modelos Prisma (SQL Server)

| Modelo | Campos clave |
|--------|-------------|
| `Rol` | id, nombre, descripcion, permisos (NVarChar JSON), esDefault |
| `Usuario` | id, nombre, email, passwordHash, rol (string), activo, rolId (FK Rol), permisosJson, comisionPct |
| `Cliente` | id, nombre, apellido, dniCuit, telefono, email, direccion, origen, vendedorId |
| `Vehiculo` | id, tipo, marca, modelo, anio, version, color, vinChasis, patente, km, combustible, transmision, estado, enPreparacion (bool), tipoStock, precioCosto, precioVenta, precioMinimo, fotosJson |
| `GastoVehiculo` | id, vehiculoId, concepto, monto, proveedor, fecha, usuarioId |
| `Lead` | id, clienteId, vendedorId, vehiculoInteresId, etapa, origen, notas, proximoContacto |
| `Venta` | id, clienteId, vehiculoId, vendedorId, precioFinal, formaPago, tienePermuta, tieneFinanciamiento, estado, fechaReserva, fechaEntrega |
| `Permuta` | id, ventaId, marca, modelo, anio, patente, km, valorTasacion, estadoIngreso, vehiculoGeneradoId |
| `Financiamiento` | id, ventaId, entidad, montoFinanciado, tasaInteres, cantCuotas, valorCuota, estado, fechaAprobacion, numeroExpediente |
| `Comision` | id, ventaId, vendedorId, montoBase, porcentaje, montoComision, estado, fechaLiquidacion |
| `Postventa` | id, ventaId, clienteId, tipo, descripcion, estado, fechaContacto, fechaResolucion, usuarioId |
| `Documento` | id, ventaId, tipo, urlArchivo, fechaGeneracion, usuarioId |
| `Factura` | id, ventaId, tipo, puntoVenta, numero, cae, caeFechaVencimiento, importeNeto, importeIva, importeTotal, estado, demoMode |
| `ServiceVehiculo` | id, ventaId?, vehiculoId?, tipoService, descripcion, kmActual, kmProximoService, fechaService, fechaProximoService, estado, usuarioId |
| `ConvenioBanco` | id, nombre, descripcion, activo |
| `PlanCuotas` | id, convenioBancoId, cantCuotas, tasaInteres, activo |
| `Consignacion` | id, vehiculoId, propietarioId, precioAcordado, comisionPct, estado, fechaIngreso, fechaVencimiento |
| `Indumentaria` | id, nombre, descripcion, categoria, talla, color, marca, cantidad, precioCosto, precioVenta, fotosJson, activo |
| `PlanPagoDNI` | id, clienteId, vehiculoId, vendedorId, precioTotal, cantCuotas, valorCuota, montoEntrega, montoPagado, estado, vehiculoEntregado, ventaId? |
| `CuotaPlanPago` | id, planPagoDNIId, numeroCuota, fechaVencimiento, monto, estado, fechaPago, usuarioId? |
| `SesionCaja` | id, usuarioId, fechaApertura, fechaCierre, montoApertura, montoCierre, estado |
| `MovimientoCaja` | id, sesionCajaId, tipo, concepto, monto, planPagoDNIId?, usuarioId |
| `Seguro` | id, aseguradora, numeroPoliza, tipoCobertura, vigenciaDesde, vigenciaHasta, monto, urlDocumento, estado |
| `Configuracion` | id=1 (singleton), nombreConcesionaria, comisionPctDefault, moneda, direccion, telefono, email, afipCuit, afipPuntoVenta, afipCondicionIva, afipIvaAlicuota |

### Enums (implementados como strings en Prisma)

| Campo | Valores |
|-------|---------|
| `Usuario.rol` | `ADMIN` `GERENTE` `VENDEDOR` `ASESOR` |
| `Cliente.origen` | `VISITA` `WHATSAPP` `INSTAGRAM` `REFERIDO` `WEB` `OTRO` |
| `Vehiculo.tipo` | `AUTO` `MOTO` |
| `Vehiculo.estado` | `DISPONIBLE` `RESERVADO` `VENDIDO` `EN_CONSIGNACION` |
| `Vehiculo.tipoStock` | `NUEVO` `USADO` `CONSIGNACION` |
| `Lead.etapa` | `NUEVO` `CONTACTADO` `INTERESADO` `NEGOCIACION` `GANADO` `PERDIDO` |
| `Venta.formaPago` | `CONTADO` `FINANCIADO` `MIXTO` |
| `Venta.estado` | `RESERVA` `EN_TRAMITE` `ENTREGADO` `CANCELADO` |
| `Financiamiento.estado` | `PENDIENTE` `APROBADO` `RECHAZADO` |
| `Comision.estado` | `PENDIENTE` `LIQUIDADA` |
| `Postventa.tipo` | `GARANTIA` `RECLAMO` `CONSULTA` `SEGUIMIENTO` |
| `Postventa.estado` | `ABIERTO` `EN_GESTION` `CERRADO` |
| `Documento.tipo` | `BOLETO` `CONTRATO` `CESION` `OTRO` |
| `Factura.tipo` | `FACTURA_A` `FACTURA_B` `FACTURA_C` |
| `Factura.estado` | `PENDIENTE` `EMITIDA` `ERROR` |
| `ServiceVehiculo.tipoService` | `REVISION` `MANTENIMIENTO` `GARANTIA` `OTRO` |
| `ServiceVehiculo.estado` | `PENDIENTE` `REALIZADO` `CANCELADO` |
| `Consignacion.estado` | `ACTIVA` `VENDIDA` `RETIRADA` |
| `Indumentaria.categoria` | `Ropa` `Accesorio` `Calzado` `Merchandising` `Otro` |
| `PlanPagoDNI.estado` | `ACTIVO` `SUSPENDIDO` `COMPLETADO` `CANCELADO` |
| `CuotaPlanPago.estado` | `PENDIENTE` `PAGADO` `VENCIDO` |
| `SesionCaja.estado` | `ABIERTA` `CERRADA` |
| `MovimientoCaja.tipo` | `INGRESO` `EGRESO` |
| `MovimientoCaja.concepto` | `CUOTA_PLAN_PAGO` `VENTA_INDUMENTARIA` `GASTO` `OTRO` |
| `Seguro.tipoCobertura` | `RESPONSABILIDAD_CIVIL` `TERCEROS_COMPLETO` `TODO_RIESGO` `OTRO` |
| `Seguro.estado` | `VIGENTE` `VENCIDO` `CANCELADO` |

> **Nota**: `Vehiculo.enPreparacion` es un campo `Boolean` separado, no un valor del enum `estado`.

---

## Flujo de venta (lógica crítica)

1. Wizard 4 pasos: Cliente → Vehículo → Pago → Confirmación
2. Al confirmar (`ventasService.create()`):
   - Valida que el vehículo esté en `DISPONIBLE`
   - Crea `Venta` + actualiza `Vehiculo.estado → RESERVADO` + crea `Comision` en transacción
   - El porcentaje de comisión se toma de `Configuracion.comisionPctDefault` (default 2%)
3. Opcionales post-venta: `Permuta` (`POST /ventas/:id/permuta`), `Financiamiento` (`POST /ventas/:id/financiamiento`)
4. Documentos: `POST /ventas/:id/documentos`
5. Facturación AFIP: `POST /facturacion/emitir` — genera CAE via AFIP SDK

---

## Facturación electrónica AFIP

- Usa `@afipsdk/afip.js` con credenciales configuradas en `Configuracion` (CUIT, punto de venta)
- `demoMode: true` en `Factura` cuando se genera en ambiente de testing AFIP
- El CAE y fecha de vencimiento se guardan en el modelo `Factura`
- Genera PDF con PDFKit y QR con `qrcode`
- Solo `ADMIN` y `GERENTE` pueden emitir facturas

---

## Variables de entorno

### server/.env
```
DATABASE_URL="sqlserver://..."
SHADOW_DATABASE_URL="sqlserver://...DealerOS_shadow..."
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
CLIENT_URL="http://localhost:5173"
```

### client/.env
```
VITE_CLOUDINARY_CLOUD_NAME=didb70rur
VITE_CLOUDINARY_UPLOAD_PRESET=frytn7zq
```

---

## Comandos de desarrollo

```bash
# Backend
cd server && npm run dev          # Nodemon en puerto 3000
npm run db:migrate -- --name foo  # Nueva migración
npm run db:seed                   # Carga datos de prueba
npm run db:studio                 # Prisma Studio (UI para la BD)
npm run db:generate               # Regenerar Prisma Client tras cambios en schema

# Frontend
cd client && npm run dev          # Vite en puerto 5173
npm run build                     # Build de producción
```

### Credenciales de prueba (seed)
| Rol | Email | Password |
|-----|-------|----------|
| ADMIN | admin@dealeros.com | Admin1234! |
| VENDEDOR | carlos@dealeros.com | Vendedor1! |
| VENDEDOR | laura@dealeros.com | Vendedor2! |

---

## Reglas para Claude

### Al modificar el backend
- Seguir siempre el orden: `routes → controller → service → validator`
- No poner lógica de negocio en controllers, va en services
- Usar `prisma.$transaction` si la operación toca más de una tabla
- Validar con Zod antes de que llegue al controller (`validate(schema)`)
- Responder siempre con `ok()` / `fail()` — nunca `res.json()` directamente
- Al agregar un nuevo módulo: crear los 4 archivos (`controller`, `service`, `routes`, `validator`) y montarlo en `app.js`

### Al modificar el frontend
- Toda llamada a la API va en un composable (`use{Feature}.js`), no en el componente
- Los componentes solo consumen composables y manejan template/UI
- Usar los componentes compartidos: `AppTable`, `AppModal`, `AppBadge`, `AppPagination`, `AppToast`, `AppSelect`
- Toast de feedback siempre: `useToast().success/error/warning/info(titulo, mensaje)`
- No inventar nuevos colores — usar la paleta definida en `tailwind.config.js`
- Para estados `loading` / `error` usar los patrones ya establecidos en composables existentes
- Usar `AppSelect` en lugar de `<select>` nativo. Pasar `:options="[{value, label}]"` como prop.

### Dark mode — OBLIGATORIO en todo elemento nuevo

Este proyecto usa Tailwind dark mode por clase (`class="dark"` en `<html>`).
**Toda clase de color o fondo que agregues debe tener su contraparte `dark:`.**

Checklist por elemento:

| Elemento | Light | Dark |
|----------|-------|------|
| Card / panel | `bg-white` | `dark:bg-[#1a1a2e]` |
| Fondo sutil | `bg-slate-50` | `dark:bg-white/5` |
| Border card | `border-slate-100` o `border-slate-200` | `dark:border-white/5` o `dark:border-white/10` |
| Texto principal | `text-slate-900` o `text-slate-800` | `dark:text-white` |
| Texto secundario | `text-slate-700` o `text-slate-600` | `dark:text-slate-200` o `dark:text-slate-300` |
| Texto muted | `text-slate-500` o `text-slate-400` | `dark:text-slate-400` o `dark:text-slate-500` |
| Input / select | `bg-white border-slate-200 text-slate-900 placeholder-slate-400` | `dark:bg-[#1a1a2e] dark:border-white/10 dark:text-white dark:placeholder-slate-500` |
| Hover fila/item | `hover:bg-slate-50` | `dark:hover:bg-white/5` |
| Divisor `divide-*` | `divide-slate-100` | `dark:divide-white/5` |
| Botón cancelar | `text-slate-600 border-slate-200 hover:bg-slate-50` | `dark:text-slate-300 dark:border-white/10 dark:hover:bg-white/5` |
| Dropdown/popup | `bg-white border-slate-200` | `dark:bg-[#1a1a2e] dark:border-white/10` |

**Valores de opacidad válidos en Tailwind:** `5, 10, 15, 20, 25, 30, 35, 40, 45, 50...` — nunca usar `/2`, `/3` (no están en la escala estándar). Para valores arbitrarios usar `bg-white/[0.03]`.

### Al crear migraciones
- Usar `npm run db:migrate -- --name descripcion_breve`
- No editar archivos de migración existentes
- El shadow DB debe existir y estar configurado en `SHADOW_DATABASE_URL`

### Al agregar nuevas rutas
- Registrar el módulo en `server/src/app.js`
- Registrar las rutas del módulo en `client/src/router/index.js` con el layout y guards correctos
- Considerar los roles que deben tener acceso

### Permisos por rol (frontend)
- La sidebar filtra ítems por rol con `user.rol` del store de auth
- Las rutas usan `meta.roles` para bloquear acceso con guards
- El backend siempre valida con `authorize(...)` independientemente del frontend
