import { Camera, CameraOff, CheckCircle2, Keyboard, ScanLine, ShieldAlert, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Alerta, Cargando } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { Campo, Selector } from '@/components/ui/Campo';
import { useAuth } from '@/context/AuthContext';
import { prepararAudio, sonidoAceptado, sonidoRechazado } from '@/features/qr-scanner/sonidos';
import { useQrScanner } from '@/features/qr-scanner/useQrScanner';
import { AvisoPermiso, usePermiso } from '@/components/ui/AvisoPermiso';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { EncabezadoPagina } from '@/layouts/AdminLayout';
import { suscribirTalleres } from '@/services/talleres.service';
import { validarPase, validarPorFolio, type ResultadoValidacion } from '@/services/validacion.service';
import type { Taller } from '@/types/models';
import { formatearFecha, formatearFechaHora } from '@/utils/formatters';
import { folioCorto } from '@/utils/id';

interface Registro {
  id: number;
  hora: number;
  resultado: ResultadoValidacion;
}

const TEXTOS: Record<ResultadoValidacion['estado'], { titulo: string; detalle: string; ok: boolean }> = {
  valido: { titulo: 'ACCESO PERMITIDO', detalle: 'Pase válido. Registrado como asistencia.', ok: true },
  ya_usado: { titulo: 'PASE YA UTILIZADO', detalle: 'Este pase ya se usó; no se permite una segunda entrada.', ok: false },
  otro_evento: { titulo: 'OTRA ACTIVIDAD', detalle: 'El pase es válido pero corresponde a otra actividad.', ok: false },
  no_existe: { titulo: 'PASE NO ENCONTRADO', detalle: 'No existe un pase con este código (pudo cancelarse).', ok: false },
  formato_invalido: { titulo: 'CÓDIGO NO RECONOCIDO', detalle: 'El código no es un pase SICUJ.', ok: false },
};

function PanelResultado({ registro, alContinuar }: { registro: Registro; alContinuar: () => void }) {
  const r = registro.resultado;
  const t = TEXTOS[r.estado];
  const ins = 'inscripcion' in r ? r.inscripcion : null;
  return (
    <div
      role="alert"
      className={`flex flex-col gap-3 rounded-xl border-4 p-6 ${t.ok ? 'border-ok bg-ok-fondo text-ok' : 'border-error bg-error-fondo text-error'}`}
    >
      <div className="flex items-center gap-3">
        {t.ok ? <CheckCircle2 aria-hidden className="size-12 shrink-0" /> : <XCircle aria-hidden className="size-12 shrink-0" />}
        <div>
          <p className="text-2xl font-black tracking-wide">{t.titulo}</p>
          <p className="font-semibold">{t.detalle}</p>
        </div>
      </div>
      {ins && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-superficie/70 p-3 text-sm text-tinta">
          <dt className="text-tenue">Folio</dt>
          <dd className="font-mono font-bold">{folioCorto(ins.id)}</dd>
          <dt className="text-tenue">Personas</dt>
          <dd className="text-lg font-bold">{ins.personas}</dd>
          <dt className="text-tenue">Titular</dt>
          <dd className="font-semibold">{ins.titular.nombre}</dd>
          <dt className="text-tenue">Actividad</dt>
          <dd>{ins.tallerTitulo}</dd>
          {r.estado === 'ya_usado' && ins.usadoEn && (
            <>
              <dt className="text-tenue">Usado</dt>
              <dd className="font-semibold">{formatearFechaHora(ins.usadoEn)}</dd>
            </>
          )}
        </dl>
      )}
      <Boton variante={t.ok ? 'primario' : 'peligro'} onClick={alContinuar} autoFocus>
        Escanear siguiente
      </Boton>
    </div>
  );
}

