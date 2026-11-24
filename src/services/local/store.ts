/**
 * Almacén local que imita a Firestore mientras no hay base de datos.
 *
 * - Colecciones de documentos guardadas en localStorage.
 * - `transaccion()` aplica todas las escrituras juntas o ninguna (como runTransaction).
 * - `suscribir()` avisa en cada cambio (como onSnapshot), incluso entre pestañas
 *   abiertas del mismo navegador: puedes inscribirte en una pestaña y ver el
 *   dashboard actualizarse en otra.
 *
 * Cuando se conecte Firebase, solo se reemplazan los archivos *.service.ts;
 * las páginas no cambian.
 */

export interface AlmacenamientoBasico {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
  removeItem(clave: string): void;
}

export type Coleccion = 'recintos' | 'talleres' | 'inscripciones' | 'usuarios' | 'credenciales' | 'datosInscripcion';

type Documento = { id: string } & Record<string, unknown>;
type Tabla = Record<string, Documento>;
type Oyente = () => void;

const PREFIJO = 'sicuj:v1:';

export class ErrorAlmacen extends Error {}

export interface Transaccion {
  obtener<T extends { id: string }>(col: Coleccion, id: string): T | null;
  crear<T extends { id: string }>(col: Coleccion, doc: T): void;
  actualizar(col: Coleccion, id: string, cambios: Record<string, unknown>): void;
  eliminar(col: Coleccion, id: string): void;
}

export class AlmacenLocal {
  private cache = new Map<Coleccion, Tabla>();
  private oyentes = new Map<Coleccion, Set<Oyente>>();

  constructor(private readonly almacenamiento: AlmacenamientoBasico) {}

  /** Llamar una vez en el navegador para sincronizar pestañas. */
  escucharOtrasPestanas(): () => void {
    const alCambiar = (e: StorageEvent) => {
      if (!e.key?.startsWith(PREFIJO)) return;
      const col = e.key.slice(PREFIJO.length) as Coleccion;
      this.cache.delete(col);
      this.notificar([col]);
    };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }

  private tabla(col: Coleccion): Tabla {
    let t = this.cache.get(col);
    if (!t) {
      const crudo = this.almacenamiento.getItem(PREFIJO + col);
      t = crudo ? (JSON.parse(crudo) as Tabla) : {};
      this.cache.set(col, t);
    }
    return t;
  }

  private guardar(col: Coleccion, tabla: Tabla) {
    try {
      this.almacenamiento.setItem(PREFIJO + col, JSON.stringify(tabla));
    } catch (e) {
      // localStorage tiene ~5 MB. Con Firebase este límite desaparece.
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        throw new ErrorAlmacen(
          'El almacenamiento local del navegador está lleno (versión de prueba). Usa imágenes más ligeras o restablece los datos de demostración.',
        );
      }
      throw e;
    }
    this.cache.set(col, tabla);
  }

  private notificar(cols: Iterable<Coleccion>) {
    const avisados = new Set<Oyente>();
    for (const col of cols) {
      for (const o of this.oyentes.get(col) ?? []) {
        if (avisados.has(o)) continue;
        avisados.add(o);
        o();
      }
    }
  }

  existe(col: Coleccion): boolean {
    return this.almacenamiento.getItem(PREFIJO + col) !== null;
  }

  listar<T>(col: Coleccion): T[] {
    return Object.values(this.tabla(col)) as T[];
  }

  obtener<T>(col: Coleccion, id: string): T | null {
    return (this.tabla(col)[id] as T | undefined) ?? null;
  }

  /** Todas las lecturas y escrituras dentro de `fn` se aplican juntas; si `fn` lanza un error no se aplica nada. */
  transaccion<R>(fn: (tx: Transaccion) => R): R {
    const pendientes = new Map<Coleccion, Tabla>();
    const copia = (col: Coleccion) => {
      let t = pendientes.get(col);
      if (!t) {
        t = { ...this.tabla(col) };
        pendientes.set(col, t);
      }
      return t;
    };

    const tx: Transaccion = {
      obtener: <T extends { id: string }>(col: Coleccion, id: string) =>
        ((pendientes.get(col) ?? this.tabla(col))[id] as T | undefined) ?? null,
      crear: (col, doc) => {
        const t = copia(col);
        if (t[doc.id]) throw new ErrorAlmacen(`Ya existe ${col}/${doc.id}`);
        t[doc.id] = structuredClone(doc) as unknown as Documento;
      },
      actualizar: (col, id, cambios) => {
        const t = copia(col);
        const actual = t[id];
        if (!actual) throw new ErrorAlmacen(`No existe ${col}/${id}`);
        t[id] = { ...actual, ...structuredClone(cambios), id };
      },
      eliminar: (col, id) => {
        delete copia(col)[id];
      },
    };

    const resultado = fn(tx);
    for (const [col, tabla] of pendientes) this.guardar(col, tabla);
    this.notificar(pendientes.keys());
    return resultado;
  }

  /** Similar a onSnapshot: llama a `alCambiar` ahora y en cada cambio. Devuelve la función para dejar de escuchar. */
  suscribir(cols: Coleccion[], alCambiar: Oyente): () => void {
    for (const col of cols) {
      if (!this.oyentes.has(col)) this.oyentes.set(col, new Set());
      this.oyentes.get(col)!.add(alCambiar);
    }
    alCambiar();
    return () => {
      for (const col of cols) this.oyentes.get(col)?.delete(alCambiar);
    };
  }

  borrarTodo() {
    const cols: Coleccion[] = ['recintos', 'talleres', 'inscripciones', 'usuarios', 'credenciales', 'datosInscripcion'];
    for (const col of cols) {
      this.almacenamiento.removeItem(PREFIJO + col);
      this.cache.delete(col);
    }
    this.notificar(cols);
  }
}

export class AlmacenamientoEnMemoria implements AlmacenamientoBasico {
  private datos = new Map<string, string>();
  getItem(k: string) {
    return this.datos.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.datos.set(k, v);
  }
  removeItem(k: string) {
    this.datos.delete(k);
  }
}

function detectarAlmacenamiento(): AlmacenamientoBasico {
  try {
    // Node 25 expone un `localStorage` global incompleto: se verifica que funcione de verdad.
    if (typeof window !== 'undefined' && typeof window.localStorage?.removeItem === 'function') {
      return window.localStorage;
    }
  } catch {
    /* acceso bloqueado (modo privado estricto) */
  }
  return new AlmacenamientoEnMemoria();
}

const almacenamientoNavegador = detectarAlmacenamiento();

export const almacen = new AlmacenLocal(almacenamientoNavegador);

/** Simula la latencia de red para que los estados de "cargando" se vean como en producción. */
export const latencia = (ms = 120) => new Promise<void>((r) => setTimeout(r, ms));
