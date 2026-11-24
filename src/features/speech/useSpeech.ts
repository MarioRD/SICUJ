import { useCallback, useEffect, useRef, useState } from 'react';

export type EstadoVoz = 'detenido' | 'hablando' | 'pausado';

const soportado = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Divide el texto en frases de ≤ 220 caracteres. Chrome corta los enunciados
 * largos a los ~15 s; leer por frases evita que la lectura se detenga sola.
 */
export function dividirEnFrases(texto: string, max = 220): string[] {
  const frases = texto
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?¿¡;:])\s+/);
  const partes: string[] = [];
  for (const f of frases) {
    if (!f) continue;
    if (f.length <= max) {
      partes.push(f);
      continue;
    }
    let resto = f;
    while (resto.length > max) {
      const corte = resto.lastIndexOf(' ', max);
      const i = corte > 40 ? corte : max;
      partes.push(resto.slice(0, i));
      resto = resto.slice(i).trim();
    }
    if (resto) partes.push(resto);
  }
  return partes;
}

/** Voces de mejor calidad (neuronales / en línea / mejoradas) que suenan menos robóticas. */
const NATURALES = /natural|neural|online|premium|enhanced|mejorada|google|siri|wavenet|studio/i;
const CONOCIDAS = /dalia|jorge|paulina|sabina|elvira|alvaro|helena|monica|paloma|marisol|lupe|camila|valentina/i;
const ROBOTICAS = /espeak|compact|eloquence|fred|zarvox|albert/i;

/** Elige la voz en español más natural del dispositivo, prefiriendo acento mexicano. */
export function elegirVoz(): SpeechSynthesisVoice | null {
  const voces = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('es'));
  const puntos = (v: SpeechSynthesisVoice) => {
    const lang = v.lang.replace('_', '-');
    let p = 0;
    if (lang === 'es-MX') p += 40;
    else if (lang === 'es-US' || lang.startsWith('es-419')) p += 30;
    else if (lang !== 'es-ES') p += 15;
    if (NATURALES.test(v.name)) p += 50;
    if (CONOCIDAS.test(v.name)) p += 10;
    if (!v.localService) p += 8; // las voces en línea suelen ser neuronales
    if (ROBOTICAS.test(v.name)) p -= 60;
    return p;
  };
  return voces.sort((a, b) => puntos(b) - puntos(a))[0] ?? null;
}

/** Ajustes que suavizan el tono de las voces del sistema. */
export const TONO_VOZ = 1.02;

/** Lectura en voz alta con la Web Speech API (funciona sin internet en la mayoría de los dispositivos). */
export function useSpeech(velocidad = 1) {
  const [estado, setEstado] = useState<EstadoVoz>('detenido');
  const cola = useRef<string[]>([]);
  const idLectura = useRef(0);

  const detener = useCallback(() => {
    if (!soportado()) return;
    idLectura.current++;
    cola.current = [];
    window.speechSynthesis.cancel();
    setEstado('detenido');
  }, []);

  const hablar = useCallback(
    (texto: string) => {
      if (!soportado() || !texto.trim()) return;
      window.speechSynthesis.cancel();
      const id = ++idLectura.current;
      cola.current = dividirEnFrases(texto);
      const voz = elegirVoz();

      const siguiente = () => {
        if (id !== idLectura.current) return;
        const frase = cola.current.shift();
        if (!frase) {
          setEstado('detenido');
          return;
        }
        const u = new SpeechSynthesisUtterance(frase);
        u.lang = voz?.lang ?? 'es-MX';
        if (voz) u.voice = voz;
        u.rate = velocidad;
        u.pitch = TONO_VOZ;
        u.onend = siguiente;
        u.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') setEstado('detenido');
        };
        window.speechSynthesis.speak(u);
      };
      setEstado('hablando');
      siguiente();
    },
    [velocidad],
  );

  const pausar = useCallback(() => {
    if (!soportado()) return;
    window.speechSynthesis.pause();
    setEstado('pausado');
  }, []);

  const reanudar = useCallback(() => {
    if (!soportado()) return;
    window.speechSynthesis.resume();
    setEstado('hablando');
  }, []);

  // Las voces cargan de forma asíncrona en Chrome; y al salir de la pantalla se calla.
  useEffect(() => {
    if (!soportado()) return;
    const cargar = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', cargar);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', cargar);
      idLectura.current++;
      window.speechSynthesis.cancel();
    };
  }, []);

  return { estado, hablar, pausar, reanudar, detener, soportado: soportado() };
}
