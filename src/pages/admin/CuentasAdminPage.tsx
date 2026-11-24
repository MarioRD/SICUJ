import { KeyRound, Search, Trash2, UserPlus } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Alerta, Cargando, Insignia, Modal } from '@/components/ui/Basicos';
import { Boton } from '@/components/ui/Boton';
import { Campo, Selector } from '@/components/ui/Campo';
import { useAuth } from '@/context/AuthContext';
import { useAvisos } from '@/context/AvisosContext';
import { useSuscripcion } from '@/hooks/useSuscripcion';
import { EncabezadoPagina } from '@/layouts/AdminLayout';
import { usarFirebase } from '@/services/config';
import { cambiarRol, crearCuentaPersonal, eliminarCuentaDe, suscribirUsuarios, type CuentaCreada } from '@/services/cuentas.service';
import type { Rol, Usuario } from '@/types/models';
import { formatearFecha } from '@/utils/formatters';

const ROLES: Record<Rol, string> = { admin: 'Administración', staff: 'Personal de acceso', ciudadano: 'Ciudadanía' };
const TONO: Record<Rol, 'marca' | 'ok' | 'neutro'> = { admin: 'marca', staff: 'ok', ciudadano: 'neutro' };

function NuevaCuenta({ alTerminar }: { alTerminar: (c: CuentaCreada) => void }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<'admin' | 'staff'>('staff');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      alTerminar(await crearCuentaPersonal({ nombre, email, rol }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <Campo etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} required />
      <Campo etiqueta="Correo institucional" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Selector etiqueta="Rol" value={rol} onChange={(e) => setRol(e.target.value as 'admin' | 'staff')}>
        <option value="staff">Personal de acceso (solo valida pases)</option>
        <option value="admin">Administración (todo el panel)</option>
      </Selector>
      <p className="text-sm text-tenue">
        {usarFirebase
          ? 'Le enviaremos un correo para que cree su propia contraseña. Nadie más la conoce.'
          : 'Modo local: verás una contraseña temporal para compartirla con la persona.'}
      </p>
      {error && <Alerta tono="error">{error}</Alerta>}
      <Boton type="submit" cargando={enviando} icono={<UserPlus aria-hidden className="size-5" />}>
        Crear cuenta
      </Boton>
    </form>
  );
}

