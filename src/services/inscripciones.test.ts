import { beforeEach, describe, expect, it } from 'vitest';
import type { Recinto, Taller } from '@/types/models';
import { codificarPase } from '@/utils/id';
import { almacen } from './local/store';
import { sembrarDatosDemo } from './local/seed';
import { ErrorInscripcion, cancelarInscripcion, inscribir, type InscripcionEntrada } from './inscripciones.service';
import { validarPase } from './validacion.service';

const taller = (id: string) => almacen.obtener<Taller>('talleres', id)!;

function entrada(tallerId: string, extra: Partial<InscripcionEntrada> = {}): InscripcionEntrada {
  return {
    tallerId,
    titular: { nombre: 'Ana G.', edad: 25, genero: 'femenino' },
    acompanantes: [],
    contacto: { email: '', telefono: '' },
    aceptoAvisoPrivacidad: true,
    consentimientoTutor: false,
    uidCiudadano: null,
    ...extra,
  };
}

beforeEach(() => {
  almacen.borrarTodo();
  sembrarDatosDemo(almacen);
});

describe('inscribir', () => {
  it('crea el pase y suma titular + acompañantes al contador', async () => {
    const antes = taller('taller-demo-1').inscritos;
    const ins = await inscribir(
      entrada('taller-demo-1', { acompanantes: [{ nombre: 'Luis', edad: 30, genero: 'masculino' }] }),
    );
    expect(ins.id).toMatch(/^[A-Za-z0-9]{20}$/);
    expect(ins.personas).toBe(2);
    expect(taller('taller-demo-1').inscritos).toBe(antes + 2);
  });

  it('rechaza cuando el grupo no cabe en el cupo y no modifica nada', async () => {
    // taller-demo-1: cupo 20, 14 inscritos → quedan 6
    const grupo = Array.from({ length: 4 }, (_, i) => ({ nombre: `P${i}`, edad: 20, genero: 'femenino' as const }));
    await inscribir(entrada('taller-demo-1', { acompanantes: grupo })); // 5 → quedan 1
    await expect(
      inscribir(entrada('taller-demo-1', { acompanantes: [{ nombre: 'Extra', edad: 20, genero: 'masculino' }] })),
    ).rejects.toMatchObject({ codigo: 'SIN_CUPO' });
    expect(taller('taller-demo-1').inscritos).toBe(19);
  });

  it('rechaza si el taller está lleno', async () => {
    await expect(inscribir(entrada('taller-demo-2', { titular: { nombre: 'Niño', edad: 10, genero: 'masculino' }, consentimientoTutor: true }))).rejects.toMatchObject({
      codigo: 'SIN_CUPO',
    });
  });

  it('valida la edad de cada persona', async () => {
    // taller-demo-1 requiere 10+
    await expect(
      inscribir(
        entrada('taller-demo-1', {
          acompanantes: [{ nombre: 'Peque', edad: 7, genero: 'femenino' }],
          consentimientoTutor: true,
        }),
      ),
    ).rejects.toMatchObject({ codigo: 'EDAD_NO_PERMITIDA' });
  });

  it('exige consentimiento del tutor si hay menores', async () => {
    await expect(
      inscribir(entrada('taller-demo-1', { titular: { nombre: 'Teo', edad: 12, genero: 'masculino' } })),
    ).rejects.toBeInstanceOf(ErrorInscripcion);
  });

  it('exige aceptar el aviso de privacidad', async () => {
    await expect(inscribir(entrada('taller-demo-1', { aceptoAvisoPrivacidad: false }))).rejects.toMatchObject({
      codigo: 'FALTA_AVISO',
    });
  });

  it('cancelar libera los lugares', async () => {
    const antes = taller('taller-demo-3').inscritos;
    const ins = await inscribir(entrada('taller-demo-3'));
    await cancelarInscripcion(ins.id);
    expect(taller('taller-demo-3').inscritos).toBe(antes);
  });
});

describe('validarPase', () => {
  it('acepta una vez y rechaza el segundo intento', async () => {
    const ins = await inscribir(entrada('taller-demo-3', { acompanantes: [{ nombre: 'Bea', edad: 40, genero: 'femenino' }] }));
    const primero = await validarPase(codificarPase(ins.id), 'taller-demo-3', 'staff-demo');
    expect(primero.estado).toBe('valido');
    expect(taller('taller-demo-3').asistentes).toBe(2);
    expect(almacen.obtener<Recinto>('recintos', ins.recintoId)!.afluenciaTotal).toBe(2);

    const segundo = await validarPase(codificarPase(ins.id), 'taller-demo-3', 'staff-demo');
    expect(segundo.estado).toBe('ya_usado');
    expect(taller('taller-demo-3').asistentes).toBe(2);
  });

  it('rechaza pases de otra actividad, inexistentes o con formato inválido', async () => {
    const ins = await inscribir(entrada('taller-demo-3'));
    expect((await validarPase(codificarPase(ins.id), 'taller-demo-1', 'x')).estado).toBe('otro_evento');
    expect((await validarPase('SICUJ:AAAAAAAAAAAAAAAAAAAA', 'taller-demo-3', 'x')).estado).toBe('no_existe');
    expect((await validarPase('https://ejemplo.com', 'taller-demo-3', 'x')).estado).toBe('formato_invalido');
  });
});
