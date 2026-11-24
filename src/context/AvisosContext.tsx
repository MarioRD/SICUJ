import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type TipoAviso = 'exito' | 'error' | 'info';
interface Aviso {
  id: number;
  tipo: TipoAviso;
  mensaje: string;
}

const Contexto = createContext<((mensaje: string, tipo?: TipoAviso) => void) | null>(null);

const ESTILOS: Record<TipoAviso, string> = {
  exito: 'bg-ok-fondo text-ok border-ok',
  error: 'bg-error-fondo text-error border-error',
  info: 'text-tinta border-linea',
};
const ICONOS = { exito: CheckCircle2, error: TriangleAlert, info: Info };

/** Notificaciones breves. Se anuncian a lectores de pantalla mediante aria-live. */
export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const quitar = useCallback((id: number) => setAvisos((a) => a.filter((x) => x.id !== id)), []);
  const avisar = useCallback(
    (mensaje: string, tipo: TipoAviso = 'info') => {
      const id = Date.now() + Math.random();
      setAvisos((a) => [...a.slice(-2), { id, tipo, mensaje }]);
      setTimeout(() => quitar(id), tipo === 'error' ? 7000 : 4500);
    },
    [quitar],
  );
  const valor = useMemo(() => avisar, [avisar]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4"
        style={{ bottom: 'calc(var(--alto-barra) + 0.75rem)' }}
      >
        {avisos.map((a) => {
          const Icono = ICONOS[a.tipo];
          return (
            <div
              key={a.id}
              className={`vidrio pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border p-3.5 text-sm shadow-lg ${ESTILOS[a.tipo]}`}
              style={{ animation: 'entrar-suave 360ms var(--curva-liquida) both' }}
            >
              <Icono aria-hidden className="mt-0.5 size-5 shrink-0" />
              <p className="flex-1 font-medium">{a.mensaje}</p>
              <button type="button" onClick={() => quitar(a.id)} className="rounded p-0.5" aria-label="Cerrar aviso">
                <X aria-hidden className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Contexto.Provider>
  );
}

export function useAvisos() {
  const v = useContext(Contexto);
  if (!v) throw new Error('useAvisos debe usarse dentro de AvisosProvider');
  return v;
}
