# SICUJ Coacalco · Sistema Integral de Cultura y Juventud

PWA ciudadana + panel administrativo para la Dirección de Cultura y Juventud de Coacalco.

> **Versión de prueba funcional.** Todavía **no** usa Firebase: los datos viven en el
> navegador (`localStorage`) con datos de demostración ficticios. La conexión con la base
> de datos es el siguiente paso.

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pruebas de la lógica (Haversine, cupos, validación de pases)
npm run build      # compilación de producción (PWA)
```

Para probar en el celular dentro de la misma red Wi-Fi: `npm run dev -- --host` y abre la
IP que aparece. La **cámara** (escáner QR) solo funciona en `localhost` o con HTTPS.

### Cuentas demo del panel (`/admin/login`)

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
├── services/          ← ÚNICA capa de datos. Al conectar Firebase solo cambia esta carpeta.
│   └── local/         ← almacén local que imita Firestore (transacciones y tiempo real)
├── features/          ← OCR, voz, escáner QR, reportes (carga diferida)
├── pages/public|admin
├── components/ui|public|admin
├── layouts/           ← PublicLayout (móvil) · AdminLayout (escritorio)
├── utils/             ← funciones puras con pruebas (haversine, edades, compresión…)
└── content/           ← aviso de privacidad (BORRADOR: revisar con jurídico)
```

## Pendiente

- Conectar Firebase (Auth, Firestore, reglas de seguridad) reemplazando `src/services/`.
- Revisión del aviso de privacidad por el área jurídica y la Unidad de Transparencia.
- Identidad gráfica institucional e ícono maskable.
