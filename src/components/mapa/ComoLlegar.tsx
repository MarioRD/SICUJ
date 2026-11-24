import { Compass, Map as MapaIcono, Navigation2, Smartphone } from 'lucide-react';
import { Modal } from '@/components/ui/Basicos';

export interface Destino {
  nombre: string;
  lat: number;
  lng: number;
}

/** Enlaces de navegación paso a paso hacia el destino, en la app que la persona prefiera. */
function opciones(d: Destino) {
  const ll = `${d.lat},${d.lng}`;
  const nombre = encodeURIComponent(d.nombre);
  const android = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  return [
    {
      id: 'google',
      texto: 'Google Maps',
      href: `https://www.google.com/maps/dir/?api=1&destination=${ll}`,
      placa: 'linear-gradient(135deg, var(--c-cielo), var(--c-azul))',
      icono: MapaIcono,
    },
    {
      id: 'waze',
      texto: 'Waze',
      href: `https://waze.com/ul?ll=${ll}&navigate=yes`,
      placa: 'linear-gradient(135deg, var(--c-cielo), var(--c-anil))',
      icono: Navigation2,
    },
    {
      id: 'apple',
      texto: 'Mapas de Apple',
      href: `https://maps.apple.com/?daddr=${ll}&q=${nombre}`,
      placa: 'linear-gradient(135deg, var(--c-grafito), var(--c-carbon))',
      icono: Compass,
    },
    ...(android
      ? [
          {
            id: 'geo',
            texto: 'Otra app',
            href: `geo:${ll}?q=${ll}(${nombre})`,
            placa: 'linear-gradient(135deg, var(--c-amarillo), var(--c-coral))',
            icono: Smartphone,
          },
        ]
      : []),
  ];
}

export function ComoLlegar({ destino, alCerrar }: { destino: Destino | null; alCerrar: () => void }) {
  return (
    <Modal abierto={!!destino} alCerrar={alCerrar} titulo="¿Con qué app quieres llegar?" ancho="clamp(20rem, 92vw, 30rem)">
      {destino && (
        <div className="flex flex-col gap-6 pb-2">
          <p className="text-tenue">
            Ruta hacia <strong className="text-tinta">{destino.nombre}</strong>. Se abre en tu app de navegación.
          </p>
          <ul className="iconos-vidrio" role="list">
            {opciones(destino).map(({ id, texto, href, placa, icono: Icono }) => (
              <li key={id}>
                <a
                  className="icono-vidrio"
                  href={href}
                  target={id === 'geo' ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  onClick={() => setTimeout(alCerrar, 300)}
                >
                  <span className="icono-vidrio-caja" aria-hidden>
                    <span className="icono-vidrio-placa" style={{ ['--placa' as string]: placa }} />
                    <span className="icono-vidrio-cristal" />
                    <Icono className="icono-vidrio-glifo size-8" strokeWidth={1.8} />
                  </span>
                  {texto}
                  {id !== 'geo' && <span className="solo-lectores"> (se abre en otra pestaña)</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
