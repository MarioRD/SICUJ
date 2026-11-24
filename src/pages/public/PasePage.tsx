import { TicketX } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BoletoPase } from '@/components/public/BoletoPase';
import { Vacio } from '@/components/ui/Basicos';
import { useAvisos } from '@/context/AvisosContext';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { suscribirInscripcion } from '@/services/inscripciones.service';
import type { Inscripcion } from '@/types/models';
import MisPasesPage from './MisPasesPage';

/**
 * /pase/:id abre el boleto animado encima de "Mis pases" (el mismo que se ve al tocar un pase).
 * Al cerrarlo, queda la lista de pases.
 */
export default function PasePage() {
  const { id = '' } = useParams();
  const { state } = useLocation() as { state: { nuevo?: boolean } | null };
  const navegar = useNavigate();
  const avisar = useAvisos();
  const inscripcion = useSuscripcion<Inscripcion | null>((cb) => suscribirInscripcion(id, cb), [id]);
  const avisado = useRef(false);

  useEffect(() => {
    if (state?.nuevo && inscripcion && !avisado.current) {
      avisado.current = true;
      avisar('¡Listo! Tu lugar está reservado. El pase funciona aunque no tengas internet.', 'exito');
    }
  }, [state?.nuevo, inscripcion, avisar]);

  if (inscripcion === null) {
    return (
      <Vacio icono={TicketX} titulo="No encontramos este pase">
        Pudo haberse cancelado.{' '}
        <Link to="/mis-pases" className="font-semibold text-marca underline">
          Ver mis pases
        </Link>
      </Vacio>
    );
  }

  return (
    <>
      <MisPasesPage />
      {inscripcion && <BoletoPase inscripcion={inscripcion} alCerrar={() => navegar('/mis-pases', { replace: true })} />}
    </>
  );
}
