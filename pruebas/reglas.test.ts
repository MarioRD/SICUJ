/**
 * Pruebas de firestore.rules contra el emulador.
 * Ejecutar: npm run test:reglas  (necesita Java)
 */
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { deleteDoc, doc, getDoc, runTransaction, setDoc, updateDoc, type Firestore } from 'firebase/firestore';

let env: RulesTestEnvironment;
const ahora = Date.now();
const DIA = 86_400_000;

const taller = {
  tipo: 'taller',
  titulo: 'Guitarra',
  descripcion: '',
  categoria: 'musica',
  recintoId: 'r1',
  recintoNombre: 'Casa de Cultura',
  recintoUbicacion: { lat: 19.6, lng: -99.1 },
  instructor: null,
  fechaInicio: ahora + DIA,
  fechaFin: ahora + 5 * DIA,
  horario: '10:00',
  edadMin: null,
  edadMax: null,
  cupoMaximo: 3,
  inscritos: 0,
  asistentes: 0,
  imagenUrl: null,
  costo: 0,
  activo: true,
  creadoEn: ahora,
  actualizadoEn: ahora,
};

const persona = { nombre: 'Ana', edad: 20, rangoEdad: '18-29', genero: 'femenino' };
const inscripcion = (id: string, extra: Record<string, unknown> = {}) => ({
  folio: `${id.slice(0, 4)}-${id.slice(4, 8)}`.toUpperCase(),
  tallerId: 't1',
  tallerTitulo: 'Guitarra',
  tallerFechaInicio: taller.fechaInicio,
  tallerHorario: '10:00',
  recintoId: 'r1',
  recintoNombre: 'Casa de Cultura',
  uidCiudadano: null,
  titular: persona,
  acompanantes: [],
  personas: 1,
  contacto: { email: null, telefono: null },
  aceptoAvisoPrivacidad: true,
  consentimientoTutor: false,
  usado: false,
  usadoEn: null,
  validadoPor: null,
  creadoEn: Date.now(),
  ...extra,
});

/** Lo mismo que hace la app: crea el pase, sube el contador y (con cuenta) crea la marca. */
async function inscribirComo(
  db: Firestore,
  id: string,
  extra: Record<string, unknown> = {},
  sumar?: number,
  { conMarca = true } = {},
) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'talleres', 't1');
    const t = (await tx.get(ref)).data()!;
    const ins = inscripcion(id, extra);
    tx.set(doc(db, 'inscripciones', id), ins);
    tx.update(ref, { inscritos: t.inscritos + (sumar ?? ins.personas), ultimaInscripcion: id });
    if (ins.uidCiudadano && conMarca) tx.set(doc(db, 'talleres', 't1', 'cuentas', ins.uidCiudadano as string), { inscripcionId: id });
  });
}

async function cancelarComo(db: Firestore, id: string, { borrarMarca = true } = {}) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'inscripciones', id);
    const ins = (await tx.get(ref)).data()!;
    const refT = doc(db, 'talleres', ins.tallerId);
    const t = (await tx.get(refT)).data()!;
    tx.update(refT, { inscritos: t.inscritos - ins.personas, ultimaCancelacion: id });
    if (ins.uidCiudadano && borrarMarca) tx.delete(doc(db, 'talleres', ins.tallerId, 'cuentas', ins.uidCiudadano));
    tx.delete(ref);
  });
}

const anonimo = () => env.unauthenticatedContext().firestore() as unknown as Firestore;
const como = (uid: string, email = `${uid}@x.mx`) => env.authenticatedContext(uid, { email }).firestore() as unknown as Firestore;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'sicuj-pruebas',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, 'usuarios', 'admin'), { nombre: 'Admin', email: 'admin@x.mx', rol: 'admin', activo: true, creadoEn: ahora });
    await setDoc(doc(db, 'usuarios', 'staff'), { nombre: 'Staff', email: 'staff@x.mx', rol: 'staff', activo: true, creadoEn: ahora });
    await setDoc(doc(db, 'usuarios', 'ana'), { nombre: 'Ana', email: 'ana@x.mx', rol: 'ciudadano', activo: true, creadoEn: ahora });
    await setDoc(doc(db, 'recintos', 'r1'), { nombre: 'Casa de Cultura', activo: true, afluenciaTotal: 0 });
    await setDoc(doc(db, 'talleres', 't1'), taller);
    await setDoc(doc(db, 'talleres', 'inactivo'), { ...taller, activo: false });
  });
});

