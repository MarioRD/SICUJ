import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { asegurarDatosDemo } from './services/local/seed';
import { almacen } from './services/local/store';
import './styles/index.css';
import { activarDesplazamientoSuave } from './features/desplazamiento/suave';

// Versión de prueba: carga datos de demostración la primera vez y sincroniza pestañas.
asegurarDatosDemo(almacen);
almacen.escucharOtrasPestanas();

// PWA: si hay una versión nueva, se pregunta antes de recargar (no interrumpe formularios).
const actualizar = registerSW({
  onNeedRefresh() {
    if (window.confirm('Hay una nueva versión de SICUJ disponible. ¿Actualizar ahora?')) void actualizar(true);
  },
});

activarDesplazamientoSuave();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
