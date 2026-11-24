import { CheckCircle2, Clock, MapPin, Navigation, Scissors, Users, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState, type PointerEvent as EventoPuntero } from 'react';
import { ComoLlegar, type Destino } from '@/components/mapa';
import { TextoRevelado } from '@/components/ui/Animados';
import { Boton } from '@/components/ui/Boton';
import { Vidrio } from '@/components/ui/Vidrio';
import { useAvisos } from '@/context/AvisosContext';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { suscribirRecintos } from '@/services/recintos.service';
import { cancelarInscripcion } from '@/services/inscripciones.service';
import type { Inscripcion, Recinto } from '@/types/models';
import { formatearFechaHora, formatearFechaLarga } from '@/utils/formatters';
import { codificarPase, folioCorto } from '@/utils/id';

type Fase = 'normal' | 'rompiendo' | 'confirmar' | 'cancelando';

const UMBRAL = 110; // px de arrastre para desprender el talón
const RESISTENCIA = 0.55;

function useHorizontal() {
  const consulta = '(min-width: 48rem)';
  const [h, setH] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const f = () => setH(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return h;
}

const sinMovimiento = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.movimiento === 'reducido';

/**
 * Pase como boleto 3D. Se inclina con el puntero; el talón se arrastra y, si se
 * desprende (o se toca "Cancelar pase"), se pide confirmar la cancelación.
 * "Conservar mi pase" regresa el talón a su lugar. Esc o clic fuera solo cierran la vista.
 */
export function BoletoPase({ inscripcion, alCerrar }: { inscripcion: Inscripcion; alCerrar: () => void }) {
  const avisar = useAvisos();
  const horizontal = useHorizontal();
  const dialogo = useRef<HTMLDialogElement>(null);
  const boleto = useRef<HTMLDivElement>(null);
  const talon = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ x: number; y: number; id: number } | null>(null);
  const [fase, setFase] = useState<Fase>('normal');
  const [cerrando, setCerrando] = useState(false);
  const usado = inscripcion.usado;
  const folio = folioCorto(inscripcion.id);
  const recintos = useSuscripcion<Recinto[]>((cb) => suscribirRecintos({}, cb), []);
  const recinto = recintos?.find((r) => r.id === inscripcion.recintoId);
  const [destino, setDestino] = useState<Destino | null>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
  }, []);

  const salir = useCallback(
    (despues?: () => void) => {
      if (cerrando) return;
      setCerrando(true);
      setTimeout(() => (despues ?? alCerrar)(), 260);
    },
    [alCerrar, cerrando],
  );

  // ---- Inclinación 3D con el puntero (no en táctil ni con movimiento reducido) ----
  const inclinar = (e: EventoPuntero<HTMLDivElement>) => {
    const b = boleto.current;
    if (!b || e.pointerType === 'touch' || arrastre.current || sinMovimiento()) return;
    const r = b.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    b.classList.add('inclinando');
    b.style.setProperty('--ry', `${((x - 0.5) * 14).toFixed(2)}deg`);
    b.style.setProperty('--rx', `${((0.5 - y) * 14).toFixed(2)}deg`);
    b.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    b.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
  };
  const enderezar = () => {
    const b = boleto.current;
    if (!b) return;
    b.classList.remove('inclinando');
    b.style.setProperty('--rx', '0deg');
    b.style.setProperty('--ry', '0deg');
  };

  // ---- Talón ----
  const fijarTalon = (d: number) => {
    const t = talon.current;
    if (!t) return;
    const desp = d * RESISTENCIA;
    const giro = Math.min(18, (desp / UMBRAL) * 12);
    t.style.setProperty('--tx', horizontal ? `${desp}px` : '0px');
    t.style.setProperty('--ty', horizontal ? '0px' : `${desp}px`);
    t.style.setProperty('--rt', `${horizontal ? giro : -giro}deg`);
  };
  const soltarTalon = () => {
    const t = talon.current;
    if (!t) return;
    t.style.setProperty('--tx', '0px');
    t.style.setProperty('--ty', '0px');
    t.style.setProperty('--rt', '0deg');
  };
  const romper = useCallback(() => {
    const t = talon.current;
    if (!t || usado) return;
    t.style.setProperty('--tx', horizontal ? '60vw' : '-4vw');
    t.style.setProperty('--ty', horizontal ? '40vh' : '110vh');
    t.style.setProperty('--rt', horizontal ? '28deg' : '-22deg');
    setFase('rompiendo');
    setTimeout(() => setFase('confirmar'), sinMovimiento() ? 0 : 650);
  }, [horizontal, usado]);

  const alBajar = (e: EventoPuntero<HTMLDivElement>) => {
    if (usado || fase !== 'normal' || (e.target as HTMLElement).closest('button, a')) return;
    arrastre.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
    enderezar();
  };
  const alMover = (e: EventoPuntero<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a || a.id !== e.pointerId) return;
    const d = Math.max(0, horizontal ? e.clientX - a.x : e.clientY - a.y);
    fijarTalon(d);
  };
  const alSoltar = (e: EventoPuntero<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a || a.id !== e.pointerId) return;
    arrastre.current = null;
    const d = Math.max(0, horizontal ? e.clientX - a.x : e.clientY - a.y);
    if (d >= UMBRAL) romper();
    else soltarTalon();
  };

  const conservar = () => {
    setFase('normal');
    requestAnimationFrame(soltarTalon);
  };
  const confirmar = async () => {
    setFase('cancelando');
    try {
      await cancelarInscripcion(inscripcion.id);
      avisar('Pase cancelado. ¡Gracias por liberar tu lugar!', 'exito');
      salir();
    } catch (err) {
      avisar(err instanceof Error ? err.message : 'No se pudo cancelar el pase.', 'error');
      conservar();
    }
  };

  const roto = fase !== 'normal';
  const personas = [inscripcion.titular, ...inscripcion.acompanantes].map((p) => p.nombre).join(', ');
  const ancho = horizontal ? 'min(94vw, 58rem)' : 'min(92vw, 24rem)';

  return (
    <dialog
      ref={dialogo}
      className={`modal-boleto ${cerrando ? 'cerrando' : ''}`}
      aria-labelledby="boleto-titulo"
      onCancel={(e) => {
        e.preventDefault();
        salir();
      }}
      onClick={(e) => e.target === e.currentTarget && salir()}
    >
      <div className="grid min-h-full place-items-center p-4 py-10" onClick={(e) => e.target === e.currentTarget && salir()}>
        <button
          type="button"
          onClick={() => salir()}
          className="vidrio fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-10 grid size-12 place-items-center rounded-full text-tinta"
          aria-label="Cerrar pase"
        >
          <X aria-hidden className="size-5" />
        </button>

        <div className="boleto-escena relative" style={{ width: ancho }} onPointerMove={inclinar} onPointerLeave={enderezar}>
          <div
            ref={boleto}
            className={`boleto ${roto ? 'roto' : ''}`}
            data-orientacion={horizontal ? 'horizontal' : 'vertical'}
            style={{ ['--giro' as string]: horizontal ? '-2deg' : '-1.4deg' }}
          >
            {/* Cuerpo: el QR ocupa el lugar de la imagen */}
            <div className={`boleto-parte boleto-cuerpo flex flex-col gap-4 p-[18px] ${horizontal ? 'flex-1' : ''}`}>
              <div className={`portada-agua boleto-medio relative grid place-items-center ${horizontal ? 'min-h-[18rem]' : 'aspect-square'}`}>
                <span className="vidrio absolute top-3 left-3 rounded-full px-3 py-1 text-sm font-semibold text-blanco">Folio {folio}</span>
                <div className={`rounded-2xl bg-blanco p-3 shadow-lg ${usado ? 'opacity-40' : ''}`}>
                  <QRCodeSVG
                    value={codificarPase(inscripcion.id)}
                    size={512}
                    level="M"
                    marginSize={1}
                    title={`Código QR del pase ${folio}`}
                    className="h-auto w-[min(56vw,13rem)]"
                  />
                </div>
                <div className="banda-greca absolute inset-x-0 bottom-0" aria-hidden />
              </div>
              <div className="px-1 pb-1">
                <h2 id="boleto-titulo" className="text-2xl leading-tight font-bold">
                  {inscripcion.tallerTitulo}
                </h2>
                <TextoRevelado
                  className="mt-2 text-tinta"
                  partes={[
                    'Te esperamos el ',
                    { texto: formatearFechaLarga(inscripcion.tallerFechaInicio), resaltar: true },
                    ', en el horario ',
                    { texto: inscripcion.tallerHorario, resaltar: true },
                    ', en ',
                    { texto: inscripcion.recintoNombre, resaltar: true },
                    '.',
                  ]}
                />
              </div>
            </div>

            {/* Talón: se arrastra para desprenderlo */}
            <div
              ref={talon}
              className={`boleto-parte boleto-talon flex flex-col gap-3 p-[18px] ${horizontal ? 'w-[19rem] shrink-0' : ''} ${fase === 'rompiendo' || fase === 'confirmar' || fase === 'cancelando' ? 'cayendo' : ''}`}
              style={{ ['--origen-talon' as string]: horizontal ? '0% 100%' : '100% 0%' }}
              aria-disabled={usado || undefined}
              onPointerDown={alBajar}
              onPointerMove={alMover}
              onPointerUp={alSoltar}
              onPointerCancel={alSoltar}
            >
              <span className="boleto-perforacion" aria-hidden />
              <p className="fuente-display text-sm font-bold text-marca">Pase digital SICUJ</p>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex items-start gap-2">
                  <Users aria-hidden className="mt-0.5 size-4 shrink-0 text-tenue" />
                  <dt className="solo-lectores">Personas</dt>
                  <dd>
                    <strong>{inscripcion.personas === 1 ? '1 persona' : `${inscripcion.personas} personas`}</strong>: {personas}
                  </dd>
                </div>
                <div className="flex items-start gap-2">
                  <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-tenue" />
                  <dt className="solo-lectores">Horario</dt>
                  <dd>{inscripcion.tallerHorario}</dd>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-tenue" />
                  <dt className="solo-lectores">Lugar</dt>
                  <dd>{inscripcion.recintoNombre}</dd>
                </div>
              </dl>
              <p className="font-mono text-2xl font-bold tracking-wider" aria-label={`Folio ${folio.split('').join(' ')}`}>
                {folio}
              </p>
              {recinto && (
                <Boton
                  tamano="sm"
                  variante="secundario"
                  className="w-fit"
                  icono={<Navigation aria-hidden className="size-4" />}
                  onClick={() => setDestino({ nombre: recinto.nombre, lat: recinto.ubicacion.lat, lng: recinto.ubicacion.lng })}
                >
                  ¿Cómo llegar?
                </Boton>
              )}
              {usado ? (
                <p className="mt-auto flex items-center gap-2 rounded-lg bg-ok-fondo p-3 text-sm font-semibold text-ok">
                  <CheckCircle2 aria-hidden className="size-5 shrink-0" /> Usado el {formatearFechaHora(inscripcion.usadoEn!)}
                </p>
              ) : (
                <>
                  <p className="text-sm text-tenue">Muestra el código en la entrada y sube el brillo de tu pantalla.</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-semibold text-tenue">
                      <Scissors aria-hidden className="size-4" /> Arrastra el talón para cancelar
                    </span>
                    <Boton tamano="sm" variante="peligro" onClick={romper} className="shrink-0 whitespace-nowrap">
                      Cancelar pase
                    </Boton>
                  </div>
                </>
              )}
            </div>
          </div>

          {(fase === 'confirmar' || fase === 'cancelando') && (
            <Vidrio
              as="div"
              role="alertdialog"
              aria-labelledby="confirmar-titulo"
              aria-describedby="confirmar-texto"
              className={`absolute z-10 flex flex-col gap-3 rounded-2xl p-5 ${horizontal ? 'top-1/2 right-0 w-[19rem] -translate-y-1/2' : 'inset-x-1 bottom-0'}`}
              style={{ animation: 'entrar-suave 360ms var(--curva-liquida) both' }}
            >
              <p id="confirmar-titulo" className="fuente-display text-lg font-bold text-titulo">
                ¿Cancelar este pase?
              </p>
              <p id="confirmar-texto" className="text-sm">
                {inscripcion.personas === 1 ? 'Tu lugar quedará libre' : `Tus ${inscripcion.personas} lugares quedarán libres`} para otra
                persona. Esto no se puede deshacer.
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Boton variante="secundario" onClick={conservar} disabled={fase === 'cancelando'} autoFocus>
                  Conservar mi pase
                </Boton>
                <Boton variante="peligro" onClick={confirmar} cargando={fase === 'cancelando'}>
                  Sí, cancelar pase
                </Boton>
              </div>
            </Vidrio>
          )}
        </div>
      </div>
      <ComoLlegar destino={destino} alCerrar={() => setDestino(null)} />
    </dialog>
  );
}