describe('cuentas', () => {
  it('una persona se registra como ciudadana', async () => {
    await assertSucceeds(setDoc(doc(como('nuevo'), 'usuarios', 'nuevo'), { nombre: 'Leo', email: 'nuevo@x.mx', rol: 'ciudadano', activo: true, creadoEn: ahora }));
  });
  it('nadie se registra como admin', async () => {
    await assertFails(setDoc(doc(como('nuevo'), 'usuarios', 'nuevo'), { nombre: 'Leo', email: 'nuevo@x.mx', rol: 'admin', activo: true, creadoEn: ahora }));
  });
  it('una ciudadana no puede subirse de rol', async () => {
    await assertFails(updateDoc(doc(como('ana'), 'usuarios', 'ana'), { rol: 'admin' }));
  });
  it('nadie lee perfiles ajenos', async () => {
    await assertFails(getDoc(doc(como('ana'), 'usuarios', 'admin')));
  });
});

describe('catálogo', () => {
  it('el público ve talleres activos pero no los inactivos', async () => {
    await assertSucceeds(getDoc(doc(anonimo(), 'talleres', 't1')));
    await assertFails(getDoc(doc(anonimo(), 'talleres', 'inactivo')));
  });
  it('solo administración crea o edita talleres', async () => {
    await assertFails(updateDoc(doc(como('ana'), 'talleres', 't1'), { titulo: 'Hackeado' }));
    await assertFails(updateDoc(doc(como('staff'), 'talleres', 't1'), { cupoMaximo: 999 }));
    await assertSucceeds(updateDoc(doc(como('admin'), 'talleres', 't1'), { titulo: 'Guitarra 2' }));
  });
});

describe('inscripciones', () => {
  it('sin cuenta se puede inscribir y el contador sube', async () => {
    await assertSucceeds(inscribirComo(anonimo(), 'AAAAAAAAAAAAAAAAAAA1'));
  });
  it('no se puede crear un pase sin subir el contador', async () => {
    await assertFails(setDoc(doc(anonimo(), 'inscripciones', 'AAAAAAAAAAAAAAAAAAA2'), inscripcion('AAAAAAAAAAAAAAAAAAA2')));
  });
  it('no se puede sumar menos personas de las que trae el pase', async () => {
    await assertFails(
      inscribirComo(anonimo(), 'AAAAAAAAAAAAAAAAAAA3', { acompanantes: [persona, persona], personas: 3 }, 1),
    );
  });
  it('no se rebasa el cupo', async () => {
    await inscribirComo(anonimo(), 'AAAAAAAAAAAAAAAAAAA4', { acompanantes: [persona, persona], personas: 3 });
    await assertFails(inscribirComo(anonimo(), 'AAAAAAAAAAAAAAAAAAA5'));
  });
  it('no se puede crear un pase ya usado ni a nombre de otra cuenta', async () => {
    await assertFails(inscribirComo(anonimo(), 'AAAAAAAAAAAAAAAAAAA6', { usado: true }));
    await assertFails(inscribirComo(como('ana'), 'AAAAAAAAAAAAAAAAAAA7', { uidCiudadano: 'otra' }));
    await assertSucceeds(inscribirComo(como('ana'), 'AAAAAAAAAAAAAAAAAAA8', { uidCiudadano: 'ana' }));
  });
  it('no se inscribe a un taller inactivo', async () => {
    const db = anonimo();
    await assertFails(
      runTransaction(db, async (tx) => {
        tx.set(doc(db, 'inscripciones', 'AAAAAAAAAAAAAAAAAAA9'), inscripcion('AAAAAAAAAAAAAAAAAAA9', { tallerId: 'inactivo' }));
        tx.update(doc(db, 'talleres', 'inactivo'), { inscritos: 1, ultimaInscripcion: 'AAAAAAAAAAAAAAAAAAA9' });
      }),
    );
  });
  it('con el ID se ve el pase, pero no se pueden listar todos', async () => {
    await inscribirComo(anonimo(), 'BBBBBBBBBBBBBBBBBBB1');
    await assertSucceeds(getDoc(doc(anonimo(), 'inscripciones', 'BBBBBBBBBBBBBBBBBBB1')));
    const { collection, getDocs } = await import('firebase/firestore');
    await assertFails(getDocs(collection(anonimo(), 'inscripciones')));
  });
  it('cancelar libera el cupo; cancelar sin liberar no se permite', async () => {
    await inscribirComo(anonimo(), 'BBBBBBBBBBBBBBBBBBB2');
    await assertFails(deleteDoc(doc(anonimo(), 'inscripciones', 'BBBBBBBBBBBBBBBBBBB2')));
    await assertSucceeds(cancelarComo(anonimo(), 'BBBBBBBBBBBBBBBBBBB2'));
  });
  it('la persona no puede marcar su propio pase como usado', async () => {
    await inscribirComo(anonimo(), 'BBBBBBBBBBBBBBBBBBB3');
    await assertFails(updateDoc(doc(anonimo(), 'inscripciones', 'BBBBBBBBBBBBBBBBBBB3'), { usado: true }));
  });
  it('vincular un pase sin cuenta a la propia cuenta (con su marca)', async () => {
    await inscribirComo(anonimo(), 'BBBBBBBBBBBBBBBBBBB4');
    const db = como('ana');
    const ref = doc(db, 'inscripciones', 'BBBBBBBBBBBBBBBBBBB4');
    await assertFails(updateDoc(ref, { uidCiudadano: 'otra' }));
    await assertFails(updateDoc(ref, { uidCiudadano: 'ana' })); // sin marca
    await assertSucceeds(
      runTransaction(db, async (tx) => {
        tx.update(ref, { uidCiudadano: 'ana' });
        tx.set(doc(db, 'talleres', 't1', 'cuentas', 'ana'), { inscripcionId: 'BBBBBBBBBBBBBBBBBBB4' });
      }),
    );
  });
});

