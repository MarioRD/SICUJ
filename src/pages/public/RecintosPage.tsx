import { Accessibility, Building2, LocateFixed, MapPin, Navigation } from 'lucide-react';
import { useMemo } from 'react';
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

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Recintos culturales</h1>
        <p className="text-tenue">Encuentra el espacio cultural más cercano a ti.</p>
      </header>

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
            const rutaUrl = `https://www.openstreetmap.org/directions?to=${r.ubicacion.lat}%2C${r.ubicacion.lng}`;
            return (
              <li key={r.id} className="tarjeta flex flex-col overflow-hidden">
                {r.imagenUrl && <img src={r.imagenUrl} alt="" loading="lazy" className="aspect-[16/7] w-full object-cover" />}
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
                  <a
                    href={rutaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto pt-2 text-sm font-semibold text-marca underline"
                  >
                    Cómo llegar<span className="solo-lectores"> a {r.nombre} (se abre en otra pestaña)</span>
                  </a>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
