import { describe, expect, it } from 'vitest';
import type { Usuario } from '@/types/models';
import { validarNuevaCuenta, verificarNoEsUltimoAdmin } from './cuentas';

const u = (id: string, rol: Usuario['rol'], activo = true): Usuario => ({ id, nombre: id, email: `${id}@x.mx`, rol, activo, creadoEn: 0 });

describe('cuentas', () => {
  it('no deja el sistema sin administración', () => {
    expect(() => verificarNoEsUltimoAdmin([u('a', 'admin'), u('b', 'staff')], 'a')).toThrow(/única cuenta/);
    expect(() => verificarNoEsUltimoAdmin([u('a', 'admin'), u('b', 'admin', false)], 'a')).toThrow(/única cuenta/);
    expect(() => verificarNoEsUltimoAdmin([u('a', 'admin'), u('b', 'admin')], 'a')).not.toThrow();
    expect(() => verificarNoEsUltimoAdmin([u('a', 'admin'), u('b', 'staff')], 'b')).not.toThrow();
  });
  it('valida los datos de una cuenta nueva', () => {
    expect(validarNuevaCuenta({ nombre: '  Ana  ', email: ' ANA@X.MX ', rol: 'staff' })).toEqual({ nombre: 'Ana', email: 'ana@x.mx', rol: 'staff' });
    expect(() => validarNuevaCuenta({ nombre: 'Ana', email: 'no-es-correo', rol: 'admin' })).toThrow();
  });
});
