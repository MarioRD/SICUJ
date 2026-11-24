import { LocateFixed, Search, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ComoLlegar, Mapa, puntosDesdeTalleres, type Destino } from '@/components/mapa';
import { DetalleActividad } from '@/components/public/DetalleActividad';
import { HistoriaCoacalco } from '@/components/public/HistoriaCoacalco';
import { TarjetaTaller } from '@/components/public/TarjetaTaller';
import { ControlSegmentado, TextoRotativo } from '@/components/ui/Animados';
import { Alerta, Cargando, Vacio } from '@/components/ui/Basicos';
import { LucesCandil } from '@/components/ui/LucesCandil';
import { Vidrio } from '@/components/ui/Vidrio';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { suscribirTalleres } from '@/services/talleres.service';
import { CATEGORIAS, type Categoria, type Taller, type TipoActividad } from '@/types/models';
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
  const [orden, setOrden] = useState<Orden>(ubicacion.estado === 'listo' ? 'cercania' : 'fecha');
  const [abierto, setAbierto] = useState<Taller | null>(null);
  const [destino, setDestino] = useState<Destino | null>(null);

  const coords = ubicacion.estado === 'listo' ? ubicacion.coords : null;

  // La búsqueda también encuentra por disciplina ("anime", "idiomas", "autos"…)
  const resultados = useMemo(() => {
    if (!talleres) return [];
    const q = normalizar(busqueda.trim());
    const filtrados = talleres
      .filter((t) => tipo === 'todos' || t.tipo === tipo)
      .filter(
        (t) =>
          !q ||
          normalizar(`${t.titulo} ${t.descripcion} ${t.recintoNombre} ${t.instructor ?? ''} ${CATEGORIAS[t.categoria]}`).includes(q),
      )
      .map((t) => ({
        taller: t,
        distanciaKm: coords
          ? calcularDistanciaHaversine(coords.lat, coords.lng, t.recintoUbicacion.lat, t.recintoUbicacion.lng)
          : undefined,
      }));
    if (orden === 'cercania' && coords) filtrados.sort((a, b) => a.distanciaKm! - b.distanciaKm!);
    return filtrados;
  }, [talleres, busqueda, tipo, orden, coords]);

  const ordenarPorCercania = () => {
    setOrden('cercania');
    if (!coords) solicitar();
  };

  const puntos = useMemo(() => puntosDesdeTalleres(resultados), [resultados]);

  const disciplinas = useMemo(() => {
    const presentes = (Object.keys(CATEGORIAS) as Categoria[]).filter((c) => c !== 'otro' && talleres?.some((t) => t.categoria === c));
    return (presentes.length ? presentes : (['musica', 'danza', 'teatro', 'idiomas'] as Categoria[])).map((c) => CATEGORIAS[c].toLowerCase());
  }, [talleres]);

  return (
    <div className="flex flex-col gap-8">
      <section
        aria-labelledby="titulo-catalogo"
        className="portada-historica superficie-oscura -mx-4 -mt-5 flex flex-col overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-2xl"
      >
        <LucesCandil contenido fuegosCada={4.5} />
        <div className="flex flex-col gap-5 px-5 pt-8 pb-7 sm:px-8 sm:pt-11 lg:px-12 lg:pt-14 lg:pb-11">
          <div className="flex max-w-[36rem] flex-col gap-2">
            <h1 id="titulo-catalogo" className="titulo-claro text-(length:--fs-portada) leading-[1.05] font-extrabold">
              Talleres y eventos{' '}
              <span className="mt-1 flex flex-wrap items-baseline gap-x-[0.3em]">
                de
                <TextoRotativo textos={disciplinas} />
              </span>
            </h1>
            <p className="text-lg text-blanco/85">Actividades culturales gratuitas en Coacalco. Inscríbete sin crear cuenta.</p>
          </div>

          <search className="max-w-[40rem]">
            <Vidrio fuerza={18} bisel={14} className="relative rounded-full" style={{ ['--vidrio-tinte' as string]: 'var(--c-noche)' }}>
              <label htmlFor="busqueda" className="solo-lectores">
                Buscar actividad
              </label>
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-blanco" />
              <input
                id="busqueda"
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Busca: anime, inglés, autos, teatro…"
                className="min-h-[calc(var(--toque-min)*1.15)] w-full rounded-full bg-transparent pr-4 pl-12 text-base text-blanco placeholder:text-blanco/75 focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amarillo"
              />
            </Vidrio>
          </search>
        </div>
        <div className="banda-greca" aria-hidden />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <ControlSegmentado
          etiqueta="Tipo de actividad"
          valor={tipo}
          alCambiar={setTipo}
          className="w-full sm:w-auto sm:min-w-[22rem]"
          opciones={[
            { valor: 'todos', texto: 'Todo' },
            { valor: 'taller', texto: 'Talleres' },
            { valor: 'evento', texto: 'Eventos' },
          ]}
        />
        <ControlSegmentado
          etiqueta="Ordenar actividades"
          valor={orden}
          alCambiar={(o) => (o === 'cercania' ? ordenarPorCercania() : setOrden('fecha'))}
          className="w-full sm:w-auto sm:min-w-[18rem]"
          opciones={[
            { valor: 'fecha', texto: 'Próximos' },
            { valor: 'cercania', texto: 'Cerca de mí' },
          ]}
        />
        {ubicacion.estado === 'buscando' && (
          <span role="status" className="flex items-center gap-1.5 text-sm text-tenue">
            <LocateFixed aria-hidden className="size-4 animate-pulse" /> Buscando tu ubicación…
          </span>
        )}
      </div>
      {ubicacion.estado === 'error' && orden === 'cercania' && <Alerta tono="error">{ubicacion.mensaje}</Alerta>}

      {!talleres ? (
        <Cargando texto="Cargando actividades…" />
      ) : resultados.length === 0 ? (
        <Vacio icono={SearchX} titulo="No encontramos actividades">
          Prueba con otra palabra, por ejemplo "música" o "idiomas".
        </Vacio>
      ) : (
        <section aria-label="Resultados" className="flex flex-col gap-6">
          <Mapa
            puntos={puntos}
            ubicacion={coords}
            alComoLlegar={setDestino}
            alPedirUbicacion={ordenarPorCercania}
            buscando={ubicacion.estado === 'buscando'}
          />
          <p className="text-sm text-tenue" aria-live="polite">
            {resultados.length} {resultados.length === 1 ? 'actividad' : 'actividades'}
            {orden === 'cercania' && coords ? ', de la más cercana a la más lejana' : ''}
          </p>
          <div className="rejilla-auto">
            {resultados.map(({ taller, distanciaKm }) => (
              <TarjetaTaller key={taller.id} taller={taller} distanciaKm={distanciaKm} alAbrir={setAbierto} />
            ))}
          </div>
        </section>
      )}

      <HistoriaCoacalco />

      {abierto && <DetalleActividad taller={abierto} alCerrar={() => setAbierto(null)} />}
      <ComoLlegar destino={destino} alCerrar={() => setDestino(null)} />
    </div>
  );
}
