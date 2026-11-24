import { Camera, Lock, Mic, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { Vidrio } from '@/components/ui/Vidrio';

export type RecursoPermiso = 'microfono' | 'camara';
export type EstadoPermiso = 'prompt' | 'granted' | 'denied' | 'desconocido';

const NOMBRE_API: Record<RecursoPermiso, string> = { microfono: 'microphone', camara: 'camera' };

/** Estado del permiso (Permissions API); 'desconocido' si el navegador no lo informa. */
export function usePermiso(recurso: RecursoPermiso) {
  const [estado, setEstado] = useState<EstadoPermiso>('desconocido');
  useEffect(() => {
    let status: PermissionStatus | null = null;
    let vigente = true;
    const actualizar = () => status && vigente && setEstado(status.state as EstadoPermiso);
    navigator.permissions
      ?.query({ name: NOMBRE_API[recurso] as PermissionName })
      .then((s) => {
        status = s;
        actualizar();
        s.addEventListener('change', actualizar);
      })
      .catch(() => {});
    return () => {
      vigente = false;
      status?.removeEventListener('change', actualizar);
    };
  }, [recurso]);
  return [estado, setEstado] as const;
}

const TEXTOS: Record<RecursoPermiso, { icono: LucideIcon; nombre: string; para: string }> = {
  microfono: { icono: Mic, nombre: 'micrófono', para: 'Lo uso solo mientras te escucho; no se graba nada.' },
  camara: { icono: Camera, nombre: 'cámara', para: 'La uso solo para leer los códigos QR; no se graba nada.' },
};

const enApp = () => typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;

/**
 * Antes de que el navegador pregunte, explicamos con nuestra estética para qué es el permiso.
 * Si ya está bloqueado, se dan los pasos para activarlo (el aviso del sistema no se puede rediseñar).
 */
export function AvisoPermiso({
  recurso,
  bloqueado,
  alPermitir,
  alCancelar,
  textoCancelar = 'Ahora no',
}: {
  recurso: RecursoPermiso;
  bloqueado: boolean;
  alPermitir: () => void;
  alCancelar: () => void;
  textoCancelar?: string;
}) {
  const { icono: Icono, nombre, para } = TEXTOS[recurso];
  return (
    <Vidrio
      as="div"
      role="alertdialog"
      aria-labelledby={`permiso-${recurso}`}
      fuerza={14}
      bisel={12}
      className="flex flex-col gap-3 rounded-3xl p-4"
      style={{ animation: 'entrar-suave 280ms var(--curva-liquida) both' }}
    >
      <div className="flex items-center gap-3">
        <span className={`relative grid size-12 shrink-0 place-items-center rounded-2xl ${bloqueado ? 'bg-error-fondo text-error' : 'bg-marca text-marca-tinta'}`}>
          <Icono aria-hidden className="size-6" />
          {bloqueado && (
            <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-error text-blanco ring-2 ring-superficie">
              <Lock aria-hidden className="size-3" />
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p id={`permiso-${recurso}`} className="leading-tight font-bold">
            {bloqueado ? `El ${nombre} está bloqueado` : `¿Activamos tu ${nombre}?`}
          </p>
          <p className="text-sm text-tenue">{para}</p>
        </div>
      </div>
      {bloqueado ? (
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
          {enApp() ? (
            <>
              <li>Abre los Ajustes del teléfono → Apps → SICUJ.</li>
              <li>
                Entra a <strong>Permisos</strong> y activa el <strong>{nombre}</strong>.
              </li>
            </>
          ) : (
            <>
              <li>Toca el ícono junto a la dirección de la página (candado o ajustes).</li>
              <li>
                En <strong>Permisos</strong>, cambia <strong>{nombre}</strong> a <strong>Permitir</strong>.
              </li>
            </>
          )}
          <li>Regresa y toca “Reintentar”.</li>
        </ol>
      ) : (
        <p className="text-sm">
          Tu teléfono te va a preguntar en seguida: elige <strong>Permitir</strong>.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Boton tamano="sm" onClick={alPermitir} icono={<Icono aria-hidden className="size-4" />}>
          {bloqueado ? 'Reintentar' : `Permitir ${nombre}`}
        </Boton>
        <Boton tamano="sm" variante="fantasma" onClick={alCancelar}>
          {textoCancelar}
        </Boton>
      </div>
    </Vidrio>
  );
}
