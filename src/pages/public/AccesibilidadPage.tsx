import { lazySeguro } from '@/utils/cargaSegura';
import { ArrowUpRight, Gauge, Mic, Minus, Moon, Plus, ScanText, Type, Wind } from 'lucide-react';
import { Suspense, useState, type ReactNode } from 'react';
import { Boton } from '@/components/ui/Boton';
import { usePreferencias, type TamanoTexto } from '@/context/PreferenciasContext';

const LectorCarteles = lazySeguro(() => import('@/components/public/LectorCarteles'));
const AsistenteVoz = lazySeguro(() => import('@/components/public/AsistenteVoz'));

const TAMANOS: Array<{ v: TamanoTexto; t: string; escala: string }> = [
  { v: 'normal', t: 'Normal', escala: 'text-base' },
  { v: 'grande', t: 'Grande', escala: 'text-xl' },
  { v: 'muy_grande', t: 'Muy grande', escala: 'text-2xl' },
];

/** Mosaico de ajuste: ícono grande, nombre corto y el control. */
function Mosaico({ icono, titulo, children, className = '' }: { icono: ReactNode; titulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={`tarjeta flex flex-col gap-2.5 p-3.5 ${className}`}>
      <p className="flex items-center gap-2.5 font-bold">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-marca/10 text-marca">{icono}</span>
        {titulo}
      </p>
      {children}
    </div>
  );
}

/** Herramienta que se abre (asistente, lector): mismo formato que los interruptores. */
function MosaicoAccion({ icono, titulo, tono, alAbrir }: { icono: ReactNode; titulo: string; tono: string; alAbrir: () => void }) {
  return (
    <button
      type="button"
      onClick={alAbrir}
      aria-haspopup="dialog"
      className="tarjeta group flex min-h-[5.75rem] flex-col justify-between gap-3 p-3.5 text-left transition-[border-color,transform] duration-(--dur-corta) ease-(--curva-liquida) hover:border-marca/40 active:scale-[0.97]"
    >
      <span className="flex items-start justify-between gap-2">
        <span className={`grid size-9 place-items-center rounded-xl ${tono}`}>{icono}</span>
        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-linea transition-[transform,border-color] duration-(--dur-corta) ease-(--curva-liquida) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-marca/50">
          <ArrowUpRight className="size-4" />
        </span>
      </span>
      <span className="leading-tight font-bold [overflow-wrap:anywhere]">{titulo}</span>
    </button>
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
      className={`tarjeta flex min-h-[5.75rem] flex-col justify-between gap-3 p-3.5 text-left transition-[background-color,border-color,transform] duration-(--dur-corta) ease-(--curva-liquida) active:scale-[0.97] ${
        activo ? 'border-marca bg-marca text-marca-tinta' : 'hover:border-marca/40'
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className={`grid size-9 place-items-center rounded-xl ${activo ? 'bg-blanco/20' : 'bg-marca/10 text-marca'}`}>{icono}</span>
        <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition-[background-color,border-color] duration-(--dur-micro) ${activo ? 'border-blanco/70 bg-blanco/25' : 'border-linea bg-hundido'}`}>
          <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-superficie shadow-sm transition-transform duration-(--dur-corta) ease-(--curva-liquida) ${activo ? 'translate-x-5' : 'translate-x-0'}`} />
        </span>
      </span>
      <span className="leading-tight font-bold [overflow-wrap:anywhere]">{titulo}</span>
    </button>
  );
}

/** Menú de accesibilidad en una sola pantalla: mosaicos grandes, sin desplazarse. */
export default function AccesibilidadPage() {
  const { preferencias, cambiar } = usePreferencias();
  const [lector, setLector] = useState(false);
  const [asistente, setAsistente] = useState(false);
  const velocidad = preferencias.velocidadVoz;
  const cambiarVelocidad = (d: number) => cambiar({ velocidadVoz: Math.min(1.6, Math.max(0.6, Math.round((velocidad + d) * 10) / 10)) });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-2.5 sm:gap-3 lg:min-h-[calc(100dvh-14rem)] lg:justify-center">
      <header>
        <h1 className="text-3xl leading-tight font-bold">Accesibilidad</h1>
        <p className="text-sm text-tenue sm:text-base">Ajusta la app a tu manera. Los cambios se guardan solos.</p>
      </header>

      <div className="grid grid-cols-2 content-start gap-2.5 sm:gap-3 lg:grid-cols-4">
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
        <MosaicoAccion icono={<Mic aria-hidden className="size-5" />} titulo="Asistente por voz" tono="bg-marca text-marca-tinta" alAbrir={() => setAsistente(true)} />
        <MosaicoAccion icono={<ScanText aria-hidden className="size-5" />} titulo="Leer un cartel" tono="bg-acento text-acento-tinta" alAbrir={() => setLector(true)} />

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

      </div>

      {asistente && (
        <Suspense fallback={null}>
          <AsistenteVoz alCerrar={() => setAsistente(false)} />
        </Suspense>
      )}
      {lector && (
        <Suspense fallback={null}>
          <LectorCarteles alCerrar={() => setLector(false)} />
        </Suspense>
      )}
    </div>
  );
}
