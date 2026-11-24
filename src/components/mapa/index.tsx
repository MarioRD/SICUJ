import { lazy, Suspense, type ComponentProps } from 'react';
import type { Taller } from '@/types/models';
import type { PuntoMapa } from './MapaCultural';

export type { PuntoMapa } from './MapaCultural';
export { ComoLlegar, type Destino } from './ComoLlegar';

const MapaCultural = lazy(() => import('./MapaCultural'));

/** El mapa (Leaflet) se descarga solo cuando se muestra. */
export function Mapa(props: ComponentProps<typeof MapaCultural>) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Cargando mapa"
          className={
            props.marco === false
              ? 'mapa-plano mapa-cultural animate-pulse'
              : 'mapa-cultural mx-auto aspect-[16/10] w-[min(100%,54rem)] animate-pulse max-md:aspect-[9/13] max-md:w-[min(84vw,22rem)]'
          }
        />
      }
    >
      <MapaCultural {...props} />
    </Suspense>
  );
}

/** Agrupa actividades por recinto: un marcador por lugar con sus actividades. */
export function puntosDesdeTalleres(lista: Array<{ taller: Taller; distanciaKm?: number }>): PuntoMapa[] {
  const m = new Map<string, PuntoMapa>();
  for (const { taller: t, distanciaKm } of lista) {
    const p = m.get(t.recintoId) ?? {
      id: t.recintoId,
      nombre: t.recintoNombre,
      lat: t.recintoUbicacion.lat,
      lng: t.recintoUbicacion.lng,
      distanciaKm,
      actividades: [],
    };
    p.actividades.push({ id: t.id, titulo: t.titulo });
    m.set(t.recintoId, p);
  }
  return [...m.values()];
}
