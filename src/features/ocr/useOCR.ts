import { useCallback, useEffect, useRef, useState } from 'react';
import type { Worker } from 'tesseract.js';
import { limpiarLineas, prepararImagen } from './preparar';

export type EstadoOCR =
  | { fase: 'inactivo' }
  | { fase: 'cargando'; mensaje: string; progreso: number }
  | { fase: 'leyendo'; progreso: number }
  | { fase: 'listo'; texto: string; confianza: number }
  | { fase: 'error'; mensaje: string };

const MENSAJES: Record<string, string> = {
  'loading tesseract core': 'Cargando motor de lectura…',
  'initializing tesseract': 'Preparando motor…',
  'loading language traineddata': 'Descargando idioma español (solo la primera vez)…',
  'initializing api': 'Iniciando…',
};

/**
 * OCR en el navegador con Tesseract.js: la imagen nunca sale del dispositivo.
 * La librería (~MB) se carga solo cuando se usa por primera vez, y el worker
 * se reutiliza entre lecturas y se libera al salir de la pantalla.
 */
export function useOCR() {
  const [estado, setEstado] = useState<EstadoOCR>({ fase: 'inactivo' });
  const worker = useRef<Promise<Worker> | null>(null);

  const obtenerWorker = useCallback(() => {
    if (!worker.current) {
      worker.current = import('tesseract.js').then(({ createWorker }) =>
        createWorker('spa', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') setEstado({ fase: 'leyendo', progreso: m.progress });
            else setEstado({ fase: 'cargando', mensaje: MENSAJES[m.status] ?? 'Preparando…', progreso: m.progress });
          },
        }),
      );
      worker.current.catch(() => {
        worker.current = null;
      });
    }
    return worker.current;
  }, []);

  const leer = useCallback(
    async (imagen: File | Blob) => {
      try {
        setEstado({ fase: 'cargando', mensaje: 'Cargando motor de lectura…', progreso: 0 });
        const [w, lienzo] = await Promise.all([obtenerWorker(), prepararImagen(imagen)]);
        await w.setParameters({
          tessedit_pageseg_mode: '3' as never, // segmentación automática (carteles con bloques)
          preserve_interword_spaces: '1',
          user_defined_dpi: '300',
          // Solo caracteres que aparecen en carteles en español: evita símbolos inventados
          tessedit_char_whitelist:
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚÜÑáéíóúüñ0123456789 .,:;!?¡¿()"\'%$#@&/+-–',
        });
        const { data } = await w.recognize(lienzo, {}, { blocks: true, text: true });
        const lineas = (data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((pa) => pa.lines));
        const { texto, confianza } = limpiarLineas(lineas);
        setEstado({ fase: 'listo', texto, confianza });
        return texto;
      } catch (e) {
        console.error(e);
        setEstado({
          fase: 'error',
          mensaje: navigator.onLine
            ? 'No se pudo leer la imagen. Intenta con una foto más nítida y bien iluminada.'
            : 'La primera lectura necesita internet para descargar el idioma español.',
        });
        return null;
      }
    },
    [obtenerWorker],
  );

  const reiniciar = useCallback(() => setEstado({ fase: 'inactivo' }), []);

  useEffect(
    () => () => {
      void worker.current?.then((w) => w.terminate());
      worker.current = null;
    },
    [],
  );

  return { estado, leer, reiniciar };
}
