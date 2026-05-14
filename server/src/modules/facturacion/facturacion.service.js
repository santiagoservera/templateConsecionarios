const prisma          = require('../../shared/prisma');
const { getAfipClient } = require('./afip.client');

// ── Constantes AFIP ────────────────────────────────────────────────────────────
const TIPO_FACTURA = {
  FACTURA_A: 1,
  FACTURA_B: 6,
  FACTURA_C: 11,
};

const DOC_TIPO = {
  CUIT:      80,
  DNI:       96,
  SIN_DOC:   99, // consumidor final
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Devuelve la fecha en formato YYYYMMDD que espera AFIP */
function afipDate(date = new Date()) {
  return parseInt(date.toISOString().slice(0, 10).replace(/-/g, ''));
}

/** Genera un CAE falso de 14 dígitos para el modo demo */
function fakeCae() {
  const ts  = Date.now().toString().slice(-8);
  const rnd = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return ts + rnd;
}

/** Detecta si el string es un CUIT (11 dígitos) o DNI */
function detectDocTipo(dniCuit) {
  if (!dniCuit) return { tipo: DOC_TIPO.SIN_DOC, nro: 0 };
  const clean = dniCuit.replace(/[-\s]/g, '');
  if (clean.length === 11) return { tipo: DOC_TIPO.CUIT, nro: parseInt(clean) };
  return { tipo: DOC_TIPO.DNI, nro: parseInt(clean) || 0 };
}

/** Determina el tipo de factura según condición del cliente y del emisor */
function detectTipoFactura(dniCuit, configCondicion) {
  const { tipo } = detectDocTipo(dniCuit);
  if (configCondicion === 'MONOTRIBUTO') return 'FACTURA_C';
  if (tipo === DOC_TIPO.CUIT) return 'FACTURA_A';
  return 'FACTURA_B';
}

/** Calcula importes desglosados según alícuota IVA */
function calcularImportes(precioFinalConIva, alicuota) {
  // precioFinal ya incluye IVA
  const factor     = 1 + Number(alicuota) / 100;
  const neto       = Number(precioFinalConIva) / factor;
  const iva        = Number(precioFinalConIva) - neto;
  return {
    importeNeto:  parseFloat(neto.toFixed(2)),
    importeIva:   parseFloat(iva.toFixed(2)),
    importeTotal: parseFloat(Number(precioFinalConIva).toFixed(2)),
  };
}

// ── Id de alícuota IVA para AFIP ──────────────────────────────────────────────
const IVA_ID = {
  10.5: 4,
  21:   5,
  27:   6,
  5:    8,
  2.5:  9,
};

// ── Main service ───────────────────────────────────────────────────────────────

const VENTA_INCLUDE = {
  cliente:  { select: { id: true, nombre: true, apellido: true, dniCuit: true, direccion: true } },
  vehiculo: { select: { id: true, marca: true, modelo: true, anio: true } },
  vendedor: { select: { id: true, nombre: true } },
};

/**
 * Emite la factura electrónica para una venta.
 * Si ya existe una factura EMITIDA para esa venta, lanza 409.
 */
const emitirFactura = async (ventaId) => {
  const venta = await prisma.venta.findUnique({
    where:   { id: Number(ventaId) },
    include: VENTA_INCLUDE,
  });
  if (!venta) throw Object.assign(new Error('Venta no encontrada'), { statusCode: 404 });

  // Verificar si ya tiene factura emitida
  const existente = await prisma.factura.findUnique({ where: { ventaId: Number(ventaId) } });
  if (existente?.estado === 'EMITIDA') {
    throw Object.assign(new Error('La venta ya tiene una factura emitida'), { statusCode: 409 });
  }

  // Obtener configuración del sistema
  const config = await prisma.configuracion.findUnique({ where: { id: 1 } });
  const puntoVenta  = config?.afipPuntoVenta ?? 1;
  const alicuota    = config?.afipIvaAlicuota ?? 21;
  const condicion   = config?.afipCondicionIva ?? 'RESPONSABLE_INSCRIPTO';

  // Determinar tipo de factura y datos del cliente
  const dniCuit    = venta.cliente.dniCuit ?? '';
  const tipoKey    = detectTipoFactura(dniCuit, condicion);
  const cbteNro    = TIPO_FACTURA[tipoKey];
  const { tipo: docTipo, nro: docNro } = detectDocTipo(dniCuit);
  const { importeNeto, importeIva, importeTotal } = calcularImportes(venta.precioFinal, alicuota);

  const afip   = getAfipClient();
  const isDemo = !afip;

  let cae             = null;
  let caeFechaVenc    = null;
  let estado          = 'ERROR';
  let errorMensaje    = null;
  let numero          = 0;
  let demoMode        = isDemo;

  if (isDemo) {
    // ── Modo demo: generar CAE falso ──────────────────────────────────────────
    const ultimoNro = await prisma.factura.aggregate({
      where:   { tipo: tipoKey },
      _max:    { numero: true },
    });
    numero       = (ultimoNro._max.numero ?? 0) + 1;
    cae          = fakeCae();
    const venc   = new Date(); venc.setDate(venc.getDate() + 10);
    caeFechaVenc = venc;
    estado       = 'EMITIDA';
  } else {
    // ── Modo sandbox/production: AFIP real ────────────────────────────────────
    try {
      const ultimoAfip = await afip.ElectronicBilling.getLastVoucher(puntoVenta, cbteNro);
      numero = (ultimoAfip ?? 0) + 1;

      const fechaHoy = afipDate();
      const ivaId    = IVA_ID[Number(alicuota)] ?? 5;

      const voucherData = {
        CantReg:    1,
        PtoVta:     puntoVenta,
        CbteTipo:   cbteNro,
        Concepto:   1,               // 1 = Productos
        DocTipo:    docTipo,
        DocNro:     docNro,
        CbteDesde:  numero,
        CbteHasta:  numero,
        CbteFch:    fechaHoy,
        ImpTotal:   importeTotal,
        ImpTotConc: 0,
        ImpNeto:    importeNeto,
        ImpOpEx:    0,
        ImpIVA:     importeIva,
        ImpTrib:    0,
        MonId:      'PES',
        MonCotiz:   1,
        Iva: [{
          Id:       ivaId,
          BaseImp:  importeNeto,
          Importe:  importeIva,
        }],
      };

      const res    = await afip.ElectronicBilling.createVoucher(voucherData);
      cae          = res.CAE;
      const ymd    = String(res.CAEFchVto); // 'YYYYMMDD'
      caeFechaVenc = new Date(`${ymd.slice(0,4)}-${ymd.slice(4,6)}-${ymd.slice(6,8)}`);
      estado       = 'EMITIDA';
    } catch (err) {
      errorMensaje = err.message ?? 'Error desconocido de AFIP';
      estado       = 'ERROR';
    }
  }

  // Persistir factura (upsert por si había un intento fallido previo)
  const factura = await prisma.factura.upsert({
    where:  { ventaId: Number(ventaId) },
    create: {
      ventaId:             Number(ventaId),
      tipo:                tipoKey,
      puntoVenta,
      numero,
      cae,
      caeFechaVencimiento: caeFechaVenc,
      importeNeto,
      importeIva,
      importeTotal,
      estado,
      errorMensaje,
      demoMode,
    },
    update: {
      tipo:                tipoKey,
      puntoVenta,
      numero,
      cae,
      caeFechaVencimiento: caeFechaVenc,
      importeNeto,
      importeIva,
      importeTotal,
      estado,
      errorMensaje,
      demoMode,
      fechaEmision:        new Date(),
    },
    include: { venta: { include: VENTA_INCLUDE } },
  });

  if (estado === 'ERROR') {
    throw Object.assign(new Error(errorMensaje ?? 'Error al emitir factura'), { statusCode: 502 });
  }

  return factura;
};

/** Retorna la factura existente de una venta */
const getByVenta = async (ventaId) => {
  const f = await prisma.factura.findUnique({
    where:   { ventaId: Number(ventaId) },
    include: { venta: { include: VENTA_INCLUDE } },
  });
  if (!f) throw Object.assign(new Error('Sin factura para esta venta'), { statusCode: 404 });
  return f;
};

/** Lista todas las facturas con paginación y filtros */
const getAll = async ({ estado, tipo, page = 1, pageSize = 20 } = {}) => {
  const { paginate, paginateMeta } = require('../../shared/utils/pagination.helper');
  const where = {};
  if (estado) where.estado = estado;
  if (tipo)   where.tipo   = tipo;

  const { take, skip } = paginate(page, pageSize);
  const [total, items] = await Promise.all([
    prisma.factura.count({ where }),
    prisma.factura.findMany({
      where,
      skip, take,
      include: { venta: { include: VENTA_INCLUDE } },
      orderBy: { fechaEmision: 'desc' },
    }),
  ]);

  return { items, meta: paginateMeta(total, page, pageSize) };
};

module.exports = { emitirFactura, getByVenta, getAll };
