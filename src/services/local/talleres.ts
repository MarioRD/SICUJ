import type { Recinto, Taller } from '@/types/models';
import { generarId } from '@/utils/id';
import { datosTaller, estaVigente, porFecha, validarTaller, type TallerEntrada } from '../comun/talleres';
import { almacen, latencia } from './store';

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

export async function guardarTaller(entrada: TallerEntrada, id?: string): Promise<string> {
  await latencia();
  const ahora = Date.now();
  return almacen.transaccion((tx) => {
    const recinto = tx.obtener<Recinto>('recintos', entrada.recintoId);
    if (!recinto) throw new Error('El recinto seleccionado no existe.');
    const datos = datosTaller(entrada, recinto);

    if (!id) {
      validarTaller(entrada, 0);
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
    validarTaller(entrada, actual.inscritos);
    tx.actualizar('talleres', id, { ...datos, actualizadoEn: ahora });
    return id;
  });
}

/** Baja lógica (activo: false). Las inscripciones existentes se conservan para los reportes. */
export async function cambiarEstadoTaller(id: string, activo: boolean) {
  await latencia();
  almacen.transaccion((tx) => tx.actualizar('talleres', id, { activo, actualizadoEn: Date.now() }));
}
