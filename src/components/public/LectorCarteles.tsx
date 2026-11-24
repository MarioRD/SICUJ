import { Camera, ImageUp, RotateCcw, ScanText } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { BotonLeer } from '@/components/public/BotonLeer';
import { Alerta } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { AreaTexto } from '@/components/ui/Campo';
import { ModalVidrio } from '@/components/ui/ModalVidrio';
import { useOCR } from '@/features/ocr/useOCR';

/** Lector de carteles: foto → texto (OCR en el dispositivo) → lectura en voz alta. */
export default function LectorCarteles({ alCerrar }: { alCerrar: () => void }) {
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
