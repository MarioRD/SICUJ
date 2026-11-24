import type { Rol, Usuario } from '@/types/models';
import { ErrorAuth, normalizarEmail } from './auth';

export interface NuevaCuentaEntrada {
  nombre: string;
  email: string;
  rol: Exclude<Rol, 'ciudadano'>;
}

/** Resultado de crear una cuenta del personal: cómo obtiene su contraseña la persona. */
export type CuentaCreada = { usuario: Usuario; contrasenaTemporal: string | null };

export function validarNuevaCuenta(e: NuevaCuentaEntrada) {
  const nombre = e.nombre.trim().replace(/\s+/g, ' ');
  const email = normalizarEmail(e.email);
  if (nombre.length < 2 || nombre.length > 60) throw new ErrorAuth('Escribe un nombre de 2 a 60 caracteres.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ErrorAuth('El correo no es válido.');
  if (e.rol !== 'admin' && e.rol !== 'staff') throw new ErrorAuth('Elige un rol.');
  return { nombre, email, rol: e.rol };
}

/** No se puede dejar el sistema sin ninguna cuenta de administración activa. */
export function verificarNoEsUltimoAdmin(usuarios: Usuario[], uid: string) {
  const objetivo = usuarios.find((u) => u.id === uid);
  if (objetivo?.rol !== 'admin') return;
  const otros = usuarios.filter((u) => u.rol === 'admin' && u.activo && u.id !== uid);
  if (otros.length === 0) throw new ErrorAuth('Es la única cuenta de administración: crea otra antes de quitarle el acceso.');
}

/** Contraseña temporal legible (solo modo local; en Firebase la persona crea la suya por correo). */
export function contrasenaTemporal() {
  const letras = 'abcdefghjkmnpqrstuvwxyz23456789';
  const b = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(b, (x) => letras[x % letras.length]).join('');
}
