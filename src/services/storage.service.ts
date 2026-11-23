import { blobADataUrl } from '@/utils/imageCompressor';
import { latencia } from './local/store';

const LIMITE_LOCAL = 400 * 1024;

/**
 * Guarda una imagen YA comprimida y devuelve su URL.
 * - Versión de prueba: data URL dentro del almacenamiento local.
 * - Con Firebase: Storage (plan Blaze) o Firestore en base64 (demo Spark),
 *   según VITE_IMAGE_STORAGE_MODE.
 */
export async function guardarImagen(blob: Blob): Promise<string> {
  if (blob.size > LIMITE_LOCAL) {
    throw new Error('La imagen sigue siendo muy pesada después de comprimirla. Prueba con otra.');
  }
  await latencia(200);
  return blobADataUrl(blob);
}
