import { CalendarDays, Clock, MapPin, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Barra, Insignia } from '@/components/ui/Basicos';
import { cuposDisponibles } from '@/services/talleres.service';
import { CATEGORIAS, type Taller } from '@/types/models';
import { formatearCosto, formatearDistancia, formatearRangoFechas } from '@/utils/formatters';
import { PortadaActividad } from './IconoCategoria';

export function TarjetaTaller({ taller, distanciaKm, alAbrir }: { taller: Taller; distanciaKm?: number; alAbrir?: (t: Taller) => void }) {
  const libres = cuposDisponibles(taller);
  return (
    <article className="tarjeta group relative flex flex-col overflow-hidden transition-[box-shadow,transform] duration-(--dur-corta) ease-(--curva) hover:-translate-y-0.5 hover:shadow-lg focus-within:shadow-lg">
      <div className="overflow-hidden">
        <PortadaActividad categoria={taller.categoria} imagenUrl={taller.imagenUrl} className="aspect-[16/7]" />
      </div>
      <div className="banda-rebozo" aria-hidden />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          <Insignia tono="marca">{taller.tipo === 'taller' ? 'Taller' : 'Evento'}</Insignia>
          <Insignia>{CATEGORIAS[taller.categoria]}</Insignia>
          <Insignia tono="ok">{formatearCosto(taller.costo)}</Insignia>
        </div>
        <h3 className="text-xl leading-tight font-bold">
          {/* El enlace cubre toda la tarjeta (área táctil grande) */}
          <Link
            to={`/taller/${taller.id}`}
            aria-haspopup={alAbrir ? 'dialog' : undefined}
            onClick={(e) => {
              // Clic normal: vista enfocada. Ctrl/Cmd + clic: abre la página en otra pestaña.
              if (!alAbrir || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              alAbrir(taller);
            }}
            className="after:absolute after:inset-0 after:rounded-xl focus:outline-none focus-visible:after:outline-3 focus-visible:after:-outline-offset-4 focus-visible:after:outline-(--c-foco) group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
            {taller.titulo}
          </Link>
        </h3>
        <ul className="flex flex-col gap-1.5 text-sm text-tenue">
          <li className="flex items-center gap-2">
            <CalendarDays aria-hidden className="size-4 shrink-0" />
            {formatearRangoFechas(taller.fechaInicio, taller.fechaFin)}
          </li>
          <li className="flex items-center gap-2">
            <Clock aria-hidden className="size-4 shrink-0" />
            {taller.horario}
          </li>
          <li className="flex items-center gap-2">
            <MapPin aria-hidden className="size-4 shrink-0" />
            <span className="truncate">{taller.recintoNombre}</span>
          </li>
          {distanciaKm !== undefined && (
            <li className="flex items-center gap-2 font-semibold text-marca">
              <Navigation aria-hidden className="size-4 shrink-0" />A {formatearDistancia(distanciaKm)} de ti
            </li>
          )}
        </ul>
        <div className="mt-auto flex flex-col gap-1.5 border-t border-linea pt-3">
          <p className="text-sm font-semibold">
            {libres > 0 ? `${libres} de ${taller.cupoMaximo} lugares disponibles` : 'Cupo lleno'}
          </p>
          <Barra valor={taller.inscritos} maximo={taller.cupoMaximo} etiqueta={`Ocupación de ${taller.titulo}`} />
        </div>
      </div>
    </article>
  );
}
