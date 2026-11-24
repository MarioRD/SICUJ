import { RotateCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const UMBRAL = 72;

/**
 * "Jalar para recargar" con la estética de SICUJ. El del navegador se desactiva en CSS
 * (overscroll-behavior-y: none), así que aquí va el nuestro: solo al estar arriba del todo,
 * fuera de diálogos y mapas.
 */
export function RecargarArrastrando() {
  const [jalon, setJalon] = useState(0);
  const [recargando, setRecargando] = useState(false);
  const inicio = useRef<number | null>(null);

  useEffect(() => {
    const alTocar = (e: TouchEvent) => {
      const t = e.target as Element;
      if (window.scrollY > 0 || e.touches.length > 1 || document.querySelector('dialog[open], :popover-open') || t.closest('.leaflet-container, [data-lenis-prevent], .boleto')) {
        inicio.current = null;
        return;
      }
      inicio.current = e.touches[0]!.clientY;
    };
    const alMover = (e: TouchEvent) => {
      if (inicio.current === null) return;
      const dy = e.touches[0]!.clientY - inicio.current;
      if (dy <= 0 || window.scrollY > 0) return setJalon(0);
      setJalon(Math.min(dy * 0.5, UMBRAL * 1.4));
    };
    const alSoltar = () => {
      if (inicio.current === null) return;
      inicio.current = null;
      setJalon((j) => {
        if (j >= UMBRAL) {
          setRecargando(true);
          setTimeout(() => window.location.reload(), 350);
        }
        return 0;
      });
    };
    window.addEventListener('touchstart', alTocar, { passive: true });
    window.addEventListener('touchmove', alMover, { passive: true });
    window.addEventListener('touchend', alSoltar);
    window.addEventListener('touchcancel', alSoltar);
    return () => {
      window.removeEventListener('touchstart', alTocar);
      window.removeEventListener('touchmove', alMover);
      window.removeEventListener('touchend', alSoltar);
      window.removeEventListener('touchcancel', alSoltar);
    };
  }, []);

  const visible = recargando || jalon > 4;
  const listo = recargando || jalon >= UMBRAL;
  const y = recargando ? UMBRAL : jalon;
  return (
    <div
      aria-hidden={!recargando}
      role={recargando ? 'status' : undefined}
      className="pointer-events-none fixed inset-x-0 z-50 grid justify-center"
      style={{ top: 'env(safe-area-inset-top)', opacity: visible ? 1 : 0, transform: `translateY(${y - 44}px)`, transition: jalon ? 'none' : 'transform 280ms var(--curva-liquida), opacity 200ms' }}
    >
      <span
        className={`grid size-11 place-items-center rounded-full shadow-[0_10px_24px_-8px_rgb(11_16_38/0.5)] ring-4 ring-superficie/70 transition-colors duration-(--dur-micro) ${
          listo ? 'bg-acento text-acento-tinta' : 'bg-superficie text-marca'
        }`}
      >
        <RotateCw className={`size-5 ${recargando ? 'animate-spin' : ''}`} style={recargando ? undefined : { rotate: `${(jalon / UMBRAL) * 300}deg` }} />
        {recargando && <span className="solo-lectores">Recargando…</span>}
      </span>
    </div>
  );
}
