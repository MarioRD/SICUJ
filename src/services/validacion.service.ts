import type { Inscripcion, Recinto, Taller } from '@/types/models';
import { codificarPase, decodificarPase, folioCorto } from '@/utils/id';
import { almacen, latencia } from './local/store';

export type ResultadoValidacion =
  | { estado: 'valido'; inscripcion: Inscripcion }
  | { estado: 'ya_usado'; inscripcion: Inscripcion }
  | { estado: 'otro_evento'; inscripcion: Inscripcion }
  | { estado: 'no_existe' }
  | { estado: 'formato_invalido' };

/**
 * Validación presencial atómica (en Firestore será runTransaction):
 * el pase debe existir, ser de la actividad seleccionada y tener usado === false.
 * Si es válido se marca como usado y se suman los asistentes al taller y al recinto,
 * todo en la misma operación, para que el mismo QR no entre dos veces.
 */
export async function validarPase(codigoLeido: string, tallerId: string, uidStaff: string): Promise<ResultadoValidacion> {
  const id = decodificarPase(codigoLeido);
  if (!id) return { estado: 'formato_invalido' };
  await latencia(150);

  return almacen.transaccion((tx): ResultadoValidacion => {
    const ins = tx.obtener<Inscripcion>('inscripciones', id);
    if (!ins) return { estado: 'no_existe' };
    if (ins.tallerId !== tallerId) return { estado: 'otro_evento', inscripcion: ins };
    if (ins.usado) return { estado: 'ya_usado', inscripcion: ins };

    const ahora = Date.now();
    tx.actualizar('inscripciones', id, { usado: true, usadoEn: ahora, validadoPor: uidStaff });
    const taller = tx.obtener<Taller>('talleres', ins.tallerId);
    if (taller) tx.actualizar('talleres', taller.id, { asistentes: taller.asistentes + ins.personas });
    const recinto = tx.obtener<Recinto>('recintos', ins.recintoId);
    if (recinto) tx.actualizar('recintos', recinto.id, { afluenciaTotal: recinto.afluenciaTotal + ins.personas });

    return { estado: 'valido', inscripcion: { ...ins, usado: true, usadoEn: ahora, validadoPor: uidStaff } };
  });
}

/**
 * Respaldo cuando el QR no se puede leer (pantalla rota, sin brillo): se teclea
 * el folio corto impreso bajo el QR. Se busca solo dentro de la actividad seleccionada.
 * En Firestore: guardar `folio` en la inscripción y consultar where(tallerId) + where(folio).
 */
export async function validarPorFolio(folio: string, tallerId: string, uidStaff: string): Promise<ResultadoValidacion> {
  const buscado = folio.trim().toUpperCase().replace(/\s/g, '');
  const normalizado = buscado.includes('-') ? buscado : `${buscado.slice(0, 4)}-${buscado.slice(4)}`;
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizado)) return { estado: 'formato_invalido' };
  const ins = almacen
    .listar<Inscripcion>('inscripciones')
    .find((i) => i.tallerId === tallerId && folioCorto(i.id) === normalizado);
  if (!ins) return { estado: 'no_existe' };
  return validarPase(codificarPase(ins.id), tallerId, uidStaff);
}
