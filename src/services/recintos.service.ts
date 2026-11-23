import type { Coordenadas, Recinto, Taller } from '@/types/models';
import { generarId } from '@/utils/id';
import { almacen, latencia } from './local/store';

export interface RecintoEntrada {
  nombre: string;
  direccion: string;
  ubicacion: Coordenadas;
  descripcion: string;
  imagenUrl: string | null;
  capacidad: number;
  accesible: boolean;
}

const porNombre = (a: Recinto, b: Recinto) => a.nombre.localeCompare(b.nombre, 'es');

/** En Firestore: onSnapshot(query(recintos, where('activo','==',true))) */
export function suscribirRecintos(opciones: { incluirInactivos?: boolean }, alCambiar: (r: Recinto[]) => void) {
  return almacen.suscribir(['recintos'], () => {
    const todos = almacen.listar<Recinto>('recintos');
    alCambiar((opciones.incluirInactivos ? todos : todos.filter((r) => r.activo)).sort(porNombre));
  });
}

export async function listarRecintosActivos(): Promise<Recinto[]> {
  await latencia();
  return almacen
    .listar<Recinto>('recintos')
    .filter((r) => r.activo)
    .sort(porNombre);
}

function validar(e: RecintoEntrada) {
  if (!e.nombre.trim()) throw new Error('El nombre es obligatorio.');
  if (!Number.isFinite(e.ubicacion.lat) || Math.abs(e.ubicacion.lat) > 90) throw new Error('Latitud inválida.');
  if (!Number.isFinite(e.ubicacion.lng) || Math.abs(e.ubicacion.lng) > 180) throw new Error('Longitud inválida.');
  if (e.capacidad < 0) throw new Error('La capacidad no puede ser negativa.');
}

/** Crea o actualiza. Si cambian el nombre o la ubicación, actualiza las copias en sus talleres. */
export async function guardarRecinto(entrada: RecintoEntrada, id?: string): Promise<string> {
  validar(entrada);
  await latencia();
  const ahora = Date.now();
  const datos = { ...entrada, nombre: entrada.nombre.trim(), direccion: entrada.direccion.trim() };

  return almacen.transaccion((tx) => {
    if (!id) {
      const nuevo: Recinto = { ...datos, id: generarId(), activo: true, afluenciaTotal: 0, creadoEn: ahora, actualizadoEn: ahora };
      tx.crear('recintos', nuevo);
      return nuevo.id;
    }
    tx.actualizar('recintos', id, { ...datos, actualizadoEn: ahora });
    for (const t of almacen.listar<Taller>('talleres')) {
      if (t.recintoId === id) {
        tx.actualizar('talleres', t.id, { recintoNombre: datos.nombre, recintoUbicacion: datos.ubicacion });
      }
    }
    return id;
  });
}

/** Baja lógica: nunca se borran recintos con historial. */
export async function cambiarEstadoRecinto(id: string, activo: boolean) {
  await latencia();
  almacen.transaccion((tx) => tx.actualizar('recintos', id, { activo, actualizadoEn: Date.now() }));
}
