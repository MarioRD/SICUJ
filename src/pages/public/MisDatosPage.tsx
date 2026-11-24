import { Save, Trash2, UserCheck, UserX } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alerta, Cargando, Modal } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { Campo, Casilla, Selector } from '@/components/ui/Campo';
import { CampoFecha } from '@/components/ui/CampoFecha';
import { useAuth } from '@/context/AuthContext';
import { useAvisos } from '@/context/AvisosContext';
import { eliminarMiCuenta } from '@/services/cuentas.service';
import { borrarDatosInscripcion, guardarDatosInscripcion, obtenerDatosInscripcion } from '@/services/datos.service';
import { GENEROS, type DatosInscripcion, type Genero } from '@/types/models';
import { edadEnFecha } from '@/utils/rangosEdad';

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Confirma con la contraseña y borra la cuenta; los pases siguen en este dispositivo. */
function EliminarCuenta({ uid, alTerminar }: { uid: string; alTerminar: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [password, setPassword] = useState('');
  const [entiendo, setEntiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await eliminarMiCuenta(uid, password);
      alTerminar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la cuenta.');
      setEnviando(false);
    }
  };

  return (
    <section aria-labelledby="t-eliminar" className="tarjeta flex flex-col gap-3 border-error/30 p-5">
      <h2 id="t-eliminar" className="flex items-center gap-2 text-xl font-bold">
        <UserX aria-hidden className="size-5 text-error" /> Eliminar mi cuenta
      </h2>
      <p className="text-sm text-tenue">
        Borramos tu cuenta, tus datos guardados y tu acceso. Tus pases siguen funcionando con su código QR en este dispositivo.
      </p>
      <Boton variante="fantasma" className="w-fit text-error!" onClick={() => setAbierto(true)} icono={<Trash2 aria-hidden className="size-5" />}>
        Eliminar mi cuenta
      </Boton>
      <Modal abierto={abierto} alCerrar={() => setAbierto(false)} titulo="¿Eliminar tu cuenta?">
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <ul className="list-disc pl-5 text-sm">
            <li>Se borran tu cuenta, tu nombre, correo y datos de inscripción rápida.</li>
            <li>Tus pases no se cancelan: los verás en "Mis pases" de este dispositivo.</li>
            <li>No se puede deshacer. Si vuelves, podrás crear una cuenta nueva.</li>
          </ul>
          <Campo
            etiqueta="Escribe tu contraseña para confirmar"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Casilla checked={entiendo} onChange={(e) => setEntiendo(e.target.checked)} etiqueta="Entiendo que no se puede deshacer." />
          {error && <Alerta tono="error">{error}</Alerta>}
          <Boton type="submit" variante="peligro" cargando={enviando} disabled={!entiendo || !password}>
            Sí, eliminar mi cuenta
          </Boton>
        </form>
      </Modal>
    </section>
  );
}

/** Datos guardados para inscribirse con un toque: verlos, cambiarlos o borrarlos. */
export default function MisDatosPage() {
  const { usuario } = useAuth();
  const avisar = useAvisos();
  const navegar = useNavigate();
  const uid = usuario?.id ?? null;
  const [datos, setDatos] = useState<DatosInscripcion | null | undefined>(undefined);
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [genero, setGenero] = useState<Genero | ''>('');
  const [telefono, setTelefono] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    void obtenerDatosInscripcion(uid)
      .catch(() => null)
      .then((d) => {
        setDatos(d);
        setNombre(d?.nombre ?? usuario?.nombre ?? '');
        setFecha(d?.fechaNacimiento ?? '');
        setGenero(d?.genero ?? '');
        setTelefono(d?.telefono ?? '');
      });
  }, [uid, usuario?.nombre]);

  if (!usuario) return <Navigate to="/cuenta" replace />;
  if (datos === undefined) return <Cargando />;

  const edad = fecha ? edadEnFecha(fecha) : null;

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOcupado(true);
    try {
      const d = await guardarDatosInscripcion(usuario.id, { nombre, fechaNacimiento: fecha, genero: genero as Genero, telefono: telefono || null });
      setDatos(d);
      avisar('Tus datos quedaron guardados. Ya puedes inscribirte con un toque.', 'exito');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar.');
    } finally {
      setOcupado(false);
    }
  };

  const borrar = async () => {
    if (!window.confirm('¿Borrar tus datos guardados? Tus pases no se cancelan; solo tendrás que llenar el formulario la próxima vez.')) return;
    setOcupado(true);
    try {
      await borrarDatosInscripcion(usuario.id);
      setDatos(null);
      setFecha('');
      setGenero('');
      setTelefono('');
      avisar('Borramos tus datos guardados.', 'exito');
    } catch {
      avisar('No se pudieron borrar. Inténtalo de nuevo.', 'error');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl leading-tight font-bold">Mis datos</h1>
        <p className="text-tenue">
          Con estos datos te inscribes con un solo toque. Solo tú puedes verlos: ni el personal del Instituto tiene acceso.
        </p>
      </header>

      {datos ? (
        <Alerta tono="ok">
          <span className="flex items-center gap-2">
            <UserCheck aria-hidden className="size-5 shrink-0" /> Inscripción rápida activada.
          </span>
        </Alerta>
      ) : (
        <Alerta tono="info">Aún no tienes datos guardados. Llénalos aquí o en tu próxima inscripción.</Alerta>
      )}

      <form onSubmit={guardar} className="tarjeta flex flex-col gap-4 p-5">
        <Campo
          etiqueta="Nombre"
          ayuda="Basta con tu nombre de pila o iniciales."
          autoComplete="given-name"
          maxLength={60}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoFecha
            etiqueta="Fecha de nacimiento"
            min="1900-01-01"
            max={hoyISO()}
            vistaInicial={`${new Date().getFullYear() - 18}-01-01`}
            ayuda={edad !== null ? `Tienes ${edad} años. Calculamos tu edad al día de cada evento.` : 'Calculamos tu edad al día de cada evento.'}
            value={fecha}
            onChange={setFecha}
            required
          />
          <Selector etiqueta="Género" value={genero} onChange={(e) => setGenero(e.target.value as Genero)} required>
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
        <Campo
          etiqueta="Teléfono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="10 dígitos"
          ayuda="Solo para avisarte si una actividad cambia o se cancela."
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          opcional
        />
        {error && <Alerta tono="error">{error}</Alerta>}
        <div className="flex flex-wrap gap-2">
          <Boton type="submit" cargando={ocupado} icono={<Save aria-hidden className="size-5" />}>
            Guardar
          </Boton>
          {datos && (
            <Boton variante="fantasma" onClick={borrar} disabled={ocupado} icono={<Trash2 aria-hidden className="size-5" />}>
              Borrar mis datos
            </Boton>
          )}
        </div>
      </form>

      <EliminarCuenta
        uid={usuario.id}
        alTerminar={() => {
          avisar('Eliminamos tu cuenta. ¡Gracias por haber sido parte!', 'exito');
          navegar('/', { replace: true });
        }}
      />
    </div>
  );
}
