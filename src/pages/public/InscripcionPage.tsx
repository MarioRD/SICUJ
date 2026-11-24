import { ArrowLeft, CalendarDays, MapPin, Plus, ShieldCheck, Ticket, Trash2, UserCheck, UserPlus } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alerta, Cargando, Modal, Vacio } from '@/components/ui/Basicos';
import { Boton, EnlaceBoton } from '@/components/ui/Boton';
import { Campo, Casilla, Selector } from '@/components/ui/Campo';
import { CampoFecha } from '@/components/ui/CampoFecha';
import { AvisoPrivacidadSimplificado } from '@/content/avisoPrivacidad';
import { useAuth } from '@/context/AuthContext';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { guardarDatosInscripcion, obtenerDatosInscripcion } from '@/services/datos.service';
import { ErrorInscripcion, guardarPaseLocal, inscribir, miPaseEn } from '@/services/inscripciones.service';
import { cuposDisponibles, estaVigente, suscribirTaller } from '@/services/talleres.service';
import { GENEROS, MAX_ACOMPANANTES, type DatosInscripcion, type Genero, type Taller } from '@/types/models';
import { formatearFecha } from '@/utils/formatters';
import { describirRangoTaller, edadEnFecha, edadPermitida } from '@/utils/rangosEdad';

interface PersonaForm {
  clave: number;
  nombre: string;
  edad: string;
  /** Solo la persona con cuenta: se guarda la fecha, no la edad. */
  fechaNacimiento: string;
  genero: Genero | '';
}

const personaVacia = (): PersonaForm => ({ clave: Math.random(), nombre: '', edad: '', fechaNacimiento: '', genero: '' });
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const haceAnios = (n: number) => `${new Date().getFullYear() - n}-01-01`;

