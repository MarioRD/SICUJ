/** Cuentas: administración del personal y eliminación de la propia cuenta. */
import { usarFirebase } from './config';
import * as remoto from './firebase/cuentas';
import * as local from './local/cuentas';

export type { CuentaCreada, NuevaCuentaEntrada } from './comun/cuentas';

const impl = usarFirebase ? remoto : local;

export const suscribirUsuarios = impl.suscribirUsuarios;
export const crearCuentaPersonal = impl.crearCuentaPersonal;
export const cambiarRol = impl.cambiarRol;
export const eliminarCuentaDe = impl.eliminarCuentaDe;
export const eliminarMiCuenta = impl.eliminarMiCuenta;
