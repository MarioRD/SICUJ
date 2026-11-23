import { describe, expect, it } from 'vitest';
import { calcularDistanciaHaversine, ordenarPorCercania } from './haversine';

describe('calcularDistanciaHaversine', () => {
  it('es 0 para el mismo punto', () => {
    expect(calcularDistanciaHaversine(19.63, -99.1, 19.63, -99.1)).toBe(0);
  });

  it('calcula la distancia Zócalo CDMX → Coacalco (~22 km)', () => {
    const d = calcularDistanciaHaversine(19.4326, -99.1332, 19.6267, -99.1089);
    expect(d).toBeGreaterThan(21);
    expect(d).toBeLessThan(23);
  });

  it('un grado de latitud ≈ 111.19 km', () => {
    expect(calcularDistanciaHaversine(0, 0, 1, 0)).toBeCloseTo(111.19, 1);
  });

  it('es simétrica', () => {
    const ida = calcularDistanciaHaversine(19.6, -99.1, 19.7, -99.2);
    const vuelta = calcularDistanciaHaversine(19.7, -99.2, 19.6, -99.1);
    expect(ida).toBeCloseTo(vuelta, 10);
  });
});

describe('ordenarPorCercania', () => {
  it('ordena del más cercano al más lejano sin mutar el original', () => {
    const lugares = [
      { n: 'lejos', u: { lat: 19.9, lng: -99.1 } },
      { n: 'cerca', u: { lat: 19.631, lng: -99.1 } },
      { n: 'medio', u: { lat: 19.7, lng: -99.1 } },
    ];
    const r = ordenarPorCercania(lugares, { lat: 19.63, lng: -99.1 }, (l) => l.u);
    expect(r.map((l) => l.n)).toEqual(['cerca', 'medio', 'lejos']);
    expect(lugares[0]!.n).toBe('lejos');
    expect(r[0]!.distanciaKm).toBeLessThan(0.2);
  });
});
