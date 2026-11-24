import { BookOpen, CarFront, Drama, Footprints, Languages, Megaphone, Music, Palette, Sparkles, Swords, Users, type LucideIcon } from 'lucide-react';
import type { Categoria } from '@/types/models';

const ICONOS: Record<Categoria, LucideIcon> = {
  musica: Music,
  danza: Footprints,
  artes_plasticas: Palette,
  teatro: Drama,
  literatura: BookOpen,
  idiomas: Languages,
  cultura_pop: Swords,
  autos: CarFront,
  juventud: Users,
  campanas: Megaphone,
  otro: Sparkles,
};

/* Sin imagen: cada disciplina toma un color de la marca + rombos (ver `.portada-*` en index.css). */

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
    return <img src={imagenUrl} alt="" loading="lazy" decoding="async" className={`zoom-imagen w-full object-cover ${className}`} />;
  }
  const Icono = ICONOS[categoria];
  return (
    <div aria-hidden className={`portada portada-${categoria} grid w-full place-items-center ${className}`}>
      <span className="zoom-imagen grid size-[clamp(4.5rem,20vmin,6rem)] rotate-45 place-items-center rounded-2xl border-2 border-current/40 bg-current/10">
        <Icono className="size-[clamp(2.2rem,10vmin,3rem)] -rotate-45" strokeWidth={1.6} />
      </span>
    </div>
  );
}
