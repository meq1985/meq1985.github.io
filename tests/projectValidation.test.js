import { it, expect } from 'vitest';
import { projectBudget, projectProfile, projectName, validProjectId, validRevision } from '../src/services/projectValidation';
const budget = () => ({ cliente: ' Cliente ', createdAt: '2026-10-21T12:00:00Z', items: [{ descripcion: ' Cableado ', codigo: 101, cantidad: 2, precioUnitario: 1.25 }], total: 999999 });
it('recalculates cloud totals and stores a minimal stable source snapshot', () => {
  const result = projectBudget({ ...budget(), pdf: new Blob(), owner: 'local', tipoInmueble: ' Departamento ' });
  expect(result).toMatchObject({ total: 2.5, cliente: 'Cliente', tipoInmueble: 'Departamento' });
  expect(result.items[0]).toMatchObject({ codigo: '101', descripcion: 'Cableado', precioTotal: 2.5 });
  expect(result).not.toHaveProperty('pdf'); expect(result).not.toHaveProperty('owner');
});
it('rejects malformed, oversized or undated source data', () => {
  expect(() => projectBudget({ ...budget(), items: Array.from({ length: 201 }, () => budget().items[0]) })).toThrow('200');
  expect(() => projectBudget({ ...budget(), createdAt: 'invalid' })).toThrow('fecha');
  expect(() => projectBudget({ ...budget(), cliente: 'x'.repeat(121) })).toThrow('Cliente');
  expect(() => projectBudget({ ...budget(), items: [{ ...budget().items[0], descripcion: 'x'.repeat(1001) }] })).toThrow('Descripción');
});
it('omits unrelated store data and handles null company and authenticated email', () => {
  expect(projectProfile({ nombre1: 'Demo', empresa1: null, correo: 'forged', extra: 'ignored' }, 'owner@example.com')).toEqual({ nombre1: 'Demo', apellido1: '', empresa1: '', cuit1: '', matricula1: '', telefono1: '', direccion1: '', correo: 'owner@example.com' });
});
it('validates project identities and version boundaries', () => {
  expect(projectName('', 'Cliente')).toBe('Cliente');
  expect(() => validProjectId('../other/account')).toThrow(); expect(() => validRevision(0)).toThrow(); expect(() => validRevision(1.5)).toThrow();
});
