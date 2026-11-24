import { CalendarDays, Clock, MapPin, Navigation, Ticket, Users, Wallet } from 'lucide-react';
import { useState } from 'react';
import { ComoLlegar, type Destino } from '@/components/mapa';
import { BotonLeer } from '@/components/public/BotonLeer';
import { PortadaActividad } from '@/components/public/IconoCategoria';
import { TextoRevelado } from '@/components/ui/Animados';
import { Barra, Insignia } from '@/components/ui/Basicos';
import { Boton, EnlaceBoton } from '@/components/ui/Boton';
import { ModalVidrio } from '@/components/ui/ModalVidrio';
import { cuposDisponibles } from '@/services/talleres.service';
import { CATEGORIAS, type Taller } from '@/types/models';
import { formatearCosto, formatearFechaLarga, formatearRangoFechas } from '@/utils/formatters';
import { describirRangoTaller } from '@/utils/rangosEdad';

/**
 * Detalle de una actividad en una sola tarjeta grande, sin desplazamiento:
 * lo esencial con íconos grandes y frases cortas, y las acciones al final.
 */
export function DetalleActividad({ taller, alCerrar }: { taller: Taller; alCerrar: () => void }) {
  const [destino, setDestino] = useState<Destino | null>(null);
  const libres = cuposDisponibles(taller);
  const unDia = taller.fechaFin - taller.fechaInicio < 24 * 60 * 60 * 1000;
  const datos = [
    { icono: CalendarDays, etiqueta: 'Cuándo', valor: unDia ? formatearFechaLarga(taller.fechaInicio) : formatearRangoFechas(taller.fechaInicio, taller.fechaFin) },
    { icono: Clock, etiqueta: 'Horario', valor: taller.horario },
    { icono: MapPin, etiqueta: 'Dónde', valor: taller.recintoNombre },
    { icono: Users, etiqueta: 'Edad', valor: describirRangoTaller(taller.edadMin, taller.edadMax) },
    { icono: Wallet, etiqueta: 'Costo', valor: formatearCosto(taller.costo) },
  ];
  const lectura = [
    `${taller.tipo === 'taller' ? 'Taller' : 'Evento'}: ${taller.titulo}.`,
    taller.descripcion,
    `Lugar: ${taller.recintoNombre}. Horario: ${taller.horario.replace('·', ',')}.`,
    libres > 0 ? `Quedan ${libres} lugares.` : 'El cupo está lleno.',
  ].join(' ');

  return (
    <ModalVidrio alCerrar={alCerrar} etiquetadoPor="detalle-titulo">
      <article className="tarjeta overflow-hidden shadow-2xl">
        <div className="relative">
          <PortadaActividad categoria={taller.categoria} imagenUrl={taller.imagenUrl} className="h-[clamp(5.5rem,16dvh,9rem)]" />
          <div className="absolute bottom-3 left-4 flex flex-wrap gap-1.5">
            <Insignia tono="marca">{taller.tipo === 'taller' ? 'Taller' : 'Evento'}</Insignia>
            <Insignia>{CATEGORIAS[taller.categoria]}</Insignia>
          </div>
        </div>
        <div className="banda-rebozo" aria-hidden />

        <div className="flex flex-col gap-4 p-5 sm:p-7">
          <div className="flex flex-col gap-1.5">
            <h2 id="detalle-titulo" className="text-3xl leading-tight font-bold">
              {taller.titulo}
            </h2>
            <TextoRevelado className="text-lg" partes={[taller.descripcion]} />
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {datos.map(({ icono: Icono, etiqueta, valor }) => (
              <div key={etiqueta} className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-marca/10 text-marca">
                  <Icono aria-hidden className="size-5.5" />
                </span>
                <div className="min-w-0">
                  <dt className="text-sm text-tenue">{etiqueta}</dt>
                  <dd className="leading-snug font-bold">{valor}</dd>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-marca/10 text-marca">
                <Ticket aria-hidden className="size-5.5" />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-sm text-tenue">Lugares</dt>
                <dd className="flex flex-col gap-1 font-bold">
                  {libres > 0 ? `Quedan ${libres} de ${taller.cupoMaximo}` : 'Cupo lleno'}
                  <Barra valor={taller.inscritos} maximo={taller.cupoMaximo} etiqueta="Ocupación" />
                </dd>
              </div>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {libres > 0 ? (
              <EnlaceBoton to={`/taller/${taller.id}/inscripcion`} variante="acento" tamano="lg" className="flex-1 sm:flex-none">
                Inscribirme
              </EnlaceBoton>
            ) : (
              <p className="rounded-full bg-error-fondo px-4 py-2 font-semibold text-error">Ya no hay lugares</p>
            )}
            <Boton
              variante="secundario"
              tamano="lg"
              icono={<Navigation aria-hidden className="size-5" />}
              onClick={() => setDestino({ nombre: taller.recintoNombre, lat: taller.recintoUbicacion.lat, lng: taller.recintoUbicacion.lng })}
            >
              Cómo llegar
            </Boton>
            <BotonLeer texto={lectura} etiqueta="Escuchar" />
          </div>
        </div>
      </article>
      <ComoLlegar destino={destino} alCerrar={() => setDestino(null)} />
    </ModalVidrio>
  );
}
