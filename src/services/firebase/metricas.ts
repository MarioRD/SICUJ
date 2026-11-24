import { collection, onSnapshot } from 'firebase/firestore';
import type { Recinto, Taller } from '@/types/models';
import { calcularMetricas, type Metricas } from '../comun/metricas';
import { conId, firebase } from './app';

/** Escucha solo talleres y recintos (sus contadores), nunca las inscripciones. */
export function suscribirMetricas(alCambiar: (m: Metricas) => void) {
  const { db } = firebase();
  let talleres: Taller[] | null = null;
  let recintos: Recinto[] | null = null;
  const emitir = () => talleres && recintos && alCambiar(calcularMetricas(talleres, recintos));
  const a = onSnapshot(collection(db, 'talleres'), (s) => {
    talleres = s.docs.map((d) => conId<Taller>(d)!);
    emitir();
  });
  const b = onSnapshot(collection(db, 'recintos'), (s) => {
    recintos = s.docs.map((d) => conId<Recinto>(d)!);
    emitir();
  });
  return () => {
    a();
    b();
  };
}
