import type { RangoEdad } from '@/types/models';

export function calcularRangoEdad(edad: number): RangoEdad {
  if (edad < 12) return '0-11';
  if (edad < 18) return '12-17';
  if (edad < 30) return '18-29';
  if (edad < 60) return '30-59';
  return '60+';
}

export function esMenorDeEdad(edad: number): boolean {
  return edad < 18;
}

/** ¿La edad cabe en el rango del taller? (null = sin límite) */
export function edadPermitida(edad: number, edadMin: number | null, edadMax: number | null): boolean {
  if (edadMin !== null && edad < edadMin) return false;
  if (edadMax !== null && edad > edadMax) return false;
  return true;
}

export function describirRangoTaller(edadMin: number | null, edadMax: number | null): string {
  if (edadMin === null && edadMax === null) return 'Todas las edades';
  if (edadMin !== null && edadMax === null) return `${edadMin} años en adelante`;
  if (edadMin === null && edadMax !== null) return `Hasta ${edadMax} años`;
  return `De ${edadMin} a ${edadMax} años`;
}

const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Edad cumplida en una fecha dada (por defecto, hoy). null si la fecha no es válida. */
export function edadEnFecha(fechaNacimiento: string, enMs = Date.now()): number | null {
  const m = FECHA.exec(fechaNacimiento);
  if (!m) return null;
  const [a, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const nac = new Date(a, mes - 1, d);
  if (nac.getFullYear() !== a || nac.getMonth() !== mes - 1 || nac.getDate() !== d) return null;
  const en = new Date(enMs);
  let edad = en.getFullYear() - a;
  if (en.getMonth() < mes - 1 || (en.getMonth() === mes - 1 && en.getDate() < d)) edad--;
  return edad >= 0 && edad <= 120 ? edad : null;
}
