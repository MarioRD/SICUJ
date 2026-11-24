import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

/**
 * Vidrio líquido: una lente con bisel que refracta (desplaza) lo que hay detrás,
 * con una ligera separación cromática en el canto. Se construye un mapa de
 * desplazamiento a la medida del elemento y se aplica con
 * `backdrop-filter: url(#filtro)` (solo Chromium lo soporta). En Safari y Firefox
 * queda como vidrio esmerilado (clase `.vidrio`), sin perder legibilidad.
 */

const MAPAS = new Map<string, string>();

function mapaRefraccion(ancho: number, alto: number, radio: number, bisel: number) {
  const clave = `${ancho}x${alto}:${radio}:${bisel}`;
  const enCache = MAPAS.get(clave);
  if (enCache) return enCache;
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  if (!ctx) return null;
  const img = ctx.createImageData(ancho, alto);
  const r = Math.min(radio, ancho / 2, alto / 2);
  const mx = ancho / 2;
  const my = alto / 2;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const px = x + 0.5 - mx;
      const py = y + 0.5 - my;
      const qx = Math.abs(px) - (mx - r);
      const qy = Math.abs(py) - (my - r);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const distancia = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
      let nx = 0;
      let ny = 0;
      if (qx > 0 && qy > 0) {
        const l = Math.hypot(ox, oy) || 1;
        nx = (ox / l) * Math.sign(px);
        ny = (oy / l) * Math.sign(py);
      } else if (qx > qy) nx = Math.sign(px);
      else ny = Math.sign(py);
      const dentro = -distancia;
      const t = dentro >= bisel ? 0 : dentro <= 0 ? 1 : 1 - dentro / bisel;
      const pendiente = Math.pow(t, 2.2);
      const i = (y * ancho + x) * 4;
      img.data[i] = Math.round(128 + 127 * nx * pendiente);
      img.data[i + 1] = Math.round(128 + 127 * ny * pendiente);
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = lienzo.toDataURL();
  if (MAPAS.size > 40) MAPAS.clear();
  MAPAS.set(clave, url);
  return url;
}

let soporteCache: boolean | null = null;
function soportaLiquido() {
  if (soporteCache !== null) return soporteCache;
  if (typeof window === 'undefined') return (soporteCache = false);
  const ua = navigator.userAgent;
  const safari = /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);
  if (safari || /Firefox/.test(ua)) return (soporteCache = false);
  if (window.matchMedia?.('(prefers-reduced-transparency: reduce)').matches) return (soporteCache = false);
  return (soporteCache = window.CSS?.supports?.('backdrop-filter', 'url(#a)') ?? false);
}

type Props = HTMLAttributes<HTMLElement> & {
  as?: keyof HTMLElementTagNameMap;
  /** Solo cuando `as` es un botón. */
  type?: 'button' | 'submit';
  /** Fuerza de la refracción en px. */
  fuerza?: number;
  /** Ancho del bisel en px (la zona del canto que dobla la luz). */
  bisel?: number;
  /** Separación cromática (0–1). */
  dispersion?: number;
  /** Desenfoque adicional (px) para que el texto encima siga legible. */
  escarcha?: number;
  children?: ReactNode;
  [dato: `data-${string}`]: string | undefined;
};

export const Vidrio = forwardRef<HTMLElement, Props>(function Vidrio(
  { as = 'div', fuerza = 22, bisel = 16, dispersion = 0.35, escarcha = 1.5, className = '', style, children, ...resto },
  refExterno,
) {
  const ref = useRef<HTMLElement>(null);
  useImperativeHandle(refExterno, () => ref.current as HTMLElement);
  const id = `vidrio-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const [mapa, setMapa] = useState<{ url: string; w: number; h: number } | null>(null);
  const [liquido] = useState(soportaLiquido);

  const medir = useCallback(() => {
    const el = ref.current;
    if (!el || !liquido) return;
    const w = Math.round(el.offsetWidth);
    const h = Math.round(el.offsetHeight);
    if (w < 8 || h < 8) return;
    const radio = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    const url = mapaRefraccion(w, h, radio, Math.min(bisel, w / 2, h / 2));
    if (url) setMapa((m) => (m && m.url === url ? m : { url, w, h }));
  }, [bisel, liquido]);

  useEffect(() => {
    if (!liquido) return;
    const el = ref.current;
    if (!el) return;
    let cuadro = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(medir);
    });
    ro.observe(el);
    medir();
    return () => {
      cancelAnimationFrame(cuadro);
      ro.disconnect();
    };
  }, [medir, liquido]);

  const filtro = mapa ? `url(#${id}) blur(${escarcha}px) saturate(1.7) brightness(1.04)` : undefined;
  const separacion = fuerza * 0.12 * dispersion;

  return createElement(
    as,
    {
      ...resto,
      ref,
      className: `vidrio ${className}`,
      'data-liquido': mapa ? 'si' : undefined,
      style: { ...(filtro ? { backdropFilter: filtro, WebkitBackdropFilter: filtro } : null), ...style } as CSSProperties,
    },
    mapa && (
      <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feImage href={mapa.url} x="0" y="0" width={mapa.w} height={mapa.h} preserveAspectRatio="none" result="mapa" />
          <feDisplacementMap in="SourceGraphic" in2="mapa" scale={-(fuerza + separacion) * 2} xChannelSelector="R" yChannelSelector="G" result="dr" />
          <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feDisplacementMap in="SourceGraphic" in2="mapa" scale={-fuerza * 2} xChannelSelector="R" yChannelSelector="G" result="dg" />
          <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feDisplacementMap in="SourceGraphic" in2="mapa" scale={-(fuerza - separacion) * 2} xChannelSelector="R" yChannelSelector="G" result="db" />
          <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feBlend in="r" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b" mode="screen" />
        </filter>
      </svg>
    ),
    children,
  );
});
