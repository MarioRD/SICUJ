/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt', // el usuario decide cuándo actualizar (no recarga a mitad de un formulario)
      includeAssets: ['icons/favicon-32.png', 'icons/favicon-64.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'SICUJ Coacalco · Cultura y Juventud',
        short_name: 'SICUJ',
        description: 'Talleres, eventos y recintos culturales de Coacalco.',
        lang: 'es-MX',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any', // la escala con clamp()/vmin se ve igual en vertical y horizontal
        background_color: '#ffffff',
        theme_color: '#263167',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Maskable: el logo ocupa el 80 % central (zona segura de Android).
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        // Los chunks de admin/OCR/reportes son pesados: no se precargan,
        // se cachean bajo demanda la primera vez que se usan.
        globIgnores: [
          // Panel administrativo (se usa en línea)
          '**/AdminLayout-*.js',
          '**/LoginPage-*.js',
          '**/DashboardPage-*.js',
          '**/*AdminPage-*.js',
          '**/ValidacionQRPage-*.js',
          '**/ReportesPage-*.js',
          '**/SubirImagen-*.js',
          // Librerías pesadas: se cachean al usarse por primera vez
          '**/reportes-*.js',
          '**/pdfReporte-*.js',
          '**/excelAuditoria-*.js',
          '**/html2canvas-*.js',
          '**/purify.es-*.js',
          '**/index.es-*.js',
          '**/tesseract-*.js',
          '**/zxing-*.js',
          '**/mapa-*.js',
          '**/MapaCultural-*.js',
        ],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Chunks diferidos (admin, OCR, reportes)
            urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === 'script',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'sicuj-chunks' },
          },
          {
            // Motor y modelo de idioma de Tesseract (≈ 10–15 MB, se descarga una sola vez)
            urlPattern: /^https:\/\/(cdn\.jsdelivr\.net|tessdata\.projectnaptha\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sicuj-ocr',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Mosaicos del mapa (OpenStreetMap): los ya vistos funcionan sin conexión
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'sicuj-mapa',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Nota: Firestore NO se cachea aquí; usa su propia caché persistente en IndexedDB
          // (ver src/config/firebase.ts), que además ahorra lecturas.
        ],
      },
    }),
  ],
  build: {
    // `reportes` (jsPDF + SheetJS) pesa ~760 KB pero solo se descarga al exportar un reporte.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase';
          if (id.includes('node_modules/tesseract')) return 'tesseract';
          if (id.includes('node_modules/@zxing')) return 'zxing';
          if (id.includes('node_modules/leaflet')) return 'mapa';
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/xlsx')) return 'reportes';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
