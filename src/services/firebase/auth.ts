/** Autenticación con Firebase Authentication (correo y contraseña) + perfil en usuarios/{uid}. */
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import type { Usuario } from '@/types/models';
import { ErrorAuth, normalizarEmail, validarRegistro } from '../comun/auth';
import { conId, firebase } from './app';

const perfil = (uid: string) => doc(firebase().db, 'usuarios', uid);

function traducir(e: unknown): Error {
  if (e instanceof ErrorAuth) return e;
  const codigo = e instanceof FirebaseError ? e.code : '';
  switch (codigo) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-email':
      // Mismo mensaje para "no existe" y "contraseña incorrecta": no revela qué correos están registrados.
      return new ErrorAuth('Correo o contraseña incorrectos.');
    case 'auth/email-already-in-use':
      return new ErrorAuth('Ya existe una cuenta con ese correo. Inicia sesión.');
    case 'auth/weak-password':
      return new ErrorAuth('La contraseña es muy débil: usa al menos 8 caracteres.');
    case 'auth/too-many-requests':
      return new ErrorAuth('Demasiados intentos. Espera unos minutos y vuelve a intentarlo.');
    case 'auth/network-request-failed':
      return new ErrorAuth('Sin conexión a internet. Revisa tu red e inténtalo de nuevo.');
    case 'auth/user-disabled':
      return new ErrorAuth('Esta cuenta está desactivada.');
    default:
      return new ErrorAuth('No pudimos completar la operación. Inténtalo de nuevo.');
  }
}

/** Llama a `alCambiar` con la persona que tiene sesión (o null) y en cada cambio de su perfil. */
export function suscribirSesion(alCambiar: (u: Usuario | null) => void) {
  const { auth } = firebase();
  let dejarPerfil: (() => void) | null = null;
  const dejarAuth = onAuthStateChanged(auth, (cuenta) => {
    dejarPerfil?.();
    dejarPerfil = null;
    if (!cuenta) return alCambiar(null);
    dejarPerfil = onSnapshot(
      perfil(cuenta.uid),
      (s) => {
        const u = conId<Usuario>(s);
        // Justo al registrarse el perfil puede tardar un instante: se espera al siguiente aviso.
        if (!u && s.metadata.hasPendingWrites) return;
        alCambiar(u?.activo ? u : null);
      },
      () => alCambiar(null),
    );
  });
  return () => {
    dejarPerfil?.();
    dejarAuth();
  };
}

export async function iniciarSesion(emailCrudo: string, password: string): Promise<Usuario> {
  const { auth } = firebase();
  try {
    const { user } = await signInWithEmailAndPassword(auth, normalizarEmail(emailCrudo), password);
    const u = conId<Usuario>(await getDoc(perfil(user.uid)));
    if (!u?.activo) {
      await signOut(auth);
      throw new ErrorAuth(u ? 'Esta cuenta está desactivada.' : 'Esta cuenta no tiene perfil en SICUJ.');
    }
    return u;
  } catch (e) {
    throw traducir(e);
  }
}

export async function registrarCiudadano(nombreCrudo: string, emailCrudo: string, password: string): Promise<Usuario> {
  const { nombre, email } = validarRegistro(nombreCrudo, emailCrudo, password);
  const { auth } = firebase();
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: nombre });
    const usuario: Usuario = { id: user.uid, nombre, email, rol: 'ciudadano', activo: true, creadoEn: Date.now() };
    const { id: _id, ...datos } = usuario;
    await setDoc(perfil(user.uid), datos);
    return usuario;
  } catch (e) {
    throw traducir(e);
  }
}

export async function cerrarSesion() {
  await signOut(firebase().auth);
}
