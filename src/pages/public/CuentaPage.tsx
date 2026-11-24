import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Alerta } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { useAuth } from '@/context/AuthContext';
import { useAvisos } from '@/context/AvisosContext';
import { iniciarSesion, registrarCiudadano } from '@/services/auth.service';
import { pasesLocales, vincularInscripciones } from '@/services/inscripciones.service';

/** Cuenta ciudadana OPCIONAL: sirve para ver los pases en cualquier dispositivo y el historial. */
export default function CuentaPage() {
  const { usuario } = useAuth();
  const avisar = useAvisos();
  const [modo, setModo] = useState<'entrar' | 'registro'>('registro');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Con sesión iniciada ya no hay panel aparte: sus datos viven en las pestañas Mis pases e Historial
  if (usuario) return <Navigate to="/mis-pases" replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const u = modo === 'registro' ? await registrarCiudadano(nombre, email, password) : await iniciarSesion(email, password);
      if (u.rol === 'ciudadano') {
        const locales = pasesLocales();
        if (locales.length) await vincularInscripciones(locales, u.id);
      }
      avisar(modo === 'registro' ? `¡Bienvenida/o, ${u.nombre}! Tus pases quedaron en tu cuenta.` : `Hola de nuevo, ${u.nombre}.`, 'exito');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold">{modo === 'registro' ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
        <p className="text-tenue">
          Es opcional. Te sirve para ver tus pases en cualquier dispositivo y tu historial de talleres.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Tipo de acceso">
        {(['registro', 'entrar'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={modo === m}
            onClick={() => {
              setModo(m);
              setError(null);
            }}
            className={`toque rounded-lg border-2 font-bold ${modo === m ? 'border-marca bg-marca text-marca-tinta' : 'border-linea bg-superficie'}`}
          >
            {m === 'registro' ? 'Soy nuevo' : 'Ya tengo cuenta'}
          </button>
        ))}
      </div>

      <form onSubmit={enviar} className="tarjeta flex flex-col gap-4 p-4">
        {modo === 'registro' && (
          <Campo etiqueta="Nombre o alias" autoComplete="nickname" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        )}
        <Campo etiqueta="Correo electrónico" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Campo
          etiqueta="Contraseña"
          type="password"
          autoComplete={modo === 'registro' ? 'new-password' : 'current-password'}
          ayuda={modo === 'registro' ? 'Mínimo 8 caracteres.' : undefined}
          minLength={modo === 'registro' ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {modo === 'registro' && (
          <p className="text-xs text-tenue">
            Al crear tu cuenta aceptas el{' '}
            <Link to="/aviso-privacidad" className="font-semibold text-marca underline">
              aviso de privacidad
            </Link>
            .
          </p>
        )}
        {error && <Alerta tono="error">{error}</Alerta>}
        <Boton type="submit" tamano="lg" cargando={enviando}>
          {modo === 'registro' ? 'Crear cuenta' : 'Entrar'}
        </Boton>
      </form>

      <p className="text-center text-sm text-tenue">
        ¿Eres personal de la Dirección?{' '}
        <Link to="/admin/login" className="font-semibold text-marca underline">
          Acceso al panel
        </Link>
      </p>
      <p className="text-center text-sm">
        <Link to="/aviso-privacidad" className="text-tenue underline">
          Aviso de privacidad
        </Link>
      </p>
    </div>
  );
}
