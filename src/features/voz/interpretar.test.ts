import { describe, expect, it } from 'vitest';
import type { Taller } from '@/types/models';
import { buscarPorVoz, describirActividad, horarioHablado, intencion, interes, nombrarInteres } from './interpretar';

const AHORA = Date.UTC(2026, 10, 24, 18);
const DIA = 86_400_000;
const taller = (p: Partial<Taller>): Taller => ({
  id: 't', tipo: 'taller', titulo: 'Guitarra para principiantes', descripcion: '', categoria: 'musica', recintoId: 'r',
  recintoNombre: 'Casa de Cultura', recintoUbicacion: { lat: 0, lng: 0 }, instructor: null, fechaInicio: AHORA + 5 * DIA,
  fechaFin: AHORA + 60 * DIA, horario: 'Sábados · 10:00 – 13:00', edadMin: null, edadMax: null, cupoMaximo: 20, inscritos: 0,
  asistentes: 0, imagenUrl: null, costo: 0, activo: true, creadoEn: 0, actualizadoEn: 0, ...p,
});

describe('intención', () => {
  it.each([
    ['Sí, inscríbeme', 'si'],
    ['claro que sí', 'si'],
    ['no quiero', 'no'],
    ['otra', 'no'],
    ['ya no, gracias, adiós', 'salir'],
    ['¿Cómo?', 'repetir'],
    ['lo que haya', 'cualquiera'],
    ['guitarra', 'otra'],
  ])('"%s" → %s', (dicho, esperado) => expect(intencion(dicho)).toBe(esperado));
});

describe('interés', () => {
  it('reconoce categorías por sinónimos y sin acentos', () => {
    expect(interes('me gustaría algo de baile').categorias).toEqual(['danza']);
    expect(interes('Anime y videojuegos').categorias).toEqual(['cultura_pop']);
    expect(interes('clases de inglés').categorias).toEqual(['idiomas']);
  });
  it('nombra lo que se pidió', () => {
    expect(nombrarInteres('quiero algo de karate')).toBe('karate');
    expect(nombrarInteres('música')).toBe('música');
  });
});

describe('buscarPorVoz', () => {
  const lista = [
    taller({ id: 'a', fechaInicio: AHORA + 9 * DIA }),
    taller({ id: 'b', titulo: 'Ballet', categoria: 'danza' }),
    taller({ id: 'c', fechaInicio: AHORA + 2 * DIA }),
    taller({ id: 'lleno', inscritos: 20 }),
    taller({ id: 'pasado', fechaFin: AHORA - DIA }),
  ];
  it('filtra por categoría, con lugar y vigentes, las más próximas primero', () => {
    expect(buscarPorVoz(lista, 'algo de música', AHORA).map((t) => t.id)).toEqual(['c', 'a']);
  });
  it('busca palabras sueltas en el título', () => {
    expect(buscarPorVoz(lista, 'ballet', AHORA).map((t) => t.id)).toEqual(['b']);
  });
  it('"lo que haya" devuelve todo lo disponible', () => {
    expect(buscarPorVoz(lista, 'lo que haya', AHORA)).toHaveLength(3);
  });
  it('sin coincidencias devuelve vacío', () => {
    expect(buscarPorVoz(lista, 'karate', AHORA)).toEqual([]);
  });
});

describe('describirActividad', () => {
  it('suena natural al leerse', () => {
    expect(horarioHablado('Sábados · 10:00 – 13:00')).toBe('Sábados, 10:00 a 13:00');
    const d = describirActividad(taller({}), AHORA);
    expect(d).toContain('el taller Guitarra para principiantes, en Casa de Cultura.');
    expect(d).toContain('Empieza el domingo, 29 de noviembre; horario: sábados, 10:00 a 13:00');
    expect(d).toContain('es gratis');
  });
  it('dice si ya está en curso', () => {
    expect(describirActividad(taller({ fechaInicio: AHORA - DIA }), AHORA)).toContain('Ya está en curso');
    expect(describirActividad(taller({ tipo: 'evento', fechaInicio: AHORA - 3_600_000 }), AHORA)).toContain('Es hoy');
  });
});
