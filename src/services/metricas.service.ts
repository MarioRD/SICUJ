import { usarFirebase } from './config';
import * as remoto from './firebase/metricas';
import * as local from './local/metricas';

export type { Metricas } from './comun/metricas';

export const suscribirMetricas = usarFirebase ? remoto.suscribirMetricas : local.suscribirMetricas;
