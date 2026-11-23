import { CalendarDays, CheckCircle2, Clock, MapPin, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
      <header className="bg-marca px-5 py-4 text-marca-tinta">
        <p className="text-xs font-semibold tracking-widest uppercase opacity-85">Pase digital SICUJ</p>
        <h2 className="text-xl leading-tight font-bold">{inscripcion.tallerTitulo}</h2>
      </header>

      <div className="flex flex-col items-center gap-3 px-5 py-5">
        <div className={`relative rounded-lg bg-white p-3 ${usado ? 'opacity-35' : ''}`}>
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

      <dl className="grid gap-2 border-t border-dashed border-linea px-5 py-4 text-sm">
        <div className="flex items-center gap-2">
          <CalendarDays aria-hidden className="size-4 shrink-0 text-tenue" />
          <dt className="solo-lectores">Fecha</dt>
          <dd>Inicia el {formatearFechaLarga(inscripcion.tallerFechaInicio)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock aria-hidden className="size-4 shrink-0 text-tenue" />
          <dt className="solo-lectores">Horario</dt>
          <dd>{inscripcion.tallerHorario}</dd>
        </div>
        <div className="flex items-center gap-2">
          <MapPin aria-hidden className="size-4 shrink-0 text-tenue" />
          <dt className="solo-lectores">Lugar</dt>
          <dd>{inscripcion.recintoNombre}</dd>
        </div>
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
