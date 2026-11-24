import type { Inscripcion, Taller } from '@/types/models';
import { generarId } from '@/utils/id';
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
import { almacen, latencia } from './store';

/**
 * Inscripción atómica: lee el taller, verifica vigencia, edades y cupo para TODAS
 * las personas, crea la inscripción y suma al contador `inscritos`, todo junto.
 */
export async function inscribir(entrada: InscripcionEntrada): Promise<Inscripcion> {
  const preparada = prepararEntrada(entrada);
  await latencia(250);
  return almacen.transaccion((tx) => {
    const taller = tx.obtener<Taller>('talleres', entrada.tallerId);
    verificarTaller(taller, preparada);
    const uid = entrada.uidCiudadano;
    if (uid && almacen.listar<Inscripcion>('inscripciones').some((i) => i.uidCiudadano === uid && i.tallerId === taller.id)) {
      throw errorYaInscrito();
    }
    const inscripcion = construirInscripcion(generarId(), taller, preparada);
    tx.crear('inscripciones', inscripcion);
    tx.actualizar('talleres', taller.id, { inscritos: taller.inscritos + inscripcion.personas });
    return inscripcion;
  });
}

/** Libera los lugares. Solo si el pase no se ha usado. */
export async function cancelarInscripcion(id: string) {
  await latencia();
  almacen.transaccion((tx) => {
    const ins = tx.obtener<Inscripcion>('inscripciones', id);
    if (!ins) return;
    if (ins.usado) throw new Error('Este pase ya se usó; no se puede cancelar.');
    const taller = tx.obtener<Taller>('talleres', ins.tallerId);
    if (taller) tx.actualizar('talleres', taller.id, { inscritos: Math.max(0, taller.inscritos - ins.personas) });
    tx.eliminar('inscripciones', id);
  });
  quitarPaseLocal(id);
}

export function suscribirInscripcion(id: string, alCambiar: (i: Inscripcion | null) => void) {
  return almacen.suscribir(['inscripciones'], () => alCambiar(almacen.obtener<Inscripcion>('inscripciones', id)));
}

/** Pases de un ciudadano con cuenta o guardados en este dispositivo. */
export function suscribirMisInscripciones(
  uid: string | null,
  idsLocales: string[],
  alCambiar: (i: Inscripcion[]) => void,
) {
  return almacen.suscribir(['inscripciones'], () => {
    const locales = new Set(idsLocales);
    const lista = almacen
      .listar<Inscripcion>('inscripciones')
      .filter((i) => (uid !== null && i.uidCiudadano === uid) || locales.has(i.id))
      .sort(porFechaTaller);
    alCambiar(lista);
  });
}

/** ID del pase que esta cuenta ya tiene para la actividad (un pase por cuenta por actividad). */
export async function miPaseEn(tallerId: string, uid: string): Promise<string | null> {
  return almacen.listar<Inscripcion>('inscripciones').find((i) => i.uidCiudadano === uid && i.tallerId === tallerId)?.id ?? null;
}

/**
 * Al crear cuenta o iniciar sesión: los pases de este dispositivo pasan a la cuenta,
 * salvo los de actividades donde la cuenta ya tiene pase (se quedan solo en el dispositivo).
 */
export async function vincularInscripciones(ids: string[], uid: string) {
  almacen.transaccion((tx) => {
    const conPase = new Set(almacen.listar<Inscripcion>('inscripciones').filter((i) => i.uidCiudadano === uid).map((i) => i.tallerId));
    for (const id of ids) {
      const ins = tx.obtener<Inscripcion>('inscripciones', id);
      if (!ins || ins.uidCiudadano !== null || conPase.has(ins.tallerId)) continue;
      tx.actualizar('inscripciones', id, { uidCiudadano: uid });
      conPase.add(ins.tallerId);
    }
  });
}

/**
 * Solo para reportes (lectura bajo demanda, nunca en tiempo real).
 * En Firestore: where('tallerId','==',x) + where('creadoEn','>=',desde) con índice compuesto.
 */
export async function consultarInscripciones(filtro: FiltroInscripciones): Promise<Inscripcion[]> {
  await latencia(300);
  return almacen
    .listar<Inscripcion>('inscripciones')
    .filter(
      (i) =>
        (!filtro.tallerId || i.tallerId === filtro.tallerId) &&
        (filtro.desde === undefined || i.creadoEn >= filtro.desde) &&
        (filtro.hasta === undefined || i.creadoEn <= filtro.hasta),
    )
    .sort((a, b) => a.creadoEn - b.creadoEn);
}
