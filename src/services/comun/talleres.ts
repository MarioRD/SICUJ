import type { Categoria, Recinto, Taller, TipoActividad } from '@/types/models';

export interface TallerEntrada {
  tipo: TipoActividad;
  titulo: string;
  descripcion: string;
  categoria: Categoria;
  recintoId: string;
  instructor: string | null;
  fechaInicio: number;
  fechaFin: number;
  horario: string;
  edadMin: number | null;
  edadMax: number | null;
  cupoMaximo: number;
  imagenUrl: string | null;
  costo: number;
}

export const porFecha = (a: Taller, b: Taller) => a.fechaInicio - b.fechaInicio;

/** Vigente = activo y que todavía no termina. */
export const estaVigente = (t: Taller, ahora = Date.now()) => t.activo && t.fechaFin >= ahora;
export const cuposDisponibles = (t: Taller) => Math.max(0, t.cupoMaximo - t.inscritos);

export function validarTaller(e: TallerEntrada, inscritosActuales: number) {
  if (!e.titulo.trim()) throw new Error('El título es obligatorio.');
  if (!e.recintoId) throw new Error('Selecciona un recinto.');
  if (!Number.isFinite(e.fechaInicio) || !Number.isFinite(e.fechaFin)) throw new Error('Fechas inválidas.');
  if (e.fechaFin < e.fechaInicio) throw new Error('La fecha de fin no puede ser anterior al inicio.');
  if (!Number.isInteger(e.cupoMaximo) || e.cupoMaximo < 1) throw new Error('El cupo debe ser un número entero mayor a 0.');
  if (e.cupoMaximo < inscritosActuales) {
    throw new Error(`Ya hay ${inscritosActuales} personas inscritas; el cupo no puede ser menor.`);
  }
  if (e.edadMin !== null && e.edadMax !== null && e.edadMin > e.edadMax) {
    throw new Error('La edad mínima no puede ser mayor que la máxima.');
  }
  if (e.costo < 0) throw new Error('El costo no puede ser negativo.');
}

/** Datos del taller listos para guardar, con las copias del recinto (el catálogo se arma con una sola consulta). */
export function datosTaller(entrada: TallerEntrada, recinto: Recinto) {
  return {
    ...entrada,
    titulo: entrada.titulo.trim(),
    descripcion: entrada.descripcion.trim(),
    instructor: entrada.instructor?.trim() || null,
    recintoNombre: recinto.nombre,
    recintoUbicacion: recinto.ubicacion,
  };
}
