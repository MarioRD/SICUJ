import { collection, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import type { Recinto } from '@/types/models';
import { datosRecinto, porNombre, validarRecinto, type RecintoEntrada } from '../comun/recintos';
import { conId, firebase } from './app';

const coleccion = () => collection(firebase().db, 'recintos');

export function suscribirRecintos(opciones: { incluirInactivos?: boolean }, alCambiar: (r: Recinto[]) => void) {
  const q = opciones.incluirInactivos ? coleccion() : query(coleccion(), where('activo', '==', true));
  return onSnapshot(
    q,
    (s) => alCambiar(s.docs.map((d) => conId<Recinto>(d)!).sort(porNombre)),
    () => alCambiar([]),
  );
}

export async function listarRecintosActivos(): Promise<Recinto[]> {
  const s = await getDocs(query(coleccion(), where('activo', '==', true)));
  return s.docs.map((d) => conId<Recinto>(d)!).sort(porNombre);
}

/** Crea o actualiza. Si cambian el nombre o la ubicación, actualiza las copias en sus talleres. */
export async function guardarRecinto(entrada: RecintoEntrada, id?: string): Promise<string> {
  validarRecinto(entrada);
  const { db } = firebase();
  const ahora = Date.now();
  const datos = datosRecinto(entrada);

  if (!id) {
    const ref = doc(coleccion());
    await setDoc(ref, { ...datos, activo: true, afluenciaTotal: 0, creadoEn: ahora, actualizadoEn: ahora });
    return ref.id;
  }
  const talleres = await getDocs(query(collection(db, 'talleres'), where('recintoId', '==', id)));
  const lote = writeBatch(db);
  lote.update(doc(coleccion(), id), { ...datos, actualizadoEn: ahora });
  for (const t of talleres.docs) lote.update(t.ref, { recintoNombre: datos.nombre, recintoUbicacion: datos.ubicacion });
  await lote.commit();
  return id;
}

/** Baja lógica: nunca se borran recintos con historial. */
export async function cambiarEstadoRecinto(id: string, activo: boolean) {
  await updateDoc(doc(coleccion(), id), { activo, actualizadoEn: Date.now() });
}
