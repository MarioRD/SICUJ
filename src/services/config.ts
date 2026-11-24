/**
 * ¿Firebase o modo local?
 * Si el .env trae la configuración del proyecto, la app usa Firebase (Auth + Firestore).
 * Sin configuración (o en las pruebas) usa el almacén local con datos de demostración.
 */
export const usarFirebase = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID) && import.meta.env.MODE !== 'test';
