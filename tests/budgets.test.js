import { describe, it, expect } from 'vitest';
import { validateBudget } from '../src/services/budgetValidation';

const row = { descripcion: 'Cableado', cantidad: 3, precioUnitario: 0.1 };
describe('budget validation', () => {
  it('normalizes numeric inputs and rounds currency', () => {
    expect(validateBudget(' Cliente ', [row]).total).toBe(0.3);
    expect(validateBudget(' Cliente ', [row]).cliente).toBe('Cliente');
  });
  it.each([
    { cantidad: 0 }, { cantidad: -1 }, { cantidad: NaN }, { cantidad: Infinity },
    { precioUnitario: null }, { precioUnitario: '' }, { precioUnitario: -1 },
    { precioUnitario: Infinity }, { descripcion: ' ' }, { cantidad: 1e30 }
  ])('rejects invalid line %j', change => {
    expect(() => validateBudget('Cliente', [{ ...row, ...change }])).toThrow();
  });
  it('requires a client and at least one item', () => {
    expect(() => validateBudget(' ', [row])).toThrow();
    expect(() => validateBudget('Cliente', [])).toThrow();
  });
  it('accepts explicitly free items', () => {
    expect(validateBudget('Cliente', [{ ...row, precioUnitario: 0 }]).total).toBe(0);
  });
});
it('preserves a custom property type, accepts old budgets without it and limits its length', () => {
  expect(validateBudget('Cliente', [row], '  Depósito industrial  ').tipoInmueble).toBe('Depósito industrial');
  expect(validateBudget('Cliente', [row], null).tipoInmueble).toBeUndefined();
  expect(validateBudget('Cliente', [row]).tipoInmueble).toBeUndefined();
  expect(() => validateBudget('Cliente', [row], 'x'.repeat(81))).toThrow('80 caracteres');
});
