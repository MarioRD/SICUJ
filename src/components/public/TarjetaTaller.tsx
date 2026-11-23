import { CalendarDays, Clock, MapPin, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Barra, Insignia } from '@/components/ui/Basicos';
import { cuposDisponibles } from '@/services/talleres.service';
import { CATEGORIAS, type Taller } from '@/types/models';
import { formatearCosto, formatearDistancia, formatearRangoFechas } from '@/utils/formatters';
import { PortadaActividad } from './IconoCategoria';

export function TarjetaTaller({ taller, distanciaKm }: { taller: Taller; distanciaKm?: number }) {
  const libres = cuposDisponibles(taller);
  return (
    <article className="tarjeta relative flex flex-col overflow-hidden transition hover:shadow-md focus-within:shadow-md">
      <PortadaActividad categoria={taller.categoria} imagenUrl={taller.imagenUrl} className="aspect-[16/7]" />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex flex-wrap gap-1.5">
          <Insignia tono="marca">{taller.tipo === 'taller' ? 'Taller' : 'Evento'}</Insignia>
          <Insignia>{CATEGORIAS[taller.categoria]}</Insignia>
          <Insignia tono="ok">{formatearCosto(taller.costo)}</Insignia>
        </div>
        <h3 className="text-lg leading-tight font-bold">
          {/* El enlace cubre toda la tarjeta (área táctil grande) */}
          <Link to={`/taller/${taller.id}`} className="after:absolute after:inset-0 focus:outline-none">
            {taller.titulo}
          </Link>
        </h3>
        <ul className="flex flex-col gap-1 text-sm text-tenue">
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
        <div className="mt-auto flex flex-col gap-1.5 pt-1">
          <p className="text-sm font-semibold">
            {libres > 0 ? `${libres} de ${taller.cupoMaximo} lugares disponibles` : 'Cupo lleno'}
          </p>
          <Barra valor={taller.inscritos} maximo={taller.cupoMaximo} etiqueta={`Ocupación de ${taller.titulo}`} />
        </div>
      </div>
    </article>
  );
}
