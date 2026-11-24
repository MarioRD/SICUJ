import { CheckCircle2, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { TextoRevelado } from '@/components/ui/Animados';
import { Insignia } from '@/components/ui/Basicos';
import type { Inscripcion } from '@/types/models';
import { formatearFechaHora, formatearFechaLarga } from '@/utils/formatters';
import { codificarPase, folioCorto } from '@/utils/id';

/** Pase digital: QR + datos mínimos. El QR solo contiene el ID (sin datos personales). */
export function PaseQR({ inscripcion }: { inscripcion: Inscripcion }) {
  const usado = inscripcion.usado;
  return (
    <article
      aria-label={`Pase para ${inscripcion.tallerTitulo}`}
      className="tarjeta mx-auto flex w-full max-w-[clamp(18rem,88vmin,26rem)] flex-col overflow-hidden"
    >
      <header className="portada-agua superficie-oscura">
        <div className="banda-rebozo" aria-hidden />
        <div className="px-5 pt-4 pb-3">
          <p className="text-sm text-blanco/85">Pase digital SICUJ</p>
          <h2 className="titulo-claro text-xl leading-tight font-bold">{inscripcion.tallerTitulo}</h2>
        </div>
        <div className="banda-greca" aria-hidden />
      </header>

      <div className="flex flex-col items-center gap-3 px-5 py-5">
        <div className={`relative rounded-lg bg-blanco p-3 ${usado ? 'opacity-35' : ''}`}>
          <QRCodeSVG
            value={codificarPase(inscripcion.id)}
            size={512}
            level="M"
            marginSize={1}
            title={`Código QR del pase ${folioCorto(inscripcion.id)}`}
            className="h-auto w-[clamp(11rem,58vmin,16rem)]"
          />
        </div>
        {usado ? (
          <Insignia tono="ok">
            <CheckCircle2 aria-hidden className="size-4" /> Usado el {formatearFechaHora(inscripcion.usadoEn!)}
          </Insignia>
        ) : (
          <p className="text-center text-sm text-tenue">Muestra este código en la entrada. Sube el brillo de tu pantalla.</p>
        )}
        <p className="font-mono text-lg font-bold tracking-wider" aria-label={`Folio ${folioCorto(inscripcion.id).split('').join(' ')}`}>
          Folio {folioCorto(inscripcion.id)}
        </p>
      </div>

      <TextoRevelado
        className="border-t border-dashed border-linea px-5 pt-4"
        partes={[
          'Inicia el ',
          { texto: formatearFechaLarga(inscripcion.tallerFechaInicio), resaltar: true },
          ', en el horario ',
          { texto: inscripcion.tallerHorario, resaltar: true },
          ', en ',
          { texto: inscripcion.recintoNombre, resaltar: true },
          '.',
        ]}
      />
      <dl className="grid gap-2 px-5 py-4 text-sm">
        <div className="flex items-start gap-2">
          <Users aria-hidden className="mt-0.5 size-4 shrink-0 text-tenue" />
          <dt className="solo-lectores">Personas</dt>
          <dd>
            {inscripcion.personas === 1 ? '1 persona' : `${inscripcion.personas} personas`}:{' '}
            {[inscripcion.titular, ...inscripcion.acompanantes].map((p) => p.nombre).join(', ')}
          </dd>
        </div>
      </dl>
    </article>
  );
}
