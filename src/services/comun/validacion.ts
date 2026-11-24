import type { Inscripcion } from '@/types/models';

export type ResultadoValidacion =
  | { estado: 'valido'; inscripcion: Inscripcion }
  | { estado: 'ya_usado'; inscripcion: Inscripcion }
  | { estado: 'otro_evento'; inscripcion: Inscripcion }
  | { estado: 'no_existe' }
  | { estado: 'formato_invalido' };

/** "abcd1234", "ABCD 1234" o "ABCD-1234" → "ABCD-1234"; null si no tiene el formato. */
export function normalizarFolio(folio: string): string | null {
  const buscado = folio.trim().toUpperCase().replace(/\s/g, '');
  const normalizado = buscado.includes('-') ? buscado : `${buscado.slice(0, 4)}-${buscado.slice(4)}`;
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizado) ? normalizado : null;
}
