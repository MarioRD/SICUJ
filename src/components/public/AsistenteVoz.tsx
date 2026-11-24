import { ClipboardList, Keyboard, LoaderCircle, Mic, Send, Sparkles, Ticket, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boton } from '@/components/ui/Boton';
import { ModalVidrio } from '@/components/ui/ModalVidrio';
import { useAuth } from '@/context/AuthContext';
import { usePreferencias } from '@/context/PreferenciasContext';
import { buscarPorVoz, describirActividad, intencion, nombrarInteres, interes } from '@/features/voz/interpretar';
import { callar, decir, escuchar, puedeEscuchar } from '@/features/voz/voz';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { obtenerDatosInscripcion } from '@/services/datos.service';
import { guardarPaseLocal, inscribir, miPaseEn } from '@/services/inscripciones.service';
import { suscribirTalleres } from '@/services/talleres.service';
import type { DatosInscripcion, Taller } from '@/types/models';
import { describirRangoTaller, edadEnFecha, edadPermitida } from '@/utils/rangosEdad';

type Paso = 'interes' | 'propuesta' | 'tutor' | 'fin';
type Fase = 'hablando' | 'escuchando' | 'pensando' | 'esperando';
interface Mensaje {
  id: number;
  quien: 'asistente' | 'tu';
  texto: string;
}

const PREGUNTA = '¿Qué tipo de talleres o eventos te interesan? Por ejemplo: música, baile, anime o idiomas.';
const SUGERENCIAS: Record<Paso, string[]> = {
  interes: ['Música', 'Baile', 'Arte', 'Anime', 'Idiomas', 'Lo que haya'],
  propuesta: ['Sí, inscríbeme', 'Otra', 'Salir'],
  tutor: ['Sí, tengo permiso', 'No'],
  fin: ['Buscar otra cosa'],
};

/** Folio letra por letra para que se entienda al oírlo. */
const deletrear = (folio: string) => folio.replace(/-/g, ' ').split('').join(' ').replace(/\s+/g, ' ');

/**
 * Asistente por voz: pregunta qué te interesa, propone actividades una por una y, si dices
 * que sí, te inscribe con tus datos guardados. Todo con APIs gratuitas del navegador.
 */
