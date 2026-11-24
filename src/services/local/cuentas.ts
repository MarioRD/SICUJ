/** Gestión de cuentas en modo local (sin Firebase). */
import type { Inscripcion, Rol, Usuario } from '@/types/models';
import { generarId, sha256 } from '@/utils/id';
import { ErrorAuth } from '../comun/auth';
import { contrasenaTemporal, validarNuevaCuenta, verificarNoEsUltimoAdmin, type CuentaCreada, type NuevaCuentaEntrada } from '../comun/cuentas';
import { guardarPaseLocal } from '../comun/inscripciones';
import { cerrarSesion } from './auth';
import { almacen, latencia } from './store';

interface Credencial {
  id: string;
  email: string;
  hash: string;
}

const porNombre = (a: Usuario, b: Usuario) => a.nombre.localeCompare(b.nombre, 'es');

export function suscribirUsuarios(alCambiar: (u: Usuario[]) => void) {
  return almacen.suscribir(['usuarios'], () => alCambiar(almacen.listar<Usuario>('usuarios').sort(porNombre)));
}

export async function crearCuentaPersonal(entrada: NuevaCuentaEntrada): Promise<CuentaCreada> {
  const { nombre, email, rol } = validarNuevaCuenta(entrada);
  await latencia(250);
  if (almacen.listar<Credencial>('credenciales').some((c) => c.email === email)) {
    throw new ErrorAuth('Ya existe una cuenta con ese correo: búscala en la lista y cámbiale el rol.');
  }
  const clave = contrasenaTemporal();
  const usuario: Usuario = { id: generarId(), nombre, email, rol, activo: true, creadoEn: Date.now() };
  const hash = await sha256(`sicuj|${email}|${clave}`);
  almacen.transaccion((tx) => {
    tx.crear('usuarios', usuario);
    tx.crear('credenciales', { id: usuario.id, email, hash });
  });
  return { usuario, contrasenaTemporal: clave };
}

export async function cambiarRol(uid: string, rol: Rol) {
  await latencia();
  if (rol !== 'admin') verificarNoEsUltimoAdmin(almacen.listar<Usuario>('usuarios'), uid);
  almacen.transaccion((tx) => tx.actualizar('usuarios', uid, { rol }));
}

/** Administración borra la cuenta de otra persona: perfil, acceso y datos guardados. */
export async function eliminarCuentaDe(uid: string) {
  await latencia();
  verificarNoEsUltimoAdmin(almacen.listar<Usuario>('usuarios'), uid);
  almacen.transaccion((tx) => {
    for (const i of almacen.listar<Inscripcion>('inscripciones')) {
      if (i.uidCiudadano === uid) tx.actualizar('inscripciones', i.id, { uidCiudadano: null });
    }
    tx.eliminar('datosInscripcion', uid);
    tx.eliminar('credenciales', uid);
    tx.eliminar('usuarios', uid);
  });
}

/** La persona borra su propia cuenta. Sus pases siguen funcionando en este dispositivo. */
export async function eliminarMiCuenta(uid: string, password: string) {
  await latencia(300);
  const cred = almacen.obtener<Credencial>('credenciales', uid);
  if (!cred || cred.hash !== (await sha256(`sicuj|${cred.email}|${password}`))) throw new ErrorAuth('La contraseña no es correcta.');
  verificarNoEsUltimoAdmin(almacen.listar<Usuario>('usuarios'), uid);
  for (const i of almacen.listar<Inscripcion>('inscripciones')) if (i.uidCiudadano === uid) guardarPaseLocal(i.id);
  await eliminarCuentaDe(uid);
  await cerrarSesion();
}
