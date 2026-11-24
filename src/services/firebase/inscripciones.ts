import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  where,
  type DocumentReference,
  type QueryConstraint,
  type Transaction,
} from 'firebase/firestore';
import type { Inscripcion, Taller } from '@/types/models';
import {
  construirInscripcion,
  errorYaInscrito,
  porFechaTaller,
  prepararEntrada,
  quitarPaseLocal,
  verificarTaller,
  type FiltroInscripciones,
  type InscripcionEntrada,
} from '../comun/inscripciones';
import { conId, firebase, sinId } from './app';

const coleccion = () => collection(firebase().db, 'inscripciones');

/**
 * Marca "esta cuenta ya tiene pase": talleres/{tallerId}/cuentas/{uid} = { inscripcionId }.
 * Las reglas exigen crearla junto con el pase, así una cuenta no aparta dos pases del mismo evento.
 */
const marca = (tallerId: string, uid: string) => doc(firebase().db, 'talleres', tallerId, 'cuentas', uid);

/** Un taller inactivo no se puede leer (reglas): se trata como "no disponible". */
async function leerTaller(tx: Transaction, ref: DocumentReference): Promise<Taller | null> {
  try {
    return conId<Taller>(await tx.get(ref));
  } catch {
    return null;
  }
}

/**
 * Inscripción atómica con runTransaction: si dos personas se inscriben al mismo tiempo
 * nunca se rebasa el cupo. El taller guarda `ultimaInscripcion` para que las reglas de
 * seguridad comprueben que el contador sube exactamente lo que trae la inscripción.
 */
export async function inscribir(entrada: InscripcionEntrada): Promise<Inscripcion> {
  const preparada = prepararEntrada(entrada);
  const { db } = firebase();
  return runTransaction(db, async (tx) => {
    const refTaller = doc(db, 'talleres', entrada.tallerId);
    const taller = await leerTaller(tx, refTaller);
    verificarTaller(taller, preparada);
    const uid = entrada.uidCiudadano;
    const refMarca = uid ? marca(taller.id, uid) : null;
    if (refMarca && (await tx.get(refMarca)).exists()) throw errorYaInscrito();
    const ref = doc(coleccion());
    const inscripcion = construirInscripcion(ref.id, taller, preparada);
    tx.set(ref, sinId(inscripcion));
    if (refMarca) tx.set(refMarca, { inscripcionId: ref.id });
    tx.update(refTaller, { inscritos: taller.inscritos + inscripcion.personas, ultimaInscripcion: ref.id });
    return inscripcion;
  });
}

/** Libera los lugares. Solo si el pase no se ha usado. */
export async function cancelarInscripcion(id: string) {
  const { db } = firebase();
  await runTransaction(db, async (tx) => {
    const ref = doc(coleccion(), id);
    const ins = conId<Inscripcion>(await tx.get(ref));
    if (!ins) return;
    if (ins.usado) throw new Error('Este pase ya se usó; no se puede cancelar.');
    // Un pase ligado a una cuenta solo lo cancela esa cuenta (también borra su marca).
    if (ins.uidCiudadano && firebase().auth.currentUser?.uid !== ins.uidCiudadano) {
      throw new Error('Este pase está en una cuenta: inicia sesión con ella para cancelarlo.');
    }
    const refTaller = doc(db, 'talleres', ins.tallerId);
    const taller = await leerTaller(tx, refTaller);
    if (taller) tx.update(refTaller, { inscritos: taller.inscritos - ins.personas, ultimaCancelacion: id });
    if (ins.uidCiudadano) tx.delete(marca(ins.tallerId, ins.uidCiudadano));
    tx.delete(ref);
  });
  quitarPaseLocal(id);
}

export function suscribirInscripcion(id: string, alCambiar: (i: Inscripcion | null) => void) {
  return onSnapshot(
    doc(coleccion(), id),
    (s) => alCambiar(conId<Inscripcion>(s)),
    () => alCambiar(null),
  );
}

/** Pases de la cuenta (consulta por uid) + los guardados en este dispositivo (uno por uno, por su ID). */
export function suscribirMisInscripciones(uid: string | null, idsLocales: string[], alCambiar: (i: Inscripcion[]) => void) {
  const deCuenta = new Map<string, Inscripcion>();
  const locales = new Map<string, Inscripcion | null>();
  let pendientes = idsLocales.length + (uid ? 1 : 0);
  const listo = new Set<string>();

  const emitir = () => {
    if (pendientes > 0) return;
    const todas = new Map(deCuenta);
    for (const [id, ins] of locales) if (ins) todas.set(id, ins);
    alCambiar([...todas.values()].sort(porFechaTaller));
  };
  const marcar = (clave: string) => {
    if (!listo.has(clave)) {
      listo.add(clave);
      pendientes--;
    }
    emitir();
  };

  const bajas: Array<() => void> = [];
  if (uid) {
    bajas.push(
      onSnapshot(
        query(coleccion(), where('uidCiudadano', '==', uid)),
        (s) => {
          deCuenta.clear();
          for (const d of s.docs) deCuenta.set(d.id, conId<Inscripcion>(d)!);
          marcar('cuenta');
        },
        () => marcar('cuenta'),
      ),
    );
  }
  for (const id of idsLocales) {
    bajas.push(
      onSnapshot(
        doc(coleccion(), id),
        (s) => {
          locales.set(id, conId<Inscripcion>(s));
          marcar(id);
        },
        () => {
          locales.set(id, null);
          marcar(id);
        },
      ),
    );
  }
  emitir();
  return () => bajas.forEach((b) => b());
}

/** ID del pase que esta cuenta ya tiene para la actividad (un pase por cuenta por actividad). */
export async function miPaseEn(tallerId: string, uid: string): Promise<string | null> {
  try {
    const s = await getDoc(marca(tallerId, uid));
    return s.exists() ? (s.data().inscripcionId as string) : null;
  } catch {
    return null;
  }
}

/**
 * Al crear cuenta o iniciar sesión: los pases de este dispositivo pasan a la cuenta,
 * salvo los de actividades donde la cuenta ya tiene pase (se quedan solo en el dispositivo).
 */
export async function vincularInscripciones(ids: string[], uid: string) {
  const { db } = firebase();
  for (const id of ids) {
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(coleccion(), id);
        const ins = conId<Inscripcion>(await tx.get(ref));
        if (!ins || ins.uidCiudadano !== null) return;
        const refMarca = marca(ins.tallerId, uid);
        if ((await tx.get(refMarca)).exists()) return;
        tx.update(ref, { uidCiudadano: uid });
        tx.set(refMarca, { inscripcionId: id });
      });
    } catch {
      /* pase cancelado o ajeno: se ignora */
    }
  }
}

/** Solo para reportes (lectura bajo demanda). Usa el índice compuesto tallerId + creadoEn. */
export async function consultarInscripciones(filtro: FiltroInscripciones): Promise<Inscripcion[]> {
  const filtros: QueryConstraint[] = [];
  if (filtro.tallerId) filtros.push(where('tallerId', '==', filtro.tallerId));
  if (filtro.desde !== undefined) filtros.push(where('creadoEn', '>=', filtro.desde));
  if (filtro.hasta !== undefined) filtros.push(where('creadoEn', '<=', filtro.hasta));
  const s = await getDocs(query(coleccion(), ...filtros, orderBy('creadoEn')));
  return s.docs.map((d) => conId<Inscripcion>(d)!);
}
