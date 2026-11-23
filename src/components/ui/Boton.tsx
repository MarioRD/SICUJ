import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variante = 'primario' | 'secundario' | 'acento' | 'fantasma' | 'peligro';
type Tamano = 'sm' | 'md' | 'lg';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-marca text-marca-tinta border-marca hover:brightness-110',
  secundario: 'bg-superficie text-marca border-marca hover:bg-marca/8',
  acento: 'bg-acento text-acento-tinta border-acento hover:brightness-105',
  fantasma: 'bg-transparent text-tinta border-transparent hover:bg-tinta/6',
  peligro: 'bg-superficie text-error border-error hover:bg-error-fondo',
};
const TAMANOS: Record<Tamano, string> = {
  sm: 'text-sm px-3 gap-1.5 min-h-[calc(var(--toque-min)*0.8)]',
  md: 'text-base px-4 gap-2 min-h-(--toque-min)',
  lg: 'text-lg px-6 gap-2.5 min-h-[calc(var(--toque-min)*1.15)]',
};

export function clasesBoton(variante: Variante = 'primario', tamano: Tamano = 'md', extra = '') {
  return `inline-flex items-center justify-center rounded-lg border-2 font-semibold transition select-none disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${TAMANOS[tamano]} ${extra}`;
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  icono?: ReactNode;
}

export function Boton({ variante, tamano, cargando, icono, children, className = '', disabled, type = 'button', ...resto }: Props) {
  return (
    <button
      type={type}
      className={clasesBoton(variante, tamano, className)}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando ? <LoaderCircle aria-hidden className="size-[1.2em] animate-spin" /> : icono}
      {children}
    </button>
  );
}

interface PropsEnlace extends LinkProps {
  variante?: Variante;
  tamano?: Tamano;
  icono?: ReactNode;
}

export function EnlaceBoton({ variante, tamano, icono, children, className = '', ...resto }: PropsEnlace) {
  return (
    <Link className={clasesBoton(variante, tamano, className)} {...resto}>
      {icono}
      {children}
    </Link>
  );
}