export default function AsistenteVoz({ alCerrar }: { alCerrar: () => void }) {
  const { usuario } = useAuth();
  const { preferencias } = usePreferencias();
  const navegar = useNavigate();
  const talleres = useSuscripcion(suscribirTalleres.bind(null, {}), []);
  const conVoz = puedeEscuchar();

  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [fase, setFase] = useState<Fase>('esperando');
  const [paso, setPasoEstado] = useState<Paso>('interes');
  const [provisional, setProvisional] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const [escrito, setEscrito] = useState('');
  const [teclado, setTeclado] = useState(!conVoz);
  const [pase, setPase] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<string | null>(null);

  // El diálogo es asíncrono (habla → escucha → responde): el estado vivo va en refs
  const pasoRef = useRef<Paso>('interes');
  const candidatos = useRef<Taller[]>([]);
  const indice = useRef(0);
  const ultimo = useRef('');
  const datos = useRef<DatosInscripcion | null>(null);
  const turno = useRef(0);
  const cancelarEscucha = useRef<(() => void) | null>(null);
  const vivo = useRef(true);
  const listaTalleres = useRef<Taller[]>([]);
  const log = useRef<HTMLOListElement>(null);
  const nMensaje = useRef(0);
  listaTalleres.current = talleres ?? [];

  const setPaso = (p: Paso) => {
    pasoRef.current = p;
    setPasoEstado(p);
  };
  const agregar = (quien: Mensaje['quien'], texto: string) => setMensajes((m) => [...m, { id: ++nMensaje.current, quien, texto }]);

  const detenerEscucha = () => {
    cancelarEscucha.current?.();
    cancelarEscucha.current = null;
  };

  // Funciones del diálogo (se llaman entre sí; el turno evita que dos flujos se crucen)
  const oir = useRef<() => Promise<void>>(async () => {});
  const responder = useRef<(dicho: string) => Promise<void>>(async () => {});

  const asistente = useCallback(
    async (texto: string, luegoEscuchar = true) => {
      const mio = turno.current;
      agregar('asistente', texto);
      ultimo.current = texto;
      setFase('hablando');
      await decir(texto, preferencias.velocidadVoz);
      if (!vivo.current || mio !== turno.current) return;
      if (luegoEscuchar && pasoRef.current !== 'fin' && conVoz && !teclado) void oir.current();
      else setFase('esperando');
    },
    [preferencias.velocidadVoz, conVoz, teclado],
  );

  const proponer = async (i: number, intro = '') => {
    const t = candidatos.current[i];
    if (!t) {
      setPaso('interes');
      return asistente(`Esas son todas las que tengo por ahora. ¿Te interesa otro tipo de actividad?`);
    }
    indice.current = i;
    setPaso('propuesta');
    const inicio = intro ? `${intro} ${candidatos.current.length > 1 ? 'La primera es' : 'Es'}` : 'La siguiente es';
    return asistente(`${inicio} ${describirActividad(t)} ¿Quieres inscribirte?`);
  };

  const buscar = async (dicho: string) => {
    const lista = buscarPorVoz(listaTalleres.current, dicho);
    if (!lista.length) {
      const i = intencion(dicho);
      if (i === 'no') {
        setPaso('fin');
        return asistente('Está bien. Cuando quieras buscar algo, aquí estoy.', false);
      }
      if (i === 'si' || !interes(dicho).palabras.length) return asistente(PREGUNTA);
      return asistente(`Por ahora no hay talleres ni eventos de ${nombrarInteres(dicho)}. ¿Te interesa otra cosa? También puedes decir: lo que haya.`);
    }
    candidatos.current = lista;
    return proponer(0, `Encontré ${lista.length === 1 ? 'una actividad' : `${lista.length} actividades`}.`);
  };

  const completar = async (tutor: boolean) => {
    const t = candidatos.current[indice.current]!;
    const d = datos.current!;
    const edad = edadEnFecha(d.fechaNacimiento, t.fechaInicio)!;
    setFase('pensando');
    try {
      const ins = await inscribir({
        tallerId: t.id,
        titular: { nombre: d.nombre, edad, genero: d.genero },
        acompanantes: [],
        contacto: { email: usuario?.email ?? '', telefono: d.telefono ?? '' },
        aceptoAvisoPrivacidad: true,
        consentimientoTutor: tutor,
        uidCiudadano: usuario?.id ?? null,
      });
      guardarPaseLocal(ins.id);
      setPase(ins.id);
      setPaso('fin');
      return asistente(`¡Listo! Tu lugar en ${t.titulo} quedó apartado. Tu folio es ${deletrear(ins.folio)}. Tu pase con código QR ya está en Mis pases.`, false);
    } catch (err) {
      await asistente(`No pude inscribirte: ${err instanceof Error ? err.message : 'hubo un problema'}`, false);
      return proponer(indice.current + 1);
    }
  };

  const intentarInscribir = async () => {
    const t = candidatos.current[indice.current]!;
    const sinDatos = (motivo: string) => {
      setPaso('fin');
      setFormulario(t.id);
      return asistente(`${motivo} Te dejo el botón para llenar el formulario de ${t.titulo}; solo toma un minuto.`, false);
    };
    if (!usuario) return sinDatos('Para inscribirte solo con la voz necesitas una cuenta con tus datos guardados.');
    setFase('pensando');
    datos.current ??= await obtenerDatosInscripcion(usuario.id).catch(() => null);
    const d = datos.current;
    if (!d) return sinDatos('Aún no tienes tus datos guardados para inscribirte con un toque.');
    const ya = await miPaseEn(t.id, usuario.id).catch(() => null);
    if (ya) {
      setPase(ya);
      await asistente('Ya tienes un pase para esta actividad.', false);
      return proponer(indice.current + 1);
    }
    const edad = edadEnFecha(d.fechaNacimiento, t.fechaInicio);
    if (edad === null) return sinDatos('No pude calcular tu edad.');
    if (!edadPermitida(edad, t.edadMin, t.edadMax)) {
      await asistente(`Esta actividad es para personas ${describirRangoTaller(t.edadMin, t.edadMax).toLowerCase()} y ese día tendrás ${edad} años.`, false);
      return proponer(indice.current + 1);
    }
    if (edad < 18) {
      setPaso('tutor');
      return asistente('Como eres menor de edad, necesito saber algo: ¿tu mamá, papá o tutor te dio permiso para inscribirte?');
    }
    return completar(false);
  };

  responder.current = async (dicho: string) => {
    turno.current++;
    callar();
    detenerEscucha();
    setAviso(null);
    setProvisional('');
    agregar('tu', dicho);
    setFase('pensando');
    const i = intencion(dicho);
    if (i === 'salir') {
      setPaso('fin');
      return asistente('Muy bien. Cuando quieras, aquí estoy. ¡Hasta luego!', false);
    }
    if (i === 'repetir' && ultimo.current) return asistente(ultimo.current);
    switch (pasoRef.current) {
      case 'interes':
        return buscar(dicho);
      case 'propuesta': {
        // "No, mejor de baile": cambia de tema en lugar de pasar a la siguiente
        const cats = interes(dicho).categorias;
        const actual = candidatos.current[indice.current];
        if (cats.length && actual && !cats.includes(actual.categoria) && buscarPorVoz(listaTalleres.current, dicho).length) return buscar(dicho);
        if (i === 'si') return intentarInscribir();
        if (i === 'no') return proponer(indice.current + 1);
        if (buscarPorVoz(listaTalleres.current, dicho).length) return buscar(dicho);
        return asistente('No te entendí. ¿Quieres inscribirte? Di sí, o di "otra" para escuchar la siguiente.');
      }
      case 'tutor':
        if (i === 'si') return completar(true);
        if (i === 'no') {
          setPaso('interes');
          return asistente('Sin ese permiso no puedo inscribirte. Pídeselo y vuelve cuando quieras. ¿Te interesa otro tipo de actividad?');
        }
        return asistente('¿Te dieron permiso? Responde sí o no.');
      case 'fin':
        setPase(null);
        setFormulario(null);
        setPaso('interes');
        {
          const q = interes(dicho);
          return q.categorias.length || q.cualquiera ? buscar(dicho) : asistente(PREGUNTA);
        }
    }
  };

  oir.current = async () => {
    callar();
    detenerEscucha();
    setAviso(null);
    setProvisional('');
    setFase('escuchando');
    const mio = ++turno.current;
    const { promesa, cancelar } = escuchar(setProvisional);
    cancelarEscucha.current = cancelar;
    try {
      const dicho = await promesa;
      if (!vivo.current || mio !== turno.current) return;
      cancelarEscucha.current = null;
      setProvisional('');
      if (!dicho) {
        setFase('esperando');
        setAviso('No te escuché. Toca el micrófono para hablar.');
        return;
      }
      await responder.current(dicho);
    } catch (err) {
      if (!vivo.current || mio !== turno.current) return;
      cancelarEscucha.current = null;
      setFase('esperando');
      setAviso(err instanceof Error ? err.message : 'No pude escucharte.');
    }
  };

  // Saludo al abrir (la apertura fue un toque, así que el navegador deja hablar)
  const saludado = useRef(false);
  useEffect(() => {
    vivo.current = true;
    if (!saludado.current && talleres) {
      saludado.current = true;
      const nombre = usuario?.nombre.split(' ')[0];
      void asistente(`¡Hola${nombre ? `, ${nombre}` : ''}! Soy el asistente de SICUJ. ${PREGUNTA}`);
    }
  }, [talleres, usuario?.nombre, asistente]);
  useEffect(
    () => () => {
      vivo.current = false;
      turno.current++;
      callar();
      cancelarEscucha.current?.();
    },
    [],
  );

  useEffect(() => {
    log.current?.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [mensajes, provisional]);

  const tocarMicro = () => {
    if (fase === 'escuchando') {
      turno.current++;
      detenerEscucha();
      setProvisional('');
      setFase('esperando');
      return;
    }
    setTeclado(false);
    void oir.current();
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const t = escrito.trim();
    if (!t) return;
    setEscrito('');
    void responder.current(t);
  };

  const ESTADO: Record<Fase, string> = {
    hablando: 'Hablando… toca para interrumpir y responder',
    escuchando: 'Te escucho…',
    pensando: 'Un momento…',
    esperando: conVoz ? 'Toca el micrófono para hablar' : 'Escribe tu respuesta',
  };

  return (
    <ModalVidrio alCerrar={alCerrar} etiquetadoPor="t-asistente" ancho="min(94vw, 32rem)">
      <section className="tarjeta flex max-h-[88dvh] flex-col gap-4 p-5 shadow-2xl">
        <header>
          <h2 id="t-asistente" className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles aria-hidden className="size-6 text-marca" /> Asistente por voz
          </h2>
          <p className="mt-1 text-sm text-tenue">Dime qué te gusta y te digo qué hay. Si quieres, te inscribo.</p>
        </header>

        <ol ref={log} role="log" aria-label="Conversación" className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {mensajes.map((m) => (
            <li
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[0.95rem] leading-snug ${
                m.quien === 'asistente' ? 'self-start rounded-bl-md bg-hundido' : 'self-end rounded-br-md bg-marca text-marca-tinta'
              }`}
              style={{ animation: 'entrar-suave 260ms var(--curva-liquida) both' }}
            >
              <span className="solo-lectores">{m.quien === 'asistente' ? 'Asistente: ' : 'Tú: '}</span>
              {m.texto}
            </li>
          ))}
          {provisional && (
            <li aria-hidden className="max-w-[85%] self-end rounded-2xl rounded-br-md border-2 border-dashed border-marca/40 px-3.5 py-2 text-[0.95rem] text-tenue">
              {provisional}…
            </li>
          )}
        </ol>

        {(pase || formulario) && (
          <div className="flex flex-wrap gap-2">
            {pase && (
              <Boton onClick={() => navegar(`/pase/${pase}`, { state: { nuevo: true } })} icono={<Ticket aria-hidden className="size-5" />}>
                Ver mi pase
              </Boton>
            )}
            {formulario && (
              <Boton onClick={() => navegar(`/taller/${formulario}/inscripcion`)} icono={<ClipboardList aria-hidden className="size-5" />}>
                Ir al formulario
              </Boton>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2" role="group" aria-label="Respuestas rápidas">
          {SUGERENCIAS[paso].map((s) => (
            <button
              key={s}
              type="button"
              disabled={fase === 'pensando' || !talleres}
              onClick={() => void responder.current(s)}
              className="min-h-10 rounded-full border-2 border-linea px-3.5 text-sm font-semibold transition-[border-color,background-color,transform] duration-(--dur-micro) hover:border-marca/50 hover:bg-marca/6 active:scale-95 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {conVoz && (
            <button
              type="button"
              onClick={tocarMicro}
              disabled={fase === 'pensando' || !talleres}
              aria-label={fase === 'escuchando' ? 'Dejar de escuchar' : 'Hablar'}
              aria-pressed={fase === 'escuchando'}
              data-fase={fase}
              className="microfono grid size-16 shrink-0 place-items-center rounded-full bg-marca text-marca-tinta shadow-lg transition-transform duration-(--dur-corta) ease-(--curva-liquida) active:scale-90 disabled:opacity-60"
            >
              {fase === 'pensando' ? (
                <LoaderCircle aria-hidden className="size-7 animate-spin" />
              ) : fase === 'hablando' ? (
                <Volume2 aria-hidden className="size-7" />
              ) : (
                <Mic aria-hidden className="size-7" />
              )}
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" aria-live="polite">
              {ESTADO[fase]}
            </p>
            {aviso && <p className="text-sm text-error">{aviso}</p>}
            {!conVoz && <p className="text-xs text-tenue">Este navegador no reconoce la voz; prueba con Chrome, Edge o Safari.</p>}
          </div>
          {conVoz && !teclado && (
            <button
              type="button"
              onClick={() => {
                turno.current++;
                detenerEscucha();
                callar();
                setFase('esperando');
                setTeclado(true);
              }}
              className="grid size-11 place-items-center rounded-full text-tenue hover:bg-marca/8 hover:text-marca"
              aria-label="Escribir en lugar de hablar"
            >
              <Keyboard aria-hidden className="size-5" />
            </button>
          )}
        </div>

        {teclado && (
          <form onSubmit={enviar} className="flex items-center gap-2">
            <label htmlFor="asistente-texto" className="solo-lectores">
              Tu respuesta
            </label>
            <input
              id="asistente-texto"
              value={escrito}
              onChange={(e) => setEscrito(e.target.value)}
              placeholder="Escribe aquí…"
              autoComplete="off"
              enterKeyHint="send"
              className="min-h-12 min-w-0 flex-1 rounded-full border-2 border-linea bg-superficie px-4 focus:border-marca"
            />
            <button type="submit" aria-label="Enviar" className="grid size-12 shrink-0 place-items-center rounded-full bg-acento text-acento-tinta active:scale-90">
              <Send aria-hidden className="size-5" />
            </button>
          </form>
        )}
      </section>
    </ModalVidrio>
  );
}
