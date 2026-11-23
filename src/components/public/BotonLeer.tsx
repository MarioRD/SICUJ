import { Pause, Play, Square, Volume2 } from 'lucide-react';
import { usePreferencias } from '@/context/PreferenciasContext';
import { useSpeech } from '@/features/speech/useSpeech';
import { Boton } from '@/components/ui/Boton';

/** Controles de lectura en voz alta: reproducir / pausar / reanudar / detener. */
export function BotonLeer({ texto, etiqueta = 'Escuchar', compacto = false }: { texto: string; etiqueta?: string; compacto?: boolean }) {
  const { preferencias } = usePreferencias();
  const { estado, hablar, pausar, reanudar, detener, soportado } = useSpeech(preferencias.velocidadVoz);
  if (!soportado) return null;

  const tamano = compacto ? 'sm' : 'md';
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lectura en voz alta">
      {estado === 'detenido' && (
        <Boton variante="secundario" tamano={tamano} icono={<Volume2 aria-hidden className="size-[1.2em]" />} onClick={() => hablar(texto)}>
          {etiqueta}
        </Boton>
      )}
      {estado === 'hablando' && (
        <Boton variante="secundario" tamano={tamano} icono={<Pause aria-hidden className="size-[1.2em]" />} onClick={pausar}>
          Pausar
        </Boton>
      )}
      {estado === 'pausado' && (
        <Boton variante="secundario" tamano={tamano} icono={<Play aria-hidden className="size-[1.2em]" />} onClick={reanudar}>
          Continuar
        </Boton>
      )}
      {estado !== 'detenido' && (
        <Boton variante="fantasma" tamano={tamano} icono={<Square aria-hidden className="size-[1.1em]" />} onClick={detener}>
          Detener
        </Boton>
      )}
    </div>
  );
}
