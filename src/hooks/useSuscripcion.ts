import { useEffect, useState, type DependencyList } from 'react';

/**
 * Conecta un listener en tiempo real (estilo onSnapshot) al ciclo de vida del
 * componente: se suscribe al montar y SIEMPRE se desuscribe al desmontar, para
 * no dejar listeners abiertos que en Firestore seguirían consumiendo lecturas.
 * Devuelve `undefined` mientras llega el primer dato.
 */
export function useSuscripcion<T>(suscribir: (alCambiar: (v: T) => void) => () => void, deps: DependencyList): T | undefined {
  const [valor, setValor] = useState<T | undefined>(undefined);
  useEffect(() => {
    setValor(undefined);
    return suscribir(setValor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return valor;
}
