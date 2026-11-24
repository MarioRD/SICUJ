import { Camera, ChevronRight, Gauge, ImageUp, Minus, Moon, Plus, RotateCcw, ScanText, Type, Wind } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Alerta } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { AreaTexto } from '@/components/ui/Campo';
import { ModalVidrio } from '@/components/ui/ModalVidrio';
import { BotonLeer } from '@/components/public/BotonLeer';
import { usePreferencias, type TamanoTexto } from '@/context/PreferenciasContext';
import { useOCR } from '@/features/ocr/useOCR';

const TAMANOS: Array<{ v: TamanoTexto; t: string; escala: string }> = [
  { v: 'normal', t: 'Normal', escala: 'text-base' },
  { v: 'grande', t: 'Grande', escala: 'text-xl' },
  { v: 'muy_grande', t: 'Muy grande', escala: 'text-2xl' },
];

/** Mosaico de ajuste: ícono grande, nombre corto y el control. */
function Mosaico({ icono, titulo, children, className = '' }: { icono: ReactNode; titulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={`tarjeta flex flex-col gap-3 p-4 ${className}`}>
      <p className="flex items-center gap-2.5 font-bold">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-marca/10 text-marca">{icono}</span>
        {titulo}
      </p>
      {children}
    </div>
  );
}

/** Interruptor grande: todo el mosaico se toca. */
function MosaicoInterruptor({ icono, titulo, activo, alCambiar }: { icono: ReactNode; titulo: string; activo: boolean; alCambiar: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => alCambiar(!activo)}
      className={`tarjeta flex flex-col justify-between gap-3 p-4 text-left transition-[background-color,border-color,transform] duration-(--dur-corta) ease-(--curva-liquida) active:scale-[0.97] ${
        activo ? 'border-marca bg-marca text-marca-tinta' : 'hover:border-marca/40'
      }`}
    >
      <span className={`grid size-9 place-items-center rounded-xl ${activo ? 'bg-blanco/20' : 'bg-marca/10 text-marca'}`}>{icono}</span>
      <span className="flex items-center justify-between gap-3">
        <span className="leading-tight font-bold">{titulo}</span>
        <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition-[background-color,border-color] duration-(--dur-micro) ${activo ? 'border-blanco/70 bg-blanco/25' : 'border-linea bg-hundido'}`}>
          <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-superficie shadow-sm transition-transform duration-(--dur-corta) ease-(--curva-liquida) ${activo ? 'translate-x-5' : 'translate-x-0'}`} />
        </span>
      </span>
    </button>
  );
}

function LectorCarteles({ alCerrar }: { alCerrar: () => void }) {
  const { estado, leer, reiniciar } = useOCR();
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const inputCamara = useRef<HTMLInputElement>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
  }, [vistaPrevia]);

  const alElegir = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setVistaPrevia(URL.createObjectURL(archivo));
    setTexto('');
    const resultado = await leer(archivo);
    if (resultado !== null) setTexto(resultado);
  };

  const ocupado = estado.fase === 'cargando' || estado.fase === 'leyendo';
  const progreso = estado.fase === 'leyendo' ? estado.progreso : estado.fase === 'cargando' ? estado.progreso : 0;

  return (
    <ModalVidrio alCerrar={alCerrar} etiquetadoPor="t-ocr" ancho="min(94vw, 34rem)">
      <section className="tarjeta flex flex-col gap-4 p-5 shadow-2xl">
        <div>
          <h2 id="t-ocr" className="flex items-center gap-2 text-2xl font-bold">
            <ScanText aria-hidden className="size-6" /> Leer un cartel en voz alta
          </h2>
          <p className="mt-1 text-tenue">Toma una foto del cartel: sacamos el texto y te lo leemos. La foto no sale de tu teléfono.</p>
        </div>

        <input ref={inputCamara} type="file" accept="image/*" capture="environment" className="sr-only" onChange={alElegir} tabIndex={-1} aria-hidden />
        <input ref={inputArchivo} type="file" accept="image/*" className="sr-only" onChange={alElegir} tabIndex={-1} aria-hidden />
        <div className="grid grid-cols-2 gap-2">
          <Boton tamano="lg" onClick={() => inputCamara.current?.click()} disabled={ocupado} icono={<Camera aria-hidden className="size-5" />}>
            Tomar foto
          </Boton>
          <Boton tamano="lg" variante="secundario" onClick={() => inputArchivo.current?.click()} disabled={ocupado} icono={<ImageUp aria-hidden className="size-5" />}>
            Subir imagen
          </Boton>
        </div>

        {vistaPrevia && <img src={vistaPrevia} alt="Imagen seleccionada" className="max-h-[28vh] w-full rounded-lg bg-hundido object-contain" />}

        {ocupado && (
          <div role="status" className="flex flex-col gap-2">
            <p className="text-sm font-semibold">{estado.fase === 'leyendo' ? 'Leyendo texto…' : estado.mensaje}</p>
            <progress value={progreso} max={1} className="h-2 w-full accent-(--c-marca)" aria-label="Progreso de lectura" />
          </div>
        )}
        {estado.fase === 'error' && <Alerta tono="error">{estado.mensaje}</Alerta>}

        {estado.fase === 'listo' && (
          <div className="flex flex-col gap-3">
            {texto.trim() ? (
              <>
                <p className="text-sm text-tenue" role="status">
                  Texto encontrado (confianza {estado.confianza}%). Puedes corregirlo antes de escucharlo.
                </p>
                <AreaTexto etiqueta="Texto extraído" rows={5} value={texto} onChange={(e) => setTexto(e.target.value)} />
                <BotonLeer texto={texto} etiqueta="Leer en voz alta" />
              </>
            ) : (
              <Alerta>No encontramos texto. Acércate más al cartel y busca buena luz.</Alerta>
            )}
            <Boton
              variante="fantasma"
              tamano="sm"
              icono={<RotateCcw aria-hidden className="size-4" />}
              onClick={() => {
                reiniciar();
                setTexto('');
                setVistaPrevia(null);
              }}
            >
              Leer otra imagen
            </Boton>
          </div>
        )}
      </section>
    </ModalVidrio>
  );
}

