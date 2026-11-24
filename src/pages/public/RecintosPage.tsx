import { Accessibility, Building2, LocateFixed, MapPin, Navigation } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ComoLlegar, Mapa, type Destino, type PuntoMapa } from '@/components/mapa';
import { TextoRotativo } from '@/components/ui/Animados';
import { Alerta, Cargando, Insignia, Vacio } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { suscribirRecintos } from '@/services/recintos.service';
import { suscribirTalleres } from '@/services/talleres.service';
import type { Recinto } from '@/types/models';
import { formatearDistancia } from '@/utils/formatters';
import { ordenarPorCercania } from '@/utils/haversine';

export default function RecintosPage() {
  const recintos = useSuscripcion<Recinto[]>((cb) => suscribirRecintos({}, cb), []);
  const talleres = useSuscripcion(suscribirTalleres.bind(null, {}), []);
  const { ubicacion, solicitar } = useGeolocation();

  const lista = useMemo(() => {
    if (!recintos) return [];
    if (ubicacion.estado !== 'listo') return recintos.map((r) => ({ ...r, distanciaKm: undefined as number | undefined }));
    return ordenarPorCercania(recintos, ubicacion.coords, (r) => r.ubicacion);
  }, [recintos, ubicacion]);

  const actividadesPorRecinto = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of talleres ?? []) m.set(t.recintoId, (m.get(t.recintoId) ?? 0) + 1);
    return m;
  }, [talleres]);

  const [destino, setDestino] = useState<Destino | null>(null);
  const puntos = useMemo<PuntoMapa[]>(
    () =>
      lista.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        direccion: r.direccion,
        lat: r.ubicacion.lat,
        lng: r.ubicacion.lng,
        distanciaKm: r.distanciaKm,
        actividades: (talleres ?? []).filter((t) => t.recintoId === r.id).map((t) => ({ id: t.id, titulo: t.titulo })),
      })),
    [lista, talleres],
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl leading-tight font-bold">
          Recintos{' '}
          <TextoRotativo
            textos={['culturales', 'juveniles', 'cerca de ti']}
            intervalo={2600}
          />
        </h1>
        <p className="text-tenue">Encuentra el espacio cultural más cercano a ti.</p>
      </header>

      {recintos && lista.length > 0 && (
        <Mapa
          puntos={puntos}
          ubicacion={ubicacion.estado === 'listo' ? ubicacion.coords : null}
          alComoLlegar={setDestino}
          alPedirUbicacion={solicitar}
          buscando={ubicacion.estado === 'buscando'}
          marco={false}
          titulo="Mapa de recintos"
        />
      )}

      {ubicacion.estado !== 'listo' && (
        <Boton
          tamano="lg"
          onClick={solicitar}
          cargando={ubicacion.estado === 'buscando'}
          icono={<LocateFixed aria-hidden className="size-5" />}
        >
          Ordenar por cercanía
        </Boton>
      )}
      {ubicacion.estado === 'error' && <Alerta tono="error">{ubicacion.mensaje}</Alerta>}
      {ubicacion.estado === 'listo' && (
        <p className="text-sm text-tenue" aria-live="polite">
          Ordenados del más cercano al más lejano (distancia en línea recta). Tu ubicación no se envía a ningún servidor.
        </p>
      )}

      {!recintos ? (
        <Cargando />
      ) : lista.length === 0 ? (
        <Vacio icono={Building2} titulo="No hay recintos registrados" />
      ) : (
        <ol className="rejilla-auto">
          {lista.map((r, i) => {
            const n = actividadesPorRecinto.get(r.id) ?? 0;
            return (
              <li key={r.id} className="tarjeta group flex flex-col overflow-hidden transition-[box-shadow,transform] duration-(--dur-corta) ease-(--curva) hover:-translate-y-0.5 hover:shadow-lg">
                {r.imagenUrl ? (
                  <div className="overflow-hidden">
                    <img src={r.imagenUrl} alt="" loading="lazy" className="zoom-imagen aspect-[16/7] w-full object-cover" />
                  </div>
                ) : (
                  <div className="banda-rebozo" aria-hidden />
                )}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg leading-tight font-bold">
                      {r.distanciaKm !== undefined && <span className="solo-lectores">Número {i + 1}: </span>}
                      {r.nombre}
                    </h2>
                    {r.distanciaKm !== undefined && (
                      <Insignia tono="marca">
                        <Navigation aria-hidden className="size-3.5" />
                        {formatearDistancia(r.distanciaKm)}
                      </Insignia>
                    )}
                  </div>
                  <p className="flex items-start gap-2 text-sm text-tenue">
                    <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
                    {r.direccion}
                  </p>
                  <p className="text-sm">{r.descripcion}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.accesible && (
                      <Insignia tono="ok">
                        <Accessibility aria-hidden className="size-3.5" /> Accesible
                      </Insignia>
                    )}
                    <Insignia>{n === 1 ? '1 actividad' : `${n} actividades`}</Insignia>
                  </div>
                  <div className="mt-auto pt-2">
                    <Boton
                      tamano="sm"
                      variante="secundario"
                      onClick={() => setDestino({ nombre: r.nombre, lat: r.ubicacion.lat, lng: r.ubicacion.lng })}
                      icono={<Navigation aria-hidden className="size-4" />}
                    >
                      Cómo llegar<span className="solo-lectores"> a {r.nombre}</span>
                    </Boton>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <ComoLlegar destino={destino} alCerrar={() => setDestino(null)} />
    </div>
  );
}
