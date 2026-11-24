import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

// Flujo completo contra los emuladores de Auth y Firestore: npm run test:integracion
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['pruebas/integracion.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: {
      VITE_FIREBASE_API_KEY: 'clave-emulador',
      VITE_FIREBASE_AUTH_DOMAIN: 'sicuj-pruebas.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'sicuj-pruebas',
      VITE_FIREBASE_APP_ID: '1:1:web:1',
      VITE_USE_EMULATORS: 'true',
    },
  },
});
