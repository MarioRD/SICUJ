import { Accessibility, History, Home, LayoutDashboard, LogIn, LogOut, MapPinned, Moon, Sun, Ticket } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { SaltarAlContenido } from '@/components/ui/Basicos';
import { LucesCandil } from '@/components/ui/LucesCandil';
import { Vidrio } from '@/components/ui/Vidrio';
import { useAuth } from '@/context/AuthContext';
import { usePreferencias } from '@/context/PreferenciasContext';
import { cerrarSesion } from '@/services/auth.service';

/** Interruptor de modo oscuro (luces de candil). */
function BotonTema({ className = '' }: { className?: string }) {
  const { preferencias, cambiar } = usePreferencias();
  const oscuro = preferencias.modoOscuro;
  return (
    <button
      type="button"
      onClick={() => cambiar({ modoOscuro: !oscuro })}
      aria-pressed={oscuro}
      aria-label="Modo oscuro"
      title={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={`vidrio grid size-11 shrink-0 place-items-center rounded-full text-marca transition-transform duration-(--dur-corta) ease-(--curva-liquida) hover:-rotate-12 active:scale-90 ${className}`}
    >
      {oscuro ? <Sun aria-hidden className="size-5" /> : <Moon aria-hidden className="size-5" />}
    </button>
  );
}

/** Sesión: "Entrar" discreto, o las iniciales con un menú corto. */
function MenuSesion() {
  const { usuario } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  useEffect(() => setAbierto(false), [pathname]);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => !caja.current?.contains(e.target as Node) && setAbierto(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, [abierto]);

  if (!usuario) {
    return (
      <Link
        to="/cuenta"
        className="vidrio brillo inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold text-marca transition-transform duration-(--dur-micro) active:scale-95"
      >
        <LogIn aria-hidden className="size-4" /> Entrar
      </Link>
    );
  }
  const iniciales = (usuario.nombre.match(/\p{L}+/gu) ?? ['?'])
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="vidrio flex min-h-11 items-center gap-2 rounded-full py-1 pr-4 pl-1 text-sm font-semibold transition-transform duration-(--dur-micro) active:scale-95"
      >
        <span className="grid size-9 place-items-center rounded-full bg-marca font-bold text-marca-tinta">{iniciales}</span>
        <span className="max-w-[8rem] truncate max-sm:hidden">{usuario.nombre.split(' ')[0]}</span>
      </button>
      {abierto && (
        <Vidrio
          as="div"
          role="menu"
          className="absolute top-full right-0 z-40 mt-2 flex w-60 flex-col gap-1 rounded-2xl p-2"
          style={{ animation: 'entrar-suave 260ms var(--curva-liquida) both' }}
        >
          <p className="px-3 pt-1 pb-2 text-sm">
            <strong className="block truncate">{usuario.nombre}</strong>
            <span className="block truncate text-tenue">{usuario.email}</span>
          </p>
          {usuario.rol !== 'ciudadano' && (
            <Link role="menuitem" to="/admin" className="flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold hover:bg-marca/8">
              <LayoutDashboard aria-hidden className="size-4.5" /> Panel administrativo
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={() => cerrarSesion()}
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-left font-semibold text-error hover:bg-error-fondo"
          >
            <LogOut aria-hidden className="size-4.5" /> Cerrar sesión
          </button>
        </Vidrio>
      )}
    </div>
  );
}

/**
 * Móvil primero: encabezado de vidrio compacto + barra inferior flotante al alcance del pulgar.
 * En escritorio (≥ 64rem) la navegación sube al encabezado. Al iniciar sesión, los datos de la
 * persona aparecen como pestañas nuevas (Historial) en lugar de un panel aparte.
 */
export function PublicLayout() {
  const { usuario } = useAuth();
  const { preferencias } = usePreferencias();
  const conSesion = !!usuario;
  const { pathname } = useLocation();
  // Pantallas de herramienta (pases y accesibilidad) van sin pie de página
  const sinPie = pathname.startsWith('/mis-pases') || pathname.startsWith('/accesibilidad');
  const nav = [
    { a: '/', etiqueta: 'Inicio', icono: Home, fin: true },
    { a: '/recintos', etiqueta: 'Recintos', icono: MapPinned, fin: false },
    { a: '/mis-pases', etiqueta: 'Mis pases', icono: Ticket, fin: false },
    ...(conSesion ? [{ a: '/historial', etiqueta: 'Historial', icono: History, fin: false }] : []),
    { a: '/accesibilidad', etiqueta: 'Accesible', icono: Accessibility, fin: false },
  ];

  return (
    <div className="flex min-h-dvh flex-col text-base">
      {preferencias.modoOscuro && <LucesCandil />}
      <SaltarAlContenido />
      <header className="encabezado-fijo vidrio sticky top-0 z-30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="banda-rebozo" aria-hidden />
        <div className="contenedor flex items-center justify-between gap-3 py-2.5">
          <Link to="/" className="flex min-w-0 items-center gap-3 rounded-md">
            <img
              src="/brand/imjuvec-96.webp"
              srcSet="/brand/imjuvec-96.webp 1x, /brand/imjuvec-192.webp 2x"
              alt="Instituto Municipal de la Juventud de Coacalco"
              width={162}
              height={96}
              className="h-[clamp(2.3rem,9vmin,3rem)] w-auto"
            />
            <span className="flex min-w-0 flex-col border-l border-linea pl-3 leading-tight max-[380px]:hidden">
              <span className="fuente-display text-lg font-bold text-titulo">SICUJ</span>
              <span className="truncate text-xs text-tenue">Cultura y Juventud Coacalco</span>
            </span>
          </Link>

          <nav aria-label="Navegación principal" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {nav.map(({ a, etiqueta, icono: Icono, fin }) => (
                <li key={a}>
                  <NavLink
                    to={a}
                    end={fin}
                    className={({ isActive }) =>
                      `flex min-h-(--toque-min) items-center gap-2 rounded-full px-4 text-sm font-semibold transition-[background-color,color,transform] duration-(--dur-corta) ease-(--curva-liquida) active:scale-95 ${
                        isActive ? 'bg-marca text-marca-tinta' : 'text-tinta hover:bg-marca/8'
                      }`
                    }
                  >
                    <Icono aria-hidden className="size-4.5" />
                    {etiqueta}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <BotonTema className="lg:hidden" />
            <MenuSesion />
          </div>
        </div>
      </header>

      <main
        id="contenido"
        tabIndex={-1}
        className="contenedor flex-1 pt-5 focus:outline-none lg:pt-8"
        style={{ paddingBottom: '1.5rem' }}
      >
        <Outlet />
      </main>

      {sinPie ? (
        <div aria-hidden className="lg:hidden" style={{ height: 'calc(var(--alto-barra) + 0.5rem)' }} />
      ) : (
      <footer className="border-t border-linea" style={{ paddingBottom: 'calc(var(--alto-barra) + 0.5rem)' }}>
        <div className="banda-greca h-3 bg-anil opacity-10 [mask-size:22px_12px]" aria-hidden />
        <div className="contenedor flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
          <div className="flex items-center gap-4">
            <img src="/brand/coacalco-96.webp" alt="Gobierno Municipal de Coacalco 2025-2027" width={184} height={96} className="h-9 w-auto" loading="lazy" />
            <img src="/brand/imjuvec-96.webp" alt="Instituto Municipal de la Juventud de Coacalco" width={162} height={96} className="h-9 w-auto" loading="lazy" />
          </div>
          <div className="flex items-center gap-5">
            <Link to="/aviso-privacidad" className="text-xs font-semibold text-tenue underline underline-offset-4 hover:text-marca">
              Aviso de privacidad
            </Link>
            <span className="bajorrelieve" role="img" aria-label="Firma del autor: 65" title="65">
              <span className="h-9 w-[2.35rem]" style={{ ['--firma' as string]: 'url(/brand/firma-65.png)' }} />
            </span>
          </div>
        </div>
      </footer>
      )}

      {/* Escritorio: interruptor de tema flotante abajo a la izquierda */}
      <BotonTema className="fixed bottom-5 left-5 z-30 hidden lg:grid" />

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-30 px-3 lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <Vidrio fuerza={26} bisel={22} className="mx-auto max-w-[32rem] rounded-full p-1.5 shadow-lg">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
            {nav.map(({ a, etiqueta, icono: Icono, fin }) => (
              <li key={a}>
                <NavLink
                  to={a}
                  end={fin}
                  className={({ isActive }) =>
                    `flex min-h-[calc(var(--toque-min)*1.3)] flex-col items-center justify-center gap-0.5 rounded-full text-xs transition-[background-color,color,transform] duration-(--dur-corta) ease-(--curva-liquida) active:scale-90 ${
                      isActive ? 'bg-marca font-bold text-marca-tinta shadow-sm' : 'font-semibold text-tinta/75'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icono aria-hidden className="size-[clamp(1.25rem,5.2vmin,1.5rem)]" strokeWidth={isActive ? 2.4 : 1.9} />
                      {etiqueta}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </Vidrio>
      </nav>
      <ScrollRestoration />
    </div>
  );
}
