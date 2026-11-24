import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useRouteError } from 'react-router-dom';
import { Boton } from '@/components/ui/Boton';
import { esErrorDeVersion, recargarPorVersion } from '@/utils/cargaSegura';

/** Pantalla amable cuando una ruta falla (en lugar del error técnico del enrutador). */
export default function ErrorRutaPage() {
  const error = useRouteError();
  const porVersion = esErrorDeVersion(error);

  // Versión nueva publicada: se recarga sola una vez
  useEffect(() => {
    if (porVersion) recargarPorVersion();
  }, [porVersion]);

  if (!porVersion) console.error(error);

  return (
    <main className="contenedor grid min-h-dvh place-items-center py-10">
      <div className="tarjeta flex max-w-md flex-col items-center gap-4 rounded-[1.75rem] p-6 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-aviso-fondo text-aviso">
          {porVersion ? <RefreshCw aria-hidden className="size-7" /> : <TriangleAlert aria-hidden className="size-7" />}
        </span>
        <h1 className="text-2xl font-bold">{porVersion ? 'Hay una versión nueva de SICUJ' : 'Algo salió mal'}</h1>
        <p className="text-tenue">
          {porVersion
            ? 'Actualizamos la aplicación mientras la tenías abierta. Recarga para seguir.'
            : 'No pudimos mostrar esta pantalla. Intenta de nuevo; si sigue pasando, revisa tu conexión.'}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Boton onClick={() => window.location.reload()} icono={<RefreshCw aria-hidden className="size-4" />}>
            Recargar
          </Boton>
          <Link to="/" reloadDocument className="toque inline-flex items-center rounded-full px-4 font-semibold text-marca underline">
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
