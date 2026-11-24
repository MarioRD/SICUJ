import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import type { DatosInscripcion } from '@/types/models';
import { validarDatos, type DatosEntrada } from '../comun/datos';
import { firebase } from './app';

/** datosInscripcion/{uid}: solo la persona dueña de la cuenta puede leerlo o cambiarlo. */
const ref = (uid: string) => doc(firebase().db, 'datosInscripcion', uid);

export async function obtenerDatosInscripcion(uid: string): Promise<DatosInscripcion | null> {
  const s = await getDoc(ref(uid));
  return s.exists() ? (s.data() as DatosInscripcion) : null;
}

export async function guardarDatosInscripcion(uid: string, entrada: DatosEntrada): Promise<DatosInscripcion> {
  const datos = validarDatos(entrada);
  await setDoc(ref(uid), datos);
  return datos;
}

export async function borrarDatosInscripcion(uid: string) {
  await deleteDoc(ref(uid));
}
