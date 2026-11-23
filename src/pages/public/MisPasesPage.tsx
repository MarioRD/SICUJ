import { CheckCircle2, ChevronRight, Ticket } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Alerta, Cargando, Insignia, Vacio } from '@/components/ui/Basicos';
import { EnlaceBoton } from '@/components/ui/Boton';
import { useAuth } from '@/context/AuthContext';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { pasesLocales, suscribirMisInscripciones } from '@/services/inscripciones.service';
import type { Inscripcion } from '@/types/models';
import { formatearFecha } from '@/utils/formatters';
import { folioCorto } from '@/utils/id';

function FilaPase({ ins }: { ins: Inscripcion }) {
  return (
    <li>
      <Link to={`/pase/${ins.id}`} className="tarjeta flex items-center gap-4 p-4 transition hover:shadow-md">
        <div className={`grid size-12 shrink-0 place-items-center rounded-lg ${ins.usado ? 'bg-ok-fondo text-ok' : 'bg-marca text-marca-tinta'}`}>
          {ins.usado ? <CheckCircle2 aria-hidden className="size-6" /> : <Ticket aria-hidden className="size-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{ins.tallerTitulo}</p>
          <p className="text-sm text-tenue">
            {formatearFecha(ins.tallerFechaInicio)} · {ins.personas} {ins.personas === 1 ? 'persona' : 'personas'} · Folio{' '}
            {folioCorto(ins.id)}
          </p>
          {ins.usado && <Insignia tono="ok">Asistencia registrada</Insignia>}
        </div>
        <ChevronRight aria-hidden className="size-5 shrink-0 text-tenue" />
      </Link>
    </li>
  );
}

export default function MisPasesPage() {
  const { usuario } = useAuth();
  const uid = usuario?.rol === 'ciudadano' ? usuario.id : null;
  const locales = useMemo(() => pasesLocales(), []);
  const pases = useSuscripcion<Inscripcion[]>((cb) => suscribirMisInscripciones(uid, locales, cb), [uid, locales]);

  if (!pases) return <Cargando />;

  const proximos = pases.filter((p) => !p.usado);
  const historial = pases.filter((p) => p.usado);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">Mis pases</h1>

      {!uid && (
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
                  <FilaPase key={p.id} ins={p} />
                ))}
              </ul>
            ) : (
              <p className="text-tenue">No tienes pases pendientes.</p>
            )}
          </section>
          {historial.length > 0 && (
            <section aria-labelledby="t-historial" className="flex flex-col gap-3">
              <h2 id="t-historial" className="text-xl font-bold">
                Historial ({historial.length})
              </h2>
              <ul className="flex flex-col gap-3">
                {historial.map((p) => (
                  <FilaPase key={p.id} ins={p} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
