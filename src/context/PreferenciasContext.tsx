import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type TamanoTexto = 'normal' | 'grande' | 'muy_grande';

export interface Preferencias {
  altoContraste: boolean;
  tamanoTexto: TamanoTexto;
  reducirMovimiento: boolean;
  velocidadVoz: number;
}

const ESCALAS: Record<TamanoTexto, number> = { normal: 1, grande: 1.15, muy_grande: 1.3 };
const CLAVE = 'sicuj:preferencias';
const POR_DEFECTO: Preferencias = { altoContraste: false, tamanoTexto: 'normal', reducirMovimiento: false, velocidadVoz: 1 };

function cargar(): Preferencias {
  try {
    return { ...POR_DEFECTO, ...(JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as Partial<Preferencias>) };
  } catch {
    return POR_DEFECTO;
  }
}

interface Valor {
  preferencias: Preferencias;
  cambiar: (cambios: Partial<Preferencias>) => void;
}

const Contexto = createContext<Valor | null>(null);

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const [preferencias, setPreferencias] = useState(cargar);

  useEffect(() => {
    const html = document.documentElement;
    if (preferencias.altoContraste) html.dataset.contraste = 'alto';
    else delete html.dataset.contraste;
    if (preferencias.reducirMovimiento) html.dataset.movimiento = 'reducido';
    else delete html.dataset.movimiento;
    html.style.setProperty('--escala-texto', String(ESCALAS[preferencias.tamanoTexto]));
    try {
      localStorage.setItem(CLAVE, JSON.stringify(preferencias));
    } catch {
      /* sin almacenamiento: las preferencias duran solo esta visita */
    }
  }, [preferencias]);

  const valor = useMemo<Valor>(
    () => ({ preferencias, cambiar: (c) => setPreferencias((p) => ({ ...p, ...c })) }),
    [preferencias],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePreferencias() {
  const v = useContext(Contexto);
  if (!v) throw new Error('usePreferencias debe usarse dentro de PreferenciasProvider');
  return v;
}
