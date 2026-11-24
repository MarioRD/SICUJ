import type { Coordenadas, Recinto } from '@/types/models';

export interface RecintoEntrada {
  nombre: string;
  direccion: string;
  ubicacion: Coordenadas;
  descripcion: string;
  imagenUrl: string | null;
  capacidad: number;
  accesible: boolean;
}

export const porNombre = (a: Recinto, b: Recinto) => a.nombre.localeCompare(b.nombre, 'es');

export function validarRecinto(e: RecintoEntrada) {
  if (!e.nombre.trim()) throw new Error('El nombre es obligatorio.');
  if (!Number.isFinite(e.ubicacion.lat) || Math.abs(e.ubicacion.lat) > 90) throw new Error('Latitud inválida.');
  if (!Number.isFinite(e.ubicacion.lng) || Math.abs(e.ubicacion.lng) > 180) throw new Error('Longitud inválida.');
  if (e.capacidad < 0) throw new Error('La capacidad no puede ser negativa.');
}

export const datosRecinto = (e: RecintoEntrada) => ({ ...e, nombre: e.nombre.trim(), direccion: e.direccion.trim() });
