import { LocateFixed, Search, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Alerta, Cargando, Vacio } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { TarjetaTaller } from '@/components/public/TarjetaTaller';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { suscribirTalleres } from '@/services/talleres.service';
import { CATEGORIAS, type Categoria, type TipoActividad } from '@/types/models';
import { calcularDistanciaHaversine } from '@/utils/haversine';

type Orden = 'fecha' | 'cercania';

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export default function CatalogoPage() {
  const talleres = useSuscripcion(suscribirTalleres.bind(null, {}), []);
  const { ubicacion, solicitar } = useGeolocation();
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState<TipoActividad | 'todos'>('todos');
  const [categoria, setCategoria] = useState<Categoria | 'todas'>('todas');
  const [orden, setOrden] = useState<Orden>(ubicacion.estado === 'listo' ? 'cercania' : 'fecha');

  const coords = ubicacion.estado === 'listo' ? ubicacion.coords : null;

  const resultados = useMemo(() => {
    if (!talleres) return [];
    const q = normalizar(busqueda.trim());
    const filtrados = talleres
      .filter((t) => tipo === 'todos' || t.tipo === tipo)
      .filter((t) => categoria === 'todas' || t.categoria === categoria)
      .filter((t) => !q || normalizar(`${t.titulo} ${t.descripcion} ${t.recintoNombre} ${t.instructor ?? ''}`).includes(q))
      .map((t) => ({
        taller: t,
        distanciaKm: coords
          ? calcularDistanciaHaversine(coords.lat, coords.lng, t.recintoUbicacion.lat, t.recintoUbicacion.lng)
          : undefined,
      }));
    if (orden === 'cercania' && coords) filtrados.sort((a, b) => a.distanciaKm! - b.distanciaKm!);
    return filtrados;
  }, [talleres, busqueda, tipo, categoria, orden, coords]);

  const ordenarPorCercania = () => {
    setOrden('cercania');
    if (!coords) solicitar();
  };

  const categoriasPresentes = useMemo(
    () => (Object.keys(CATEGORIAS) as Categoria[]).filter((c) => talleres?.some((t) => t.categoria === c)),
    [talleres],
  );

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="titulo-catalogo" className="flex flex-col gap-1">
        <h1 id="titulo-catalogo" className="text-3xl leading-tight font-bold">
          Talleres y eventos
        </h1>
        <p className="text-tenue">Actividades culturales gratuitas en Coacalco. Inscríbete sin crear cuenta.</p>
      </section>

      <search className="flex flex-col gap-3">
        <div className="relative">
          <label htmlFor="busqueda" className="solo-lectores">
            Buscar actividad
          </label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-tenue" />
          <input
            id="busqueda"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar: guitarra, danza, poesía…"
            className="min-h-[calc(var(--toque-min)*1.1)] w-full rounded-lg border-2 border-linea bg-superficie pr-3 pl-11 text-base focus:border-marca focus:outline-none"
          />
        </div>

        <div className="flex gap-2" role="radiogroup" aria-label="Tipo de actividad">
          {(['todos', 'taller', 'evento'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              onClick={() => setTipo(t)}
              className={`toque flex-1 rounded-lg border-2 px-3 text-sm font-bold ${
                tipo === t ? 'border-marca bg-marca text-marca-tinta' : 'border-linea bg-superficie'
              }`}
            >
              {t === 'todos' ? 'Todos' : t === 'taller' ? 'Talleres' : 'Eventos'}
            </button>
          ))}
        </div>

        {/* Fichas desplazables horizontalmente: no ocupan alto en pantallas pequeñas */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Categoría">
          {(['todas', ...categoriasPresentes] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={categoria === c}
              onClick={() => setCategoria(c)}
              className={`min-h-[calc(var(--toque-min)*0.85)] shrink-0 rounded-full border-2 px-4 text-sm font-semibold whitespace-nowrap ${
                categoria === c ? 'border-marca bg-marca/12 text-marca' : 'border-linea bg-superficie text-tenue'
              }`}
            >
              {c === 'todas' ? 'Todas' : CATEGORIAS[c]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-tenue">Ordenar:</span>
          <Boton tamano="sm" variante={orden === 'fecha' ? 'primario' : 'secundario'} onClick={() => setOrden('fecha')} aria-pressed={orden === 'fecha'}>
            Próximos
          </Boton>
          <Boton
            tamano="sm"
            variante={orden === 'cercania' ? 'primario' : 'secundario'}
            onClick={ordenarPorCercania}
            aria-pressed={orden === 'cercania'}
            cargando={ubicacion.estado === 'buscando'}
            icono={<LocateFixed aria-hidden className="size-4" />}
          >
            Cerca de mí
          </Boton>
        </div>
        {ubicacion.estado === 'error' && orden === 'cercania' && <Alerta tono="error">{ubicacion.mensaje}</Alerta>}
      </search>

      {!talleres ? (
        <Cargando texto="Cargando actividades…" />
      ) : resultados.length === 0 ? (
        <Vacio icono={SearchX} titulo="No encontramos actividades">
          Prueba con otra palabra o quita los filtros.
        </Vacio>
      ) : (
        <section aria-label="Resultados">
          <p className="mb-3 text-sm text-tenue" aria-live="polite">
            {resultados.length} {resultados.length === 1 ? 'actividad' : 'actividades'}
            {orden === 'cercania' && coords ? ', de la más cercana a la más lejana' : ''}
          </p>
          <div className="rejilla-auto">
            {resultados.map(({ taller, distanciaKm }) => (
              <TarjetaTaller key={taller.id} taller={taller} distanciaKm={distanciaKm} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
