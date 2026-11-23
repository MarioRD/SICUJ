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

function elegirVoz(): SpeechSynthesisVoice | null {
  const voces = window.speechSynthesis.getVoices();
  return (
    voces.find((v) => v.lang === 'es-MX') ??
    voces.find((v) => v.lang.startsWith('es-419') || v.lang === 'es-US') ??
    voces.find((v) => v.lang.startsWith('es')) ??
    null
  );
}

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