/** Cuentas del personal: crear, cambiar rol y eliminar (incluidas otras cuentas de administración). */
export default function CuentasAdminPage() {
  const { usuario: yo } = useAuth();
  const avisar = useAvisos();
  const usuarios = useSuscripcion(suscribirUsuarios, []);
  const [filtro, setFiltro] = useState<'personal' | 'todas'>('personal');
  const [busqueda, setBusqueda] = useState('');
  const [nueva, setNueva] = useState(false);
  const [creada, setCreada] = useState<CuentaCreada | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (usuarios ?? [])
      .filter((u) => filtro === 'todas' || u.rol !== 'ciudadano')
      .filter((u) => !q || `${u.nombre} ${u.email}`.toLowerCase().includes(q));
  }, [usuarios, filtro, busqueda]);

  if (!usuarios) return <Cargando />;

  const accion = async (u: Usuario, fn: () => Promise<unknown>, exito: string) => {
    setOcupado(u.id);
    try {
      await fn();
      avisar(exito, 'exito');
    } catch (err) {
      avisar(err instanceof Error ? err.message : 'No se pudo completar.', 'error');
    } finally {
      setOcupado(null);
    }
  };

  const eliminar = (u: Usuario) => {
    if (
      !window.confirm(
        `¿Eliminar la cuenta de ${u.nombre} (${u.email})?\n\nYa no podrá entrar a SICUJ y se borran sus datos guardados. Sus pases siguen siendo válidos con su código QR.`,
      )
    )
      return;
    void accion(u, () => eliminarCuentaDe(u.id), `Cuenta de ${u.nombre} eliminada.`);
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Cuentas"
        descripcion="Da de alta al personal, cambia su rol o elimina cuentas que ya no se usan."
        acciones={
          <Boton icono={<UserPlus aria-hidden className="size-4" />} onClick={() => setNueva(true)}>
            Nueva cuenta
          </Boton>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <Campo
            etiqueta="Buscar por nombre o correo"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Selector etiqueta="Mostrar" value={filtro} onChange={(e) => setFiltro(e.target.value as 'personal' | 'todas')}>
          <option value="personal">Solo personal</option>
          <option value="todas">Todas las cuentas</option>
        </Selector>
      </div>

      <section className="tarjeta overflow-x-auto" aria-label="Lista de cuentas">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-linea bg-hundido text-tenue">
            <tr>
              <th scope="col" className="px-5 py-2.5">Persona</th>
              <th scope="col" className="px-3 py-2.5">Rol</th>
              <th scope="col" className="px-3 py-2.5">Alta</th>
              <th scope="col" className="px-5 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => {
              const soyYo = u.id === yo?.id;
              return (
                <tr key={u.id} className="border-b border-linea last:border-0">
                  <th scope="row" className="px-5 py-3 font-normal">
                    <span className="block font-semibold">
                      {u.nombre} {soyYo && <Insignia tono="marca">Tú</Insignia>}
                    </span>
                    <span className="block text-tenue">{u.email}</span>
                  </th>
                  <td className="px-3 py-3">
                    {soyYo ? (
                      <Insignia tono={TONO[u.rol]}>{ROLES[u.rol]}</Insignia>
                    ) : (
                      <select
                        aria-label={`Rol de ${u.nombre}`}
                        value={u.rol}
                        disabled={ocupado === u.id}
                        onChange={(e) => {
                          const rol = e.target.value as Rol;
                          void accion(u, () => cambiarRol(u.id, rol), `${u.nombre} ahora es ${ROLES[rol].toLowerCase()}.`);
                        }}
                        className="min-h-10 rounded-lg border border-linea bg-superficie px-2"
                      >
                        {(Object.keys(ROLES) as Rol[]).map((r) => (
                          <option key={r} value={r}>
                            {ROLES[r]}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-tenue">{formatearFecha(u.creadoEn)}</td>
                  <td className="px-5 py-3 text-right">
                    {!soyYo && (
                      <Boton
                        variante="fantasma"
                        tamano="sm"
                        cargando={ocupado === u.id}
                        onClick={() => eliminar(u)}
                        icono={<Trash2 aria-hidden className="size-4" />}
                      >
                        Eliminar<span className="solo-lectores"> la cuenta de {u.nombre}</span>
                      </Boton>
                    )}
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-tenue">
                  <Search aria-hidden className="mx-auto mb-2 size-5" />
                  No hay cuentas que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <p className="mt-3 text-xs text-tenue">
        Tu propia cuenta se administra desde "Mis datos" en el sitio ciudadano. No se puede quitar el acceso a la última cuenta de
        administración.
      </p>

      <Modal abierto={nueva} alCerrar={() => setNueva(false)} titulo="Nueva cuenta del personal">
        {nueva && (
          <NuevaCuenta
            alTerminar={(c) => {
              setNueva(false);
              setCreada(c);
            }}
          />
        )}
      </Modal>

      <Modal abierto={!!creada} alCerrar={() => setCreada(null)} titulo="Cuenta creada">
        {creada && (
          <div className="flex flex-col gap-3">
            <p>
              <strong>{creada.usuario.nombre}</strong> ya tiene acceso como {ROLES[creada.usuario.rol].toLowerCase()}.
            </p>
            {creada.contrasenaTemporal ? (
              <Alerta tono="aviso">
                <span className="flex items-center gap-2">
                  <KeyRound aria-hidden className="size-4" /> Contraseña temporal:{' '}
                  <code className="font-mono text-base font-bold">{creada.contrasenaTemporal}</code>
                </span>
              </Alerta>
            ) : (
              <Alerta tono="ok">
                Enviamos un correo a <strong>{creada.usuario.email}</strong> para que cree su contraseña. Si no lo ve, que revise
                la carpeta de spam.
              </Alerta>
            )}
            <Boton onClick={() => setCreada(null)}>Listo</Boton>
          </div>
        )}
      </Modal>
    </>
  );
}
