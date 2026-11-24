import { ArrowRight, ChevronDown, LocateFixed, Search, SearchX } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ComoLlegar, Mapa, puntosDesdeTalleres, type Destino } from '@/components/mapa';
import { DetalleActividad } from '@/components/public/DetalleActividad';
import { HistoriaCoacalco } from '@/components/public/HistoriaCoacalco';
import { TarjetaTaller } from '@/components/public/TarjetaTaller';
import { ControlSegmentado } from '@/components/ui/Animados';
import { TextMorph } from '@/components/ui/TextMorph';
import { Alerta, Cargando, Vacio } from '@/components/ui/Basicos';
import { LucesCandil } from '@/components/ui/LucesCandil';
import { Vidrio } from '@/components/ui/Vidrio';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { suscribirTalleres } from '@/services/talleres.service';
import { CATEGORIAS, type Categoria, type Taller, type TipoActividad } from '@/types/models';
import { calcularDistanciaHaversine } from '@/utils/haversine';

type Orden = 'fecha' | 'cercania';

const CORTO: Partial<Record<Categoria, string>> & Record<Exclude<Categoria, 'otro'>, string> = {
  musica: 'música',
  danza: 'danza',
  artes_plasticas: 'arte',
  teatro: 'teatro',
  literatura: 'letras',
  idiomas: 'idiomas',
  cultura_pop: 'anime',
  autos: 'autos',
  juventud: 'juventud',
  campanas: 'jornadas',
};

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
  // Resultado de la última búsqueda enviada (Enter o botón)
  const [aviso, setAviso] = useState<{ texto: string; hay: boolean } | null>(null);
  const [enfoque, setEnfoque] = useState<{ id: string; clave: number } | null>(null);

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

  /** Al buscar: si hay actividades, baja al mapa y marca dónde es; si no, lo dice ahí mismo. */
  const buscar = (e: FormEvent) => {
    e.preventDefault();
    const q = busqueda.trim();
    if (!q || !talleres) {
      setAviso(null);
      return;
    }
    const n = resultados.length;
    const primero = resultados[0];
    if (!primero) {
      setAviso({ hay: false, texto: `Por ahora no hay talleres ni eventos disponibles de «${q}». Prueba con otra palabra.` });
      return;
    }
    const lugares = new Set(resultados.map((r) => r.taller.recintoId)).size;
    setAviso({
      hay: true,
      texto: `${n === 1 ? 'Hay 1 actividad' : `Hay ${n} actividades`} de «${q}» en ${lugares === 1 ? '1 lugar' : `${lugares} lugares`}. Te mostramos dónde.`,
    });
    setEnfoque({ id: primero.taller.recintoId, clave: Date.now() });
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      const destino = document.getElementById('mapa-titulo');
      destino?.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'start' });
      destino?.focus({ preventScroll: true });
    });
  };

  // Palabras cortas: caben en una línea en celular y la portada no cambia de alto al rotar
  const disciplinas = useMemo(() => {
    const presentes = (Object.keys(CORTO) as Categoria[]).filter((c) => talleres?.some((t) => t.categoria === c));
    return [...new Set((presentes.length ? presentes : (['musica', 'danza', 'teatro', 'idiomas'] as Categoria[])).map((c) => CORTO[c] ?? ""))].filter(Boolean);
  }, [talleres]);

  const [bienvenidaMovil] = useState(() => window.matchMedia('(max-width: 39.99rem)').matches);
  const portada = useRef<HTMLElement>(null);

  // Celular: mientras el menú flota sobre la portada oscura, se pinta en tonos claros
  useEffect(() => {
    const el = portada.current;
    if (!el || !bienvenidaMovil) return;
    const raiz = document.documentElement;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) raiz.dataset.encabezado = 'oscuro';
      else delete raiz.dataset.encabezado;
    }, { rootMargin: '0px 0px -88% 0px' });
    io.observe(el);
    return () => {
      io.disconnect();
      delete raiz.dataset.encabezado;
    };
  }, [bienvenidaMovil]);

  return (
    <div className="flex flex-col gap-8">
      <section
        ref={portada}
        aria-labelledby="titulo-catalogo"
        className="portada-historica portada-bienvenida superficie-oscura flex flex-col overflow-hidden max-sm:rounded-none sm:rounded-2xl"
      >
        <LucesCandil contenido fuegosCada={4.5} bienvenida={bienvenidaMovil} />
        <div className="flex flex-col gap-5 px-5 pt-8 pb-7 max-sm:my-auto max-sm:gap-7 max-sm:px-6 sm:px-8 sm:pt-11 lg:px-12 lg:pt-14 lg:pb-11">
          <div className="flex max-w-[36rem] flex-col gap-2 max-sm:gap-4">
            <h1 id="titulo-catalogo" className="titulo-claro text-(length:--fs-portada) leading-[1.05] font-extrabold">
              Talleres y eventos{' '}
              <span className="mt-1 flex flex-nowrap items-baseline gap-x-[0.3em] whitespace-nowrap">
                de
                <span className="rotativo">
                  <span className="rotativo-fondo" aria-hidden />
                  <TextMorph words={disciplinas} className="text-anil" />
                </span>
              </span>
            </h1>
            <p className="text-lg text-blanco/85">Actividades culturales gratuitas en Coacalco. Inscríbete sin crear cuenta.</p>
          </div>

          <search className="flex max-w-[40rem] flex-col gap-2">
            <form onSubmit={buscar}>
            <Vidrio fuerza={18} bisel={14} className="relative rounded-full" style={{ ['--vidrio-tinte' as string]: 'var(--c-noche)' }}>
              <label htmlFor="busqueda" className="solo-lectores">
                Buscar actividad
              </label>
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-blanco" />
              <input
                id="busqueda"
                type="search"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setAviso(null);
                }}
                enterKeyHint="search"
                placeholder="Busca: danza, teatro, pintura…"
                className="min-h-[calc(var(--toque-min)*1.15)] w-full rounded-full bg-transparent pr-14 pl-12 text-base text-blanco placeholder:text-blanco/75 focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amarillo"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-amarillo text-anil transition-transform duration-(--dur-micro) active:scale-90"
              >
                <ArrowRight aria-hidden className="size-5" />
              </button>
            </Vidrio>
            </form>
            <p role="status" aria-live="polite" className="min-h-[1.5em] px-2 text-sm font-semibold">
              {aviso && (
                <span className={`inline-flex items-start gap-1.5 ${aviso.hay ? 'text-amarillo' : 'text-blanco'}`}>
                  {!aviso.hay && <SearchX aria-hidden className="mt-0.5 size-4 shrink-0" />}
                  {aviso.texto}
                </span>
              )}
            </p>
          </search>
        </div>
        <p aria-hidden className="desliza-aviso sm:hidden">
          <ChevronDown className="size-5" />
        </p>
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
            enfoque={enfoque}
          />
          <p className="text-sm text-tenue" aria-live="polite">
            {resultados.length} {resultados.length === 1 ? 'actividad' : 'actividades'}
            {orden === 'cercania' && coords ? ', de la más cercana a la más lejana' : ''}
          </p>
          <div className="rejilla-auto rejilla-actividades">
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
