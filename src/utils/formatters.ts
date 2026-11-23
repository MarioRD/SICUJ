const LOCALE = 'es-MX';
const ZONA = 'America/Mexico_City';

const fmtFecha = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric', timeZone: ZONA });
const fmtFechaLarga = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: ZONA,
});
const fmtFechaHora = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: ZONA,
});

export const formatearFecha = (ms: number) => fmtFecha.format(ms);
export const formatearFechaLarga = (ms: number) => fmtFechaLarga.format(ms);
export const formatearFechaHora = (ms: number) => fmtFechaHora.format(ms);

export function formatearRangoFechas(inicio: number, fin: number): string {
  const a = formatearFecha(inicio);
  const b = formatearFecha(fin);
  return a === b ? a : `${a} – ${b}`;
}

export function formatearDistancia(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function formatearCosto(costo: number): string {
  return costo === 0
    ? 'Gratuito'
    : new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(costo);
}

export function porcentaje(parte: number, total: number): number {
  return total <= 0 ? 0 : Math.round((parte / total) * 100);
}

/** yyyy-mm-dd para <input type="date"> (hora local). */
export function aFechaInput(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Interpreta yyyy-mm-dd como hora local; `finDelDia` → 23:59:59.999 */
export function deFechaInput(valor: string, finDelDia = false): number {
  const [y, m, d] = valor.split('-').map(Number);
  const fecha = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  if (finDelDia) fecha.setHours(23, 59, 59, 999);
  return fecha.getTime();
}
