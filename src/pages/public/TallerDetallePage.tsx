import { ArrowLeft, CalendarDays, Clock, MapPin, User, Users, Wallet } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Barra, Cargando, Insignia, Vacio } from '@/components/ui/Basicos';
import { EnlaceBoton } from '@/components/ui/Boton';
import { BotonLeer } from '@/components/public/BotonLeer';
import { PortadaActividad } from '@/components/public/IconoCategoria';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { cuposDisponibles, estaVigente, suscribirTaller } from '@/services/talleres.service';
import { CATEGORIAS, type Taller } from '@/types/models';
import { formatearCosto, formatearFechaLarga, formatearRangoFechas } from '@/utils/formatters';
import { describirRangoTaller } from '@/utils/rangosEdad';

function textoParaLeer(t: Taller) {
  const libres = cuposDisponibles(t);
  return [
    `${t.tipo === 'taller' ? 'Taller' : 'Evento'}: ${t.titulo}.`,
    t.descripcion,
    `Lugar: ${t.recintoNombre}.`,
    `Inicia el ${formatearFechaLarga(t.fechaInicio)}. Horario: ${t.horario.replace('·', ',')}.`,
    `${describirRangoTaller(t.edadMin, t.edadMax)}. Costo: ${formatearCosto(t.costo)}.`,
    t.instructor ? `Imparte: ${t.instructor}.` : '',
    libres > 0 ? `Quedan ${libres} lugares.` : 'El cupo está lleno.',
  ].join(' ');
}

export default function TallerDetallePage() {
  const { id = '' } = useParams();
  const taller = useSuscripcion<Taller | null>((cb) => suscribirTaller(id, cb), [id]);

  if (taller === undefined) return <Cargando />;
  if (!taller || !estaVigente(taller)) {
    return (
      <Vacio icono={CalendarDays} titulo="Esta actividad ya no está disponible">
        <Link to="/" className="font-semibold text-marca underline">
          Ver otras actividades
        </Link>
      </Vacio>
    );
  }

  const libres = cuposDisponibles(taller);
  const mapa = `https://www.openstreetmap.org/?mlat=${taller.recintoUbicacion.lat}&mlon=${taller.recintoUbicacion.lng}#map=17/${taller.recintoUbicacion.lat}/${taller.recintoUbicacion.lng}`;

  const datos = [
    { icono: CalendarDays, etiqueta: 'Fechas', valor: formatearRangoFechas(taller.fechaInicio, taller.fechaFin) },
    { icono: Clock, etiqueta: 'Horario', valor: taller.horario },
    { icono: Users, etiqueta: 'Edad', valor: describirRangoTaller(taller.edadMin, taller.edadMax) },
    { icono: Wallet, etiqueta: 'Costo', valor: formatearCosto(taller.costo) },
    ...(taller.instructor ? [{ icono: User, etiqueta: 'Imparte', valor: taller.instructor }] : []),
  ];

  return (
    <article className="flex flex-col gap-5">
      <Link to="/" className="toque inline-flex w-fit items-center gap-2 font-semibold text-marca">
        <ArrowLeft aria-hidden className="size-5" /> Volver
      </Link>

      <div className="tarjeta overflow-hidden">
        <PortadaActividad categoria={taller.categoria} imagenUrl={taller.imagenUrl} className="aspect-[16/8] max-h-[45vh]" />
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-1.5">
            <Insignia tono="marca">{taller.tipo === 'taller' ? 'Taller' : 'Evento'}</Insignia>
            <Insignia>{CATEGORIAS[taller.categoria]}</Insignia>
          </div>
          <h1 className="text-3xl leading-tight font-bold">{taller.titulo}</h1>
          <BotonLeer texto={textoParaLeer(taller)} etiqueta="Escuchar información" />
          <p className="leading-relaxed">{taller.descripcion}</p>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {datos.map(({ icono: Icono, etiqueta, valor }) => (
              <div key={etiqueta} className="flex items-start gap-3 rounded-lg bg-fondo p-3">
                <Icono aria-hidden className="mt-0.5 size-5 shrink-0 text-marca" />
                <div>
                  <dt className="text-xs font-semibold text-tenue uppercase">{etiqueta}</dt>
                  <dd className="font-semibold">{valor}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="flex items-start gap-3 rounded-lg border border-linea p-3">
            <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-marca" />
            <div className="flex-1">
              <p className="font-semibold">{taller.recintoNombre}</p>
              <a href={mapa} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-marca underline">
                Ver en el mapa<span className="solo-lectores"> (se abre en otra pestaña)</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-semibold">{libres > 0 ? `${libres} de ${taller.cupoMaximo} lugares disponibles` : 'Cupo lleno'}</p>
            <Barra valor={taller.inscritos} maximo={taller.cupoMaximo} etiqueta="Ocupación" />
          </div>
        </div>
      </div>

      {/* Botón principal fijo sobre la barra inferior: siempre al alcance del pulgar */}
      <div
        className="sticky z-20 -mx-1"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + var(--toque-min) * 1.25 + 0.75rem)' }}
      >
        {libres > 0 ? (
          <EnlaceBoton to={`/taller/${taller.id}/inscripcion`} variante="acento" tamano="lg" className="w-full shadow-lg">
            Inscribirme
          </EnlaceBoton>
        ) : (
          <p className="rounded-lg bg-error-fondo p-3 text-center font-semibold text-error">Ya no hay lugares disponibles</p>
        )}
      </div>
    </article>
  );
}
