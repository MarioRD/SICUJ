/**
 * Autenticación SIMULADA para la versión de prueba.
 * Se reemplaza por Firebase Authentication (email/contraseña) sin cambiar
 * la interfaz que usan AuthContext y las páginas.
 */
import type { Usuario } from '@/types/models';
import { generarId, sha256 } from '@/utils/id';
import { almacen, latencia } from './local/store';

interface Credencial {
  id: string;
  email: string;
  hash: string;
}

const CLAVE_SESION = 'sicuj:sesion';
const oyentes = new Set<(u: Usuario | null) => void>();

const hashContrasena = (email: string, password: string) => sha256(`sicuj|${email}|${password}`);
const normalizarEmail = (e: string) => e.trim().toLowerCase();

function leerSesion(): string | null {
  try {
    return localStorage.getItem(CLAVE_SESION);
  } catch {
    return null;
  }
}

export function usuarioActual(): Usuario | null {
  const uid = leerSesion();
  if (!uid) return null;
  const u = almacen.obtener<Usuario>('usuarios', uid);
  return u?.activo ? u : null;
}

function emitir() {
  const u = usuarioActual();
  for (const o of oyentes) o(u);
}

/** Similar a onAuthStateChanged. */
export function suscribirSesion(alCambiar: (u: Usuario | null) => void) {
  oyentes.add(alCambiar);
  alCambiar(usuarioActual());
  const otraPestana = (e: StorageEvent) => {
    if (e.key === CLAVE_SESION) alCambiar(usuarioActual());
  };
  window.addEventListener('storage', otraPestana);
  return () => {
    oyentes.delete(alCambiar);
    window.removeEventListener('storage', otraPestana);
  };
}

export class ErrorAuth extends Error {}

export async function iniciarSesion(emailCrudo: string, password: string): Promise<Usuario> {
  const email = normalizarEmail(emailCrudo);
  await latencia(300);
  const cred = almacen.listar<Credencial>('credenciales').find((c) => c.email === email);
  // Mismo mensaje para "no existe" y "contraseña incorrecta": no revela qué correos están registrados.
  if (!cred || cred.hash !== (await hashContrasena(email, password))) {
    throw new ErrorAuth('Correo o contraseña incorrectos.');
  }
  const usuario = almacen.obtener<Usuario>('usuarios', cred.id);
  if (!usuario?.activo) throw new ErrorAuth('Esta cuenta está desactivada.');
  localStorage.setItem(CLAVE_SESION, usuario.id);
  emitir();
  return usuario;
}

export async function registrarCiudadano(nombreCrudo: string, emailCrudo: string, password: string): Promise<Usuario> {
  const email = normalizarEmail(emailCrudo);
  const nombre = nombreCrudo.trim();
  if (nombre.length < 2) throw new ErrorAuth('Escribe tu nombre o cómo quieres que te llamemos.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ErrorAuth('El correo no es válido.');
  if (password.length < 8) throw new ErrorAuth('La contraseña debe tener al menos 8 caracteres.');
  await latencia(300);
  if (almacen.listar<Credencial>('credenciales').some((c) => c.email === email)) {
    throw new ErrorAuth('Ya existe una cuenta con ese correo. Inicia sesión.');
  }
  const hash = await hashContrasena(email, password);
  const usuario: Usuario = { id: generarId(), nombre, email, rol: 'ciudadano', activo: true, creadoEn: Date.now() };
  almacen.transaccion((tx) => {
    tx.crear('usuarios', usuario);
    tx.crear('credenciales', { id: usuario.id, email, hash });
  });
  localStorage.setItem(CLAVE_SESION, usuario.id);
  emitir();
  return usuario;
}

export async function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
  emitir();
}
