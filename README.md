# SICUJ Coacalco · Sistema Integral de Cultura y Juventud

PWA ciudadana + panel administrativo para la Dirección de Cultura y Juventud de Coacalco.

> **Dos modos.** Con el archivo `.env` configurado usa **Firebase** (Authentication +
> Firestore). Sin `.env` funciona en **modo local**: los datos viven en el navegador con
> datos de demostración, útil para probar sin internet.

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pruebas de la lógica (Haversine, cupos, validación de pases)
npm run build      # compilación de producción (PWA)

# Necesitan Java (usan los emuladores de Firebase, no tocan la base real)
npm run test:reglas       # reglas de seguridad de Firestore
npm run test:integracion  # flujo completo: inscribir, cancelar, validar en puerta
```

## Firebase

1. Copia `.env.example` como `.env` y llena los valores de la app web (Consola →
   Configuración del proyecto → Tus apps). No son secretos: la seguridad está en las reglas.
2. Publica las reglas e índices (una sola vez y cada que cambien):
   ```bash
   npx firebase login
   npm run reglas:publicar
   ```
3. **Primera cuenta de administración:** regístrate en la app (Mis pases → Crear cuenta).
   En la consola, abre Firestore → `usuarios` → tu documento y cambia `rol` de
   `ciudadano` a `admin`. Para personal de acceso usa `staff`.
4. Entra a `/admin` y en **Indicadores → Cargar datos de ejemplo** se cargan los recintos
   de Coacalco y actividades de ejemplo (solo aparece si la base está vacía).

Las imágenes se guardan dentro de Firestore en WebP comprimido (plan gratuito Spark);
Cloud Storage no es necesario.

Para probar en el celular dentro de la misma red Wi-Fi: `npm run dev -- --host` y abre la
IP que aparece. La **cámara** (escáner QR) solo funciona en `localhost` o con HTTPS.

### Cuentas demo del panel (`/admin/login`, solo modo local)

| Rol   | Correo             | Contraseña | Acceso                         |
|-------|--------------------|------------|--------------------------------|
| Admin | `admin@sicuj.demo` | `admin123` | Todo                           |
| Staff | `staff@sicuj.demo` | `staff123` | Solo validación de pases QR    |

En **Indicadores → Restablecer demo** se vuelve al estado inicial.

## Qué hay

**Ciudadano (móvil primero)**: catálogo con búsqueda y filtros, orden por cercanía
(Haversine), detalle con lectura en voz alta, inscripción **sin cuenta** (nombre parcial,
hasta 4 acompañantes, consentimiento de tutor si hay menores), pase QR guardado en el
dispositivo, recintos por distancia, accesibilidad (alto contraste, tamaño de texto, OCR
de carteles con Tesseract), cuenta opcional y aviso de privacidad provisional.

**Admin (laptop/monitor primero)**: indicadores en tiempo real, CRUD de talleres/eventos y
recintos con baja lógica y compresión WebP, validación de pases por cámara (ZXing) o por
folio con alerta visual y sonora, reporte ejecutivo PDF y auditoría Excel.

## Sistema visual fluido (`clamp()`)

Todo el tamaño de texto, espacios, radios y anchos sale de variables con `clamp()` en
[`src/styles/index.css`](src/styles/index.css). Se escalan con `vmin` (el lado corto de la
pantalla), así que **un celular se ve igual en vertical y en horizontal**. Hay dos escalas:
la ciudadana (calibrada para teléfonos) y `.escala-admin` (calibrada para monitores).
Tailwind usa esas variables, por eso `text-lg`, `p-4`, `gap-6`, etc. ya son fluidos.

Para el rediseño institucional basta con cambiar los colores `--c-*` y, si se requiere,
los rangos de `clamp()` en ese mismo archivo.

## Arquitectura

```
src/
├── services/          ← ÚNICA capa de datos: *.service.ts elige Firebase o local
│   ├── comun/         ← reglas de negocio compartidas (cupo, edades, validaciones)
│   ├── firebase/      ← Auth + Firestore (transacciones y tiempo real)
│   └── local/         ← almacén local que imita Firestore (modo sin .env y pruebas)
├── features/          ← OCR, voz, escáner QR, reportes (carga diferida)
├── pages/public|admin
├── components/ui|public|admin
├── layouts/           ← PublicLayout (móvil) · AdminLayout (escritorio)
├── utils/             ← funciones puras con pruebas (haversine, edades, compresión…)
└── content/           ← aviso de privacidad (BORRADOR: revisar con jurídico)
```

## Pendiente

- Activar App Check en Firebase para frenar el uso automatizado de la API.
- Revisión del aviso de privacidad por el área jurídica y la Unidad de Transparencia.
