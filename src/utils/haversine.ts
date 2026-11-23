import type { Coordenadas } from '@/types/models';

/** Radio medio de la Tierra en kilómetros (IUGG). */
export const RADIO_TIERRA_KM = 6371;

const aRadianes = (grados: number) => (grados * Math.PI) / 180;

/**
 * Distancia geodésica entre dos puntos usando la fórmula de Haversine.
 *
 *   a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)
 *   c = 2 · atan2(√a, √(1−a))
 *   d = R · c
 *
 * @returns distancia en kilómetros
 */
export function calcularDistanciaHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = aRadianes(lat2 - lat1);
  const dLon = aRadianes(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RADIO_TIERRA_KM * c;
}

/**
 * Agrega `distanciaKm` a cada elemento y los ordena del más cercano al más lejano.
 * No modifica el arreglo original.
 */
export function ordenarPorCercania<T>(
  elementos: readonly T[],
  origen: Coordenadas,
  obtenerUbicacion: (e: T) => Coordenadas,
): Array<T & { distanciaKm: number }> {
  return elementos
    .map((e) => {
      const { lat, lng } = obtenerUbicacion(e);
      return { ...e, distanciaKm: calcularDistanciaHaversine(origen.lat, origen.lng, lat, lng) };
    })
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
}
