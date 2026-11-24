/**
 * Gestión de cuentas con Firebase.
 *
 * - Crear cuentas del personal: se usa una instancia secundaria de Firebase para no cerrar la
 *   sesión de quien administra; la persona nueva recibe un correo para crear su contraseña.
 * - Eliminar la cuenta de otra persona: se borran su perfil y sus datos; sin el perfil ya no
 *   puede entrar a SICUJ. Borrar también su registro en Authentication requiere Cloud
 *   Functions (plan Blaze) o hacerlo a mano en la consola.
 * - Eliminar la propia cuenta: se confirma la contraseña y se borra todo, incluido el acceso.
 */
import { FirebaseError, deleteApp, initializeApp } from 'firebase/app';
import {
  EmailAuthProvider,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, runTransaction, setDoc, updateDoc, where } from 'firebase/firestore';
import type { Inscripcion, Rol, Usuario } from '@/types/models';
import { ErrorAuth } from '../comun/auth';
import { contrasenaTemporal, validarNuevaCuenta, verificarNoEsUltimoAdmin, type CuentaCreada, type NuevaCuentaEntrada } from '../comun/cuentas';
import { guardarPaseLocal } from '../comun/inscripciones';
import { conId, firebase } from './app';

const porNombre = (a: Usuario, b: Usuario) => a.nombre.localeCompare(b.nombre, 'es');
const usuarios = () => collection(firebase().db, 'usuarios');

export function suscribirUsuarios(alCambiar: (u: Usuario[]) => void) {
  return onSnapshot(
    usuarios(),
    (s) => alCambiar(s.docs.map((d) => conId<Usuario>(d)!).sort(porNombre)),
    () => alCambiar([]),
  );
}

async function listarUsuarios(): Promise<Usuario[]> {
  return (await getDocs(usuarios())).docs.map((d) => conId<Usuario>(d)!);
}

export async function crearCuentaPersonal(entrada: NuevaCuentaEntrada): Promise<CuentaCreada> {
  const { nombre, email, rol } = validarNuevaCuenta(entrada);
  const { app, auth, db } = firebase();
  const secundaria = initializeApp(app.options, `alta-${Date.now()}`);
  const authAlta = getAuth(secundaria);
  if (import.meta.env.VITE_USE_EMULATORS === 'true') connectAuthEmulator(authAlta, 'http://127.0.0.1:9099', { disableWarnings: true });
  try {
    // Contraseña al azar que nadie conoce: la persona crea la suya con el correo
    const { user } = await createUserWithEmailAndPassword(authAlta, email, `${contrasenaTemporal()}A9!`);
    const usuario: Usuario = { id: user.uid, nombre, email, rol, activo: true, creadoEn: Date.now() };
    const { id: _id, ...datos } = usuario;
    await setDoc(doc(db, 'usuarios', user.uid), datos);
    await sendPasswordResetEmail(auth, email);
    return { usuario, contrasenaTemporal: null };
  } catch (e) {
    if (e instanceof FirebaseError && e.code === 'auth/email-already-in-use') {
      throw new ErrorAuth('Ya existe una cuenta con ese correo: búscala en la lista y cámbiale el rol.');
    }
    if (e instanceof FirebaseError && e.code === 'auth/invalid-email') throw new ErrorAuth('El correo no es válido.');
    throw e instanceof ErrorAuth ? e : new ErrorAuth('No se pudo crear la cuenta. Inténtalo de nuevo.');
  } finally {
    await signOut(authAlta).catch(() => undefined);
    await deleteApp(secundaria).catch(() => undefined);
  }
}

export async function cambiarRol(uid: string, rol: Rol) {
  if (rol !== 'admin') verificarNoEsUltimoAdmin(await listarUsuarios(), uid);
  await updateDoc(doc(usuarios(), uid), { rol });
}

/** Desliga los pases de una cuenta (siguen siendo válidos con su QR) y borra sus marcas. */
async function desligarPases(uid: string, guardarEnDispositivo: boolean) {
  const { db } = firebase();
  const pases = await getDocs(query(collection(db, 'inscripciones'), where('uidCiudadano', '==', uid)));
  for (const d of pases.docs) {
    const ins = conId<Inscripcion>(d)!;
    await runTransaction(db, async (tx) => {
      tx.update(d.ref, { uidCiudadano: null });
      tx.delete(doc(db, 'talleres', ins.tallerId, 'cuentas', uid));
    });
    if (guardarEnDispositivo) guardarPaseLocal(ins.id);
  }
}

/** Administración elimina la cuenta de otra persona (incluida otra cuenta de administración). */
export async function eliminarCuentaDe(uid: string) {
  const { db, auth } = firebase();
  if (auth.currentUser?.uid === uid) throw new ErrorAuth('Para eliminar tu propia cuenta usa "Mis datos".');
  verificarNoEsUltimoAdmin(await listarUsuarios(), uid);
  await desligarPases(uid, false);
  await deleteDoc(doc(db, 'datosInscripcion', uid));
  await deleteDoc(doc(db, 'usuarios', uid));
}

/** La persona elimina su propia cuenta. Sus pases siguen funcionando en este dispositivo. */
export async function eliminarMiCuenta(uid: string, password: string) {
  const { db, auth } = firebase();
  const cuenta = auth.currentUser;
  if (!cuenta?.email || cuenta.uid !== uid) throw new ErrorAuth('Vuelve a iniciar sesión e inténtalo de nuevo.');
  try {
    await reauthenticateWithCredential(cuenta, EmailAuthProvider.credential(cuenta.email, password));
  } catch (e) {
    const codigo = e instanceof FirebaseError ? e.code : '';
    if (codigo === 'auth/too-many-requests') throw new ErrorAuth('Demasiados intentos. Espera unos minutos.');
    throw new ErrorAuth('La contraseña no es correcta.');
  }
  const perfil = conId<Usuario>(await getDoc(doc(usuarios(), uid)));
  if (perfil?.rol === 'admin') verificarNoEsUltimoAdmin(await listarUsuarios(), uid);
  await desligarPases(uid, true);
  await deleteDoc(doc(db, 'datosInscripcion', uid));
  await deleteDoc(doc(db, 'usuarios', uid));
  await deleteUser(cuenta);
}
