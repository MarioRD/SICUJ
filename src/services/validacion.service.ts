import { usarFirebase } from './config';
import * as remoto from './firebase/validacion';
import * as local from './local/validacion';

export type { ResultadoValidacion } from './comun/validacion';

const impl = usarFirebase ? remoto : local;

export const validarPase = impl.validarPase;
export const validarPorFolio = impl.validarPorFolio;
