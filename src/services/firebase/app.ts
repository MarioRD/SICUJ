import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';

let instancia: { app: FirebaseApp; auth: Auth; db: Firestore } | null = null;

/** Se inicializa la primera vez que se usa (en modo local nunca se toca). */
export function firebase() {
  if (instancia) return instancia;
  const env = import.meta.env;
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  // Caché persistente: los pases y el catálogo se ven sin internet y entre pestañas.
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  const auth = getAuth(app);
  auth.languageCode = 'es';
  if (env.VITE_USE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  instancia = { app, auth, db };
  return instancia;
}

/** Documento de Firestore → objeto de la app (el id vive en la ruta, no dentro del documento). */
export function conId<T>(s: DocumentSnapshot): T | null {
  return s.exists() ? ({ ...s.data(), id: s.id } as T) : null;
}

/** Objeto de la app → datos del documento (sin el id). */
export function sinId<T extends { id: string }>(o: T): Omit<T, 'id'> {
  const { id: _id, ...resto } = o;
  return resto;
}
