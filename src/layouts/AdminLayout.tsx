import { BarChart3, Building2, ExternalLink, FileSpreadsheet, LayoutDashboard, LogOut, Menu, QrCode, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SaltarAlContenido } from '@/components/ui/Basicos';
import { useAuth } from '@/context/AuthContext';
import { cerrarSesion } from '@/services/auth.service';
import type { Rol } from '@/types/models';

const NAV: Array<{ a: string; etiqueta: string; icono: typeof LayoutDashboard; roles: Rol[]; fin?: boolean }> = [
  { a: '/admin', etiqueta: 'Indicadores', icono: LayoutDashboard, roles: ['admin'], fin: true },
  { a: '/admin/talleres', etiqueta: 'Talleres y eventos', icono: BarChart3, roles: ['admin'] },
  { a: '/admin/recintos', etiqueta: 'Recintos', icono: Building2, roles: ['admin'] },
  { a: '/admin/validacion', etiqueta: 'Validar pases QR', icono: QrCode, roles: ['admin', 'staff'] },
  { a: '/admin/reportes', etiqueta: 'Reportes', icono: FileSpreadsheet, roles: ['admin'] },
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
    <div className="escala-admin flex min-h-dvh bg-fondo text-base">
      <SaltarAlContenido />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[clamp(15rem,17vw,19rem)] flex-col bg-marca text-marca-tinta transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          menuAbierto ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        aria-label="Menú del panel"
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <Link to="/admin" className="flex items-center gap-3">
            <img src="/icons/icon.svg" alt="" className="size-10 rounded-lg ring-2 ring-white/20" />
            <span className="leading-tight">
              <span className="block text-lg font-bold">SICUJ</span>
              <span className="block text-xs opacity-80">Panel administrativo</span>
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
                    `flex min-h-(--toque-min) items-center gap-3 rounded-md px-3 font-semibold transition ${
                      isActive ? 'bg-white text-marca' : 'hover:bg-white/10'
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

        <div className="border-t border-white/15 p-4 text-sm">
          <p className="font-semibold">{usuario?.nombre}</p>
          <p className="mb-3 text-xs opacity-80">
            {usuario?.email} · {usuario?.rol === 'admin' ? 'Administración' : 'Personal de acceso'}
          </p>
          <div className="flex flex-col gap-1">
            <Link to="/" className="flex min-h-(--toque-min) items-center gap-2 rounded-md px-2 hover:bg-white/10">
              <ExternalLink aria-hidden className="size-4" /> Ver sitio ciudadano
            </Link>
            <button type="button" onClick={salir} className="flex min-h-(--toque-min) items-center gap-2 rounded-md px-2 text-left hover:bg-white/10">
              <LogOut aria-hidden className="size-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {menuAbierto && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMenuAbierto(false)} aria-hidden />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-linea bg-superficie px-4 py-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            className="toque grid place-items-center rounded-md hover:bg-tinta/6"
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
          >
            <Menu aria-hidden className="size-6" />
          </button>
          <span className="font-bold">SICUJ · Panel</span>
        </header>
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
        <h1 className="text-3xl font-bold">{titulo}</h1>
        {descripcion && <p className="mt-1 text-tenue">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}
