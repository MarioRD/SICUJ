export interface OpcionesCompresion {
  anchoMaximo?: number;
  altoMaximo?: number;
  /** 0–1 */
  calidad?: number;
}

export interface ImagenComprimida {
  blob: Blob;
  ancho: number;
  alto: number;
  bytesOriginales: number;
  formato: string;
}

/** Calcula el tamaño final manteniendo la proporción y sin agrandar la imagen. */
export function calcularDimensiones(ancho: number, alto: number, anchoMax: number, altoMax: number) {
  const factor = Math.min(1, anchoMax / ancho, altoMax / alto);
  return { ancho: Math.round(ancho * factor), alto: Math.round(alto * factor) };
}

async function cargarImagen(archivo: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    // imageOrientation respeta la rotación EXIF de las fotos de celular
    return createImageBitmap(archivo, { imageOrientation: 'from-image' });
  }
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasABlob(canvas: HTMLCanvasElement, tipo: string, calidad: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, calidad));
}

/**
 * Redimensiona con <canvas> y convierte a WebP antes de subir.
 * Si el navegador no sabe codificar WebP (Safari antiguo devuelve PNG),
 * cae a JPEG para no inflar el archivo.
 */
export async function comprimirImagen(archivo: File, opciones: OpcionesCompresion = {}): Promise<ImagenComprimida> {
  const { anchoMaximo = 1200, altoMaximo = 1200, calidad = 0.8 } = opciones;
  if (!archivo.type.startsWith('image/')) throw new Error('El archivo no es una imagen.');

  const fuente = await cargarImagen(archivo);
  const { ancho, alto } = calcularDimensiones(fuente.width, fuente.height, anchoMaximo, altoMaximo);

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no permite procesar imágenes.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(fuente, 0, 0, ancho, alto);
  if ('close' in fuente) fuente.close();

  let blob = await canvasABlob(canvas, 'image/webp', calidad);
  if (!blob || blob.type !== 'image/webp') blob = await canvasABlob(canvas, 'image/jpeg', calidad);
  if (!blob) throw new Error('No se pudo comprimir la imagen.');

  return { blob, ancho, alto, bytesOriginales: archivo.size, formato: blob.type };
}

export function blobADataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(blob);
  });
}

export function formatearBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
