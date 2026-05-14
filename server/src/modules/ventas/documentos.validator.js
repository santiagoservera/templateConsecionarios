const { z } = require('zod');

const TipoDocumento = z.enum(['BOLETO', 'CONTRATO', 'CESION', 'OTRO']);

const createDocumentoSchema = z.object({
  tipo:       TipoDocumento,
  urlArchivo: z.string().optional(), // Ruta/URL libre — el manejo de archivos físicos va en una iteración futura
});

module.exports = { createDocumentoSchema };
