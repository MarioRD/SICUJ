import type { Recinto, Taller } from '@/types/models';
import { calcularMetricas, type Metricas } from '../comun/metricas';
import { almacen } from './store';

export function suscribirMetricas(alCambiar: (m: Metricas) => void) {
  return almacen.suscribir(['talleres', 'recintos'], () =>
    alCambiar(calcularMetricas(almacen.listar<Taller>('talleres'), almacen.listar<Recinto>('recintos'))),
  );
}