function FormPersona({
  persona,
  titulo,
  alCambiar,
  alQuitar,
  conFecha = false,
}: {
  persona: PersonaForm;
  titulo: string;
  alCambiar: (p: PersonaForm) => void;
  alQuitar?: () => void;
  conFecha?: boolean;
}) {
  return (
    <fieldset className="tarjeta flex flex-col gap-3 p-4">
      <legend className="sr-only">{titulo}</legend>
      <div className="flex items-center justify-between gap-2">
        <p aria-hidden className="font-bold">
          {titulo}
        </p>
        {alQuitar && (
          <Boton variante="fantasma" tamano="sm" onClick={alQuitar} icono={<Trash2 aria-hidden className="size-4" />}>
            Quitar<span className="solo-lectores"> {titulo}</span>
          </Boton>
        )}
      </div>
      <Campo
        etiqueta="Nombre"
        ayuda="Basta con tu nombre de pila o iniciales."
        value={persona.nombre}
        onChange={(e) => alCambiar({ ...persona, nombre: e.target.value })}
        autoComplete="given-name"
        maxLength={60}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        {conFecha ? (
          <CampoFecha
            etiqueta="Fecha de nacimiento"
            max={hoyISO()}
            min="1900-01-01"
            vistaInicial={haceAnios(18)}
            value={persona.fechaNacimiento}
            onChange={(v) => alCambiar({ ...persona, fechaNacimiento: v })}
            required
          />
        ) : (
          <Campo
            etiqueta="Edad"
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            value={persona.edad}
            onChange={(e) => alCambiar({ ...persona, edad: e.target.value })}
            required
          />
        )}
        <Selector
          etiqueta="Género"
          value={persona.genero}
          onChange={(e) => alCambiar({ ...persona, genero: e.target.value as Genero })}
          required
        >
          <option value="" disabled>
            Elige…
          </option>
          {Object.entries(GENEROS).map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </Selector>
      </div>
    </fieldset>
  );
}

/** Con sesión y datos guardados: una tarjeta para confirmar con un toque. */
function ConfirmacionRapida({
  taller,
  datos,
  enviando,
  error,
  alConfirmar,
  alAgregarAcompanantes,
  alUsarOtrosDatos,
  alVerAviso,
}: {
  taller: Taller;
  datos: DatosInscripcion;
  enviando: boolean;
  error: string | null;
  alConfirmar: (consentimientoTutor: boolean) => void;
  alAgregarAcompanantes: () => void;
  alUsarOtrosDatos: () => void;
  alVerAviso: () => void;
}) {
  const [tutor, setTutor] = useState(false);
  const edad = edadEnFecha(datos.fechaNacimiento, taller.fechaInicio);
  const permitida = edad !== null && edadPermitida(edad, taller.edadMin, taller.edadMax);
  const menor = edad !== null && edad < 18;

  return (
    <section aria-labelledby="t-confirmar" className="tarjeta flex flex-col gap-4 p-5" style={{ animation: 'entrar-suave 320ms var(--curva-liquida) both' }}>
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-marca/10 text-marca">
          <UserCheck aria-hidden className="size-6" />
        </span>
        <div>
          <h2 id="t-confirmar" className="text-xl leading-tight font-bold">
            Te inscribes como {datos.nombre}
          </h2>
          <p className="text-sm text-tenue">
            {edad !== null ? `${edad} años` : 'Edad sin calcular'} · {GENEROS[datos.genero]}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2 rounded-xl bg-hundido p-3 text-sm">
        <li className="flex items-center gap-2">
          <CalendarDays aria-hidden className="size-4 shrink-0 text-marca" />
          {formatearFecha(taller.fechaInicio)} · {taller.horario}
        </li>
        <li className="flex items-center gap-2">
          <MapPin aria-hidden className="size-4 shrink-0 text-marca" />
          {taller.recintoNombre}
        </li>
      </ul>

      {!permitida && (
        <Alerta tono="error">
          Esta actividad es para personas {describirRangoTaller(taller.edadMin, taller.edadMax).toLowerCase()} y tú tendrás{' '}
          {edad ?? '?'} años ese día. Si vas a inscribir a alguien más, usa otros datos.
        </Alerta>
      )}

      {permitida && menor && (
        <Casilla
          checked={tutor}
          onChange={(e) => setTutor(e.target.checked)}
          etiqueta={
            <>
              <strong>Eres menor de edad.</strong> Declaro que soy su madre, padre o tutor y autorizo el tratamiento de sus datos.
            </>
          }
        />
      )}

      {error && <Alerta tono="error">{error}</Alerta>}

      <Boton
        variante="acento"
        tamano="lg"
        cargando={enviando}
        disabled={!permitida || (menor && !tutor)}
        onClick={() => alConfirmar(menor && tutor)}
        icono={<ShieldCheck aria-hidden className="size-5" />}
      >
        {enviando ? 'Generando pase…' : 'Confirmar inscripción'}
      </Boton>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Boton variante="secundario" onClick={alAgregarAcompanantes} icono={<Plus aria-hidden className="size-5" />} disabled={enviando}>
          Agregar acompañantes
        </Boton>
        <Boton variante="fantasma" onClick={alUsarOtrosDatos} disabled={enviando}>
          Usar otros datos
        </Boton>
      </div>

      <p className="text-xs text-tenue">
        Al confirmar aplicas el{' '}
        <button type="button" onClick={alVerAviso} className="font-semibold text-marca underline">
          aviso de privacidad
        </button>
        . Cambia o borra tus datos guardados en{' '}
        <Link to="/mis-datos" className="font-semibold text-marca underline">
          Mis datos
        </Link>
        .
      </p>
    </section>
  );
}

export default function InscripcionPage() {
  const { id = '' } = useParams();
  const navegar = useNavigate();
  const { usuario } = useAuth();
  const uid = usuario?.id ?? null;
  const taller = useSuscripcion<Taller | null>((cb) => suscribirTaller(id, cb), [id]);

  // Con sesión: datos guardados y si ya tiene pase para esta actividad (undefined = cargando)
  const [datos, setDatos] = useState<DatosInscripcion | null | undefined>(uid ? undefined : null);
  const [paseExistente, setPaseExistente] = useState<string | null | undefined>(uid ? undefined : null);
  const [modo, setModo] = useState<'rapido' | 'formulario'>('rapido');

  const [titular, setTitular] = useState<PersonaForm>(personaVacia);
  const [acompanantes, setAcompanantes] = useState<PersonaForm[]>([]);
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [telefono, setTelefono] = useState('');
  const [aceptoAviso, setAceptoAviso] = useState(false);
  const [consentimientoTutor, setConsentimientoTutor] = useState(false);
  const [guardarDatos, setGuardarDatos] = useState(true);
  const [verAviso, setVerAviso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setDatos(null);
      setPaseExistente(null);
      return;
    }
    let vigente = true;
    void Promise.all([obtenerDatosInscripcion(uid).catch(() => null), miPaseEn(id, uid)]).then(([d, p]) => {
      if (!vigente) return;
      setDatos(d);
      setPaseExistente(p);
      if (d) {
        setTitular((t) => ({ ...t, nombre: d.nombre, fechaNacimiento: d.fechaNacimiento, genero: d.genero }));
        setTelefono(d.telefono ?? '');
      }
    });
    return () => {
      vigente = false;
    };
  }, [uid, id]);

  if (taller === undefined || datos === undefined || paseExistente === undefined) return <Cargando />;

  const volver = (
    <Link to={`/taller/${id}`} className="toque inline-flex w-fit items-center gap-2 font-semibold text-marca">
      <ArrowLeft aria-hidden className="size-5" /> Volver
    </Link>
  );

  if (paseExistente) {
    return (
      <div className="flex flex-col gap-5">
        {volver}
        <Vacio icono={Ticket} titulo="Ya tienes un pase para esta actividad">
          <EnlaceBoton to={`/pase/${paseExistente}`} variante="acento">
            Ver mi pase
          </EnlaceBoton>
        </Vacio>
      </div>
    );
  }

  if (!taller || !estaVigente(taller)) {
    return (
      <Vacio icono={UserPlus} titulo="Esta actividad ya no admite inscripciones">
        <Link to="/" className="font-semibold text-marca underline">
          Ver otras actividades
        </Link>
      </Vacio>
    );
  }

  const conCuenta = uid !== null;
  const edadTitular = (p: PersonaForm) =>
    conCuenta ? (edadEnFecha(p.fechaNacimiento, taller.fechaInicio) ?? Number.NaN) : Number(p.edad);
  const todas = [titular, ...acompanantes];
  const edades = [edadTitular(titular), ...acompanantes.map((a) => Number(a.edad))];
  const hayMenores = todas.some((p, i) => (i === 0 && conCuenta ? p.fechaNacimiento !== '' : p.edad !== '') && edades[i]! < 18);
  const libres = cuposDisponibles(taller);

  const confirmar = async (persona: { nombre: string; edad: number; genero: Genero }, extra: {
    acompanantes: Array<{ nombre: string; edad: number; genero: Genero }>;
    contacto: { email: string; telefono: string };
    aceptoAvisoPrivacidad: boolean;
    consentimientoTutor: boolean;
  }) => {
    setError(null);
    setEnviando(true);
    try {
      const ins = await inscribir({ tallerId: taller.id, titular: persona, uidCiudadano: uid, ...extra });
      guardarPaseLocal(ins.id);
      navegar(`/pase/${ins.id}`, { replace: true, state: { nuevo: true } });
      return true;
    } catch (err) {
      setError(err instanceof ErrorInscripcion || err instanceof Error ? err.message : 'No se pudo completar la inscripción.');
      setEnviando(false);
      return false;
    }
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (todas.some((p) => !p.genero)) {
      setError('Selecciona el género de cada persona (puedes elegir "Prefiero no decir").');
      return;
    }
    if (conCuenta && Number.isNaN(edades[0]!)) {
      setError('Revisa tu fecha de nacimiento.');
      return;
    }
    const aPersona = (p: PersonaForm, i: number) => ({ nombre: p.nombre, edad: edades[i]!, genero: p.genero as Genero });
    const ok = await confirmar(aPersona(titular, 0), {
      acompanantes: acompanantes.map((a, i) => aPersona(a, i + 1)),
      contacto: { email, telefono },
      aceptoAvisoPrivacidad: aceptoAviso,
      consentimientoTutor: hayMenores && consentimientoTutor,
    });
    // Solo con permiso, y después de tener el pase (si falla, el pase ya está hecho)
    if (ok && uid && guardarDatos) {
      void guardarDatosInscripcion(uid, {
        nombre: titular.nombre,
        fechaNacimiento: titular.fechaNacimiento,
        genero: titular.genero as Genero,
        telefono: telefono || null,
      }).catch(() => undefined);
    }
  };

  const encabezado = (
    <header>
      <p className="text-sm font-semibold text-tenue">Inscripción</p>
      <h1 className="text-2xl leading-tight font-bold">{taller.titulo}</h1>
      <p className="mt-1 text-sm text-tenue">
        {describirRangoTaller(taller.edadMin, taller.edadMax)} · {libres} lugares disponibles
      </p>
    </header>
  );

  const modalAviso = (
    <Modal abierto={verAviso} alCerrar={() => setVerAviso(false)} titulo="Aviso de privacidad simplificado">
      <AvisoPrivacidadSimplificado />
      <p className="mt-4 text-sm">
        <Link to="/aviso-privacidad" target="_blank" className="font-semibold text-marca underline">
          Leer el aviso integral<span className="solo-lectores"> (se abre en otra pestaña)</span>
        </Link>
      </p>
      <Boton
        className="mt-5 w-full"
        onClick={() => {
          setAceptoAviso(true);
          setVerAviso(false);
        }}
      >
        Entendido, acepto
      </Boton>
    </Modal>
  );

  // Con datos guardados: confirmar con un toque
  if (datos && modo === 'rapido') {
    return (
      <div className="flex flex-col gap-5">
        {volver}
        {encabezado}
        <ConfirmacionRapida
          taller={taller}
          datos={datos}
          enviando={enviando}
          error={error}
          alVerAviso={() => setVerAviso(true)}
          alConfirmar={(tutor) =>
            void confirmar(
              { nombre: datos.nombre, edad: edadEnFecha(datos.fechaNacimiento, taller.fechaInicio)!, genero: datos.genero },
              {
                acompanantes: [],
                contacto: { email: usuario?.email ?? '', telefono: datos.telefono ?? '' },
                aceptoAvisoPrivacidad: true,
                consentimientoTutor: tutor,
              },
            )
          }
          alAgregarAcompanantes={() => {
            setError(null);
            setModo('formulario');
            setAceptoAviso(true);
            setAcompanantes([personaVacia()]);
          }}
          alUsarOtrosDatos={() => {
            setError(null);
            setModo('formulario');
            setTitular(personaVacia());
            setGuardarDatos(false);
          }}
        />
        {modalAviso}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {volver}
      {encabezado}

      <Alerta tono="info">
        {conCuenta ? (
          <p>
            Llena tus datos una vez y, si lo autorizas, la próxima vez te inscribes <strong>con un solo toque</strong>.
          </p>
        ) : (
          <p>
            <strong>No necesitas cuenta.</strong> Pedimos lo mínimo: un nombre (puede ser parcial), edad y género, solo para
            estadísticas. Tu pase quedará guardado en este dispositivo.
          </p>
        )}
      </Alerta>

      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate={false}>
        <FormPersona persona={titular} titulo="Asistente principal" alCambiar={setTitular} conFecha={conCuenta} />

        {acompanantes.map((a, i) => (
          <FormPersona
            key={a.clave}
            persona={a}
            titulo={`Acompañante ${i + 1}`}
            alCambiar={(p) => setAcompanantes((l) => l.map((x) => (x.clave === a.clave ? p : x)))}
            alQuitar={() => setAcompanantes((l) => l.filter((x) => x.clave !== a.clave))}
          />
        ))}

        {acompanantes.length < MAX_ACOMPANANTES && acompanantes.length + 1 < libres && (
          <Boton
            variante="secundario"
            icono={<Plus aria-hidden className="size-5" />}
            onClick={() => setAcompanantes((l) => [...l, personaVacia()])}
          >
            Agregar acompañante ({acompanantes.length}/{MAX_ACOMPANANTES})
          </Boton>
        )}

        <fieldset className="tarjeta flex flex-col gap-3 p-4">
          <legend className="sr-only">Contacto</legend>
          <p aria-hidden className="font-bold">
            Contacto <span className="font-normal text-tenue">(opcional)</span>
          </p>
          <p className="text-sm text-tenue">Solo para avisarte si la actividad cambia o se cancela.</p>
          <Campo etiqueta="Correo electrónico" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} opcional />
          <Campo
            etiqueta="Teléfono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="10 dígitos"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            opcional
          />
        </fieldset>

        <div className="tarjeta flex flex-col gap-3 p-4">
          {hayMenores && (
            <Casilla
              checked={consentimientoTutor}
              onChange={(e) => setConsentimientoTutor(e.target.checked)}
              required
              etiqueta={
                <>
                  <strong>Hay menores de edad en esta inscripción.</strong> Declaro que soy su madre, padre o tutor y autorizo
                  el tratamiento de sus datos.
                </>
              }
            />
          )}
          <Casilla
            checked={aceptoAviso}
            onChange={(e) => setAceptoAviso(e.target.checked)}
            required
            etiqueta={
              <>
                He leído y acepto el{' '}
                <button type="button" onClick={() => setVerAviso(true)} className="font-semibold text-marca underline">
                  aviso de privacidad
                </button>
                .
              </>
            }
          />
          {conCuenta && (
            <Casilla
              checked={guardarDatos}
              onChange={(e) => setGuardarDatos(e.target.checked)}
              etiqueta={
                <>
                  <strong>Guardar mis datos para inscribirme más rápido.</strong> Solo tú puedes verlos; los cambias o borras en
                  Mis datos.
                </>
              }
            />
          )}
        </div>

        {error && <Alerta tono="error">{error}</Alerta>}

        <Boton type="submit" variante="acento" tamano="lg" cargando={enviando} icono={<ShieldCheck aria-hidden className="size-5" />}>
          {enviando ? 'Generando pase…' : `Obtener mi pase${todas.length > 1 ? ` (${todas.length} personas)` : ''}`}
        </Boton>
      </form>

      {modalAviso}
    </div>
  );
}
