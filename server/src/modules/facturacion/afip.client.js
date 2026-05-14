/**
 * Cliente AFIP singleton.
 *
 * Modos de operación (variable de entorno AFIP_MODE):
 *   demo       → Sin AFIP real. Genera un CAE falso localmente. Ideal para desarrollo sin certificados.
 *   sandbox    → Usa el ambiente de homologación AFIP (certificados de prueba reales).
 *   production → Ambiente productivo real.
 *
 * Variables de entorno necesarias para sandbox/production:
 *   AFIP_CUIT          = 20409378472
 *   AFIP_CERT_PATH     = ./certs/afip.crt        (certificado .crt emitido por AFIP)
 *   AFIP_KEY_PATH      = ./certs/afip.key         (clave privada generada por el concesionario)
 *   AFIP_PUNTO_VENTA   = 1
 *   AFIP_MODE          = demo | sandbox | production
 */

const fs   = require('fs');
const path = require('path');

let _afip = null;

function getAfipClient() {
  if (_afip) return _afip;

  const mode = (process.env.AFIP_MODE ?? 'demo').toLowerCase();
  if (mode === 'demo') return null; // demo no necesita cliente

  try {
    const Afip = require('@afipsdk/afip.js');

    const certPath = path.resolve(process.env.AFIP_CERT_PATH ?? './certs/afip.crt');
    const keyPath  = path.resolve(process.env.AFIP_KEY_PATH  ?? './certs/afip.key');

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.warn('[AFIP] Certificados no encontrados — usando modo demo automáticamente');
      return null;
    }

    _afip = new Afip({
      CUIT:       parseInt(process.env.AFIP_CUIT ?? '0'),
      cert:       fs.readFileSync(certPath, 'utf8'),
      key:        fs.readFileSync(keyPath,  'utf8'),
      production: mode === 'production',
    });

    console.info(`[AFIP] Cliente inicializado en modo ${mode.toUpperCase()}`);
    return _afip;
  } catch (err) {
    console.warn('[AFIP] Error al inicializar cliente:', err.message, '— usando modo demo');
    return null;
  }
}

module.exports = { getAfipClient };
