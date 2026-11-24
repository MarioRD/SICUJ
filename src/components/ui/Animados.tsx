import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const prefiereQuieto = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.movimiento === 'reducido');

/**
 * Título dinámico: la palabra resaltada cambia letra por letra (de la última a la primera).
 * Para lectores de pantalla se lee una sola vez la lista completa; la animación se oculta.
 * Incluye botón de pausa (WCAG 2.2.2) y se queda quieta con movimiento reducido.
 */
export function TextoRotativo({ textos, intervalo = 2400 }: { textos: string[]; intervalo?: number }) {
  const [i, setI] = useState(0);
  const [detenido, setDetenido] = useState(false); // cursor encima, dedo encima o foco
  const quieto = prefiereQuieto();
  const palabra = useRef<HTMLSpanElement>(null);
  const fondo = useRef<HTMLSpanElement>(null);
  const anchoPrevio = useRef(0);
  const lista = textos.length ? textos : [''];

  useEffect(() => {
    if (detenido || quieto || lista.length < 2) return;
    const t = setInterval(() => {
      if (!document.hidden) setI((n) => (n + 1) % lista.length);
    }, intervalo);
    return () => clearInterval(t);
  }, [detenido, quieto, lista.length, intervalo]);

  // FLIP del fondo amarillo: crece o encoge con suavidad hasta el ancho de la nueva palabra
  useLayoutEffect(() => {
    const el = palabra.current;
    const bg = fondo.current;
    if (!el || !bg) return;
    const ancho = el.parentElement!.getBoundingClientRect().width;
    if (anchoPrevio.current && ancho) {
      bg.style.transition = 'none';
      bg.style.transform = `scaleX(${anchoPrevio.current / ancho})`;
      bg.getBoundingClientRect();
      bg.style.transition = '';
      bg.style.transform = 'scaleX(1)';
    }
    anchoPrevio.current = ancho;
  }, [i]);

  const actual = lista[i % lista.length] ?? '';
  const letras = Array.from(actual);
  return (
    <span
      className="rotativo"
      onPointerEnter={() => setDetenido(true)}
      onPointerLeave={() => setDetenido(false)}
      onPointerDown={() => setDetenido(true)}
      onPointerUp={(e) => e.pointerType !== 'mouse' && setTimeout(() => setDetenido(false), 2500)}
      title="Pasa el cursor o mantén el dedo para detener"
    >
      <span className="solo-lectores">{lista.join(', ')}</span>
      <span ref={fondo} className="rotativo-fondo" aria-hidden />
      <span ref={palabra} key={i} className="rotativo-palabra" aria-hidden>
        {letras.map((l, k) => (
          <span key={k} className="rotativo-letra" style={{ ['--i' as string]: letras.length - 1 - k }}>
            {l}
          </span>
        ))}
      </span>
    </span>
  );
}

export type Fragmento = string | { texto: string; resaltar?: boolean };

/**
 * Párrafo que aparece palabra por palabra saliendo de un desenfoque y luego
 * resalta las frases clave (hora, fecha, lugar). Arranca al entrar en pantalla.
 */
export function TextoRevelado({ partes, className = '', como: Etiqueta = 'p' }: { partes: Fragmento[]; className?: string; como?: 'p' | 'div' | 'span' }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && (setVisible(true), io.disconnect()), { threshold: 0.2 });
    io.observe(el);
    // Respaldo: si el observador no responde (p. ej. dentro de un diálogo), se muestra igual
    const respaldo = setTimeout(() => setVisible(true), 900);
    return () => {
      io.disconnect();
      clearTimeout(respaldo);
    };
  }, []);

  let n = 0;
  const nodos: ReactNode[] = [];
  partes.forEach((p, k) => {
    const { texto, resaltar } = typeof p === 'string' ? { texto: p, resaltar: false } : p;
    const palabras = texto.split(/(\s+)/).filter(Boolean);
    const piezas = palabras.map((w, j) =>
      /^\s+$/.test(w) ? (
        w
      ) : (
        <span key={j} className="revelar-palabra" style={{ ['--i' as string]: n++ }}>
          {w}
        </span>
      ),
    );
    nodos.push(
      resaltar ? (
        <mark key={k} className="resaltado" style={{ ['--i' as string]: n }}>
          {piezas}
        </mark>
      ) : (
        <span key={k}>{piezas}</span>
      ),
    );
  });

  return (
    <Etiqueta ref={ref as never} className={className} style={visible ? undefined : { visibility: 'hidden' }}>
      {visible ? nodos : partes.map((p) => (typeof p === 'string' ? p : p.texto)).join('')}
    </Etiqueta>
  );
}

/** Grupo de opciones (radio) con un indicador que se desliza con rebote líquido. */
export function ControlSegmentado<T extends string>({
  opciones,
  valor,
  alCambiar,
  etiqueta,
  className = '',
}: {
  opciones: Array<{ valor: T; texto: string }>;
  valor: T;
  alCambiar: (v: T) => void;
  etiqueta: string;
  className?: string;
}) {
  const indice = Math.max(0, opciones.findIndex((o) => o.valor === valor));
  const mover = (dir: number) => {
    const sig = opciones[(indice + dir + opciones.length) % opciones.length];
    if (!sig) return;
    alCambiar(sig.valor);
    requestAnimationFrame(() => document.getElementById(`seg-${etiqueta}-${sig.valor}`)?.focus());
  };
  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      className={`segmentado vidrio rounded-full p-1 ${className}`}
      style={{ ['--seg-n' as string]: opciones.length, ['--seg-i' as string]: indice }}
    >
      <span aria-hidden className="segmentado-indicador" />
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <button
            key={o.valor}
            id={`seg-${etiqueta}-${o.valor}`}
            type="button"
            role="radio"
            aria-checked={activo}
            tabIndex={activo ? 0 : -1}
            onClick={() => alCambiar(o.valor)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') (e.preventDefault(), mover(1));
              if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') (e.preventDefault(), mover(-1));
            }}
            className={`toque rounded-full px-3 text-sm transition-colors duration-(--dur-corta) ${activo ? 'font-bold text-marca-tinta' : 'font-semibold text-tinta hover:text-marca'}`}
          >
            {o.texto}
          </button>
        );
      })}
    </div>
  );
}