describe('un pase por cuenta por actividad', () => {
  it('una cuenta no puede apartar dos pases del mismo evento', async () => {
    await assertSucceeds(inscribirComo(como('ana'), 'DDDDDDDDDDDDDDDDDDD1', { uidCiudadano: 'ana' }));
    await assertFails(inscribirComo(como('ana'), 'DDDDDDDDDDDDDDDDDDD2', { uidCiudadano: 'ana' }));
  });
  it('no se puede crear un pase de cuenta sin su marca', async () => {
    await assertFails(inscribirComo(como('ana'), 'DDDDDDDDDDDDDDDDDDD3', { uidCiudadano: 'ana' }, undefined, { conMarca: false }));
  });
  it('nadie crea marcas a nombre de otra cuenta', async () => {
    await assertFails(setDoc(doc(como('leo'), 'talleres', 't1', 'cuentas', 'ana'), { inscripcionId: 'x' }));
  });
  it('un pase de cuenta solo se cancela borrando su marca (y la cuenta vuelve a poder inscribirse)', async () => {
    await inscribirComo(como('ana'), 'DDDDDDDDDDDDDDDDDDD4', { uidCiudadano: 'ana' });
    await assertFails(cancelarComo(anonimo(), 'DDDDDDDDDDDDDDDDDDD4', { borrarMarca: false }));
    await assertSucceeds(cancelarComo(como('ana'), 'DDDDDDDDDDDDDDDDDDD4'));
    await assertSucceeds(inscribirComo(como('ana'), 'DDDDDDDDDDDDDDDDDDD5', { uidCiudadano: 'ana' }));
  });
});

describe('datos guardados', () => {
  const datos = { nombre: 'Ana', fechaNacimiento: '2001-04-09', genero: 'femenino', telefono: null, actualizadoEn: ahora };
  it('la dueña los guarda, lee y borra', async () => {
    const ref = doc(como('ana'), 'datosInscripcion', 'ana');
    await assertSucceeds(setDoc(ref, datos));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(deleteDoc(ref));
  });
  it('nadie más los puede leer, ni administración', async () => {
    await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'datosInscripcion', 'ana'), datos));
    await assertFails(getDoc(doc(como('admin'), 'datosInscripcion', 'ana')));
    await assertFails(getDoc(doc(como('leo'), 'datosInscripcion', 'ana')));
    await assertFails(getDoc(doc(anonimo(), 'datosInscripcion', 'ana')));
  });
  it('se rechazan datos con forma inválida', async () => {
    await assertFails(setDoc(doc(como('ana'), 'datosInscripcion', 'ana'), { ...datos, fechaNacimiento: '9 de abril' }));
    await assertFails(setDoc(doc(como('ana'), 'datosInscripcion', 'ana'), { ...datos, curp: 'XXXX' }));
  });
});

