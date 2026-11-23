import { LoaderCircle, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

export function SaltarAlContenido() {
  return (
    <a
      href="#contenido"
      className="fixed top-2 left-2 z-[60] -translate-y-24 rounded-md bg-acento px-4 py-2 font-bold text-acento-tinta focus:translate-y-0"
    >
      Saltar al contenido principal
    </a>
  );
}

type TonoInsignia = 'neutro' | 'marca' | 'ok' | 'error' | 'aviso';
const TONOS: Record<TonoInsignia, string> = {
  neutro: 'bg-tinta/8 text-tinta',
  marca: 'bg-marca/12 text-marca',
  ok: 'bg-ok-fondo text-ok',
  error: 'bg-error-fondo text-error',
  aviso: 'bg-aviso-fondo text-aviso',
};

export function Insignia({ tono = 'neutro', children }: { tono?: TonoInsignia; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${TONOS[tono]}`}>{children}</span>
  );
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-tenue">
      <LoaderCircle aria-hidden className="size-6 animate-spin" />
      <span>{texto}</span>
    </div>
  );
}

export function Vacio({ icono: Icono, titulo, children }: { icono: LucideIcon; titulo: string; children?: ReactNode }) {
  return (
    <div className="tarjeta flex flex-col items-center gap-3 px-6 py-10 text-center">
      <Icono aria-hidden className="size-10 text-tenue" />
      <p className="text-lg font-bold">{titulo}</p>
      {children && <div className="text-sm text-tenue">{children}</div>}
    </div>
  );
}

export function Alerta({ tono = 'aviso', titulo, children }: { tono?: 'aviso' | 'error' | 'ok' | 'info'; titulo?: string; children: ReactNode }) {
  const estilos = {
    aviso: 'bg-aviso-fondo border-aviso text-tinta',
    error: 'bg-error-fondo border-error text-tinta',
    ok: 'bg-ok-fondo border-ok text-tinta',
    info: 'bg-marca/6 border-marca text-tinta',
  }[tono];
  return (
    <div className={`rounded-lg border-l-4 p-3 text-sm ${estilos}`} role={tono === 'error' ? 'alert' : undefined}>
      {titulo && <p className="mb-1 font-bold">{titulo}</p>}
      {children}
    </div>
  );
}

/** Barra de progreso accesible (cupo, ocupación). */
export function Barra({ valor, maximo, etiqueta }: { valor: number; maximo: number; etiqueta: string }) {
  const pct = maximo > 0 ? Math.min(100, Math.round((valor / maximo) * 100)) : 0;
  const color = pct >= 100 ? 'bg-error' : pct >= 80 ? 'bg-aviso' : 'bg-ok';
  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={maximo}
      aria-valuenow={valor}
      className="h-2 w-full overflow-hidden rounded-full bg-tinta/10"
    >
      <div className={`h-full rounded-full transition-[width] ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Modal accesible basado en <dialog>: el navegador gestiona el foco, Esc y el fondo inerte. */
export function Modal({
  abierto,
  alCerrar,
  titulo,
  children,
  ancho = 'clamp(20rem, 60vw, 48rem)',
}: {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  children: ReactNode;
  ancho?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onClose={alCerrar}
      aria-labelledby="modal-titulo"
      className="m-auto max-h-[92dvh] w-[94vw] rounded-xl border-2 border-linea bg-superficie p-0 text-tinta shadow-2xl"
      style={{ maxWidth: ancho }}
    >
      {abierto && (
        <div className="flex max-h-[92dvh] flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-linea px-6 py-4">
            <h2 id="modal-titulo" className="text-xl font-bold">
              {titulo}
            </h2>
            <button type="button" onClick={alCerrar} className="toque rounded-md text-2xl leading-none hover:bg-tinta/6" aria-label="Cerrar">
              ×
            </button>
          </header>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
