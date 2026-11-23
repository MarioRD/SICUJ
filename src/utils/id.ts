const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * ID aleatorio de 20 caracteres, mismo formato que los IDs automáticos de
 * Firestore (≈119 bits de entropía): no se puede adivinar ni enumerar.
 */
export function generarId(longitud = 20): string {
  const bytes = crypto.getRandomValues(new Uint8Array(longitud));
  let id = '';
  for (const b of bytes) id += ALFABETO[b % ALFABETO.length];
  return id;
}

export const PREFIJO_QR = 'SICUJ:';

export const codificarPase = (inscripcionId: string) => `${PREFIJO_QR}${inscripcionId}`;

/** Acepta "SICUJ:<id>" o el ID solo (captura manual). Devuelve null si el formato no es válido. */
export function decodificarPase(texto: string): string | null {
  const limpio = texto.trim();
  const id = limpio.startsWith(PREFIJO_QR) ? limpio.slice(PREFIJO_QR.length) : limpio;
  return /^[A-Za-z0-9]{20}$/.test(id) ? id : null;
}

/** Folio corto y legible para mostrar junto al QR (no reemplaza al ID). */
export const folioCorto = (id: string) => `${id.slice(0, 4)}-${id.slice(4, 8)}`.toUpperCase();

export async function sha256(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}
