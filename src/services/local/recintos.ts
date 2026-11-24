import type { Recinto, Taller } from '@/types/models';
import { generarId } from '@/utils/id';
import { datosRecinto, porNombre, validarRecinto, type RecintoEntrada } from '../comun/recintos';
import { almacen, latencia } from './store';

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

/** Crea o actualiza. Si cambian el nombre o la ubicación, actualiza las copias en sus talleres. */
export async function guardarRecinto(entrada: RecintoEntrada, id?: string): Promise<string> {
  validarRecinto(entrada);
  await latencia();
  const ahora = Date.now();
  const datos = datosRecinto(entrada);

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
