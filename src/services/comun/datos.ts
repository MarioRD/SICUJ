import type { DatosInscripcion, Genero } from '@/types/models';
import { GENEROS } from '@/types/models';
import { edadEnFecha } from '@/utils/rangosEdad';

export type DatosEntrada = Omit<DatosInscripcion, 'actualizadoEn'>;

/** Revisa y limpia los datos antes de guardarlos. */
export function validarDatos(e: DatosEntrada): DatosInscripcion {
  const nombre = e.nombre.trim().replace(/\s+/g, ' ');
  if (nombre.length < 2 || nombre.length > 60) throw new Error('Escribe un nombre de 2 a 60 caracteres.');
  if (edadEnFecha(e.fechaNacimiento) === null) throw new Error('La fecha de nacimiento no es válida.');
  if (!(e.genero in GENEROS)) throw new Error('Elige un género (puede ser "Prefiero no decir").');
  const telefono = (e.telefono ?? '').replace(/[^\d+]/g, '');
  if (telefono && telefono.replace('+', '').length < 10) throw new Error('El teléfono debe tener 10 dígitos.');
  return { nombre, fechaNacimiento: e.fechaNacimiento, genero: e.genero as Genero, telefono: telefono || null, actualizadoEn: Date.now() };
}
