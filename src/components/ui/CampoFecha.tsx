import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

/**
 * Campo de fecha con calendario propio (el del navegador no se puede estilizar).
 * Mismo contrato que <input type="date">: valor 'AAAA-MM-DD' o ''.
 * Teclado: flechas mueven el día, Re Pág/Av Pág cambian de mes, Inicio/Fin la semana,
 * Enter elige y Esc cierra. Se abre en el top layer con la API popover.
 */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const SEMANA = [
  ['L', 'lunes'],
  ['M', 'martes'],
  ['M', 'miércoles'],
  ['J', 'jueves'],
  ['V', 'viernes'],
  ['S', 'sábado'],
  ['D', 'domingo'],
] as const;

const dosDigitos = (n: number) => String(n).padStart(2, '0');
const aTexto = (d: Date) => `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
function deTexto(v: string | undefined): Date | null {
  const m = v ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v) : null;
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
const sumarDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sumarMeses = (d: Date, n: number) => {
  const destino = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const ultimo = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
  return new Date(destino.getFullYear(), destino.getMonth(), Math.min(d.getDate(), ultimo));
};
const fmtLargo = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtDia = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function CampoFecha({
  etiqueta,
  value,
  onChange,
  min,
  max,
  ayuda,
  error,
  opcional,
  required,
  className = '',
  vistaInicial,
}: {
  etiqueta: string;
  value: string;
  onChange: (valor: string) => void;
  min?: string;
  max?: string;
  ayuda?: ReactNode;
  error?: string | null;
  opcional?: boolean;
  required?: boolean;
  className?: string;
  /** Mes que se muestra si aún no hay fecha (p. ej. hace 18 años para la fecha de nacimiento). */
  vistaInicial?: string;
}) {
  const id = useId();
  const panelId = `${id}-calendario`;
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const rejilla = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);

  const elegido = deTexto(value);
  const minimo = deTexto(min);
  const maximo = deTexto(max);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limitar = (d: Date) => (minimo && d < minimo ? minimo : maximo && d > maximo ? maximo : d);
  const [foco, setFoco] = useState<Date>(() => limitar(elegido ?? deTexto(vistaInicial) ?? hoy));
  const fuera = (d: Date) => (minimo !== null && d < minimo) || (maximo !== null && d > maximo);

  // Días visibles: semanas completas de lunes a domingo
  const primero = new Date(foco.getFullYear(), foco.getMonth(), 1);
  const desplazamiento = (primero.getDay() + 6) % 7;
  const inicio = sumarDias(primero, -desplazamiento);
  const diasMes = new Date(foco.getFullYear(), foco.getMonth() + 1, 0).getDate();
  const semanas = Math.ceil((desplazamiento + diasMes) / 7);
  const dias = Array.from({ length: semanas * 7 }, (_, i) => sumarDias(inicio, i));

  const anioMin = minimo?.getFullYear() ?? hoy.getFullYear() - 100;
  const anioMax = maximo?.getFullYear() ?? hoy.getFullYear() + 5;
  const anios = Array.from({ length: anioMax - anioMin + 1 }, (_, i) => anioMax - i);

  const abrir = () => {
    setFoco(limitar(elegido ?? deTexto(vistaInicial) ?? hoy));
    panel.current?.showPopover();
  };
  const cerrar = () => panel.current?.hidePopover();
  const elegir = (d: Date) => {
    if (fuera(d)) return;
    onChange(aTexto(d));
    cerrar();
    boton.current?.focus();
  };

  // Sincroniza el estado con la API popover (Esc y clic fuera los maneja el navegador)
  useEffect(() => {
    const p = panel.current;
    if (!p) return;
    const alCambiar = (e: Event) => setAbierto((e as ToggleEvent).newState === 'open');
    p.addEventListener('toggle', alCambiar);
    return () => p.removeEventListener('toggle', alCambiar);
  }, []);

  // Coloca el calendario bajo el campo (o encima si no cabe) dentro de la pantalla
  useLayoutEffect(() => {
    if (!abierto || !panel.current || !boton.current) return;
    const r = boton.current.getBoundingClientRect();
    const p = panel.current;
    const ancho = p.offsetWidth;
    const alto = p.offsetHeight;
    const izquierda = Math.min(Math.max(12, r.left), window.innerWidth - ancho - 12);
    const abajo = r.bottom + 8 + alto <= window.innerHeight;
    p.style.left = `${izquierda}px`;
    p.style.top = `${abajo ? r.bottom + 8 : Math.max(12, r.top - alto - 8)}px`;
  }, [abierto, foco]);

  // Al abrir o mover el foco con el teclado, el día enfocado recibe el foco real
  useEffect(() => {
    if (!abierto) return;
    rejilla.current?.querySelector<HTMLButtonElement>(`[data-fecha="${aTexto(foco)}"]`)?.focus({ preventScroll: true });
  }, [abierto, foco]);

  const teclado = (e: KeyboardEvent) => {
    const mover: Record<string, () => Date> = {
      ArrowLeft: () => sumarDias(foco, -1),
      ArrowRight: () => sumarDias(foco, 1),
      ArrowUp: () => sumarDias(foco, -7),
      ArrowDown: () => sumarDias(foco, 7),
      PageUp: () => sumarMeses(foco, e.shiftKey ? -12 : -1),
      PageDown: () => sumarMeses(foco, e.shiftKey ? 12 : 1),
      Home: () => sumarDias(foco, -((foco.getDay() + 6) % 7)),
      End: () => sumarDias(foco, 6 - ((foco.getDay() + 6) % 7)),
    };
    const fn = mover[e.key];
    if (!fn) return;
    e.preventDefault();
    setFoco(limitar(fn()));
  };

  const describe = [ayuda ? `${id}-ayuda` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span id={`${id}-etiqueta`} className="text-sm font-semibold">
        {etiqueta}
        {opcional && <span className="font-normal text-tenue"> (opcional)</span>}
      </span>
      <button
        ref={boton}
        type="button"
        onClick={() => (abierto ? cerrar() : abrir())}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls={panelId}
        aria-labelledby={`${id}-etiqueta ${id}-valor`}
        aria-describedby={describe}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        className={`flex min-h-(--toque-min) w-full items-center justify-between gap-3 rounded-lg border-2 bg-superficie px-3.5 text-left text-base transition-[border-color,box-shadow] duration-(--dur-micro) hover:border-marca/40 focus-visible:border-marca focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--c-azul)_18%,transparent)] focus-visible:outline-none ${
          error ? 'border-error' : abierto ? 'border-marca' : 'border-linea'
        }`}
      >
        <span id={`${id}-valor`} className={elegido ? 'text-tinta' : 'text-tenue/80'}>
          {elegido ? fmtLargo.format(elegido) : 'Elige una fecha'}
        </span>
        <CalendarDays aria-hidden className="size-5 shrink-0 text-marca" />
      </button>
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-xs text-tenue">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-semibold text-error" role="alert">
          {error}
        </p>
      )}

      <div ref={panel} id={panelId} popover="auto" role="dialog" aria-label={`Elegir: ${etiqueta}`} className="calendario" data-lenis-prevent>
        <div className="mb-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFoco(limitar(sumarMeses(foco, -1)))}
            aria-label="Mes anterior"
            className="grid size-10 shrink-0 place-items-center rounded-full text-marca hover:bg-marca/8"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <select
            aria-label="Mes"
            value={foco.getMonth()}
            onChange={(e) => setFoco(limitar(new Date(foco.getFullYear(), Number(e.target.value), Math.min(foco.getDate(), 28))))}
            className="min-w-0 flex-1 capitalize"
          >
            {MESES.map((m, i) => (
              <option key={m} value={i} className="capitalize">
                {m}
              </option>
            ))}
          </select>
          <select
            aria-label="Año"
            value={foco.getFullYear()}
            onChange={(e) => setFoco(limitar(new Date(Number(e.target.value), foco.getMonth(), Math.min(foco.getDate(), 28))))}
            className="w-[6.2rem] shrink-0"
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFoco(limitar(sumarMeses(foco, 1)))}
            aria-label="Mes siguiente"
            className="grid size-10 shrink-0 place-items-center rounded-full text-marca hover:bg-marca/8"
          >
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </div>

        <div className="calendario-dias mb-1 text-center text-xs font-bold text-tenue" aria-hidden>
          {SEMANA.map(([c, n]) => (
            <span key={n} title={n} className="py-1">
              {c}
            </span>
          ))}
        </div>
        <div ref={rejilla} className="calendario-dias" role="group" aria-label={`${MESES[foco.getMonth()]} de ${foco.getFullYear()}`} onKeyDown={teclado}>
          {dias.map((d) => {
            const clave = aTexto(d);
            const esFoco = clave === aTexto(foco);
            return (
              <button
                key={clave}
                type="button"
                data-fecha={clave}
                tabIndex={esFoco ? 0 : -1}
                disabled={fuera(d)}
                aria-pressed={elegido ? clave === aTexto(elegido) : false}
                aria-label={fmtDia.format(d)}
                aria-current={clave === aTexto(hoy) ? 'date' : undefined}
                data-hoy={clave === aTexto(hoy) || undefined}
                data-fuera={d.getMonth() !== foco.getMonth() || undefined}
                onClick={() => elegir(d)}
                onFocus={() => !esFoco && setFoco(d)}
                className="calendario-dia"
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-linea pt-2 text-sm font-semibold">
          {!fuera(hoy) ? (
            <button type="button" onClick={() => elegir(hoy)} className="min-h-10 rounded-full px-3 text-marca hover:bg-marca/8">
              Hoy
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-1">
            {value && !required && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  cerrar();
                }}
                className="min-h-10 rounded-full px-3 text-tenue hover:bg-marca/8"
              >
                Borrar
              </button>
            )}
            <button type="button" onClick={cerrar} className="min-h-10 rounded-full px-3 text-tinta hover:bg-marca/8">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
