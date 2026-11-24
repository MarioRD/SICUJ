import { defineConfig } from 'vitest/config';

// Pruebas de firestore.rules (necesitan el emulador): npm run test:reglas
export default defineConfig({
  test: {
    environment: 'node',
    include: ['pruebas/reglas.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
