import { CalendarDays } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { DetalleActividad } from '@/components/public/DetalleActividad';
import { Vacio } from '@/components/ui/Basicos';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { estaVigente, suscribirTaller } from '@/services/talleres.service';
import type { Taller } from '@/types/models';
import CatalogoPage from './CatalogoPage';

/**
 * /taller/:id abre la ficha nueva (la misma del catálogo) encima del inicio,
 * así los enlaces directos y el "Volver" de la inscripción muestran el mismo diseño.
 */
export default function TallerDetallePage() {
  const { id = '' } = useParams();
  const navegar = useNavigate();
  const { state } = useLocation() as { state: { desde?: string } | null };
  const taller = useSuscripcion<Taller | null>((cb) => suscribirTaller(id, cb), [id]);

  if (taller === null || (taller && !estaVigente(taller))) {
    return (
      <Vacio icono={CalendarDays} titulo="Esta actividad ya no está disponible">
        <Link to="/" className="font-semibold text-marca underline">
          Ver otras actividades
        </Link>
      </Vacio>
    );
  }

  // Cerrar vuelve a donde se abrió (p. ej. Recintos); por defecto, al inicio
  const cerrar = () => navegar(state?.desde ?? '/', { replace: true });

  return (
    <>
      <CatalogoPage />
      {taller && <DetalleActividad taller={taller} alCerrar={cerrar} />}
    </>
  );
}
