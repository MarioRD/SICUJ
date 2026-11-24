import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
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
  const paneles = useRef<Record<'entrar' | 'registro', HTMLFormElement | null>>({ entrar: null, registro: null });
  const [alto, setAlto] = useState<number | null>(null);

  // La tarjeta toma el alto del formulario visible (y lo sigue si aparece un error)
  useLayoutEffect(() => {
    const panel = paneles.current[modo];
    if (!panel) return;
    const medir = () => setAlto(panel.offsetHeight);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(panel);
    return () => ro.disconnect();
  }, [modo, usuario]);

  const cambiar = (m: 'entrar' | 'registro') => {
    setModo(m);
    setError(null);
  };

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
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 sm:gap-4 lg:grid lg:min-h-[calc(100dvh-10rem)] lg:max-w-5xl lg:grid-cols-[1fr_1.1fr] lg:grid-rows-[1fr_auto_1fr] lg:content-center lg:gap-x-12 lg:gap-y-5">
      <header className="lg:col-start-1 lg:row-start-1 lg:self-end">
        <h1 key={modo} className="text-2xl font-bold sm:text-3xl" style={{ animation: 'entrar-suave 420ms var(--curva-liquida) both' }}>{modo === 'registro' ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
        <p className="text-sm text-tenue sm:text-base">
          Es opcional. Te sirve para ver tus pases en cualquier dispositivo y tu historial de talleres.
        </p>
      </header>

      <div
        className="relative grid grid-cols-2 gap-1 rounded-full border border-linea bg-superficie p-1 lg:col-start-1 lg:row-start-2"
        role="tablist"
        aria-label="Tipo de acceso"
      >
        {/* Pastilla que se desliza bajo la pestaña elegida */}
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc(50%-0.375rem)] rounded-full bg-marca shadow-sm transition-transform duration-500 ease-(--curva-liquida)"
          style={{ transform: modo === 'entrar' ? 'translateX(calc(100% + 0.25rem))' : 'none' }}
        />
        {(['registro', 'entrar'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            id={`pestana-${m}`}
            aria-controls={`panel-${m}`}
            aria-selected={modo === m}
            onClick={() => cambiar(m)}
            className={`relative min-h-11 rounded-full text-sm font-bold transition-colors duration-300 ${modo === m ? 'text-marca-tinta' : 'text-tenue hover:text-tinta'}`}
          >
            {m === 'registro' ? 'Soy nuevo' : 'Ya tengo cuenta'}
          </button>
        ))}
      </div>

      {/* Dos formularios lado a lado: el riel se desliza de uno a otro */}
      <div
        className="tarjeta overflow-hidden rounded-[1.75rem] transition-[height] duration-500 ease-(--curva-liquida) lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-center"
        style={{ height: alto ?? undefined }}
      >
        <div
          className="flex items-start transition-transform duration-[650ms] ease-(--curva-liquida) motion-reduce:transition-none"
          style={{ transform: modo === 'entrar' ? 'translateX(-100%)' : 'none' }}
        >
          {(['registro', 'entrar'] as const).map((m) => (
            <form
              key={m}
              ref={(n) => {
                paneles.current[m] = n;
              }}
              id={`panel-${m}`}
              role="tabpanel"
              aria-labelledby={`pestana-${m}`}
              inert={modo !== m}
              onSubmit={enviar}
              className={`flex w-full shrink-0 flex-col gap-3 p-4 transition-opacity duration-500 sm:gap-4 sm:p-5 ${modo === m ? 'opacity-100' : 'opacity-0'}`}
            >
              {m === 'registro' && (
                <Campo etiqueta="Nombre o alias" autoComplete="nickname" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              )}
              <Campo etiqueta="Correo electrónico" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Campo
                etiqueta="Contraseña"
                type="password"
                autoComplete={m === 'registro' ? 'new-password' : 'current-password'}
                ayuda={m === 'registro' ? 'Mínimo 8 caracteres.' : undefined}
                minLength={m === 'registro' ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {m === 'registro' && (
                <p className="text-xs text-tenue">
                  Al crear tu cuenta aceptas el{' '}
                  <Link to="/aviso-privacidad" className="font-semibold text-marca underline">
                    aviso de privacidad
                  </Link>{' '}
                  y los{' '}
                  <Link to="/terminos" className="font-semibold text-marca underline">
                    términos y condiciones
                  </Link>
                  .
                </p>
              )}
              {error && modo === m && <Alerta tono="error">{error}</Alerta>}
              <Boton type="submit" tamano="lg" cargando={enviando && modo === m}>
                {m === 'registro' ? 'Crear cuenta' : 'Entrar'}
              </Boton>
            </form>
          ))}
        </div>
      </div>

      <p className="lg:col-start-1 lg:row-start-3 lg:self-start flex flex-wrap items-center justify-start gap-x-3 px-1 gap-y-1 text-center text-xs text-tenue sm:text-sm">
        <span>
          ¿Eres personal?{' '}
          <Link to="/admin/login" className="font-semibold text-marca underline">
            Acceso al panel
          </Link>
        </span>
        <Link to="/aviso-privacidad" className="underline">
          Privacidad
        </Link>
        <Link to="/terminos" className="underline">
          Términos
        </Link>
      </p>
    </div>
  );
}
