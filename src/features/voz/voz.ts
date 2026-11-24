/**
 * Escuchar y hablar con las APIs del navegador (sin costo):
 * - SpeechRecognition: Chrome/Edge (Android y PC) y Safari (iOS/macOS). En Chrome el audio
 *   se procesa en servidores de Google, por eso requiere internet. Firefox no lo tiene.
 * - speechSynthesis: voz del propio dispositivo.
 */
import { dividirEnFrases, elegirVoz, TONO_VOZ } from '@/features/speech/useSpeech';

interface ResultadoReconocimiento {
  isFinal: boolean;
  0: { transcript: string };
}
interface EventoReconocimiento {
  resultIndex: number;
  results: ArrayLike<ResultadoReconocimiento>;
}
interface Reconocedor {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: EventoReconocimiento) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type ConstructorReconocedor = new () => Reconocedor;

const constructor = (): ConstructorReconocedor | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: ConstructorReconocedor; webkitSpeechRecognition?: ConstructorReconocedor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const puedeEscuchar = () => constructor() !== null;
export const puedeHablar = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export class ErrorEscucha extends Error {
  constructor(public codigo: string) {
    super(
      codigo === 'not-allowed' || codigo === 'service-not-allowed'
        ? 'Necesito permiso para usar el micrófono. Actívalo en la configuración del navegador.'
        : codigo === 'network'
          ? 'El reconocimiento de voz necesita internet. Puedes escribir tu respuesta.'
          : codigo === 'no-speech'
            ? 'No te escuché. Toca el micrófono e inténtalo de nuevo.'
            : 'No pude escucharte. Inténtalo de nuevo o escribe tu respuesta.',
    );
  }
}

/**
 * Escucha una frase. `alOir` recibe el texto provisional mientras la persona habla.
 * Devuelve una función para cancelar y la promesa con lo que se dijo ('' si nada).
 */
export function escuchar(alOir?: (provisional: string) => void) {
  const Ctor = constructor();
  let rec: Reconocedor | null = null;
  const promesa = new Promise<string>((resolver, rechazar) => {
    if (!Ctor) return rechazar(new ErrorEscucha('unsupported'));
    rec = new Ctor();
    rec.lang = 'es-MX';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let final = '';
    let provisional = '';
    rec.onresult = (e) => {
      provisional = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]!;
        if (r.isFinal) final += r[0].transcript;
        else provisional += r[0].transcript;
      }
      alOir?.((final + provisional).trim());
    };
    rec.onerror = (e) => {
      if (e.error === 'aborted') return resolver('');
      rechazar(new ErrorEscucha(e.error));
    };
    rec.onend = () => resolver((final || provisional).trim());
    rec.start();
  });
  return { promesa, cancelar: () => rec?.abort() };
}

let turno = 0;

/** Las voces llegan después de cargar la página en varios navegadores: se esperan un momento. */
function vocesListas(): Promise<void> {
  const s = window.speechSynthesis;
  if (s.getVoices().length) return Promise.resolve();
  return new Promise((listo) => {
    const fin = () => {
      s.removeEventListener('voiceschanged', fin);
      listo();
    };
    s.addEventListener('voiceschanged', fin);
    setTimeout(fin, 900);
  });
}

/** Dice el texto en voz alta; la promesa termina al acabar (o al callar). */
export async function decir(texto: string, velocidad = 1): Promise<void> {
  if (!puedeHablar() || !texto.trim()) return;
  const s = window.speechSynthesis;
  s.cancel();
  const id = ++turno;
  await vocesListas();
  if (id !== turno) return;
  const frases = dividirEnFrases(texto);
  const voz = elegirVoz();
  return new Promise((resolver) => {
    const siguiente = () => {
      const frase = frases.shift();
      if (id !== turno || !frase) return resolver();
      const u = new SpeechSynthesisUtterance(frase);
      u.lang = voz?.lang ?? 'es-MX';
      if (voz) u.voice = voz;
      u.rate = velocidad;
      u.pitch = TONO_VOZ;
      u.onend = siguiente;
      u.onerror = () => resolver();
      s.speak(u);
    };
    siguiente();
  });
}

export function callar() {
  turno++;
  if (puedeHablar()) window.speechSynthesis.cancel();
}
