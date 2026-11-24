/**
 * Preparar la foto antes del OCR y limpiar el resultado. Tesseract "inventa" caracteres
 * cuando la foto es enorme, tiene sombras, colores o texto claro sobre fondo oscuro;
 * aquí se normaliza la imagen y luego se descartan las palabras de baja confianza.
 */

const LADO_IDEAL = 1800; // px del lado mayor: suficiente para letras chicas, sin ruido de más

/** Escala a ~1800 px, pasa a grises con contraste estirado y pone el texto oscuro sobre claro. */
export async function prepararImagen(archivo: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  const escala = Math.min(2.5, LADO_IDEAL / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);
  const lienzo = document.createElement('canvas');
  lienzo.width = w;
  lienzo.height = h;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const grises = new Uint8ClampedArray(w * h);
  const histograma = new Uint32Array(256);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const y = (d[i]! * 299 + d[i + 1]! * 587 + d[i + 2]! * 114) / 1000;
    grises[j] = y;
    histograma[Math.round(y)]!++;
  }
  // Contraste: estirar entre los percentiles 1 % y 99 %
  const total = w * h;
  let acumulado = 0;
  let bajo = 0;
  let alto = 255;
  for (let v = 0; v < 256; v++) {
    acumulado += histograma[v]!;
    if (acumulado <= total * 0.01) bajo = v;
    if (acumulado <= total * 0.99) alto = v;
  }
  const rango = Math.max(1, alto - bajo);
  let suma = 0;
  for (let j = 0; j < total; j++) {
    const v = Math.min(255, Math.max(0, ((grises[j]! - bajo) * 255) / rango));
    grises[j] = v;
    suma += v;
  }
  // Fondo oscuro (texto claro): invertir, Tesseract lee mejor texto oscuro sobre claro
  const invertir = suma / total < 110;
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const v = invertir ? 255 - grises[j]! : grises[j]!;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return lienzo;
}

interface PalabraOCR {
  text: string;
  confidence: number;
}
interface LineaOCR {
  words: PalabraOCR[];
}

const CONFIANZA_MIN = 62;
const tieneLetras = (p: string) => /[\p{L}\p{N}]/u.test(p);
/** Proporción de caracteres "raros" (ni letra, ni número, ni puntuación común). */
const rareza = (p: string) => (p.match(/[^\p{L}\p{N}.,:;!?¡¿()"'%$#@&/+\-–]/gu)?.length ?? 0) / Math.max(1, p.length);

/** Se queda con las palabras confiables; descarta renglones que son puro ruido. */
export function limpiarLineas(lineas: LineaOCR[]) {
  const salida: string[] = [];
  const confianzas: number[] = [];
  for (const l of lineas) {
    const buenas = l.words.filter((w) => w.confidence >= CONFIANZA_MIN && tieneLetras(w.text) && rareza(w.text) < 0.3 && !(w.text.length === 1 && !/[\p{L}\p{N}]/u.test(w.text)));
    // Renglón con más basura que palabras: se descarta completo
    if (!buenas.length || buenas.length < l.words.length * 0.5) continue;
    // Palabras sueltas de 1 letra en un renglón corto suelen ser manchas
    if (buenas.length === 1 && buenas[0]!.text.length < 3 && !/^\d+$/.test(buenas[0]!.text)) continue;
    salida.push(buenas.map((w) => w.text).join(' '));
    confianzas.push(...buenas.map((w) => w.confidence));
  }
  const confianza = confianzas.length ? Math.round(confianzas.reduce((a, b) => a + b, 0) / confianzas.length) : 0;
  return { texto: salida.join('\n'), confianza };
}
