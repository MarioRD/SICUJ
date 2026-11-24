import { Clock, MapPin, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Barra, Insignia } from '@/components/ui/Basicos';
import { cuposDisponibles } from '@/services/talleres.service';
import { CATEGORIAS, type Taller } from '@/types/models';
import { formatearCosto, formatearDistancia, formatearRangoFechas } from '@/utils/formatters';
import { PortadaActividad } from './IconoCategoria';

const ZONA = 'America/Mexico_City';
const fmtDiaSemana = new Intl.DateTimeFormat('es-MX', { weekday: 'long', timeZone: ZONA });
const fmtDiaMes = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: ZONA });

/** Fecha destacada: el inicio si aún no empieza; si ya empezó, hasta cuándo sigue. */
function fechaDestacada(t: Taller, ahora = Date.now()) {
  const enCurso = t.fechaInicio <= ahora;
  const ms = enCurso ? t.fechaFin : t.fechaInicio;
  const partes = fmtDiaMes.formatToParts(ms);
  const dia = partes.find((p) => p.type === 'day')?.value ?? '';
  const mes = (partes.find((p) => p.type === 'month')?.value ?? '').replace('.', '');
  return {
    arriba: enCurso ? 'En curso · hasta' : fmtDiaSemana.format(ms),
    fecha: `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${dia}`,
  };
}

export function TarjetaTaller({ taller, distanciaKm, alAbrir }: { taller: Taller; distanciaKm?: number; alAbrir?: (t: Taller) => void }) {
  const libres = cuposDisponibles(taller);
  const { arriba, fecha } = fechaDestacada(taller);
  return (
    <article className="tarjeta tarjeta-actividad group relative flex flex-col gap-3.5 p-3.5 transition-[box-shadow,transform] duration-(--dur-corta) ease-(--curva) hover:-translate-y-0.5 hover:shadow-lg focus-within:shadow-lg">
      <header className="flex items-start justify-between gap-3 px-1 pt-1">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs font-bold tracking-wide text-marca uppercase">{taller.tipo === 'taller' ? 'Taller' : 'Evento'}</p>
          <p className="text-sm leading-snug text-tenue">{CATEGORIAS[taller.categoria]}</p>
        </div>
        <p className="flex shrink-0 flex-col items-end text-right">
          <span className="text-[0.68rem] font-bold tracking-widest text-tenue uppercase">{arriba}</span>
          <span className="fuente-display text-[1.75rem] leading-none font-extrabold">{fecha}</span>
          <span className="solo-lectores">{formatearRangoFechas(taller.fechaInicio, taller.fechaFin)}</span>
        </p>
      </header>

      <div className="relative overflow-hidden rounded-[1.35rem]">
        <PortadaActividad categoria={taller.categoria} imagenUrl={taller.imagenUrl} className="aspect-[16/10]" />
        <span className="absolute top-2.5 left-2.5 rounded-full bg-superficie shadow-sm">
          <Insignia tono="ok">{formatearCosto(taller.costo)}</Insignia>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-1">
        <h3 className="text-lg leading-tight font-bold">
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
            className="after:absolute after:inset-0 after:rounded-[inherit] focus:outline-none focus-visible:after:outline-3 focus-visible:after:-outline-offset-4 focus-visible:after:outline-(--c-foco) group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
            {taller.titulo}
          </Link>
        </h3>
        <ul className="flex flex-col gap-1.5 text-sm text-tenue">
          <li className="flex items-center gap-2">
            <MapPin aria-hidden className="size-4 shrink-0" />
            <span className="truncate">{taller.recintoNombre}</span>
          </li>
          <li className="flex items-center gap-2">
            <Clock aria-hidden className="size-4 shrink-0" />
            {taller.horario}
          </li>
          {distanciaKm !== undefined && (
            <li className="flex items-center gap-2 font-semibold text-marca">
              <Navigation aria-hidden className="size-4 shrink-0" />A {formatearDistancia(distanciaKm)} de ti
            </li>
          )}
        </ul>
      </div>

      <div className="flex flex-col gap-1.5 px-1 pb-1">
        <p className="text-center text-sm font-semibold">
          {libres > 0 ? `${libres} de ${taller.cupoMaximo} lugares disponibles` : 'Cupo lleno'}
        </p>
        <Barra valor={taller.inscritos} maximo={taller.cupoMaximo} etiqueta={`Ocupación de ${taller.titulo}`} />
      </div>
    </article>
  );
}
