import { lazySeguro } from '@/utils/cargaSegura';
import { Accessibility, History, Home, LayoutDashboard, LogIn, LogOut, MapPinned, Mic, Moon, ScanText, Sparkles, Sun, Ticket, UserPen, type LucideIcon } from 'lucide-react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { SaltarAlContenido } from '@/components/ui/Basicos';
import { LucesCandil } from '@/components/ui/LucesCandil';
import { RecargarArrastrando } from '@/components/ui/RecargarArrastrando';
import { Vidrio } from '@/components/ui/Vidrio';
import { useAuth } from '@/context/AuthContext';
import { usePreferencias } from '@/context/PreferenciasContext';
import { cerrarSesion } from '@/services/auth.service';

const LectorCarteles = lazySeguro(() => import('@/components/public/LectorCarteles'));
const AsistenteVoz = lazySeguro(() => import('@/components/public/AsistenteVoz'));

/**
 * Botón flotante (como el de chat): se despliega con las ayudas que sirven en cualquier
 * pantalla, el asistente por voz y el lector de carteles. Popover nativo: Esc y tocar
 * fuera lo cierran, y el foco vuelve al botón.
 */
function AyudasFlotantes() {
  const [abierta, setAbierta] = useState<'asistente' | 'lector' | null>(null);
  const [desplegado, setDesplegado] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const elegir = (q: 'asistente' | 'lector') => {
    menu.current?.hidePopover();
    setAbierta(q);
  };
  const cerrar = () => setAbierta(null);
  return (
    <>
      <Vidrio
        as="button"
        type="button"
        {...({ popoverTarget: 'ayudas-flotantes' } as object)}
        aria-expanded={desplegado}
        title="Asistente por voz y lector de carteles"
        fuerza={16}
        bisel={14}
        escarcha={3}
        className="fixed! right-4 z-30 flex items-center gap-2 rounded-full p-3.5 text-acento-tinta shadow-[0_12px_28px_-8px_rgb(11_16_38/0.55)] transition-[transform,scale] duration-(--dur-corta) ease-(--curva-liquida) hover:scale-105 active:scale-90 lg:right-6 lg:px-5"
        style={{ bottom: 'calc(var(--alto-barra) + 1rem)', ['--vidrio-tinte' as string]: 'var(--c-acento)', ['--vidrio-opacidad' as string]: '72%' }}
      >
        <Sparkles aria-hidden className={`size-7 transition-[rotate] duration-(--dur-corta) ease-(--curva-liquida) lg:size-6 ${desplegado ? 'rotate-45' : ''}`} />
        <span className="sr-only font-bold lg:not-sr-only">Ayuda por voz</span>
      </Vidrio>
      <div
        id="ayudas-flotantes"
        ref={menu}
        popover="auto"
        className="ayudas-flotantes"
        onToggle={(e) => setDesplegado((e.nativeEvent as ToggleEvent).newState === 'open')}
      >
        <ul className="flex flex-col items-end gap-2.5">
          {(
            [
              { q: 'asistente', texto: 'Asistente por voz', ayuda: 'Te digo qué hay y te inscribo', icono: Mic, color: 'bg-marca text-marca-tinta' },
              { q: 'lector', texto: 'Leer un cartel', ayuda: 'Foto → te lo leo en voz alta', icono: ScanText, color: 'bg-acento text-acento-tinta' },
            ] as const
          ).map(({ q, texto, ayuda, icono: Icono, color }) => (
            <li key={q}>
              <Vidrio
                as="button"
                type="button"
                onClick={() => elegir(q)}
                fuerza={18}
                bisel={16}
                escarcha={6}
                className="flex items-center gap-3 rounded-full py-1.5 pr-1.5 pl-5 text-left text-tinta shadow-[0_12px_28px_-10px_rgb(11_16_38/0.5)] transition-transform duration-(--dur-micro) hover:-translate-x-1 active:scale-95"
                style={{ ['--vidrio-opacidad' as string]: '62%' }}
              >
                <span className="flex flex-col leading-tight">
                  <span className="font-bold">{texto}</span>
                  <span className="text-xs text-tenue">{ayuda}</span>
                </span>
                <span className={`grid size-12 shrink-0 place-items-center rounded-full ${color}`}>
                  <Icono aria-hidden className="size-6" />
                </span>
              </Vidrio>
            </li>
          ))}
        </ul>
      </div>
      {abierta && (
        <Suspense fallback={null}>
          {abierta === 'asistente' ? <AsistenteVoz alCerrar={cerrar} /> : <LectorCarteles alCerrar={cerrar} />}
        </Suspense>
      )}
    </>
  );
}

