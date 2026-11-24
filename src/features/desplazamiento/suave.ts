import Lenis from 'lenis';

let lenis: Lenis | null = null;

const quieto = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  try {
    return (JSON.parse(localStorage.getItem('sicuj:preferencias') ?? '{}') as { reducirMovimiento?: boolean }).reducirMovimiento === true;
  } catch {
    return false;
  }
};

/**
 * Desplazamiento suave con inercia (rueda del ratón y trackpad). En táctil se deja el
 * nativo del sistema, que ya es suave. Se apaga con "menos animaciones" y no actúa
 * dentro de mapas, diálogos ni carruseles.
 */
export function activarDesplazamientoSuave() {
  const aplicar = () => {
    const debe = !quieto() && document.documentElement.dataset.movimiento !== 'reducido';
    if (debe && !lenis) {
      lenis = new Lenis({
        autoRaf: true,
        lerp: 0.11,
        smoothWheel: true,
        anchors: true,
        prevent: (nodo) => !!nodo.closest('dialog, .leaflet-container, [data-lenis-prevent]'),
      });
    } else if (!debe && lenis) {
      lenis.destroy();
      lenis = null;
    }
  };
  aplicar();
  // Se reevalúa cuando la persona cambia "menos animaciones"
  new MutationObserver(aplicar).observe(document.documentElement, { attributes: true, attributeFilter: ['data-movimiento'] });
}
