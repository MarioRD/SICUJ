import { ImagePlus, Trash2 } from 'lucide-react';
import { useId, useRef, useState, type ChangeEvent } from 'react';
import { Alerta } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { guardarImagen } from '@/services/storage.service';
import { comprimirImagen, formatearBytes } from '@/utils/imageCompressor';

/**
 * Selector de imagen que SIEMPRE comprime en el navegador (canvas → WebP)
 * antes de guardar, y muestra el ahorro logrado.
 */
export function SubirImagen({ valor, alCambiar, etiqueta = 'Imagen de portada' }: { valor: string | null; alCambiar: (url: string | null) => void; etiqueta?: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const alElegir = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setError(null);
    setInfo(null);
    setProcesando(true);
    try {
      const r = await comprimirImagen(archivo, { anchoMaximo: 1200, altoMaximo: 1200, calidad: 0.78 });
      const url = await guardarImagen(r.blob);
      alCambiar(url);
      const ahorro = Math.max(0, Math.round((1 - r.blob.size / r.bytesOriginales) * 100));
      setInfo(
        `${formatearBytes(r.bytesOriginales)} → ${formatearBytes(r.blob.size)} (${r.formato.replace('image/', '').toUpperCase()}, ${r.ancho}×${r.alto} px, −${ahorro}%)`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar la imagen.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span id={id} className="text-sm font-semibold">
        {etiqueta} <span className="font-normal text-tenue">(opcional; se convierte a WebP automáticamente)</span>
      </span>
      <div className="flex items-center gap-4">
        <div className="grid aspect-[16/9] w-[clamp(9rem,14vw,14rem)] shrink-0 place-items-center overflow-hidden rounded-md border-2 border-dashed border-linea bg-hundido">
          {valor ? <img src={valor} alt="Vista previa" className="size-full object-cover" /> : <ImagePlus aria-hidden className="size-8 text-tenue" />}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={input} type="file" accept="image/*" className="sr-only" onChange={alElegir} aria-labelledby={id} tabIndex={-1} />
          <Boton variante="secundario" tamano="sm" cargando={procesando} onClick={() => input.current?.click()} aria-describedby={id}>
            {procesando ? 'Comprimiendo…' : valor ? 'Cambiar imagen' : 'Elegir imagen'}
          </Boton>
          {valor && (
            <Boton variante="fantasma" tamano="sm" icono={<Trash2 aria-hidden className="size-4" />} onClick={() => alCambiar(null)}>
              Quitar
            </Boton>
          )}
        </div>
      </div>
      {info && <p className="text-xs font-semibold text-ok">{info}</p>}
      {error && <Alerta tono="error">{error}</Alerta>}
    </div>
  );
}
