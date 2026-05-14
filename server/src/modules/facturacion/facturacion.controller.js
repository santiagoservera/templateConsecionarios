const service  = require('./facturacion.service');
const { generarFacturaPDF } = require('./factura.pdf');
const prisma   = require('../../shared/prisma');
const { ok }   = require('../../shared/utils/response.helper');

const emitir = async (req, res, next) => {
  try {
    ok(res, await service.emitirFactura(req.params.ventaId));
  } catch (e) { next(e); }
};

const getByVenta = async (req, res, next) => {
  try {
    ok(res, await service.getByVenta(req.params.ventaId));
  } catch (e) { next(e); }
};

const getAll = async (req, res, next) => {
  try {
    const r = await service.getAll(req.query);
    ok(res, r.items, r.meta);
  } catch (e) { next(e); }
};

const descargarPDF = async (req, res, next) => {
  try {
    const factura = await service.getByVenta(req.params.ventaId);
    const config  = await prisma.configuracion.findUnique({ where: { id: 1 } });

    const { padNum } = { padNum: (n, l) => String(n).padStart(l, '0') };
    const filename = `factura_${padNum(factura.puntoVenta, 4)}-${padNum(factura.numero, 8)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const pdfDoc = await generarFacturaPDF(factura, config);
    pdfDoc.pipe(res);
  } catch (e) { next(e); }
};

module.exports = { emitir, getByVenta, getAll, descargarPDF };
