import { LockKeyhole } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alerta } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { useAuth } from '@/context/AuthContext';
import { cerrarSesion, iniciarSesion } from '@/services/auth.service';
import { CUENTAS_DEMO } from '@/services/local/seed';

export default function LoginPage() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const { state } = useLocation() as { state: { desde?: string } | null };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario && usuario.rol !== 'ciudadano') return <Navigate to={state?.desde ?? '/admin'} replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const u = await iniciarSesion(email, password);
      if (u.rol === 'ciudadano') {
        await cerrarSesion();
        throw new Error('Esta cuenta no tiene acceso al panel administrativo.');
      }
      navegar(state?.desde ?? (u.rol === 'staff' ? '/admin/validacion' : '/admin'), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
      setEnviando(false);
    }
  };

  return (
    <div className="escala-admin portada-agua grid min-h-dvh place-items-center p-6 text-base">
      <main className="tarjeta flex w-full max-w-[clamp(22rem,32vw,30rem)] flex-col gap-6 overflow-hidden p-8 pt-0 text-tinta shadow-2xl">
        <div className="banda-rebozo -mx-8" aria-hidden />
        <div className="flex items-center gap-4">
          <img
            src="/brand/imjuvec-96.webp"
            srcSet="/brand/imjuvec-96.webp 1x, /brand/imjuvec-192.webp 2x"
            alt="Instituto Municipal de la Juventud de Coacalco"
            width={162}
            height={96}
            className="h-14 w-auto"
          />
          <div className="border-l border-linea pl-4">
            <h1 className="text-2xl leading-tight font-bold">Panel SICUJ</h1>
            <p className="text-sm text-tenue">Dirección de Cultura y Juventud</p>
          </div>
        </div>

        <form onSubmit={enviar} className="flex flex-col gap-4">
          <Campo etiqueta="Correo institucional" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <Campo etiqueta="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <Alerta tono="error">{error}</Alerta>}
          <Boton type="submit" tamano="lg" cargando={enviando} icono={<LockKeyhole aria-hidden className="size-5" />}>
            Entrar
          </Boton>
        </form>

        <Alerta tono="aviso" titulo="Versión de prueba: cuentas demo">
          <ul className="mt-1 flex flex-col gap-1">
            {CUENTAS_DEMO.map((c) => (
              <li key={c.email}>
                <button
                  type="button"
                  className="text-left underline"
                  onClick={() => {
                    setEmail(c.email);
                    setPassword(c.password);
                  }}
                >
                  <strong>{c.rol === 'admin' ? 'Admin' : 'Staff'}:</strong> {c.email} / {c.password}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs">Las cuentas reales se crearán en Firebase Authentication.</p>
        </Alerta>

        <Link to="/" className="text-center text-sm font-semibold text-marca underline">
          Ir al sitio ciudadano
        </Link>
      </main>
    </div>
  );
}
