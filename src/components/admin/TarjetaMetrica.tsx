import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/** Tarjeta de indicador. Destella brevemente cuando el valor cambia en vivo. */
export function TarjetaMetrica({ etiqueta, valor, detalle, icono: Icono }: { etiqueta: string; valor: number; detalle?: string; icono: LucideIcon }) {
  const anterior = useRef(valor);
  const [destello, setDestello] = useState(false);
  useEffect(() => {
    if (anterior.current !== valor) {
      anterior.current = valor;
      setDestello(true);
      const t = setTimeout(() => setDestello(false), 900);
      return () => clearTimeout(t);
    }
  }, [valor]);

  return (
    <div className={`tarjeta flex items-start gap-4 p-5 transition-shadow ${destello ? 'shadow-[0_0_0_3px_var(--c-acento)]' : ''}`}>
      <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-marca/10 text-marca">
        <Icono aria-hidden className="size-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-tenue">{etiqueta}</p>
        <p className="text-3xl leading-tight font-bold tabular-nums">{valor.toLocaleString('es-MX')}</p>
        {detalle && <p className="text-xs text-tenue">{detalle}</p>}
      </div>
    </div>
  );
}
