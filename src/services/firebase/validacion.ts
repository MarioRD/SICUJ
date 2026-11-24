import { collection, doc, getDocs, limit, query, runTransaction, where } from 'firebase/firestore';
import type { Inscripcion, Recinto, Taller } from '@/types/models';
import { codificarPase, decodificarPase } from '@/utils/id';
import { normalizarFolio, type ResultadoValidacion } from '../comun/validacion';
import { conId, firebase } from './app';

/**
 * Validación presencial atómica: el pase debe existir, ser de la actividad elegida y no estar usado.
 * Se marca como usado y se suman asistentes al taller y afluencia al recinto en la misma transacción,
 * para que el mismo QR no entre dos veces aunque lo escaneen en dos puertas a la vez.
 */
export async function validarPase(codigoLeido: string, tallerId: string, uidStaff: string): Promise<ResultadoValidacion> {
  const id = decodificarPase(codigoLeido);
  if (!id) return { estado: 'formato_invalido' };
  const { db } = firebase();

  return runTransaction(db, async (tx): Promise<ResultadoValidacion> => {
    const ref = doc(db, 'inscripciones', id);
    const ins = conId<Inscripcion>(await tx.get(ref));
    if (!ins) return { estado: 'no_existe' };
    if (ins.tallerId !== tallerId) return { estado: 'otro_evento', inscripcion: ins };
    if (ins.usado) return { estado: 'ya_usado', inscripcion: ins };

    // En Firestore todas las lecturas van antes que las escrituras.
    const refTaller = doc(db, 'talleres', ins.tallerId);
    const refRecinto = doc(db, 'recintos', ins.recintoId);
    const taller = conId<Taller>(await tx.get(refTaller));
    const recinto = conId<Recinto>(await tx.get(refRecinto));

    const ahora = Date.now();
    tx.update(ref, { usado: true, usadoEn: ahora, validadoPor: uidStaff });
    if (taller) tx.update(refTaller, { asistentes: taller.asistentes + ins.personas });
    if (recinto) tx.update(refRecinto, { afluenciaTotal: recinto.afluenciaTotal + ins.personas });
    return { estado: 'valido', inscripcion: { ...ins, usado: true, usadoEn: ahora, validadoPor: uidStaff } };
  });
}

/** Respaldo cuando el QR no se puede leer: se teclea el folio corto impreso bajo el QR. */
export async function validarPorFolio(folio: string, tallerId: string, uidStaff: string): Promise<ResultadoValidacion> {
  const normalizado = normalizarFolio(folio);
  if (!normalizado) return { estado: 'formato_invalido' };
  const s = await getDocs(
    query(collection(firebase().db, 'inscripciones'), where('tallerId', '==', tallerId), where('folio', '==', normalizado), limit(1)),
  );
  const d = s.docs[0];
  if (!d) return { estado: 'no_existe' };
  return validarPase(codificarPase(d.id), tallerId, uidStaff);
}
