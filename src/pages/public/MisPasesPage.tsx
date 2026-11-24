import { CheckCircle2, ChevronRight, Ticket } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BoletoPase } from '@/components/public/BoletoPase';
import { Link } from 'react-router-dom';
import { Alerta, Cargando, Insignia, Vacio } from '@/components/ui/Basicos';
import { EnlaceBoton } from '@/components/ui/Boton';
import { useAuth } from '@/context/AuthContext';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { pasesLocales, suscribirMisInscripciones } from '@/services/inscripciones.service';
import type { Inscripcion } from '@/types/models';
import { formatearFecha } from '@/utils/formatters';
import { folioCorto } from '@/utils/id';

function FilaPase({ ins, alAbrir }: { ins: Inscripcion; alAbrir: (i: Inscripcion) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => alAbrir(ins)}
        aria-haspopup="dialog"
        className="tarjeta group relative flex w-full overflow-hidden items-center gap-4 p-4 text-left transition-[box-shadow,transform] duration-(--dur-corta) ease-(--curva-liquida) hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
      >
        <span className="banda-rebozo absolute inset-x-0 top-0 rounded-t-[inherit]" aria-hidden />
        <div className={`grid size-12 shrink-0 rotate-45 place-items-center rounded-lg transition-transform duration-(--dur-larga) ease-(--curva-liquida) group-hover:rotate-[60deg] ${ins.usado ? 'bg-ok-fondo text-ok' : 'bg-marca text-marca-tinta'}`}>
          {ins.usado ? <CheckCircle2 aria-hidden className="size-6 -rotate-45" /> : <Ticket aria-hidden className="size-6 -rotate-45" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{ins.tallerTitulo}</p>
          <p className="text-sm text-tenue">
            {formatearFecha(ins.tallerFechaInicio)} · {ins.personas} {ins.personas === 1 ? 'persona' : 'personas'} · Folio{' '}
            {folioCorto(ins.id)}
          </p>
          {ins.usado && <Insignia tono="ok">Asistencia registrada</Insignia>}
        </div>
        <ChevronRight aria-hidden className="size-5 shrink-0 text-tenue transition-transform duration-(--dur-corta) group-hover:translate-x-1" />
      </button>
    </li>
  );
}

export default function MisPasesPage() {
  const { usuario, cargando } = useAuth();
  const uid = usuario?.rol === 'ciudadano' ? usuario.id : null;
  const locales = useMemo(() => pasesLocales(), []);
  const pases = useSuscripcion<Inscripcion[]>((cb) => suscribirMisInscripciones(uid, locales, cb), [uid, locales]);
  const [abierto, setAbierto] = useState<Inscripcion | null>(null);

  if (!pases) return <Cargando />;

  const proximos = pases.filter((p) => !p.usado);
  const historial = pases.filter((p) => p.usado);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">Mis pases</h1>

      {!usuario && !cargando && (
        <Alerta tono="info">
          <p className="mb-2">
            Estos son los pases guardados <strong>en este dispositivo</strong>. Para verlos en otro dispositivo y consultar tu
            historial de talleres, crea una cuenta (es opcional).
          </p>
          <EnlaceBoton to="/cuenta" tamano="sm" variante="secundario">
            Crear cuenta o iniciar sesión
          </EnlaceBoton>
        </Alerta>
      )}

      {pases.length === 0 ? (
        <Vacio icono={Ticket} titulo="Aún no tienes pases">
          <Link to="/" className="font-semibold text-marca underline">
            Explora talleres y eventos
          </Link>
        </Vacio>
      ) : (
        <>
          <section aria-labelledby="t-proximos" className="flex flex-col gap-3">
            <h2 id="t-proximos" className="text-xl font-bold">
              Vigentes ({proximos.length})
            </h2>
            {proximos.length ? (
              <ul className="flex flex-col gap-3">
                {proximos.map((p) => (
                  <FilaPase key={p.id} ins={p} alAbrir={setAbierto} />
                ))}
              </ul>
            ) : (
              <p className="text-tenue">No tienes pases pendientes.</p>
            )}
          </section>
          {historial.length > 0 && !uid && (
            <section aria-labelledby="t-historial" className="flex flex-col gap-3">
              <h2 id="t-historial" className="text-xl font-bold">
                Historial ({historial.length})
              </h2>
              <ul className="flex flex-col gap-3">
                {historial.map((p) => (
                  <FilaPase key={p.id} ins={p} alAbrir={setAbierto} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      {abierto && <BoletoPase inscripcion={abierto} alCerrar={() => setAbierto(null)} />}
    </div>
  );
}