/**
 * Ícono de navegación: de contorno en reposo; activo, relleno sólido del azul de la marca
 * sin contorno aparte. Los detalles interiores (puerta, manecillas, hueco del pin) se
 * "calan" con el color del fondo encima de la silueta, como en los íconos rellenos.
 */
function IconoNav({ icono: Icono, activo, className }: { icono: LucideIcon; activo: boolean; className: string }) {
  const clases = `${className} transition-[scale] duration-(--dur-corta) ease-(--curva-liquida)`;
  if (!activo) return <Icono aria-hidden className={clases} strokeWidth={1.9} />;
  return (
    <span aria-hidden className={`relative inline-grid scale-110 text-marca ${clases}`}>
      <Icono className="col-start-1 row-start-1 size-full" fill="currentColor" strokeWidth={2.6} />
      <Icono className="col-start-1 row-start-1 size-full text-superficie" fill="none" strokeWidth={1.2} />
    </span>
  );
}

/** Interruptor de modo oscuro (luces de candil). */
function BotonTema({ className = '', flotante = false }: { className?: string; flotante?: boolean }) {
  const { preferencias, cambiar } = usePreferencias();
  const oscuro = preferencias.modoOscuro;
  const props = {
    onClick: () => cambiar({ modoOscuro: !oscuro }),
    'aria-pressed': oscuro,
    'aria-label': 'Modo oscuro',
    title: oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro',
    className: `grid size-11 shrink-0 place-items-center rounded-full text-marca transition-[transform,background-color] duration-(--dur-corta) ease-(--curva-liquida) hover:-rotate-12 active:scale-90 ${
      flotante ? 'shadow-lg' : 'hover:bg-marca/8'
    } ${className}`,
  };
  const icono = oscuro ? <Sun aria-hidden className="size-5" /> : <Moon aria-hidden className="size-5" />;
  return flotante ? (
    <Vidrio as="button" type="button" fuerza={14} bisel={12} {...props}>
      {icono}
    </Vidrio>
  ) : (
    <button type="button" {...props}>
      {icono}
    </button>
  );
}

