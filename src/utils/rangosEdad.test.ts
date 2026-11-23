import { describe, expect, it } from 'vitest';
import { calcularRangoEdad, describirRangoTaller, edadPermitida } from './rangosEdad';

describe('calcularRangoEdad', () => {
  it.each([
    [0, '0-11'],
    [11, '0-11'],
    [12, '12-17'],
    [17, '12-17'],
    [18, '18-29'],
    [29, '18-29'],
    [30, '30-59'],
    [59, '30-59'],
    [60, '60+'],
    [95, '60+'],
  ] as const)('%i años → %s', (edad, rango) => {
    expect(calcularRangoEdad(edad)).toBe(rango);
  });
});

describe('edadPermitida', () => {
  it('respeta límites inclusivos y null = sin límite', () => {
    expect(edadPermitida(12, 12, 29)).toBe(true);
    expect(edadPermitida(29, 12, 29)).toBe(true);
    expect(edadPermitida(30, 12, 29)).toBe(false);
    expect(edadPermitida(5, null, null)).toBe(true);
    expect(edadPermitida(5, 6, null)).toBe(false);
  });
});

describe('describirRangoTaller', () => {
  it('genera textos legibles', () => {
    expect(describirRangoTaller(null, null)).toBe('Todas las edades');
    expect(describirRangoTaller(15, null)).toBe('15 años en adelante');
    expect(describirRangoTaller(6, 12)).toBe('De 6 a 12 años');
  });
});
