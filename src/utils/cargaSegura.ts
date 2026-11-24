import { lazy, type ComponentType } from 'react';

const CLAVE = 'sicuj:recarga-por-version';

/** ¿El error es de un módulo que ya no existe en el servidor (se publicó una versión nueva)? */
export const esErrorDeVersion = (e: unknown) =>
  e instanceof Error && /dynamically imported module|Importing a module script failed|error loading dynamically imported|Unable to preload CSS/i.test(e.message);

/**
 * Tras publicar, una pestaña abierta con la versión anterior pide archivos que ya
 * no existen. En ese caso se recarga una sola vez para traer la versión nueva.
 */
export function recargarPorVersion(): boolean {
  try {
    if (sessionStorage.getItem(CLAVE)) return false;
    sessionStorage.setItem(CLAVE, String(Date.now()));
  } catch {
    /* sin sessionStorage: se intenta igual */
  }
  window.location.reload();
  return true;
}

export function importarSeguro<T>(cargar: () => Promise<T>): () => Promise<T> {
  return () =>
    cargar().then(
      (m) => {
        try {
          sessionStorage.removeItem(CLAVE);
        } catch {
          /* nada */
        }
        return m;
      },
      (e: unknown) => {
        if (esErrorDeVersion(e) && recargarPorVersion()) return new Promise<T>(() => {});
        throw e;
      },
    );
}

/** `React.lazy` que se recupera solo cuando hay una versión nueva publicada. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- misma firma que React.lazy
export const lazySeguro = <T extends ComponentType<any>>(cargar: () => Promise<{ default: T }>) => lazy(importarSeguro(cargar));