export default function ValidacionQRPage() {
  const { usuario } = useAuth();
  const talleres = useSuscripcion<Taller[]>((cb) => suscribirTalleres({}, cb), []);
  const [tallerId, setTallerId] = useState('');
  const [actual, setActual] = useState<Registro | null>(null);
  const [historial, setHistorial] = useState<Registro[]>([]);
  const [folio, setFolio] = useState('');
  const temporizador = useRef<number | null>(null);

  // Preselecciona la actividad más próxima a hoy
  useEffect(() => {
    if (!tallerId && talleres?.length) setTallerId(talleres[0]!.id);
  }, [talleres, tallerId]);

  const tallerSel = useMemo(() => talleres?.find((t) => t.id === tallerId), [talleres, tallerId]);

  const mostrar = useCallback((resultado: ResultadoValidacion) => {
    const reg = { id: Date.now(), hora: Date.now(), resultado };
    setActual(reg);
    setHistorial((h) => [reg, ...h].slice(0, 12));
    if (resultado.estado === 'valido') sonidoAceptado();
    else sonidoRechazado();
  }, []);

  const [permisoCamara, setPermisoCamara] = usePermiso('camara');
  const [pedirCamara, setPedirCamara] = useState(false);
  const scanner = useQrScanner({
    alLeer: async (texto) => {
      if (!usuario) return;
      mostrar(await validarPase(texto, tallerId, usuario.id));
    },
  });

  const { reanudar } = scanner;
  const continuar = useCallback(() => {
    if (temporizador.current) window.clearTimeout(temporizador.current);
    setActual(null);
    reanudar();
  }, [reanudar]);

  // Los pases válidos se cierran solos tras 3 s para agilizar la fila; los rechazos esperan confirmación.
  useEffect(() => {
    if (actual?.resultado.estado === 'valido') {
      temporizador.current = window.setTimeout(continuar, 3000);
      return () => {
        if (temporizador.current) window.clearTimeout(temporizador.current);
      };
    }
  }, [actual, continuar]);

  // Al cambiar de actividad, se limpia el resultado anterior
  useEffect(() => setActual(null), [tallerId]);

  const validarManual = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuario || !folio.trim()) return;
    prepararAudio();
    mostrar(await validarPorFolio(folio, tallerId, usuario.id));
    setFolio('');
  };

  if (!talleres) return <Cargando />;

  const aceptados = historial.filter((h) => h.resultado.estado === 'valido').length;

  return (
    <>
      <EncabezadoPagina
        titulo="Validación de pases"
        descripcion="Escanea el QR del pase. Cada pase se acepta una sola vez (validación atómica)."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-4">
          <Selector etiqueta="Actividad que se está validando" value={tallerId} onChange={(e) => setTallerId(e.target.value)}>
            {talleres.map((t) => (
              <option key={t.id} value={t.id}>
                {formatearFecha(t.fechaInicio)} · {t.titulo} — {t.recintoNombre}
              </option>
            ))}
          </Selector>
          {tallerSel && (
            <p className="text-sm text-tenue">
              Asistentes registrados: <strong className="text-tinta">{tallerSel.asistentes}</strong> de {tallerSel.inscritos} inscritos
            </p>
          )}

          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
            <video ref={scanner.videoRef} muted playsInline className="size-full object-cover" aria-label="Vista de la cámara" />
            {scanner.estado === 'activa' && (
              <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="aspect-square h-[70%] rounded-2xl border-4 border-white/90 shadow-[0_0_0_100vmax_rgb(0_0_0/0.35)]">
                  <ScanLine className="size-full animate-pulse p-6 text-white/40" />
                </div>
              </div>
            )}
            {(scanner.estado === 'apagada' || scanner.estado === 'error') && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
                <div className="flex flex-col items-center gap-3">
                  <CameraOff aria-hidden className="size-12 opacity-70" />
                  <p>La cámara está apagada</p>
                </div>
              </div>
            )}
            {actual && <div className={`absolute inset-0 ${TEXTOS[actual.resultado.estado].ok ? 'bg-ok/45' : 'bg-error/45'}`} aria-hidden />}
          </div>

          <div className="flex flex-wrap gap-2">
            {scanner.estado === 'apagada' || scanner.estado === 'error' ? (
              <Boton
                tamano="lg"
                icono={<Camera aria-hidden className="size-5" />}
                onClick={() => {
                  prepararAudio();
                  if (permisoCamara !== 'granted' && !pedirCamara) return setPedirCamara(true);
                  setPedirCamara(false);
                  void scanner.encender();
                }}
                disabled={!tallerId}
              >
                Encender cámara
              </Boton>
            ) : (
              <Boton tamano="lg" variante="secundario" icono={<CameraOff aria-hidden className="size-5" />} onClick={scanner.apagar} cargando={scanner.estado === 'iniciando'}>
                Apagar cámara
              </Boton>
            )}
          </div>
          {(pedirCamara || scanner.error?.startsWith('Se negó')) && (
            <AvisoPermiso
              recurso="camara"
              bloqueado={permisoCamara === 'denied' || !!scanner.error?.startsWith('Se negó')}
              alPermitir={() => {
                setPedirCamara(false);
                if (permisoCamara === 'denied') setPermisoCamara('desconocido');
                prepararAudio();
                void scanner.encender();
              }}
              alCancelar={() => setPedirCamara(false)}
            />
          )}
          {scanner.error && !scanner.error.startsWith('Se negó') && <Alerta tono="error">{scanner.error}</Alerta>}
        </div>

        <div className="flex flex-col gap-4">
          {actual ? (
            <PanelResultado registro={actual} alContinuar={continuar} />
          ) : (
            <div className="tarjeta flex flex-col items-center gap-2 p-8 text-center text-tenue">
              <ShieldAlert aria-hidden className="size-10" />
              <p className="font-semibold">Esperando un pase…</p>
              <p className="text-sm">El resultado aparecerá aquí con una señal visual y sonora.</p>
            </div>
          )}

          <form onSubmit={validarManual} className="tarjeta flex flex-col gap-3 p-5">
            <p className="flex items-center gap-2 font-bold">
              <Keyboard aria-hidden className="size-5" /> Captura manual
            </p>
            <Campo
              etiqueta="Folio del pase"
              placeholder="ABCD-1234"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              ayuda="Si el QR no se puede leer, escribe el folio que aparece debajo del código."
              autoCapitalize="characters"
              autoComplete="off"
            />
            <Boton type="submit" variante="secundario" disabled={!folio.trim() || !tallerId}>
              Validar folio
            </Boton>
          </form>

          <section className="tarjeta p-5" aria-labelledby="t-sesion">
            <h2 id="t-sesion" className="mb-3 font-bold">
              Esta sesión: {aceptados} aceptados · {historial.length - aceptados} rechazados
            </h2>
            {historial.length === 0 ? (
              <p className="text-sm text-tenue">Sin lecturas todavía.</p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {historial.map((h) => {
                  const t = TEXTOS[h.resultado.estado];
                  const ins = 'inscripcion' in h.resultado ? h.resultado.inscripcion : null;
                  return (
                    <li key={h.id} className="flex items-center gap-2">
                      {t.ok ? <CheckCircle2 aria-hidden className="size-4 shrink-0 text-ok" /> : <XCircle aria-hidden className="size-4 shrink-0 text-error" />}
                      <span className="tabular-nums text-tenue">{new Date(h.hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span className="font-semibold">{t.titulo.toLowerCase()}</span>
                      {ins && <span className="truncate text-tenue">· {folioCorto(ins.id)} · {ins.personas} p.</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
