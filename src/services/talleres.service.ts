import type { Categoria, Recinto, Taller, TipoActividad } from '@/types/models';
import { generarId } from '@/utils/id';
import { almacen, latencia } from './local/store';

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

const porFecha = (a: Taller, b: Taller) => a.fechaInicio - b.fechaInicio;

/** Vigente = activo y que todavía no termina. */
export const estaVigente = (t: Taller, ahora = Date.now()) => t.activo && t.fechaFin >= ahora;
export const cuposDisponibles = (t: Taller) => Math.max(0, t.cupoMaximo - t.inscritos);

/**
 * Catálogo público: talleres activos y vigentes.
 * En Firestore: onSnapshot(query(talleres, where('activo','==',true), where('fechaFin','>=',hoy)))
 */
export function suscribirTalleres(opciones: { incluirInactivos?: boolean }, alCambiar: (t: Taller[]) => void) {
  return almacen.suscribir(['talleres'], () => {
    const todos = almacen.listar<Taller>('talleres');
    const lista = opciones.incluirInactivos ? todos : todos.filter((t) => estaVigente(t));
    alCambiar(lista.sort(porFecha));
  });
}

export function suscribirTaller(id: string, alCambiar: (t: Taller | null) => void) {
  return almacen.suscribir(['talleres'], () => alCambiar(almacen.obtener<Taller>('talleres', id)));
}

export async function listarTalleres(): Promise<Taller[]> {
  await latencia();
  return almacen.listar<Taller>('talleres').sort(porFecha);
}

function validar(e: TallerEntrada, inscritosActuales: number) {
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

export async function guardarTaller(entrada: TallerEntrada, id?: string): Promise<string> {
  await latencia();
  const ahora = Date.now();
  return almacen.transaccion((tx) => {
    const recinto = tx.obtener<Recinto>('recintos', entrada.recintoId);
    if (!recinto) throw new Error('El recinto seleccionado no existe.');
    const datos = {
      ...entrada,
      titulo: entrada.titulo.trim(),
      descripcion: entrada.descripcion.trim(),
      instructor: entrada.instructor?.trim() || null,
      // copias del recinto: el catálogo se arma con una sola consulta
      recintoNombre: recinto.nombre,
      recintoUbicacion: recinto.ubicacion,
    };

    if (!id) {
      validar(entrada, 0);
      const nuevo: Taller = {
        ...datos,
        id: generarId(),
        inscritos: 0,
        asistentes: 0,
        activo: true,
        creadoEn: ahora,
        actualizadoEn: ahora,
      };
      tx.crear('talleres', nuevo);
      return nuevo.id;
    }

    const actual = tx.obtener<Taller>('talleres', id);
    if (!actual) throw new Error('El taller ya no existe.');
    validar(entrada, actual.inscritos);
    tx.actualizar('talleres', id, { ...datos, actualizadoEn: ahora });
    return id;
  });
}

/** Baja lógica (activo: false). Las inscripciones existentes se conservan para los reportes. */
export async function cambiarEstadoTaller(id: string, activo: boolean) {
  await latencia();
  almacen.transaccion((tx) => tx.actualizar('talleres', id, { activo, actualizadoEn: Date.now() }));
}
