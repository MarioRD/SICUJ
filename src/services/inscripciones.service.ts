import { usarFirebase } from './config';
import * as remoto from './firebase/inscripciones';
import * as local from './local/inscripciones';

export {
  ErrorInscripcion,
  guardarPaseLocal,
  pasesLocales,
  quitarPaseLocal,
  type CodigoErrorInscripcion,
  type FiltroInscripciones,
  type InscripcionEntrada,
  type PersonaEntrada,
} from './comun/inscripciones';

const impl = usarFirebase ? remoto : local;

export const inscribir = impl.inscribir;
export const cancelarInscripcion = impl.cancelarInscripcion;
export const suscribirInscripcion = impl.suscribirInscripcion;
export const suscribirMisInscripciones = impl.suscribirMisInscripciones;
export const vincularInscripciones = impl.vincularInscripciones;
export const miPaseEn = impl.miPaseEn;
export const consultarInscripciones = impl.consultarInscripciones;
