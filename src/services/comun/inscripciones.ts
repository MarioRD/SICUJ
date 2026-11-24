import type { Genero, Inscripcion, Persona, Taller } from '@/types/models';
import { MAX_ACOMPANANTES } from '@/types/models';
import { folioCorto } from '@/utils/id';
import { calcularRangoEdad, edadPermitida, esMenorDeEdad } from '@/utils/rangosEdad';

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

export interface FiltroInscripciones {
  tallerId?: string;
  desde?: number;
  hasta?: number;
}

export type CodigoErrorInscripcion =
  | 'TALLER_NO_DISPONIBLE'
  | 'SIN_CUPO'
  | 'EDAD_NO_PERMITIDA'
  | 'DATOS_INVALIDOS'
  | 'FALTA_AVISO'
  | 'FALTA_TUTOR'
  | 'YA_INSCRITO';

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

export type EntradaPreparada = ReturnType<typeof prepararEntrada>;

/** Revisa y limpia todo lo que no depende del taller (antes de abrir la transacción). */
export function prepararEntrada(entrada: InscripcionEntrada) {
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
    throw new ErrorInscripcion('FALTA_TUTOR', 'Hay menores de edad en la inscripción: confirma que eres su madre, padre o tutor.');
  }
  return { entrada, titular, acompanantes, personas, email, telefono };
}

/** Dentro de la transacción: vigencia, edades y cupo para TODAS las personas. */
export function verificarTaller(taller: Taller | null, p: EntradaPreparada): asserts taller is Taller {
  if (!taller || !taller.activo || taller.fechaFin < Date.now()) {
    throw new ErrorInscripcion('TALLER_NO_DISPONIBLE', 'Esta actividad ya no está disponible.');
  }
  const fuera = p.personas.find((x) => !edadPermitida(x.edad, taller.edadMin, taller.edadMax));
  if (fuera) {
    throw new ErrorInscripcion('EDAD_NO_PERMITIDA', `${fuera.nombre} (${fuera.edad} años) está fuera del rango de edad.`);
  }
  const disponibles = taller.cupoMaximo - taller.inscritos;
  if (disponibles < p.personas.length) {
    throw new ErrorInscripcion(
      'SIN_CUPO',
      disponibles <= 0
        ? 'Lo sentimos, ya no hay lugares disponibles.'
        : `Solo quedan ${disponibles} lugar(es) y quieres registrar ${p.personas.length}.`,
    );
  }
}

export function construirInscripcion(id: string, taller: Taller, p: EntradaPreparada, ahora = Date.now()): Inscripcion {
  return {
    id,
    folio: folioCorto(id),
    tallerId: taller.id,
    tallerTitulo: taller.titulo,
    tallerFechaInicio: taller.fechaInicio,
    tallerHorario: taller.horario,
    recintoId: taller.recintoId,
    recintoNombre: taller.recintoNombre,
    uidCiudadano: p.entrada.uidCiudadano,
    titular: p.titular,
    acompanantes: p.acompanantes,
    personas: p.personas.length,
    contacto: { email: p.email || null, telefono: p.telefono || null },
    aceptoAvisoPrivacidad: true,
    consentimientoTutor: p.entrada.consentimientoTutor,
    usado: false,
    usadoEn: null,
    validadoPor: null,
    creadoEn: ahora,
  };
}

export const errorYaInscrito = () =>
  new ErrorInscripcion('YA_INSCRITO', 'Ya tienes un pase para esta actividad. Lo encuentras en "Mis pases".');

export const porFechaTaller = (a: Inscripcion, b: Inscripcion) => a.tallerFechaInicio - b.tallerFechaInicio;

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
