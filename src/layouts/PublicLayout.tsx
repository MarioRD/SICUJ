import { Accessibility, Home, MapPinned, Ticket, UserRound } from 'lucide-react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router-dom';
import { SaltarAlContenido } from '@/components/ui/Basicos';
import { useAuth } from '@/context/AuthContext';

const NAV = [
  { a: '/', etiqueta: 'Inicio', icono: Home, fin: true },
  { a: '/recintos', etiqueta: 'Recintos', icono: MapPinned, fin: false },
  { a: '/mis-pases', etiqueta: 'Mis pases', icono: Ticket, fin: false },
  { a: '/accesibilidad', etiqueta: 'Accesible', icono: Accessibility, fin: false },
  { a: '/cuenta', etiqueta: 'Cuenta', icono: UserRound, fin: false },
];

/** Móvil primero: encabezado compacto + barra de navegación inferior al alcance del pulgar. */
export function PublicLayout() {
  const { usuario } = useAuth();
  return (
    <div className="flex min-h-dvh flex-col text-base">
      <SaltarAlContenido />
      <header className="encabezado-fijo sticky top-0 z-30 bg-marca text-marca-tinta shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="contenedor flex items-center justify-between gap-3 py-3">
          <Link to="/" className="flex items-center gap-2.5 rounded-md">
            <img src="/icons/icon.svg" alt="" className="size-[clamp(2rem,9vmin,2.6rem)] rounded-lg" />
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-bold">SICUJ Coacalco</span>
              <span className="text-xs opacity-85">Cultura y Juventud</span>
            </span>
          </Link>
          {usuario && usuario.rol !== 'ciudadano' && (
            <Link to="/admin" className="rounded-md border border-current px-3 py-1 text-sm font-semibold">
              Panel
            </Link>
          )}
        </div>
      </header>

      <main id="contenido" tabIndex={-1} className="contenedor flex-1 py-5 focus:outline-none" style={{ paddingBottom: 'calc(var(--toque-min) * 2.2)' }}>
        <Outlet />
      </main>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-superficie"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="contenedor grid grid-cols-5 !px-1">
          {NAV.map(({ a, etiqueta, icono: Icono, fin }) => (
            <li key={a}>
              <NavLink
                to={a}
                end={fin}
                className={({ isActive }) =>
                  `flex min-h-[calc(var(--toque-min)*1.25)] flex-col items-center justify-center gap-0.5 rounded-md text-xs font-semibold ${
                    isActive ? 'text-marca' : 'text-tenue'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`grid place-items-center rounded-full px-4 py-0.5 ${isActive ? 'bg-marca/12' : ''}`}>
                      <Icono aria-hidden className="size-[clamp(1.3rem,5.5vmin,1.6rem)]" strokeWidth={isActive ? 2.4 : 2} />
                    </span>
                    {etiqueta}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <ScrollRestoration />
    </div>
  );
}
