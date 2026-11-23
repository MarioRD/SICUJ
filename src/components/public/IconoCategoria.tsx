import { BookOpen, Drama, Footprints, Music, Palette, Sparkles, Users, type LucideIcon } from 'lucide-react';
import type { Categoria } from '@/types/models';

const ICONOS: Record<Categoria, LucideIcon> = {
  musica: Music,
  danza: Footprints,
  artes_plasticas: Palette,
  teatro: Drama,
  literatura: BookOpen,
  juventud: Users,
  otro: Sparkles,
};

/** Colores de respaldo cuando una actividad no tiene imagen. */
const FONDOS: Record<Categoria, string> = {
  musica: 'linear-gradient(135deg,#0f4c5c,#1b7a8c)',
  danza: 'linear-gradient(135deg,#7a1f3d,#b23a5f)',
  artes_plasticas: 'linear-gradient(135deg,#5a3e8c,#8a64c4)',
  teatro: 'linear-gradient(135deg,#7a3e0f,#c06a1b)',
  literatura: 'linear-gradient(135deg,#2f4f2f,#4f8a4f)',
  juventud: 'linear-gradient(135deg,#123a7a,#2a6fd1)',
  otro: 'linear-gradient(135deg,#3d4a55,#66788a)',
};

export const iconoCategoria = (c: Categoria) => ICONOS[c];

export function PortadaActividad({
  categoria,
  imagenUrl,
  className = '',
}: {
  categoria: Categoria;
  imagenUrl: string | null;
  className?: string;
}) {
  if (imagenUrl) {
    return <img src={imagenUrl} alt="" loading="lazy" decoding="async" className={`w-full object-cover ${className}`} />;
  }
  const Icono = ICONOS[categoria];
  return (
    <div aria-hidden className={`grid w-full place-items-center ${className}`} style={{ background: FONDOS[categoria] }}>
      <Icono className="size-[clamp(2.5rem,12vmin,4rem)] text-white/85" strokeWidth={1.5} />
    </div>
  );
}
