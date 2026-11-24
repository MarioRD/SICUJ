import { collection, doc, getDocs, onSnapshot, query, runTransaction, updateDoc, where } from 'firebase/firestore';
import type { Recinto, Taller } from '@/types/models';
import { datosTaller, estaVigente, porFecha, validarTaller, type TallerEntrada } from '../comun/talleres';
import { conId, firebase } from './app';

const coleccion = () => collection(firebase().db, 'talleres');

/** Público: solo activos (las reglas no dejan leer los inactivos); los vencidos se filtran aquí. */
export function suscribirTalleres(opciones: { incluirInactivos?: boolean }, alCambiar: (t: Taller[]) => void) {
  const q = opciones.incluirInactivos ? coleccion() : query(coleccion(), where('activo', '==', true));
  return onSnapshot(
    q,
    (s) => {
      const todos = s.docs.map((d) => conId<Taller>(d)!);
      const lista = opciones.incluirInactivos ? todos : todos.filter((t) => estaVigente(t));
      alCambiar(lista.sort(porFecha));
    },
    () => alCambiar([]),
  );
}

export function suscribirTaller(id: string, alCambiar: (t: Taller | null) => void) {
  return onSnapshot(
    doc(coleccion(), id),
    (s) => alCambiar(conId<Taller>(s)),
    () => alCambiar(null), // inactivo o inexistente: las reglas niegan la lectura
  );
}

export async function listarTalleres(): Promise<Taller[]> {
  const s = await getDocs(coleccion());
  return s.docs.map((d) => conId<Taller>(d)!).sort(porFecha);
}

export async function guardarTaller(entrada: TallerEntrada, id?: string): Promise<string> {
  const { db } = firebase();
  const ahora = Date.now();
  return runTransaction(db, async (tx) => {
    const recinto = conId<Recinto>(await tx.get(doc(db, 'recintos', entrada.recintoId)));
    if (!recinto) throw new Error('El recinto seleccionado no existe.');
    const datos = datosTaller(entrada, recinto);

    if (!id) {
      validarTaller(entrada, 0);
      const ref = doc(coleccion());
      tx.set(ref, { ...datos, inscritos: 0, asistentes: 0, activo: true, creadoEn: ahora, actualizadoEn: ahora });
      return ref.id;
    }
    const ref = doc(coleccion(), id);
    const actual = conId<Taller>(await tx.get(ref));
    if (!actual) throw new Error('El taller ya no existe.');
    validarTaller(entrada, actual.inscritos);
    tx.update(ref, { ...datos, actualizadoEn: ahora });
    return id;
  });
}

/** Baja lógica (activo: false). Las inscripciones existentes se conservan para los reportes. */
export async function cambiarEstadoTaller(id: string, activo: boolean) {
  await updateDoc(doc(coleccion(), id), { activo, actualizadoEn: Date.now() });
}
