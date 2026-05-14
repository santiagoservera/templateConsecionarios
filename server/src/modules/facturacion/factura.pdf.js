/**
 * Factura electrónica AFIP — formato normalizado argentino.
 * Posicionamiento 100% absoluto para evitar overflow de páginas.
 */
const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');

// ── Dimensiones ───────────────────────────────────────────────────────────────
const W4 = 595.28;
const H4 = 841.89;
const ML = 28;           // margen izquierdo/derecho
const WW = W4 - ML * 2; // 539.28 pt ancho útil

// ── Primitivas de dibujo ──────────────────────────────────────────────────────
/** Texto en posición absoluta, nunca fluye */
function t(doc, str, x, y, w, opts = {}) {
  doc
    .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(opts.sz || 7.5)
    .fillColor(opts.color || '#000000')
    .text(String(str ?? ''), x, y, {
      width: w, lineBreak: false, align: opts.align || 'left',
    });
}

/** Línea horizontal */
function hl(doc, x1, y, x2, lw = 0.5) {
  doc.save().strokeColor('#000').lineWidth(lw)
     .moveTo(x1, y).lineTo(x2, y).stroke().restore();
}
/** Línea vertical */
function vl(doc, x, y1, y2, lw = 0.5) {
  doc.save().strokeColor('#000').lineWidth(lw)
     .moveTo(x, y1).lineTo(x, y2).stroke().restore();
}
/** Rectángulo con borde */
function rb(doc, x, y, w, h, lw = 0.5) {
  doc.save().strokeColor('#000').lineWidth(lw).rect(x, y, w, h).stroke().restore();
}
/** Rectángulo relleno */
function rf(doc, x, y, w, h, color) {
  doc.save().fillColor(color).rect(x, y, w, h).fill().restore();
}

// ── Utilidades ────────────────────────────────────────────────────────────────
const $  = n  => '$ ' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fd = d  => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const p5 = n  => String(n || 0).padStart(5, '0');
const p8 = n  => String(n || 0).padStart(8, '0');

const LETRA = { FACTURA_A: 'A', FACTURA_B: 'B', FACTURA_C: 'C' };
const COD   = { FACTURA_A: '001', FACTURA_B: '006', FACTURA_C: '011' };

function detectDoc(s) {
  if (!s) return { tipo: 'DNI', nro: 0, label: 'Consumidor Final' };
  const c = s.replace(/[-.\s]/g, '');
  if (c.length === 11) return { tipo: 'CUIT', nro: parseInt(c), label: `CUIT: ${s}` };
  return { tipo: 'DNI', nro: parseInt(c) || 0, label: `DNI: ${s}` };
}

async function qrDataUrl(factura, config) {
  const doci = detectDoc(factura.venta?.cliente?.dniCuit);
  const obj  = {
    ver: 1,
    fecha: new Date(factura.fechaEmision).toISOString().slice(0, 10),
    cuit: parseInt((config?.afipCuit ?? '0').replace(/[-.\s]/g, '')),
    ptoVta: factura.puntoVenta,
    tipoCmp: { FACTURA_A: 1, FACTURA_B: 6, FACTURA_C: 11 }[factura.tipo] ?? 6,
    nroCmp: factura.numero,
    importe: parseFloat(Number(factura.importeTotal).toFixed(2)),
    moneda: 'PES', ctz: 1,
    tipoDocRec: doci.tipo === 'CUIT' ? 80 : 96,
    nroDocRec: doci.nro,
    tipoCodAut: 'E',
    codAut: parseInt(factura.cae ?? '0'),
  };
  const url = 'https://www.afip.gob.ar/fe/qr/?p=' + Buffer.from(JSON.stringify(obj)).toString('base64');
  return QRCode.toDataURL(url, { width: 90, margin: 1 });
}

