import { ArrowLeft, Plus, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alerta, Cargando, Modal, Vacio } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { Campo, Casilla, Selector } from '@/components/ui/Campo';
import { AvisoPrivacidadSimplificado } from '@/content/avisoPrivacidad';
import { useAuth } from '@/context/AuthContext';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { ErrorInscripcion, guardarPaseLocal, inscribir } from '@/services/inscripciones.service';
import { cuposDisponibles, estaVigente, suscribirTaller } from '@/services/talleres.service';
import { GENEROS, MAX_ACOMPANANTES, type Genero, type Taller } from '@/types/models';
import { describirRangoTaller } from '@/utils/rangosEdad';

interface PersonaForm {
  clave: number;
  nombre: string;
  edad: string;
  genero: Genero | '';
}

const personaVacia = (): PersonaForm => ({ clave: Math.random(), nombre: '', edad: '', genero: '' });

function FormPersona({
  persona,
  titulo,
  alCambiar,
  alQuitar,
}: {
  persona: PersonaForm;
  titulo: string;
  alCambiar: (p: PersonaForm) => void;
  alQuitar?: () => void;
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

export default function InscripcionPage() {
  const { id = '' } = useParams();
  const navegar = useNavigate();
  const { usuario } = useAuth();
  const taller = useSuscripcion<Taller | null>((cb) => suscribirTaller(id, cb), [id]);

  const [titular, setTitular] = useState<PersonaForm>(personaVacia);
  const [acompanantes, setAcompanantes] = useState<PersonaForm[]>([]);
  const [email, setEmail] = useState(usuario?.rol === 'ciudadano' ? usuario.email : '');
  const [telefono, setTelefono] = useState('');
  const [aceptoAviso, setAceptoAviso] = useState(false);
  const [consentimientoTutor, setConsentimientoTutor] = useState(false);
  const [verAviso, setVerAviso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (taller === undefined) return <Cargando />;
  if (!taller || !estaVigente(taller)) {
    return (
      <Vacio icono={UserPlus} titulo="Esta actividad ya no admite inscripciones">
        <Link to="/" className="font-semibold text-marca underline">
          Ver otras actividades
        </Link>
      </Vacio>
    );
  }

  const todas = [titular, ...acompanantes];
  const hayMenores = todas.some((p) => p.edad !== '' && Number(p.edad) < 18);
  const libres = cuposDisponibles(taller);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (todas.some((p) => !p.genero)) {
      setError('Selecciona el género de cada persona (puedes elegir "Prefiero no decir").');
      return;
    }
    setEnviando(true);
    try {
      const aPersona = (p: PersonaForm) => ({ nombre: p.nombre, edad: Number(p.edad), genero: p.genero as Genero });
      const ins = await inscribir({
        tallerId: taller.id,
        titular: aPersona(titular),
        acompanantes: acompanantes.map(aPersona),
        contacto: { email, telefono },
        aceptoAvisoPrivacidad: aceptoAviso,
        consentimientoTutor: hayMenores && consentimientoTutor,
        uidCiudadano: usuario?.rol === 'ciudadano' ? usuario.id : null,
      });
      guardarPaseLocal(ins.id);
      navegar(`/pase/${ins.id}`, { replace: true, state: { nuevo: true } });
    } catch (err) {
      setError(err instanceof ErrorInscripcion || err instanceof Error ? err.message : 'No se pudo completar la inscripción.');
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Link to={`/taller/${taller.id}`} className="toque inline-flex w-fit items-center gap-2 font-semibold text-marca">
        <ArrowLeft aria-hidden className="size-5" /> Volver
      </Link>
      <header>
        <p className="text-sm font-semibold text-tenue uppercase">Inscripción</p>
        <h1 className="text-2xl leading-tight font-bold">{taller.titulo}</h1>
        <p className="mt-1 text-sm text-tenue">
          {describirRangoTaller(taller.edadMin, taller.edadMax)} · {libres} lugares disponibles
        </p>
      </header>

      <Alerta tono="info">
        <p>
          <strong>No necesitas cuenta.</strong> Pedimos lo mínimo: un nombre (puede ser parcial), edad y género, solo para
          estadísticas. Tu pase quedará guardado en este dispositivo.
        </p>
      </Alerta>

      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate={false}>
        <FormPersona persona={titular} titulo="Asistente principal" alCambiar={setTitular} />

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
        </div>

        {error && <Alerta tono="error">{error}</Alerta>}

        <Boton type="submit" variante="acento" tamano="lg" cargando={enviando} icono={<ShieldCheck aria-hidden className="size-5" />}>
          {enviando ? 'Generando pase…' : `Obtener mi pase${todas.length > 1 ? ` (${todas.length} personas)` : ''}`}
        </Boton>
      </form>

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
    </div>
  );
}
