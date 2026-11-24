/**
 * Flujo completo de la app contra los emuladores (Auth + Firestore) usando los servicios reales.
 * Ejecutar: npm run test:integracion  (necesita Java)
 */
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cerrarSesion, iniciarSesion, registrarCiudadano } from '@/services/firebase/auth';
import { cambiarRol, crearCuentaPersonal, eliminarCuentaDe, eliminarMiCuenta } from '@/services/firebase/cuentas';
import { borrarDatosInscripcion, guardarDatosInscripcion, obtenerDatosInscripcion } from '@/services/firebase/datos';
import { cancelarInscripcion, consultarInscripciones, inscribir, miPaseEn, vincularInscripciones } from '@/services/firebase/inscripciones';
import { listarTalleres } from '@/services/firebase/talleres';
import { cargarDatosEjemplo } from '@/services/firebase/semilla';
import { validarPase, validarPorFolio } from '@/services/firebase/validacion';
import { codificarPase } from '@/utils/id';
import type { InscripcionEntrada } from '@/services/comun/inscripciones';

let env: RulesTestEnvironment;
const clave = 'clave-segura-1';

async function darRol(uid: string, rol: 'admin' | 'staff') {
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), 'usuarios', uid), { rol }, { merge: true });
  });
}

const entrada = (tallerId: string, extra: Partial<InscripcionEntrada> = {}): InscripcionEntrada => ({
  tallerId,
  titular: { nombre: 'Ana G.', edad: 25, genero: 'femenino' },
  acompanantes: [],
  contacto: { email: '', telefono: '' },
  aceptoAvisoPrivacidad: true,
  consentimientoTutor: false,
  uidCiudadano: null,
  ...extra,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'sicuj-pruebas',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
  await env.clearFirestore();
});
afterAll(() => env.cleanup());

describe('SICUJ con Firebase', () => {
  let uidStaff = '';
  let emailStaff = '';
  let tallerId = '';
  let paseId = '';

  it('admin carga los datos de ejemplo', async () => {
    const admin = await registrarCiudadano('Administración', `admin${Date.now()}@x.mx`, clave);
    await darRol(admin.id, 'admin');
    await cargarDatosEjemplo();
    const talleres = await listarTalleres();
    expect(talleres.length).toBeGreaterThan(5);
    expect(talleres.every((t) => t.inscritos === 0)).toBe(true);
    tallerId = talleres.find((t) => t.edadMin === null && t.cupoMaximo >= 10)!.id;
    await cerrarSesion();
  });

  it('una persona sin cuenta se inscribe, cancela y se vuelve a inscribir', async () => {
    const ins = await inscribir(entrada(tallerId, { acompanantes: [{ nombre: 'Leo', edad: 30, genero: 'masculino' }] }));
    expect(ins.personas).toBe(2);
    await cancelarInscripcion(ins.id);
    paseId = (await inscribir(entrada(tallerId))).id;
  });

  it('el personal valida el pase una sola vez', async () => {
    const staff = await registrarCiudadano('Personal', `staff${Date.now()}@x.mx`, clave);
    uidStaff = staff.id;
    emailStaff = staff.email;
    await darRol(uidStaff, 'staff');
    await cerrarSesion();
    await iniciarSesion(staff.email, clave);
    expect((await validarPase(codificarPase(paseId), tallerId, uidStaff)).estado).toBe('valido');
    expect((await validarPase(codificarPase(paseId), tallerId, uidStaff)).estado).toBe('ya_usado');
  });

  it('valida por folio cuando el QR no se puede leer', async () => {
    await cerrarSesion();
    const otro = await inscribir(entrada(tallerId));
    await iniciarSesion(emailStaff, clave);
    expect((await validarPorFolio(otro.folio.replace('-', ''), tallerId, uidStaff)).estado).toBe('valido');
  });

  it('con cuenta: datos guardados, un pase por actividad, cancelar y volver', async () => {
    await cerrarSesion();
    const sinCuenta = await inscribir(entrada(tallerId)); // hecho antes de crear cuenta, en este dispositivo
    const ana = await registrarCiudadano('Ana', `ana${Date.now()}@x.mx`, clave);

    const datos = await guardarDatosInscripcion(ana.id, { nombre: 'Ana', fechaNacimiento: '2001-04-09', genero: 'femenino', telefono: '5512345678' });
    expect(await obtenerDatosInscripcion(ana.id)).toEqual(datos);

    const pase = await inscribir(entrada(tallerId, { uidCiudadano: ana.id }));
    expect(await miPaseEn(tallerId, ana.id)).toBe(pase.id);
    await expect(inscribir(entrada(tallerId, { uidCiudadano: ana.id }))).rejects.toMatchObject({ codigo: 'YA_INSCRITO' });

    // El pase sin cuenta de la misma actividad no se liga: la cuenta ya tiene uno
    await vincularInscripciones([sinCuenta.id], ana.id);
    expect(await miPaseEn(tallerId, ana.id)).toBe(pase.id);

    await cancelarInscripcion(pase.id);
    expect(await miPaseEn(tallerId, ana.id)).toBeNull();
    await vincularInscripciones([sinCuenta.id], ana.id);
    expect(await miPaseEn(tallerId, ana.id)).toBe(sinCuenta.id);

    await borrarDatosInscripcion(ana.id);
    expect(await obtenerDatosInscripcion(ana.id)).toBeNull();
    await cerrarSesion();
  });

  it('cuentas: admin da de alta y elimina a otra admin; una persona elimina la suya', async () => {
    await cerrarSesion();
    const jefa = await registrarCiudadano('Jefa', `jefa${Date.now()}@x.mx`, clave);
    await darRol(jefa.id, 'admin');

    const { usuario: nueva, contrasenaTemporal } = await crearCuentaPersonal({ nombre: 'Otra admin', email: `otra${Date.now()}@x.mx`, rol: 'admin' });
    expect(contrasenaTemporal).toBeNull(); // la crea ella por correo
    await cambiarRol(nueva.id, 'staff');
    await cambiarRol(nueva.id, 'admin');
    await eliminarCuentaDe(nueva.id);
    await cerrarSesion();

    const leo = await registrarCiudadano('Leo', `leo${Date.now()}@x.mx`, clave);
    const pase = await inscribir(entrada(tallerId, { uidCiudadano: leo.id }));
    await expect(eliminarMiCuenta(leo.id, 'clave-mala')).rejects.toThrow('La contraseña no es correcta.');
    await eliminarMiCuenta(leo.id, clave);
    await expect(iniciarSesion(leo.email, clave)).rejects.toThrow();
    // El pase sigue existiendo, ya sin cuenta
    expect(await miPaseEn(tallerId, leo.id)).toBeNull();
    expect(pase.id).toBeTruthy();
  });

  it('la contraseña incorrecta da un mensaje claro', async () => {
    await cerrarSesion();
    await expect(iniciarSesion('nadie@x.mx', 'mala-clave')).rejects.toThrow('Correo o contraseña incorrectos.');
  });

  it('una persona sin rol no puede consultar inscripciones', async () => {
    await registrarCiudadano('Curiosa', `curiosa${Date.now()}@x.mx`, clave);
    await expect(consultarInscripciones({})).rejects.toThrow();
    await cerrarSesion();
  });

});
