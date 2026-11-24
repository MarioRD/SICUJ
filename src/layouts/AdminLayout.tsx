import { BarChart3, Building2, ExternalLink, FileSpreadsheet, LayoutDashboard, LogOut, Menu, QrCode, UsersRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SaltarAlContenido } from '@/components/ui/Basicos';
import { Vidrio } from '@/components/ui/Vidrio';
import { useAuth } from '@/context/AuthContext';
import { cerrarSesion } from '@/services/auth.service';
import type { Rol } from '@/types/models';

const NAV: Array<{ a: string; etiqueta: string; icono: typeof LayoutDashboard; roles: Rol[]; fin?: boolean }> = [
  { a: '/admin', etiqueta: 'Indicadores', icono: LayoutDashboard, roles: ['admin'], fin: true },
  { a: '/admin/talleres', etiqueta: 'Talleres y eventos', icono: BarChart3, roles: ['admin'] },
  { a: '/admin/recintos', etiqueta: 'Recintos', icono: Building2, roles: ['admin'] },
  { a: '/admin/validacion', etiqueta: 'Validar pases QR', icono: QrCode, roles: ['admin', 'staff'] },
  { a: '/admin/reportes', etiqueta: 'Reportes', icono: FileSpreadsheet, roles: ['admin'] },
  { a: '/admin/cuentas', etiqueta: 'Cuentas', icono: UsersRound, roles: ['admin'] },
];

/**
 * Escritorio primero: barra lateral fija en laptop/monitor.
 * En pantallas angostas la barra se convierte en un menú desplegable.
 * `.escala-admin` cambia la escala fluida (clamp) a una más densa para monitores.
 */
export function AdminLayout() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  useEffect(() => setMenuAbierto(false), [pathname]);

  const enlaces = NAV.filter((n) => usuario && n.roles.includes(usuario.rol));

  const salir = async () => {
    await cerrarSesion();
    navegar('/admin/login', { replace: true });
  };

  return (
    <div className="escala-admin flex min-h-dvh text-base">
      <SaltarAlContenido />

      <aside
        className={`superficie-oscura fixed inset-y-0 left-0 z-40 flex w-[clamp(15rem,17vw,19rem)] flex-col overflow-y-auto bg-anil text-blanco transition-transform duration-(--dur-corta) ease-(--curva) lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          menuAbierto ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        aria-label="Menú del panel"
      >
        <div className="banda-rebozo shrink-0" aria-hidden />
        <div className="flex items-start justify-between gap-2 px-4 pt-5 pb-4">
          <Link to="/admin" className="flex flex-col gap-3 rounded-lg">
            <span className="rounded-lg bg-blanco px-3 py-2 shadow-sm">
              <img
                src="/brand/imjuvec-96.webp"
                srcSet="/brand/imjuvec-96.webp 1x, /brand/imjuvec-192.webp 2x"
                alt="Instituto Municipal de la Juventud de Coacalco"
                width={162}
                height={96}
                className="h-12 w-auto"
              />
            </span>
            <span className="leading-tight">
              <span className="fuente-display block text-lg font-bold">SICUJ</span>
              <span className="block text-xs text-blanco/80">Panel administrativo</span>
            </span>
          </Link>
          <button type="button" onClick={() => setMenuAbierto(false)} className="toque rounded-md lg:hidden" aria-label="Cerrar menú">
            <X aria-hidden className="mx-auto size-5" />
          </button>
        </div>

        <nav className="flex-1 px-3">
          <ul className="flex flex-col gap-1">
            {enlaces.map(({ a, etiqueta, icono: Icono, fin }) => (
              <li key={a}>
                <NavLink
                  to={a}
                  end={fin}
                  className={({ isActive }) =>
                    `flex min-h-(--toque-min) items-center gap-3 rounded-md border-l-4 px-3 font-semibold transition-[background-color,border-color] duration-(--dur-micro) ${
                      isActive ? 'border-amarillo bg-blanco/14 font-bold' : 'border-transparent hover:bg-blanco/8'
                    }`
                  }
                >
                  <Icono aria-hidden className="size-5 shrink-0" />
                  {etiqueta}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="banda-greca mx-4 mb-2 shrink-0 opacity-30" aria-hidden />
        <div className="border-t border-blanco/15 p-4 text-sm">
          <p className="font-semibold">{usuario?.nombre}</p>
          <p className="text-xs text-blanco/80">{usuario?.email}</p>
          <p className="mb-3 text-xs text-blanco/80">{usuario?.rol === 'admin' ? 'Administración' : 'Personal de acceso'}</p>
          <div className="flex flex-col gap-1">
            <Link to="/" className="flex min-h-(--toque-min) items-center gap-2 rounded-md px-2 hover:bg-blanco/8">
              <ExternalLink aria-hidden className="size-4" /> Ver sitio ciudadano
            </Link>
            <button type="button" onClick={salir} className="flex min-h-(--toque-min) items-center gap-2 rounded-md px-2 text-left hover:bg-blanco/8">
              <LogOut aria-hidden className="size-4" /> Cerrar sesión
            </button>
          </div>
          <span className="bajorrelieve mt-3 ml-auto block w-fit" role="img" aria-label="Firma del autor: 65" title="65">
            <span className="h-8 w-[2.1rem]" style={{ ['--firma' as string]: 'url(/brand/firma-65.png)' }} />
          </span>
        </div>
      </aside>

      {menuAbierto && <div className="fixed inset-0 z-30 bg-anil/45 backdrop-blur-sm lg:hidden" onClick={() => setMenuAbierto(false)} aria-hidden />}

      <div className="flex min-w-0 flex-1 flex-col">
        <Vidrio as="header" fuerza={14} bisel={10} className="sticky top-0 z-20 flex items-center gap-3 px-4 py-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            className="toque grid place-items-center rounded-md hover:bg-marca/8"
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
          >
            <Menu aria-hidden className="size-6" />
          </button>
          <img src="/brand/imjuvec-96.webp" alt="" width={162} height={96} className="h-8 w-auto" />
          <span className="fuente-display font-bold text-titulo">Panel SICUJ</span>
        </Vidrio>
        <main id="contenido" tabIndex={-1} className="contenedor flex-1 py-8 focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function EncabezadoPagina({ titulo, descripcion, acciones }: { titulo: string; descripcion?: string; acciones?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl leading-tight font-bold">{titulo}</h1>
        {descripcion && <p className="mt-1 text-tenue">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}
