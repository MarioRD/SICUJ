import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

type Desde = 'start' | 'end' | 'center' | 'edges' | 'random';

export interface TextMorphProps {
  /** Palabras entre las que se transforma. */
  words?: string[];
  /** liquid: las letras viejas se adelgazan y las nuevas crecen; blur: salen y entran de foco. */
  morph?: 'liquid' | 'blur';
  /** Segundos entre palabras (modo automático). */
  interval?: number;
  /** Segundos que dura cada transformación. */
  duration?: number;
  /** Fracción de la duración repartida entre letras (0–0.9). */
  stagger?: number;
  staggerFrom?: Desde;
  trigger?: 'auto' | 'hover' | 'click';
  loop?: boolean;
  startOnView?: boolean;
  pauseOnHover?: boolean;
  paused?: boolean;
  onChange?: (word: string, index: number) => void;
  className?: string;
  style?: CSSProperties;
}

const CURVA = 'cubic-bezier(0.34, 1.36, 0.64, 1)';
const SUAVE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const quieto = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.movimiento === 'reducido');

/** Clave estable por letra: la 2.ª "a" de una palabra se empareja con la 2.ª "a" de la siguiente. */
function letras(palabra: string) {
  const vistas = new Map<string, number>();
  return Array.from(palabra).map((c) => {
    const k = c.toLowerCase();
    const n = (vistas.get(k) ?? 0) + 1;
    vistas.set(k, n);
    return { c, clave: `${k}·${n}` };
  });
}

function orden(i: number, n: number, desde: Desde) {
  if (n < 2) return 0;
  const centro = (n - 1) / 2;
  switch (desde) {
    case 'end':
      return (n - 1 - i) / (n - 1);
    case 'center':
      return Math.abs(i - centro) / centro;
    case 'edges':
      return 1 - Math.abs(i - centro) / centro;
    case 'random':
      return Math.random();
    default:
      return i / (n - 1);
  }
}

/**
 * Transforma una palabra en otra letra por letra: las letras que comparten se
 * deslizan a su nuevo lugar, las que sobran se desvanecen y las nuevas aparecen.
 * Con "menos animaciones" solo cambia la palabra.
 */
