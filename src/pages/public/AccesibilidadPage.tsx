import { Camera, Contrast, ImageUp, RotateCcw, ScanText, Type } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Alerta } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { AreaTexto } from '@/components/ui/Campo';
import { BotonLeer } from '@/components/public/BotonLeer';
import { usePreferencias, type TamanoTexto } from '@/context/PreferenciasContext';
import { useOCR } from '@/features/ocr/useOCR';

const TAMANOS: Array<{ v: TamanoTexto; t: string }> = [
  { v: 'normal', t: 'Normal' },
  { v: 'grande', t: 'Grande' },
  { v: 'muy_grande', t: 'Muy grande' },
];

function Interruptor({ activo, alCambiar, etiqueta, descripcion }: { activo: boolean; alCambiar: (v: boolean) => void; etiqueta: string; descripcion: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => alCambiar(!activo)}
      className="flex min-h-(--toque-min) w-full items-center justify-between gap-4 text-left"
    >
      <span>
        <span className="block font-semibold">{etiqueta}</span>
        <span className="block text-sm text-tenue">{descripcion}</span>
      </span>
      <span aria-hidden className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition ${activo ? 'border-marca bg-marca' : 'border-linea bg-tinta/15'}`}>
        <span className={`absolute top-0.5 size-6 rounded-full bg-superficie shadow transition-all ${activo ? 'left-6.5' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

export default function AccesibilidadPage() {
  const { preferencias, cambiar } = usePreferencias();
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
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold">Accesibilidad</h1>
        <p className="text-tenue">Ajusta la aplicación a tus necesidades.</p>
      </header>

      <section aria-labelledby="t-ajustes" className="tarjeta flex flex-col gap-4 p-4">
        <h2 id="t-ajustes" className="flex items-center gap-2 text-xl font-bold">
          <Contrast aria-hidden className="size-5" /> Visualización
        </h2>
        <Interruptor
          activo={preferencias.altoContraste}
          alCambiar={(v) => cambiar({ altoContraste: v })}
          etiqueta="Alto contraste"
          descripcion="Fondo negro con texto blanco y amarillo."
        />
        <Interruptor
          activo={preferencias.reducirMovimiento}
          alCambiar={(v) => cambiar({ reducirMovimiento: v })}
          etiqueta="Reducir animaciones"
          descripcion="Quita transiciones y movimientos."
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 flex items-center gap-2 font-semibold">
            <Type aria-hidden className="size-4" /> Tamaño del texto
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {TAMANOS.map(({ v, t }) => (
              <label
                key={v}
                className={`toque flex cursor-pointer items-center justify-center rounded-lg border-2 px-2 text-center text-sm font-bold has-focus-visible:outline-3 has-focus-visible:outline-(--c-foco) ${
                  preferencias.tamanoTexto === v ? 'border-marca bg-marca text-marca-tinta' : 'border-linea'
                }`}
              >
                <input type="radio" name="tamano" value={v} checked={preferencias.tamanoTexto === v} onChange={() => cambiar({ tamanoTexto: v })} className="sr-only" />
                {t}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col gap-2">
          <label htmlFor="velocidad" className="font-semibold">
            Velocidad de lectura en voz alta: {preferencias.velocidadVoz.toFixed(1)}×
          </label>
          <input
            id="velocidad"
            type="range"
            min={0.6}
            max={1.6}
            step={0.1}
            value={preferencias.velocidadVoz}
            onChange={(e) => cambiar({ velocidadVoz: Number(e.target.value) })}
            className="w-full accent-(--c-marca)"
          />
        </div>
      </section>

      <section aria-labelledby="t-ocr" className="tarjeta flex flex-col gap-4 p-4">
        <div>
          <h2 id="t-ocr" className="flex items-center gap-2 text-xl font-bold">
            <ScanText aria-hidden className="size-5" /> Leer un cartel en voz alta
          </h2>
          <p className="text-sm text-tenue">
            Toma una foto de un cartel o convocatoria: extraemos el texto y te lo leemos. La imagen se procesa en tu
            teléfono y no se envía a ningún lado.
          </p>
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

        {vistaPrevia && <img src={vistaPrevia} alt="Imagen seleccionada" className="max-h-[40vh] w-full rounded-lg object-contain bg-fondo" />}

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
                <AreaTexto etiqueta="Texto extraído" rows={8} value={texto} onChange={(e) => setTexto(e.target.value)} />
                <BotonLeer texto={texto} etiqueta="Leer en voz alta" />
              </>
            ) : (
              <Alerta>No encontramos texto. Intenta acercarte más al cartel y con buena luz.</Alerta>
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
    </div>
  );
}
