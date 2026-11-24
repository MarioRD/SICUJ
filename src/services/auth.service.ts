/** Sesión: Firebase Authentication o, sin configuración, cuentas simuladas locales. */
import { usarFirebase } from './config';
import * as remoto from './firebase/auth';
import * as local from './local/auth';

export { ErrorAuth } from './comun/auth';

const impl = usarFirebase ? remoto : local;

export const suscribirSesion = impl.suscribirSesion;
export const iniciarSesion = impl.iniciarSesion;
export const registrarCiudadano = impl.registrarCiudadano;
export const cerrarSesion = impl.cerrarSesion;
