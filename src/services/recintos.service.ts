import { usarFirebase } from './config';
import * as remoto from './firebase/recintos';
import * as local from './local/recintos';

export type { RecintoEntrada } from './comun/recintos';

const impl = usarFirebase ? remoto : local;

export const suscribirRecintos = impl.suscribirRecintos;
export const listarRecintosActivos = impl.listarRecintosActivos;
export const guardarRecinto = impl.guardarRecinto;
export const cambiarEstadoRecinto = impl.cambiarEstadoRecinto;
