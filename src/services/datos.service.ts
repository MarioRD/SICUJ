/** Datos guardados para inscribirse con un toque (solo personas con cuenta y con su permiso). */
import { usarFirebase } from './config';
import * as remoto from './firebase/datos';
import * as local from './local/datos';

export type { DatosEntrada } from './comun/datos';

const impl = usarFirebase ? remoto : local;

export const obtenerDatosInscripcion = impl.obtenerDatosInscripcion;
export const guardarDatosInscripcion = impl.guardarDatosInscripcion;
export const borrarDatosInscripcion = impl.borrarDatosInscripcion;
