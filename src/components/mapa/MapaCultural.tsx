import L from 'leaflet';
import { ArrowRight, Hand, LocateFixed, MapPin, Navigation } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import limite from '@/data/limite-coacalco.json';
import { Vidrio } from '@/components/ui/Vidrio';
import type { Coordenadas } from '@/types/models';
import { formatearDistancia } from '@/utils/formatters';
import { calcularDistanciaHaversine } from '@/utils/haversine';
import type { Destino } from './ComoLlegar';

export interface PuntoMapa {
  id: string;
  nombre: string;
  direccion?: string;
  lat: number;
  lng: number;
  distanciaKm?: number;
  actividades: Array<{ id: string; titulo: string }>;
}

const COACALCO: L.LatLngTuple = [19.6316, -99.1003];
// Mosaicos: por defecto OpenStreetMap (sin clave) con un filtro CSS que lo deja gris y limpio.
// En producción se puede usar un estilo minimalista con clave (MapTiler, Stadia, CARTO…):
// VITE_MAPA_CLARO / VITE_MAPA_OSCURO con la URL {z}/{x}/{y} y VITE_MAPA_ATRIBUCION.
const PROPIO_CLARO = import.meta.env.VITE_MAPA_CLARO as string | undefined;
const PROPIO_OSCURO = import.meta.env.VITE_MAPA_OSCURO as string | undefined;
const MOSAICOS = {
  claro: PROPIO_CLARO ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  oscuro: PROPIO_OSCURO ?? PROPIO_CLARO ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
};
const ATRIBUCION =
  (import.meta.env.VITE_MAPA_ATRIBUCION as string | undefined) ??
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const temaOscuro = () => document.documentElement.dataset.tema === 'oscuro';
const token = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/**
 * "Descubre el recinto más cercano a ti": mapa minimalista dentro de una tableta (PC)
 * o un celular (móvil), con el límite municipal de Coacalco trazado, marcadores en rombo,
 * una ficha de vidrio con el recinto más cercano y "Cómo llegar".
 */
