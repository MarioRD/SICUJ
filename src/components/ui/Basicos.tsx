import { LoaderCircle, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

export function SaltarAlContenido() {
  return (
    <a
      href="#contenido"
      className="fixed top-2 left-2 z-[60] -translate-y-24 rounded-full bg-acento px-5 py-2 font-bold text-acento-tinta shadow-lg focus:translate-y-0"
    >
      Saltar al contenido principal
    </a>
  );
}

type TonoInsignia = 'neutro' | 'marca' | 'ok' | 'error' | 'aviso';
const TONOS: Record<TonoInsignia, string> = {
  neutro: 'bg-hundido text-tinta',
  marca: 'bg-marca text-marca-tinta',
  ok: 'bg-ok-fondo text-ok',
  error: 'bg-error-fondo text-error',
  aviso: 'bg-aviso-fondo text-aviso',
};

export function Insignia({ tono = 'neutro', children }: { tono?: TonoInsignia; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONOS[tono]}`}>{children}</span>
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
    <div className="tarjeta flex flex-col items-center gap-3 overflow-hidden px-6 pt-0 pb-10 text-center">
      <div className="banda-greca -mx-6 mb-5 self-stretch [--greca-color:var(--c-anil)] opacity-15" aria-hidden />
      <span className="grid size-16 place-items-center rounded-full bg-marca/8 text-marca">
        <Icono aria-hidden className="size-8" strokeWidth={1.7} />
      </span>
      <p className="fuente-display text-lg font-bold text-titulo">{titulo}</p>
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
    <div className={`rounded-lg border-l-4 px-4 py-3 text-sm ${estilos}`} role={tono === 'error' ? 'alert' : undefined}>
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
      className="h-2 w-full overflow-hidden rounded-full bg-hundido"
    >
      <div className={`h-full origin-left rounded-full transition-transform duration-(--dur-corta) ${color}`} style={{ transform: `scaleX(${pct / 100})` }} />
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
      className="m-auto max-h-[92dvh] w-[94vw] overflow-hidden rounded-2xl border border-linea bg-superficie p-0 text-tinta shadow-2xl"
      style={{ maxWidth: ancho }}
    >
      {abierto && (
        <div className="flex max-h-[92dvh] flex-col">
          <div className="banda-rebozo shrink-0" aria-hidden />
          <header className="flex items-center justify-between gap-4 border-b border-linea px-6 py-4">
            <h2 id="modal-titulo" className="text-xl font-bold">
              {titulo}
            </h2>
            <button type="button" onClick={alCerrar} className="toque grid place-items-center rounded-full hover:bg-marca/8" aria-label="Cerrar">
              <X aria-hidden className="size-5" />
            </button>
          </header>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
