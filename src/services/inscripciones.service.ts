import type { Genero, Inscripcion, Persona, Taller } from '@/types/models';
import { MAX_ACOMPANANTES } from '@/types/models';
import { generarId } from '@/utils/id';
import { calcularRangoEdad, edadPermitida, esMenorDeEdad } from '@/utils/rangosEdad';
import { almacen, latencia } from './local/store';

export interface PersonaEntrada {
  nombre: string;
  edad: number;
  genero: Genero;
}

export interface InscripcionEntrada {
  tallerId: string;
  titular: PersonaEntrada;
  acompanantes: PersonaEntrada[];
  contacto: { email: string; telefono: string };
  aceptoAvisoPrivacidad: boolean;
  consentimientoTutor: boolean;
  uidCiudadano: string | null;
}

export type CodigoErrorInscripcion =
  | 'TALLER_NO_DISPONIBLE'
  | 'SIN_CUPO'
  | 'EDAD_NO_PERMITIDA'
  | 'DATOS_INVALIDOS'
  | 'FALTA_AVISO'
  | 'FALTA_TUTOR';

export class ErrorInscripcion extends Error {
  constructor(
    public readonly codigo: CodigoErrorInscripcion,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizarPersona(p: PersonaEntrada, etiqueta: string): Persona {
  const nombre = p.nombre.trim().replace(/\s+/g, ' ');
  if (nombre.length < 2) throw new ErrorInscripcion('DATOS_INVALIDOS', `${etiqueta}: escribe al menos un nombre o iniciales.`);
  if (nombre.length > 60) throw new ErrorInscripcion('DATOS_INVALIDOS', `${etiqueta}: el nombre es demasiado largo.`);
  if (!Number.isInteger(p.edad) || p.edad < 0 || p.edad > 120) {
    throw new ErrorInscripcion('DATOS_INVALIDOS', `${etiqueta}: edad inválida.`);
  }
  return { nombre, edad: p.edad, rangoEdad: calcularRangoEdad(p.edad), genero: p.genero };
}

/**
 * Inscripción atómica (en Firestore será runTransaction):
 * 1) lee el taller, 2) verifica vigencia, edades y cupo para TODAS las personas,
 * 3) crea la inscripción y 4) suma al contador `inscritos`.
 * Si dos personas se inscriben al mismo tiempo nunca se rebasa el cupo.
 */
export async function inscribir(entrada: InscripcionEntrada): Promise<Inscripcion> {
  if (!entrada.aceptoAvisoPrivacidad) {
    throw new ErrorInscripcion('FALTA_AVISO', 'Debes aceptar el aviso de privacidad para continuar.');
  }
  if (entrada.acompanantes.length > MAX_ACOMPANANTES) {
    throw new ErrorInscripcion('DATOS_INVALIDOS', `Puedes registrar hasta ${MAX_ACOMPANANTES} acompañantes.`);
  }
  const titular = normalizarPersona(entrada.titular, 'Asistente principal');
  const acompanantes = entrada.acompanantes.map((a, i) => normalizarPersona(a, `Acompañante ${i + 1}`));
  const personas = [titular, ...acompanantes];

  const email = entrada.contacto.email.trim().toLowerCase();
  const telefono = entrada.contacto.telefono.replace(/[^\d+]/g, '');
  if (email && !EMAIL.test(email)) throw new ErrorInscripcion('DATOS_INVALIDOS', 'El correo no es válido.');
  if (telefono && telefono.replace('+', '').length < 10) {
    throw new ErrorInscripcion('DATOS_INVALIDOS', 'El teléfono debe tener 10 dígitos.');
  }
  if (personas.some((p) => esMenorDeEdad(p.edad)) && !entrada.consentimientoTutor) {
    throw new ErrorInscripcion(
      'FALTA_TUTOR',
      'Hay menores de edad en la inscripción: confirma que eres su madre, padre o tutor.',
    );
  }

  await latencia(250);

  return almacen.transaccion((tx) => {
    const taller = tx.obtener<Taller>('talleres', entrada.tallerId);
    if (!taller || !taller.activo || taller.fechaFin < Date.now()) {
      throw new ErrorInscripcion('TALLER_NO_DISPONIBLE', 'Esta actividad ya no está disponible.');
    }
    const fuera = personas.find((p) => !edadPermitida(p.edad, taller.edadMin, taller.edadMax));
    if (fuera) {
      throw new ErrorInscripcion('EDAD_NO_PERMITIDA', `${fuera.nombre} (${fuera.edad} años) está fuera del rango de edad.`);
    }
    const disponibles = taller.cupoMaximo - taller.inscritos;
    if (disponibles < personas.length) {
      throw new ErrorInscripcion(
        'SIN_CUPO',
        disponibles <= 0
          ? 'Lo sentimos, ya no hay lugares disponibles.'
          : `Solo quedan ${disponibles} lugar(es) y quieres registrar ${personas.length}.`,
      );
    }

    const inscripcion: Inscripcion = {
      id: generarId(),
      tallerId: taller.id,
      tallerTitulo: taller.titulo,
      tallerFechaInicio: taller.fechaInicio,
      tallerHorario: taller.horario,
      recintoId: taller.recintoId,
      recintoNombre: taller.recintoNombre,
      uidCiudadano: entrada.uidCiudadano,
      titular,
      acompanantes,
      personas: personas.length,
      contacto: { email: email || null, telefono: telefono || null },
      aceptoAvisoPrivacidad: true,
      consentimientoTutor: entrada.consentimientoTutor,
      usado: false,
      usadoEn: null,
      validadoPor: null,
      creadoEn: Date.now(),
    };
    tx.crear('inscripciones', inscripcion);
    tx.actualizar('talleres', taller.id, { inscritos: taller.inscritos + personas.length });
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
      .sort((a, b) => a.tallerFechaInicio - b.tallerFechaInicio);
    alCambiar(lista);
  });
}

/** Al crear cuenta o iniciar sesión: los pases de este dispositivo pasan a la cuenta. */
export async function vincularInscripciones(ids: string[], uid: string) {
  almacen.transaccion((tx) => {
    for (const id of ids) {
      const ins = tx.obtener<Inscripcion>('inscripciones', id);
      if (ins && ins.uidCiudadano === null) tx.actualizar('inscripciones', id, { uidCiudadano: uid });
    }
  });
}

export interface FiltroInscripciones {
  tallerId?: string;
  desde?: number;
  hasta?: number;
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

/* ---------- Pases guardados en el dispositivo (funcionan sin cuenta y sin internet) ---------- */

const CLAVE_PASES = 'sicuj:mis-pases';

export function pasesLocales(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_PASES) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function guardarPaseLocal(id: string) {
  try {
    const ids = pasesLocales();
    if (!ids.includes(id)) localStorage.setItem(CLAVE_PASES, JSON.stringify([...ids, id]));
  } catch {
    /* modo privado: el pase sigue visible en pantalla */
  }
}

export function quitarPaseLocal(id: string) {
  try {
    localStorage.setItem(CLAVE_PASES, JSON.stringify(pasesLocales().filter((x) => x !== id)));
  } catch {
    /* sin almacenamiento disponible */
  }
}