// ══════════════════════════════════════════════════════════════════════════════
async function generarFacturaPDF(factura, config) {
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true,
    info: { Title: `Factura ${LETRA[factura.tipo]} ${p5(factura.puntoVenta)}-${p8(factura.numero)}` } });

  const cli     = factura.venta?.cliente  ?? {};
  const veh     = factura.venta?.vehiculo ?? {};
  const doci    = detectDoc(cli.dniCuit);
  const letra   = LETRA[factura.tipo]     ?? 'B';
  const cod     = COD[factura.tipo]       ?? '006';
  const aliq    = Number(config?.afipIvaAlicuota ?? 21);
  const condiva = (config?.afipCondicionIva ?? 'RESPONSABLE_INSCRIPTO').replace(/_/g, ' ');
  const nombre  = config?.nombreConcesionaria ?? 'DealerOS';
  const nroComp = `${p5(factura.puntoVenta)}-${p8(factura.numero)}`;

  // ── Posiciones Y fijas ─────────────────────────────────────────────────────
  const Y_ORIG   = ML;          // 28
  const H_ORIG   = 18;
  const Y_HDR    = Y_ORIG + H_ORIG;  // 46
  const H_HDR    = 108;
  const Y_REC    = Y_HDR  + H_HDR;  // 154
  const H_REC    = 64;
  const Y_TBLH   = Y_REC  + H_REC;  // 218
  const H_TBLH   = 16;
  const Y_TBLR   = Y_TBLH + H_TBLH; // 234
  const H_TBLR   = 30;

  // Pie anclado al fondo
  const H_TRIB   = 88;
  const H_BOTTOM = 78;
  const Y_TRIB   = H4 - ML - H_TRIB - H_BOTTOM - 4; // ~643
  const Y_BOT    = Y_TRIB + H_TRIB + 4;              // ~735

  // ── 1. ORIGINAL ───────────────────────────────────────────────────────────
  rb(doc, ML, Y_ORIG, WW, H_ORIG);
  t(doc, 'ORIGINAL', ML, Y_ORIG + 5, WW, { bold: true, sz: 10, align: 'center' });

  // ── 2. CABECERA DOS COLUMNAS ──────────────────────────────────────────────
  const CW  = WW / 2;     // 269.64 ancho de cada columna
  const BW  = 54;          // caja letra ancho
  const BH  = 70;          // caja letra alto
  const BX  = ML + CW - BW / 2;
  const BY  = Y_HDR + (H_HDR - BH) / 2;

  // Bordes columnas
  rb(doc, ML,      Y_HDR, CW, H_HDR);
  rb(doc, ML + CW, Y_HDR, CW, H_HDR);

  // ── Columna izquierda ─────────────────────────────────────────────────────
  const LX = ML + 7;
  t(doc, nombre, LX, Y_HDR + 7, CW - BW/2 - 14, { bold: true, sz: 13 });

  const leftRows = [
    ['Razón Social:',             nombre],
    ['Domicilio Comercial:',      config?.direccion ?? 'Argentina'],
    ['Condición frente al IVA:',  condiva],
    config?.telefono ? ['Teléfono:', config.telefono] : null,
    config?.email    ? ['Email:',    config.email]    : null,
  ].filter(Boolean);

  leftRows.forEach(([label, val], i) => {
    const ly = Y_HDR + 30 + i * 13;
    t(doc, label, LX,      ly, 105, { bold: true, sz: 7.5 });
    t(doc, val,   LX + 107, ly, CW - BW/2 - 120, { sz: 7.5 });
  });

  // ── Columna derecha ───────────────────────────────────────────────────────
  const RX = ML + CW + BW/2 + 6;
  const RW = CW - BW/2 - 14;
  t(doc, 'FACTURA', RX, Y_HDR + 7, RW, { bold: true, sz: 14 });

  const rightRows = [
    ['Compr. Nro:',                nroComp],
    ['Fecha de Emisión:',          fd(factura.fechaEmision)],
    ['CUIT:',                      config?.afipCuit ?? '—'],
    ['Ingresos Brutos:',           'exento'],
    ['Inicio de Actividades:',     '—'],
  ];

  rightRows.forEach(([label, val], i) => {
    const ry = Y_HDR + 30 + i * 13;
    t(doc, label, RX,      ry, 110, { bold: true, sz: 7.5 });
    t(doc, val,   RX + 112, ry, RW - 112, { sz: 7.5 });
  });

  // ── Caja central con letra (sobre los bordes) ─────────────────────────────
  rf(doc, BX - 1, BY - 1, BW + 2, BH + 2, '#ffffff');
  rb(doc, BX, BY, BW, BH, 1);
  t(doc, letra,       BX, BY + 4,       BW, { bold: true, sz: 40, align: 'center' });
  t(doc, `COD. ${cod}`, BX, BY + BH - 14, BW, { sz: 7, align: 'center' });

  // ── 3. DATOS DEL RECEPTOR ─────────────────────────────────────────────────
  rb(doc, ML, Y_REC, WW, H_REC);

  const nomCli = `${cli.apellido ?? ''} ${cli.nombre ?? ''}`.trim() || 'Consumidor Final';
  const RCX = ML + 7;
  let   rcy = Y_REC + 7;

  // Fila: Señor(es) + Domicilio
  t(doc, 'Señor(es):',  RCX,       rcy, 52,         { bold: true, sz: 7.5 });
  t(doc, nomCli,         RCX + 54,  rcy, WW/2 - 54,  { sz: 7.5 });
  if (cli.direccion) {
    t(doc, 'Domicilio:', RCX + WW/2,     rcy, 50,          { bold: true, sz: 7.5 });
    t(doc, cli.direccion, RCX + WW/2+52, rcy, WW/2 - 64,   { sz: 7.5 });
  }
  rcy += 13;

  // Fila: Doc + Razón Social
  t(doc, doci.tipo === 'CUIT' ? 'CUIT:' : 'DNI:',   RCX,      rcy, 28,        { bold: true, sz: 7.5 });
  t(doc, cli.dniCuit ?? 'Consumidor Final',           RCX + 30, rcy, 120,       { sz: 7.5 });
  t(doc, 'Apellido y Nombre / Razón Social:',         RCX + 160, rcy, 150,      { bold: true, sz: 7.5 });
  t(doc, nomCli,                                      RCX + 312, rcy, WW - 320, { sz: 7.5 });
  rcy += 13;

  // Fila: Condición IVA
  t(doc, 'Condición frente al IVA:',       RCX,      rcy, 110,       { bold: true, sz: 7.5 });
  t(doc, 'IVA Responsable Inscripto',       RCX + 112, rcy, 130,      { sz: 7.5 });
  if (cli.telefono) {
    t(doc, 'Teléfono:', RCX + 260, rcy, 48,             { bold: true, sz: 7.5 });
    t(doc, cli.telefono, RCX + 310, rcy, WW - 318,      { sz: 7.5 });
  }
  rcy += 13;

  // Fila: Condición de venta
  t(doc, 'Condición de Venta:', RCX, rcy, 90, { bold: true, sz: 7.5 });
  t(doc, (factura.venta?.formaPago ?? 'Otra').replace(/_/g,' '), RCX + 92, rcy, 150, { sz: 7.5 });

  // ── 4. TABLA DE ITEMS ─────────────────────────────────────────────────────
  // Columnas (suma = WW = 539.28)
  // Ajustadas para números grandes en pesos argentinos
  const C = [
    { k: 'cod',  label: 'Código',           x: ML,       w: 30,  al: 'left'   },
    { k: 'des',  label: 'Producto / Servicio', x: ML+30,  w: 148, al: 'left'   },
    { k: 'qty',  label: 'Cantidad',          x: ML+178,  w: 42,  al: 'right'  },
    { k: 'umd',  label: 'U. Medida',         x: ML+220,  w: 50,  al: 'center' },
    { k: 'pu',   label: 'Precio Unit.',      x: ML+270,  w: 78,  al: 'right'  },
    { k: 'bon',  label: '% Bonif',           x: ML+348,  w: 33,  al: 'center' },
    { k: 'sub',  label: 'Subtotal',          x: ML+381,  w: 75,  al: 'right'  },
    { k: 'ali',  label: 'Alíc. IVA',        x: ML+456,  w: 38,  al: 'center' },
    { k: 'tot',  label: 'Sub. c/IVA',        x: ML+494,  w: 45,  al: 'right'  },
  ];

  // Encabezado tabla
  rf(doc, ML, Y_TBLH, WW, H_TBLH, '#CCCCCC');
  rb(doc, ML, Y_TBLH, WW, H_TBLH);
  C.forEach(c => {
    if (c.x > ML) vl(doc, c.x, Y_TBLH, Y_TBLH + H_TBLH);
    t(doc, c.label, c.x + 2, Y_TBLH + 4, c.w - 4, { bold: true, sz: 6.5, align: c.al });
  });

  // Fila de datos
  rb(doc, ML, Y_TBLR, WW, H_TBLR);
  C.forEach(c => { if (c.x > ML) vl(doc, c.x, Y_TBLR, Y_TBLR + H_TBLR); });

  const descPrimera = [veh.marca, veh.modelo, veh.anio].filter(Boolean).join(' ');
  const descSeg     = veh.patente ? `Patente: ${veh.patente}` : '';

  const rowY = Y_TBLR + 5;
  const rowY2 = Y_TBLR + 16;

  t(doc, '0001',                 C[0].x+2, rowY,  C[0].w-4, { sz: 7 });
  t(doc, descPrimera,            C[1].x+2, rowY,  C[1].w-4, { sz: 7 });
  if (descSeg) t(doc, descSeg,   C[1].x+2, rowY2, C[1].w-4, { sz: 6.5, color: '#555' });
  t(doc, '1,00',                 C[2].x+2, rowY,  C[2].w-4, { sz: 7, align: 'right' });
  t(doc, 'unidad',               C[3].x+2, rowY,  C[3].w-4, { sz: 7, align: 'center' });
  t(doc, $(factura.importeNeto),  C[4].x+2, rowY,  C[4].w-4, { sz: 6.5, align: 'right' });
  t(doc, '0,00',                 C[5].x+2, rowY,  C[5].w-4, { sz: 7, align: 'center' });
  t(doc, $(factura.importeNeto),  C[6].x+2, rowY,  C[6].w-4, { sz: 6.5, align: 'right' });
  t(doc, `${aliq}%`,             C[7].x+2, rowY,  C[7].w-4, { sz: 7, align: 'center' });
  t(doc, $(factura.importeTotal), C[8].x+2, rowY,  C[8].w-4, { sz: 6.5, align: 'right' });

  // ── 5. OTROS TRIBUTOS + TOTALES ───────────────────────────────────────────
  const TW  = WW * 0.50;   // tabla tributos
  const TVW = WW * 0.44;   // tabla totales
  const TVX = ML + WW - TVW;

  // Cabecera tributos
  const tribCols = [
    { label: 'Descripción', x: ML,      w: 148 },
    { label: 'Detalle',     x: ML+148,  w: 52  },
    { label: 'Alíc. %',   x: ML+200,  w: 38, al: 'right' },
    { label: 'Importe',    x: ML+238,  w: TW-238+ML, al: 'right' },
  ];
  const TH2 = 14;
  rf(doc, ML, Y_TRIB, TW, TH2, '#CCCCCC');
  rb(doc, ML, Y_TRIB, TW, H_TRIB);
  tribCols.forEach(c => {
    if (c.x > ML) vl(doc, c.x, Y_TRIB, Y_TRIB + H_TRIB);
    t(doc, c.label, c.x+2, Y_TRIB+3, c.w-4, { bold: true, sz: 6.5, align: c.al || 'left' });
  });
  hl(doc, ML, Y_TRIB + TH2, ML + TW);

  const tribRows = [
    'Per./Ret. Impuesto a las Ganancias',
    'Per./Ret. de IVA',
    'Impuestos Internos',
    'Impuestos Municipales',
  ];
  tribRows.forEach((label, i) => {
    const ty = Y_TRIB + TH2 + 5 + i * 17;
    t(doc, label, ML+2, ty, 144, { sz: 6.5 });
    t(doc, '0,00', ML+238+2, ty, tribCols[3].w - 6, { sz: 6.5, align: 'right' });
  });

  // Totales
  const totRows = [
    ['Importe Neto Gravado:',    $(factura.importeNeto),  false],
    [`IVA ${aliq}%:`,            $(factura.importeIva),   false],
    ['Importe Otros Tributos:',  '$ 0,00',                false],
    ['IMPORTE TOTAL:',           $(factura.importeTotal), true],
  ];
  const LW = TVW * 0.60;
  const VW = TVW * 0.40;
  totRows.forEach(([label, val, bold], i) => {
    const ty = Y_TRIB + 10 + i * 17;
    t(doc, label, TVX,        ty, LW, { bold, sz: bold ? 8 : 7.5, align: 'right' });
    t(doc, val,   TVX + LW,   ty, VW, { bold, sz: bold ? 8 : 7.5, align: 'right' });
    if (bold) {
      hl(doc, TVX, ty - 3, TVX + TVW);
      hl(doc, TVX, ty + 14, TVX + TVW);
    }
  });

  // ── 6. QR + AFIP + CAE ────────────────────────────────────────────────────
  rb(doc, ML, Y_BOT, WW, H_BOTTOM);

  // QR
  try {
    const qr  = await qrDataUrl(factura, config);
    const buf = Buffer.from(qr.split(',')[1], 'base64');
    doc.image(buf, ML + 5, Y_BOT + 5, { width: 65, height: 65 });
  } catch { /* ignorar */ }

  // Logo AFIP text
  const AX = ML + 78;
  const AY = Y_BOT + 8;
  t(doc, 'AFIP', AX, AY, 60, { bold: true, sz: 20 });
  // líneas decorativas del logo
  doc.save().lineWidth(2.5).strokeColor('#000')
     .moveTo(AX, AY+27).lineTo(AX+50, AY+27).stroke().restore();
  doc.save().lineWidth(1).strokeColor('#000')
     .moveTo(AX, AY+31).lineTo(AX+50, AY+31).stroke().restore();

  t(doc, 'Comprobante Autorizado', AX, AY+38, 130, { bold: true, sz: 8 });
  t(doc, 'Esta Administración Federal no se responsabiliza por los datos ingresados en el detalle de la operación',
         AX, AY+52, 140, { sz: 5.5, color: '#333' });

  if (factura.demoMode) {
    t(doc, '⚠ MODO DEMO — CAE NO VÁLIDO', AX, AY+64, 140, { bold: true, sz: 6, color: '#c2410c' });
  }

  // CAE info — columna derecha
  const CX = ML + WW - 195;
  const CY = Y_BOT + 14;
  const LLW = 105;
  const RRW = 88;

  t(doc, 'CAE N°:',               CX,        CY,    LLW, { bold: true, sz: 8 });
  t(doc, factura.cae ?? '—',       CX + LLW,  CY,    RRW, { sz: 8 });
  t(doc, 'Fecha de Vto. de CAE:',  CX,        CY+16, LLW, { bold: true, sz: 8 });
  t(doc, fd(factura.caeFechaVencimiento), CX + LLW, CY+16, RRW, { sz: 8 });
  t(doc, `Compr. Nro: ${nroComp}`, CX, CY+34, LLW+RRW, { sz: 6.5, color: '#555' });

  // Página
  t(doc, 'Pág 1/1', ML + WW - 30, Y_BOT + H_BOTTOM - 10, 30, { sz: 6, align: 'right' });

  doc.end();
  return doc;
}

module.exports = { generarFacturaPDF };