/** Sesión: "Entrar" discreto, o las iniciales con un menú corto. */
function MenuSesion() {
  const { usuario } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState<{ top: number; right: number } | null>(null);
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  useEffect(() => setAbierto(false), [pathname]);
  useEffect(() => {
    if (!abierto) return;
    // El menú va en <body> (fuera del encabezado de vidrio): un vidrio dentro de otro no
    // puede refractar la página, solo el encabezado. Se coloca bajo el botón.
    const colocar = () => {
      const r = boton.current?.getBoundingClientRect();
      if (r) setPosicion({ top: r.bottom + 10, right: Math.max(12, window.innerWidth - r.right) });
    };
    colocar();
    const fuera = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!caja.current?.contains(t) && !menu.current?.contains(t)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAbierto(false);
      boton.current?.focus();
    };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', esc);
    window.addEventListener('resize', colocar);
    window.addEventListener('scroll', colocar, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('resize', colocar);
      window.removeEventListener('scroll', colocar);
    };
  }, [abierto]);

  if (!usuario) {
    return (
      <Link
        to="/cuenta"
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-marca/10 px-4 text-sm font-semibold text-marca transition-[transform,background-color] duration-(--dur-micro) hover:bg-marca/16 active:scale-95"
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
        ref={boton}
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex min-h-11 items-center gap-2 rounded-full py-1 pr-4 pl-1 text-sm font-semibold transition-[transform,background-color] duration-(--dur-micro) hover:bg-marca/8 active:scale-95"
      >
        <span className="grid size-9 place-items-center rounded-full bg-marca font-bold text-marca-tinta">{iniciales}</span>
        <span className="max-w-[8rem] truncate max-sm:hidden">{usuario.nombre.split(' ')[0]}</span>
      </button>
      {abierto && posicion && createPortal(
        <Vidrio
          ref={menu}
          as="div"
          role="menu"
          fuerza={22}
          bisel={18}
          escarcha={7}
          className="fixed! z-40 flex w-60 flex-col gap-1 rounded-3xl p-2 shadow-lg"
          style={{
            top: posicion.top,
            right: posicion.right,
            // Más tinte que la barra: aquí hay texto que leer
            ['--vidrio-opacidad' as string]: '62%',
            animation: 'entrar-suave 260ms var(--curva-liquida) both',
          }}
        >
          <p className="px-3 pt-1 pb-2 text-sm">
            <strong className="block truncate">{usuario.nombre}</strong>
            <span className="block truncate text-tenue">{usuario.email}</span>
          </p>
          <Link role="menuitem" to="/mis-datos" className="flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold hover:bg-marca/8">
            <UserPen aria-hidden className="size-4.5" /> Mis datos
          </Link>
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
        </Vidrio>,
        document.body,
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
  // Pantallas de herramienta (pases, historial y accesibilidad) van sin pie de página
  const sinPie = ['/mis-pases', '/pase/', '/accesibilidad', '/historial', '/mis-datos', '/cuenta'].some((r) => pathname.startsWith(r));
  const nav = [
    { a: '/', etiqueta: 'Inicio', icono: Home, fin: true },
    { a: '/recintos', etiqueta: 'Recintos', icono: MapPinned, fin: false },
    { a: '/mis-pases', etiqueta: 'Mis pases', icono: Ticket, fin: false },
    ...(conSesion ? [{ a: '/historial', etiqueta: 'Historial', icono: History, fin: false }] : []),
    { a: '/accesibilidad', etiqueta: 'Accesible', icono: Accessibility, fin: false },
  ];
  // Hacia dónde se desliza la página al cambiar de menú
  const actual = nav.findIndex((n) => (n.fin ? pathname === n.a : pathname.startsWith(n.a)));
  const conTransicion = !preferencias.reducirMovimiento;
  const marcarDireccion = (destino: number) => {
    document.documentElement.dataset.direccion = actual === -1 || destino > actual ? 'adelante' : 'atras';
  };

  return (
    <div className="flex min-h-dvh flex-col text-base">
      {preferencias.modoOscuro && <LucesCandil />}
      <SaltarAlContenido />
      <RecargarArrastrando />
      <header className="encabezado-fijo pointer-events-none sticky top-0 z-30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="banda-rebozo" aria-hidden />
        <div className="contenedor pt-2.5">
        <Vidrio fuerza={26} bisel={22} className="pointer-events-auto flex items-center justify-between gap-3 rounded-full py-1.5 pr-1.5 pl-4 shadow-lg">
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
              {nav.map(({ a, etiqueta, icono: Icono, fin }, k) => (
                <li key={a}>
                  <NavLink
                    to={a}
                    end={fin}
                    viewTransition={conTransicion}
                    onClick={() => marcarDireccion(k)}
                    className={({ isActive }) =>
                      `relative flex min-h-(--toque-min) items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-[background-color,color,transform] duration-(--dur-corta) ease-(--curva-liquida) active:scale-95 ${
                        isActive ? 'font-bold text-marca' : 'text-tinta hover:bg-marca/8'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span aria-hidden className="nav-indicador" />}
                        <IconoNav icono={Icono} activo={isActive} className="size-5" />
                        {etiqueta}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <BotonTema className="lg:hidden" />
            <MenuSesion />
          </div>
        </Vidrio>
        </div>
      </header>

      <main
        id="contenido"
        tabIndex={-1}
        className="contenedor flex-1 pt-4 focus:outline-none lg:pt-8"
        style={{ paddingBottom: sinPie ? '0.25rem' : '1.5rem' }}
      >
        <Outlet />
      </main>

      {sinPie ? (
        <div aria-hidden className="lg:hidden" style={{ height: 'calc(var(--alto-barra) + 0.25rem)' }} />
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
            <Link to="/terminos" className="text-xs font-semibold text-tenue underline underline-offset-4 hover:text-marca">
              Términos
            </Link>
            <span className="bajorrelieve" role="img" aria-label="Firma del autor: 65" title="65">
              <span className="h-9 w-[2.35rem]" style={{ ['--firma' as string]: 'url(/brand/firma-65.png)' }} />
            </span>
          </div>
        </div>
      </footer>
      )}

      {/* Escritorio: interruptor de tema flotante abajo a la izquierda */}
      <BotonTema flotante className="fixed! bottom-5 left-5 z-30 hidden lg:grid" />
      {!pathname.startsWith('/accesibilidad') && <AyudasFlotantes />}

      <nav
        aria-label="Navegación principal"
        className="barra-inferior fixed inset-x-0 bottom-0 z-30 px-3 lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <Vidrio fuerza={26} bisel={22} className="mx-auto max-w-[32rem] rounded-full p-1.5 shadow-lg">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
            {nav.map(({ a, etiqueta, icono: Icono, fin }, k) => (
              <li key={a}>
                <NavLink
                  to={a}
                  end={fin}
                  viewTransition={conTransicion}
                  onClick={() => marcarDireccion(k)}
                  className={({ isActive }) =>
                    `relative flex min-h-[calc(var(--toque-min)*1.3)] flex-col items-center justify-center gap-0.5 rounded-full text-xs transition-[background-color,color,transform] duration-(--dur-corta) ease-(--curva-liquida) active:scale-90 ${
                      isActive ? 'font-bold text-marca' : 'font-semibold text-tinta/75'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span aria-hidden className="nav-indicador" />}
                      <IconoNav icono={Icono} activo={isActive} className="size-[clamp(1.35rem,5.6vmin,1.6rem)]" />
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