export default function MapaCultural({
  puntos,
  ubicacion,
  alComoLlegar,
  alPedirUbicacion,
  buscando = false,
  titulo = 'Descubre el recinto más cercano a ti',
  marco = true,
  enfoque,
  className = '',
}: {
  puntos: PuntoMapa[];
  ubicacion?: Coordenadas | null;
  alComoLlegar: (d: Destino) => void;
  alPedirUbicacion?: () => void;
  buscando?: boolean;
  titulo?: string;
  /** true: dentro de tableta/celular con panel; false: el puro mapa (Recintos). */
  marco?: boolean;
  /** Recinto a destacar (p. ej. tras una búsqueda); `clave` cambia en cada búsqueda. */
  enfoque?: { id: string; clave: number } | null;
  className?: string;
}) {
  const nodo = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  // Pantallas táctiles: el mapa empieza "dormido" para no estorbar al desplazarse por la página.
  // Primer toque: aviso; segundo toque: se activa. Al salir de la vista se vuelve a dormir.
  const [tactil] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  const [avisoDosDedos, setAvisoDosDedos] = useState(false);

  // Distancias y recinto más cercano
  const conDistancia = useMemo(
    () =>
      puntos.map((p) => ({
        ...p,
        distanciaKm: ubicacion ? calcularDistanciaHaversine(ubicacion.lat, ubicacion.lng, p.lat, p.lng) : p.distanciaKm,
      })),
    [puntos, ubicacion],
  );
  const masCercano = useMemo(() => {
    if (!ubicacion || !conDistancia.length) return null;
    return [...conDistancia].sort((a, b) => a.distanciaKm! - b.distanciaKm!)[0] ?? null;
  }, [conDistancia, ubicacion]);
  const destacado = useMemo(
    () => [...conDistancia].sort((a, b) => b.actividades.length - a.actividades.length)[0] ?? null,
    [conDistancia],
  );
  const elegido = conDistancia.find((p) => p.id === seleccion) ?? masCercano ?? destacado;
  const etiquetaFicha = seleccion ? 'Recinto seleccionado' : masCercano ? 'Tu recinto más cercano' : 'Recinto con más actividades';

  // Crear el mapa una sola vez
  useEffect(() => {
    if (!nodo.current) return;
    const m = L.map(nodo.current, {
      center: COACALCO,
      zoom: 14,
      zoomControl: false,
      scrollWheelZoom: false, // no secuestra el desplazamiento de la página
      attributionControl: false,
    });
    // Arriba a la derecha: abajo el dispositivo se corta
    L.control.attribution({ position: 'topright', prefix: false }).addTo(m);
    let mosaicos = L.tileLayer(temaOscuro() ? MOSAICOS.oscuro : MOSAICOS.claro, {
      maxZoom: 19,
      attribution: ATRIBUCION,
      className: PROPIO_CLARO ? '' : 'mosaico-osm',
    }).addTo(m);

    // Límite municipal de Coacalco: fuera se atenúa, el borde se traza en añil
    const anillo = (limite.geometry.coordinates[0] as number[][]).map(([lng, lat]) => [lat, lng] as L.LatLngTuple);
    const mundo: L.LatLngTuple[] = [
      [-89, -179],
      [-89, 179],
      [89, 179],
      [89, -179],
    ];
    const velo = L.polygon([mundo, anillo], {
      stroke: false,
      fillColor: token('--c-fondo'),
      fillOpacity: 0.55,
      interactive: false,
    }).addTo(m);
    const borde = L.polyline([...anillo, anillo[0]!], {
      color: token('--c-marca'),
      weight: 2.5,
      dashArray: '7 7',
      interactive: false,
    }).addTo(m);

    // Cambiar mosaicos y colores al cambiar de tema
    const obs = new MutationObserver(() => {
      m.removeLayer(mosaicos);
      mosaicos = L.tileLayer(temaOscuro() ? MOSAICOS.oscuro : MOSAICOS.claro, {
        maxZoom: 19,
        attribution: ATRIBUCION,
        className: PROPIO_CLARO ? '' : 'mosaico-osm',
      }).addTo(m);
      mosaicos.bringToBack();
      velo.setStyle({ fillColor: token('--c-fondo') });
      borde.setStyle({ color: token('--c-marca') });
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });

    m.on('focus click', () => m.scrollWheelZoom.enable());
    m.on('blur mouseout', () => m.scrollWheelZoom.disable());
    capa.current = L.layerGroup().addTo(m);
    mapa.current = m;
    return () => {
      obs.disconnect();
      m.remove();
      mapa.current = null;
    };
  }, []);

  // Táctil: con un dedo se desplaza la página (como en el resto); con dos se mueve y acerca el mapa.
  // Si alguien intenta arrastrarlo de lado con un dedo, se le recuerda usar dos.
  useEffect(() => {
    const m = mapa.current;
    if (!m || !tactil) return;
    m.dragging.disable();
    m.doubleClickZoom.disable();
    m.touchZoom.enable();
    const c = m.getContainer();
    c.style.touchAction = 'pan-x pan-y';
    let inicio: { x: number; y: number } | null = null;
    let t = 0;
    const alTocar = (e: TouchEvent) => {
      const d = e.touches[0];
      inicio = e.touches.length === 1 && d ? { x: d.clientX, y: d.clientY } : null;
      if (e.touches.length > 1) setAvisoDosDedos(false);
    };
    const alMover = (e: TouchEvent) => {
      const d = e.touches[0];
      if (!inicio || e.touches.length !== 1 || !d) return;
      const dx = Math.abs(d.clientX - inicio.x);
      const dy = Math.abs(d.clientY - inicio.y);
      if (dx > 24 && dx > dy * 1.2) {
        inicio = null;
        setAvisoDosDedos(true);
        clearTimeout(t);
        t = window.setTimeout(() => setAvisoDosDedos(false), 1800);
      }
    };
    c.addEventListener('touchstart', alTocar, { passive: true });
    c.addEventListener('touchmove', alMover, { passive: true });
    return () => {
      clearTimeout(t);
      c.removeEventListener('touchstart', alTocar);
      c.removeEventListener('touchmove', alMover);
    };
  }, [tactil]);

  // Marcadores
  useEffect(() => {
    const g = capa.current;
    if (!g) return;
    g.clearLayers();
    for (const p of conDistancia) {
      const n = p.actividades.length;
      const activo = p.id === elegido?.id;
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: '',
          html: `<span class="pin${activo ? ' activo' : ''}"><span class="pin-rombo"></span><span class="pin-num">${n || ''}</span></span>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
        title: `${p.nombre}${n ? `: ${n} ${n === 1 ? 'actividad' : 'actividades'}` : ''}`,
        alt: p.nombre,
        keyboard: true,
        riseOnHover: true,
        zIndexOffset: activo ? 500 : 0,
      })
        .on('click keypress', () => setSeleccion(p.id))
        .addTo(g);
    }
    if (ubicacion) {
      L.marker([ubicacion.lat, ubicacion.lng], {
        icon: L.divIcon({ className: '', html: '<span class="pin-yo"></span>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        title: 'Tu ubicación',
        keyboard: false,
        interactive: false,
      }).addTo(g);
    }
  }, [conDistancia, ubicacion, elegido?.id]);

  // Encuadre: los puntos (y tu ubicación) dentro de Coacalco
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    const limites: L.LatLngTuple[] = puntos.map((p) => [p.lat, p.lng]);
    if (ubicacion) limites.push([ubicacion.lat, ubicacion.lng]);
    if (limites.length === 1) m.setView(limites[0]!, 16);
    else if (limites.length > 1) m.fitBounds(L.latLngBounds(limites), { paddingTopLeft: [56, 56], paddingBottomRight: [56, marco ? 120 : 72], maxZoom: 16 });
  }, [puntos, ubicacion, marco]);

  useEffect(() => {
    if (seleccion && !puntos.some((p) => p.id === seleccion)) setSeleccion(null);
  }, [puntos, seleccion]);

  useEffect(() => {
    if (enfoque) setSeleccion(enfoque.id);
  }, [enfoque]);

  useEffect(() => {
    if (seleccion && elegido) mapa.current?.panTo([elegido.lat, elegido.lng], { animate: true });
  }, [seleccion, elegido]);

  return (
    <section aria-labelledby="mapa-titulo" className={`flex flex-col gap-4 ${className}`}>
      <h2 id="mapa-titulo" tabIndex={-1} className={marco ? 'text-center text-2xl leading-tight font-bold sm:text-3xl' : 'solo-lectores'}>
        {titulo}
      </h2>
      <Marco activo={marco}>
          <div className={`mapa-cultural ${marco ? 'dispositivo-pantalla' : 'mapa-plano'}`}>
            <div ref={nodo} className="absolute inset-0" aria-label="Mapa de recintos de Coacalco" />
            {tactil && (
              <div aria-live="polite" className="pointer-events-none absolute inset-x-0 z-[600] flex justify-center px-3" style={{ bottom: marco ? 'calc(var(--corte) + 3.25rem)' : '4.25rem' }}>
                {avisoDosDedos && (
                  <Vidrio
                    as="p"
                    fuerza={12}
                    bisel={10}
                    className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold whitespace-nowrap text-tinta shadow-lg"
                    style={{ animation: 'entrar-suave 240ms var(--curva-liquida) both' }}
                  >
                    <Hand aria-hidden className="size-4 text-marca" /> Usa dos dedos para mover el mapa
                  </Vidrio>
                )}
              </div>
            )}

            {elegido && (
              <Vidrio
                as="div"
                role="group"
                aria-label={`${etiquetaFicha}: ${elegido.nombre}`}
                fuerza={12}
                bisel={10}
                escarcha={8}
                className={`absolute top-3 left-3 z-[500] flex max-w-[min(78%,17rem)] flex-col gap-1 rounded-2xl p-3.5 shadow-lg max-sm:right-3 max-sm:max-w-none max-sm:flex-row max-sm:items-center max-sm:gap-2 max-sm:rounded-full max-sm:py-1.5 max-sm:pr-1.5 max-sm:pl-4 ${marco ? 'max-md:top-12' : ''}`}
                // Más opaca que el resto del vidrio: el mapa de fondo tiene mucho detalle
                style={{ animation: 'entrar-suave 320ms var(--curva-liquida) both', ['--vidrio-opacidad' as string]: '86%' }}
                key={elegido.id}
              >
                <p className="text-xs text-tenue max-sm:hidden">{etiquetaFicha}</p>
                <p className="fuente-display min-w-0 text-base leading-tight font-bold text-marca max-sm:flex-1 max-sm:truncate max-sm:text-sm">{elegido.nombre}</p>
                {(elegido.distanciaKm !== undefined || elegido.direccion) && (
                  <p className="flex items-start gap-1 text-xs text-tenue max-sm:hidden">
                    <MapPin aria-hidden className="mt-px size-3.5 shrink-0" />
                    {elegido.distanciaKm !== undefined ? `a ${formatearDistancia(elegido.distanciaKm)} de ti` : elegido.direccion}
                  </p>
                )}
                {elegido.actividades.length > 0 && (
                  <ul className="mt-1 flex flex-col gap-0.5 text-xs max-sm:hidden">
                    {elegido.actividades.slice(0, 2).map((a) => (
                      <li key={a.id}>
                        <Link to={`/taller/${a.id}`} state={{ desde: location.pathname }} className="group inline-flex items-center gap-1 font-semibold text-marca hover:underline">
                          {a.titulo}
                          <ArrowRight aria-hidden className="size-3 transition-transform duration-(--dur-micro) group-hover:translate-x-0.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => alComoLlegar({ nombre: elegido.nombre, lat: elegido.lat, lng: elegido.lng })}
                  aria-label={`Cómo llegar a ${elegido.nombre}`}
                  className="brillo mt-2 inline-flex min-h-9 w-fit shrink-0 items-center gap-1.5 rounded-full bg-rojo px-4 text-sm font-bold text-blanco shadow-sm transition-transform duration-(--dur-micro) active:scale-95 max-sm:mt-0 max-sm:px-3.5"
                >
                  <Navigation aria-hidden className="size-3.5" />
                  <span className="max-sm:hidden">Cómo llegar</span>
                  <span className="sm:hidden">Ir</span>
                </button>
              </Vidrio>
            )}

            {alPedirUbicacion && (
              <Vidrio
                as="button"
                type="button"
                onClick={alPedirUbicacion}
                fuerza={14}
                bisel={12}
                className="brillo absolute left-1/2 z-[500] flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full px-5 text-sm font-bold whitespace-nowrap text-tinta transition-transform duration-(--dur-micro) active:scale-95"
                style={{ bottom: marco ? 'calc(var(--corte) - 0.25rem)' : '1rem' }}
                aria-busy={buscando || undefined}
              >
                <LocateFixed aria-hidden className={`size-4 ${buscando ? 'animate-pulse' : ''}`} />
                <span>
                  {buscando ? 'Buscando…' : ubicacion ? 'Actualizar mi ubicación' : 'Buscar recinto'}
                  {!buscando && !ubicacion && <span className="max-sm:hidden"> cercano</span>}
                </span>
              </Vidrio>
            )}
          </div>
      </Marco>
    </section>
  );
}

function Marco({ activo, children }: { activo: boolean; children: ReactNode }) {
  if (!activo) return <>{children}</>;
  return (
    <div className="mapa-escena">
      <div className="mapa-panel" aria-hidden />
      <div className="dispositivo">{children}</div>
    </div>
  );
}
