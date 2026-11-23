import { ArrowLeft, PartyPopper, TicketX, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alerta, Cargando, Vacio } from '@/components/ui/Basicos';
import { Boton, EnlaceBoton } from '@/components/ui/Boton';
import { PaseQR } from '@/components/public/PaseQR';
import { useAuth } from '@/context/AuthContext';
import { useAvisos } from '@/context/AvisosContext';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { cancelarInscripcion, suscribirInscripcion } from '@/services/inscripciones.service';
import type { Inscripcion } from '@/types/models';

export default function PasePage() {
  const { id = '' } = useParams();
  const { state } = useLocation() as { state: { nuevo?: boolean } | null };
  const navegar = useNavigate();
  const avisar = useAvisos();
  const { usuario } = useAuth();
  const inscripcion = useSuscripcion<Inscripcion | null>((cb) => suscribirInscripcion(id, cb), [id]);
  const [cancelando, setCancelando] = useState(false);

  if (inscripcion === undefined) return <Cargando texto="Cargando tu pase…" />;
  if (!inscripcion) {
    return (
      <Vacio icono={TicketX} titulo="No encontramos este pase">
        Pudo haberse cancelado.{' '}
        <Link to="/mis-pases" className="font-semibold text-marca underline">
          Ver mis pases
        </Link>
      </Vacio>
    );
  }

  const cancelar = async () => {
    if (!window.confirm('¿Cancelar esta inscripción? Tu lugar quedará libre para otra persona.')) return;
    setCancelando(true);
    try {
      await cancelarInscripcion(inscripcion.id);
      avisar('Inscripción cancelada. ¡Gracias por liberar tu lugar!', 'exito');
      navegar('/mis-pases', { replace: true });
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo cancelar.', 'error');
      setCancelando(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Link to="/mis-pases" className="toque inline-flex w-fit items-center gap-2 font-semibold text-marca">
        <ArrowLeft aria-hidden className="size-5" /> Mis pases
      </Link>

      {state?.nuevo && (
        <div role="status" className="flex items-center gap-3 rounded-lg bg-ok-fondo p-4 text-ok">
          <PartyPopper aria-hidden className="size-7 shrink-0" />
          <p className="font-bold">¡Listo! Tu lugar está reservado.</p>
        </div>
      )}

      <PaseQR inscripcion={inscripcion} />

      {state?.nuevo && !usuario && (
        <Alerta tono="info" titulo="Tu pase está guardado en este dispositivo">
          <p className="mb-3">
            Funciona aunque no tengas internet. Si quieres consultarlo desde otro dispositivo o ver tu historial, crea una cuenta
            (opcional).
          </p>
          <EnlaceBoton to="/cuenta" variante="secundario" tamano="sm" icono={<UserPlus aria-hidden className="size-4" />}>
            Crear cuenta
          </EnlaceBoton>
        </Alerta>
      )}

      {!inscripcion.usado && (
        <Boton variante="peligro" onClick={cancelar} cargando={cancelando} className="mx-auto">
          Cancelar inscripción
        </Boton>
      )}
    </div>
  );
}