export function TextMorph({
  words = ['Cultura', 'Juventud', 'Coacalco'],
  morph = 'liquid',
  interval = 2.6,
  duration = 1.1,
  stagger = 0.25,
  staggerFrom = 'start',
  trigger = 'auto',
  loop = true,
  startOnView = true,
  pauseOnHover = false,
  paused = false,
  onChange,
  className = '',
  style,
}: TextMorphProps) {
  const lista = words.length ? words : [''];
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(!startOnView);
  const [encima, setEncima] = useState(false);
  const caja = useRef<HTMLSpanElement>(null);
  const fantasmas = useRef<HTMLSpanElement>(null);
  const nodos = useRef(new Map<string, HTMLSpanElement>());
  const previo = useRef<{ ancho: number; pos: Map<string, { x: number; y: number; c: string }> } | null>(null);
  const palabra = lista[i % lista.length] ?? '';

  const avanzar = () => {
    const el = caja.current;
    if (el) {
      // Foto de dónde está cada letra antes de cambiar
      const base = el.getBoundingClientRect();
      const pos = new Map<string, { x: number; y: number; c: string }>();
      nodos.current.forEach((n, clave) => {
        const r = n.getBoundingClientRect();
        pos.set(clave, { x: r.left - base.left, y: r.top - base.top, c: n.textContent ?? '' });
      });
      previo.current = { ancho: base.width, pos };
    }
    setI((n) => {
      const sig = n + 1;
      if (!loop && sig >= lista.length) return n;
      return sig % lista.length;
    });
  };
  const avanzarRef = useRef(avanzar);
  avanzarRef.current = avanzar;

  useEffect(() => {
    if (!startOnView || !caja.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting));
    io.observe(caja.current);
    return () => io.disconnect();
  }, [startOnView]);

  const detenido = paused || !visible || (pauseOnHover && encima) || lista.length < 2;
  useEffect(() => {
    if (trigger !== 'auto' || detenido) return;
    const t = setInterval(() => !document.hidden && avanzarRef.current(), interval * 1000);
    return () => clearInterval(t);
  }, [trigger, detenido, interval]);

  useEffect(() => {
    onChange?.(palabra, i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useLayoutEffect(() => {
    const el = caja.current;
    const antes = previo.current;
    previo.current = null;
    if (!el || !antes || quieto()) return;
    const ms = duration * 1000;
    const base = el.getBoundingClientRect();
    const actuales = letras(palabra);
    const n = actuales.length;
    const retraso = (k: number, total: number) => orden(k, total, staggerFrom) * stagger * ms;

    // Ancho del contenedor: crece o encoge con suavidad
    el.animate([{ width: `${antes.ancho}px` }, { width: `${base.width}px` }], { duration: ms * 0.8, easing: SUAVE });

    actuales.forEach(({ clave }, k) => {
      const nodo = nodos.current.get(clave);
      if (!nodo) return;
      const r = nodo.getBoundingClientRect();
      const viejo = antes.pos.get(clave);
      if (viejo) {
        // Letra compartida: se desliza desde su lugar anterior
        const dx = viejo.x - (r.left - base.left);
        const dy = viejo.y - (r.top - base.top);
        nodo.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
          duration: ms * 0.85,
          delay: retraso(k, n) * 0.5,
          easing: CURVA,
          fill: 'backwards',
        });
      } else {
        const desde =
          morph === 'blur'
            ? { opacity: 0, filter: 'blur(10px)', transform: 'scale(1.25)' }
            : { opacity: 0, filter: 'blur(4px)', transform: 'translateY(0.35em) scale(0.35, 1.4)' };
        nodo.animate([desde, { opacity: 1, filter: 'blur(0)', transform: 'none' }], {
          duration: ms * 0.7,
          delay: ms * 0.15 + retraso(k, n),
          easing: CURVA,
          fill: 'backwards',
        });
      }
    });

    // Letras que ya no están: se quedan donde estaban y se desvanecen
    const capa = fantasmas.current;
    if (!capa) return;
    const claves = new Set(actuales.map((a) => a.clave));
    const salen = [...antes.pos].filter(([clave]) => !claves.has(clave));
    salen.forEach(([, p], k) => {
      const g = document.createElement('span');
      g.textContent = p.c;
      g.className = 'text-morph-fantasma';
      g.style.left = `${p.x}px`;
      g.style.top = `${p.y}px`;
      capa.append(g);
      const hacia =
        morph === 'blur'
          ? { opacity: 0, filter: 'blur(10px)', transform: 'scale(0.8)' }
          : { opacity: 0, filter: 'blur(3px)', transform: 'translateY(-0.3em) scale(0.15, 1.3)' };
      g.animate([{ opacity: 1 }, hacia], { duration: ms * 0.55, delay: retraso(k, salen.length) * 0.6, easing: SUAVE, fill: 'both' }).onfinish = () =>
        g.remove();
    });
  }, [palabra]);

  const actuales = letras(palabra);
  return (
    <span
      className={`text-morph ${className}`}
      style={style}
      onPointerEnter={() => {
        setEncima(true);
        if (trigger === 'hover') avanzar();
      }}
      onPointerLeave={() => setEncima(false)}
      onClick={trigger === 'click' ? avanzar : undefined}
    >
      <span className="solo-lectores">{lista.join(', ')}</span>
      <span ref={caja} className="text-morph-caja" aria-hidden>
        {actuales.map(({ c, clave }) => (
          <span
            key={clave}
            ref={(n) => {
              if (n) nodos.current.set(clave, n);
              else nodos.current.delete(clave);
            }}
            className="text-morph-letra"
          >
            {c === ' ' ? ' ' : c}
          </span>
        ))}
        <span ref={fantasmas} className="text-morph-capa" />
      </span>
    </span>
  );
}

export default TextMorph;
