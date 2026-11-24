import { usarFirebase } from './config';
import * as remoto from './firebase/talleres';
import * as local from './local/talleres';

export { cuposDisponibles, estaVigente, type TallerEntrada } from './comun/talleres';

const impl = usarFirebase ? remoto : local;

export const suscribirTalleres = impl.suscribirTalleres;
export const suscribirTaller = impl.suscribirTaller;
export const listarTalleres = impl.listarTalleres;
export const guardarTaller = impl.guardarTaller;
export const cambiarEstadoTaller = impl.cambiarEstadoTaller;
