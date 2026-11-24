import { collection, doc, getDocs, limit, query, setDoc } from 'firebase/firestore';
import { construirDatosDemo } from '../local/seed';
import { firebase, sinId } from './app';

/** ¿La base está vacía? (sin recintos ni talleres) */
export async function baseVacia(): Promise<boolean> {
  const { db } = firebase();
  const [r, t] = await Promise.all([
    getDocs(query(collection(db, 'recintos'), limit(1))),
    getDocs(query(collection(db, 'talleres'), limit(1))),
  ]);
  return r.empty && t.empty;
}

/**
 * Carga los recintos reales de Coacalco y las actividades de ejemplo (solo admin).
 * Un documento por escritura: en un solo lote, la comprobación de rol de cada documento
 * se suma y rebasa el límite de lecturas que Firestore permite a las reglas por operación.
 * Los IDs son fijos, así que repetir la carga no duplica nada.
 */
export async function cargarDatosEjemplo() {
  const { db } = firebase();
  const { recintos, talleres } = construirDatosDemo();
  // Primero los recintos: los talleres guardan copia de su nombre y ubicación.
  await Promise.all(recintos.map((r) => setDoc(doc(db, 'recintos', r.id), sinId(r))));
  // Contadores en cero: en la base real solo cuentan las inscripciones reales.
  await Promise.all(talleres.map((t) => setDoc(doc(db, 'talleres', t.id), { ...sinId(t), inscritos: 0 })));
}