describe('validación en puerta', () => {
  it('el personal valida una vez y suma asistentes', async () => {
    await inscribirComo(anonimo(), 'CCCCCCCCCCCCCCCCCCC1');
    const db = como('staff');
    const validar = () =>
      runTransaction(db, async (tx) => {
        const ref = doc(db, 'inscripciones', 'CCCCCCCCCCCCCCCCCCC1');
        const ins = (await tx.get(ref)).data()!;
        if (ins.usado) throw new Error('ya usado');
        const t = (await tx.get(doc(db, 'talleres', 't1'))).data()!;
        const r = (await tx.get(doc(db, 'recintos', 'r1'))).data()!;
        tx.update(ref, { usado: true, usadoEn: Date.now(), validadoPor: 'staff' });
        tx.update(doc(db, 'talleres', 't1'), { asistentes: t.asistentes + 1 });
        tx.update(doc(db, 'recintos', 'r1'), { afluenciaTotal: r.afluenciaTotal + 1 });
      });
    await assertSucceeds(validar());
    await assertFails(updateDoc(doc(db, 'inscripciones', 'CCCCCCCCCCCCCCCCCCC1'), { usado: true, validadoPor: 'staff' }));
  });
  it('una ciudadana no puede validar pases', async () => {
    await inscribirComo(anonimo(), 'CCCCCCCCCCCCCCCCCCC2');
    await assertFails(updateDoc(doc(como('ana'), 'inscripciones', 'CCCCCCCCCCCCCCCCCCC2'), { usado: true, usadoEn: 1, validadoPor: 'ana' }));
  });
});

describe('gestión de cuentas', () => {
  it('administración da de alta otra cuenta de administración; una ciudadana no', async () => {
    const nueva = { nombre: 'Nuevo admin', email: 'n@x.mx', rol: 'admin', activo: true, creadoEn: ahora };
    await assertSucceeds(setDoc(doc(como('admin'), 'usuarios', 'nuevo'), nueva));
    await assertFails(setDoc(doc(como('ana'), 'usuarios', 'otro'), nueva));
  });
  it('administración elimina la cuenta de otra persona; el personal no', async () => {
    await assertFails(deleteDoc(doc(como('staff'), 'usuarios', 'ana')));
    await assertSucceeds(deleteDoc(doc(como('admin'), 'usuarios', 'staff')));
  });
  it('cada persona puede eliminar su propia cuenta, no la de otra', async () => {
    await assertFails(deleteDoc(doc(como('ana'), 'usuarios', 'staff')));
    await assertSucceeds(deleteDoc(doc(como('ana'), 'usuarios', 'ana')));
  });
  it('al eliminar la cuenta, sus pases se desligan junto con su marca', async () => {
    await inscribirComo(como('ana'), 'EEEEEEEEEEEEEEEEEEE1', { uidCiudadano: 'ana' });
    const db = como('ana');
    const ref = doc(db, 'inscripciones', 'EEEEEEEEEEEEEEEEEEE1');
    await assertFails(updateDoc(ref, { uidCiudadano: null })); // sin borrar la marca
    await assertSucceeds(
      runTransaction(db, async (tx) => {
        tx.update(ref, { uidCiudadano: null });
        tx.delete(doc(db, 'talleres', 't1', 'cuentas', 'ana'));
      }),
    );
  });
  it('nadie desliga pases ajenos salvo administración', async () => {
    await inscribirComo(como('ana'), 'EEEEEEEEEEEEEEEEEEE2', { uidCiudadano: 'ana' });
    const desligar = (db: Firestore) =>
      runTransaction(db, async (tx) => {
        tx.update(doc(db, 'inscripciones', 'EEEEEEEEEEEEEEEEEEE2'), { uidCiudadano: null });
        tx.delete(doc(db, 'talleres', 't1', 'cuentas', 'ana'));
      });
    await assertFails(desligar(como('leo')));
    await assertSucceeds(desligar(como('admin')));
  });
});
