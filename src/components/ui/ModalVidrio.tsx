import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Vidrio } from '@/components/ui/Vidrio';

/**
 * Vista enfocada: el fondo se desenfoca y el contenido aparece al centro en grande.
 * <dialog> nativo (foco atrapado, Esc), cierre al tocar fuera y animación de entrada/salida.
 */
export function ModalVidrio({
  alCerrar,
  etiquetadoPor,
  children,
  ancho = 'min(94vw, 44rem)',
}: {
  alCerrar: () => void;
  etiquetadoPor: string;
  children: ReactNode;
  ancho?: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [cerrando, setCerrando] = useState(false);

  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
  }, []);

  const salir = useCallback(() => {
    if (cerrando) return;
    setCerrando(true);
    setTimeout(alCerrar, 240);
  }, [alCerrar, cerrando]);

  return (
    <dialog
      ref={dialogo}
      className={`modal-boleto ${cerrando ? 'cerrando' : ''}`}
      aria-labelledby={etiquetadoPor}
      data-lenis-prevent
      onCancel={(e) => {
        e.preventDefault();
        salir();
      }}
      onClick={(e) => e.target === e.currentTarget && salir()}
    >
      <div className="grid min-h-full place-items-center p-3 sm:p-6" onClick={(e) => e.target === e.currentTarget && salir()}>
        <div className="relative w-full" style={{ maxWidth: ancho }}>
          <Vidrio
            as="button"
            type="button"
            fuerza={12}
            bisel={12}
            onClick={salir}
            className="absolute! -top-2 -right-2 z-10 grid size-12 place-items-center rounded-full text-tinta transition-transform duration-(--dur-micro) active:scale-90 sm:-top-4 sm:-right-4"
            aria-label="Cerrar"
          >
            <X aria-hidden className="size-5" />
          </Vidrio>
          {children}
        </div>
      </div>
    </dialog>
  );
}