/** Menú de accesibilidad en una sola pantalla: mosaicos grandes, sin desplazarse. */
export default function AccesibilidadPage() {
  const { preferencias, cambiar } = usePreferencias();
  const [lector, setLector] = useState(false);
  const velocidad = preferencias.velocidadVoz;
  const cambiarVelocidad = (d: number) => cambiar({ velocidadVoz: Math.min(1.6, Math.max(0.6, Math.round((velocidad + d) * 10) / 10)) });

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-3xl leading-tight font-bold">Accesibilidad</h1>
        <p className="text-tenue">Ajusta la app a tu manera. Los cambios se guardan solos.</p>
      </header>

      <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-4">
        <MosaicoInterruptor
          icono={<Moon aria-hidden className="size-5" />}
          titulo="Modo oscuro"
          activo={preferencias.modoOscuro}
          alCambiar={(v) => cambiar({ modoOscuro: v })}
        />
        <MosaicoInterruptor
          icono={<Wind aria-hidden className="size-5" />}
          titulo="Menos animaciones"
          activo={preferencias.reducirMovimiento}
          alCambiar={(v) => cambiar({ reducirMovimiento: v })}
        />

        <Mosaico icono={<Type aria-hidden className="size-5" />} titulo="Tamaño del texto" className="col-span-2">
          <div role="radiogroup" aria-label="Tamaño del texto" className="grid grid-cols-3 gap-2">
            {TAMANOS.map(({ v, t, escala }) => {
              const activo = preferencias.tamanoTexto === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  onClick={() => cambiar({ tamanoTexto: v })}
                  className={`toque flex flex-col items-center justify-center rounded-xl border-2 px-2 py-1 transition-[background-color,border-color,transform] duration-(--dur-corta) ease-(--curva-liquida) active:scale-95 ${
                    activo ? 'border-marca bg-marca text-marca-tinta' : 'border-linea hover:border-marca/40'
                  }`}
                >
                  <span aria-hidden className={`fuente-display leading-none font-bold ${escala}`}>
                    Aa
                  </span>
                  <span className="text-xs font-semibold">{t}</span>
                </button>
              );
            })}
          </div>
        </Mosaico>

        <Mosaico icono={<Gauge aria-hidden className="size-5" />} titulo="Velocidad de la voz" className="col-span-2">
          <div className="flex items-center justify-between gap-3">
            <Boton variante="secundario" onClick={() => cambiarVelocidad(-0.1)} disabled={velocidad <= 0.6} aria-label="Más lenta" icono={<Minus aria-hidden className="size-5" />} />
            <p className="text-center" aria-live="polite">
              <span className="fuente-display block text-3xl leading-none font-bold">{velocidad.toFixed(1)}×</span>
              <span className="text-sm text-tenue">{velocidad < 0.95 ? 'Lenta' : velocidad > 1.15 ? 'Rápida' : 'Normal'}</span>
            </p>
            <Boton variante="secundario" onClick={() => cambiarVelocidad(0.1)} disabled={velocidad >= 1.6} aria-label="Más rápida" icono={<Plus aria-hidden className="size-5" />} />
          </div>
        </Mosaico>

        <button
          type="button"
          onClick={() => setLector(true)}
          aria-haspopup="dialog"
          className="tarjeta group col-span-2 flex items-center gap-4 p-4 text-left transition-[box-shadow,transform] duration-(--dur-corta) ease-(--curva-liquida) hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] lg:col-span-2"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-acento text-acento-tinta">
            <ScanText aria-hidden className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg leading-tight font-bold">Leer un cartel en voz alta</span>
            <span className="block text-sm text-tenue">Toma una foto y te leemos el texto.</span>
          </span>
          <ChevronRight aria-hidden className="size-5 shrink-0 text-tenue transition-transform duration-(--dur-corta) group-hover:translate-x-1" />
        </button>
      </div>

      {lector && <LectorCarteles alCerrar={() => setLector(false)} />}
    </div>
  );
}
