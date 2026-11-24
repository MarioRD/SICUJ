import { CheckCircle2, History } from 'lucide-react';
import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Cargando, Vacio } from '@/components/ui/Basicos';
import { EnlaceBoton } from '@/components/ui/Boton';
import { useAuth } from '@/context/AuthContext';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { pasesLocales, suscribirMisInscripciones } from '@/services/inscripciones.service';
import type { Inscripcion } from '@/types/models';
import { formatearFechaHora } from '@/utils/formatters';

/** Pestaña que aparece al iniciar sesión: las actividades a las que ya asististe. */
export default function HistorialPage() {
  const { usuario } = useAuth();
  const uid = usuario?.id ?? null;
  const locales = useMemo(() => pasesLocales(), []);
  const pases = useSuscripcion<Inscripcion[]>((cb) => suscribirMisInscripciones(uid, locales, cb), [uid, locales]);

  if (!usuario) return <Navigate to="/cuenta" replace />;
  if (!pases) return <Cargando />;
  const asistidas = pases.filter((p) => p.usado).sort((a, b) => (b.usadoEn ?? 0) - (a.usadoEn ?? 0));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl leading-tight font-bold">Tu historial</h1>
        <p className="text-tenue">
          {asistidas.length === 0
            ? 'Aquí verás las actividades a las que asistas.'
            : `Has asistido a ${asistidas.length} ${asistidas.length === 1 ? 'actividad' : 'actividades'}. ¡Gracias por ser parte!`}
        </p>
      </header>

      {asistidas.length === 0 ? (
        <Vacio icono={History} titulo="Todavía no hay asistencias">
          <EnlaceBoton to="/" tamano="sm" variante="secundario">
            Buscar actividades
          </EnlaceBoton>
        </Vacio>
      ) : (
        <ol className="flex flex-col gap-3">
          {asistidas.map((p) => (
            <li key={p.id} className="tarjeta flex items-center gap-4 p-4">
              <span className="grid size-12 shrink-0 rotate-45 place-items-center rounded-lg bg-ok-fondo text-ok">
                <CheckCircle2 aria-hidden className="size-6 -rotate-45" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold">{p.tallerTitulo}</p>
                <p className="text-sm text-tenue">
                  {p.recintoNombre}. Asististe el {formatearFechaHora(p.usadoEn!)}.
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
