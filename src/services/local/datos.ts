import type { DatosInscripcion } from '@/types/models';
import { validarDatos, type DatosEntrada } from '../comun/datos';
import { almacen, latencia } from './store';

type Doc = DatosInscripcion & { id: string };

export async function obtenerDatosInscripcion(uid: string): Promise<DatosInscripcion | null> {
  const d = almacen.obtener<Doc>('datosInscripcion', uid);
  if (!d) return null;
  const { id: _id, ...datos } = d;
  return datos;
}

export async function guardarDatosInscripcion(uid: string, entrada: DatosEntrada): Promise<DatosInscripcion> {
  const datos = validarDatos(entrada);
  await latencia();
  almacen.transaccion((tx) => {
    if (tx.obtener('datosInscripcion', uid)) tx.actualizar('datosInscripcion', uid, { ...datos });
    else tx.crear('datosInscripcion', { id: uid, ...datos });
  });
  return datos;
}

export async function borrarDatosInscripcion(uid: string) {
  await latencia();
  almacen.transaccion((tx) => tx.eliminar('datosInscripcion', uid));
}
