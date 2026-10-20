import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { validateBudget } from '../src/services/budgetValidation';
import { saveBudget, listBudgets, deleteBudget } from '../src/services/localBudgets';

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
describe('local persistence', () => {
  it('persists PDF and source data, isolates accounts and refuses cross-account deletion', async () => {
    const budget = validateBudget('Cliente', [row]);
    const first = await saveBudget('user-a', budget, new Blob(['pdf-a']));
    const second = await saveBudget('user-a', budget, new Blob(['pdf-b']));
    expect(first.id).not.toBe(second.id);
    expect(await listBudgets('user-b')).toEqual([]);
    await deleteBudget('user-b', first.id);
    const saved = await listBudgets('user-a');
    expect(saved).toHaveLength(2);
    expect(await saved.find(item => item.id === first.id).pdf.text()).toBe('pdf-a');
    expect(saved[0].items).toEqual(budget.items);
    await deleteBudget('user-a', first.id);
    await deleteBudget('user-a', second.id);
    expect(await listBudgets('user-a')).toEqual([]);
  });
});

it('preserves a custom property type, accepts old budgets without it and limits its length', () => {
  expect(validateBudget('Cliente', [row], '  Depósito industrial  ').tipoInmueble).toBe('Depósito industrial');
  expect(validateBudget('Cliente', [row], null).tipoInmueble).toBeUndefined();
  expect(validateBudget('Cliente', [row]).tipoInmueble).toBeUndefined();
  expect(() => validateBudget('Cliente', [row], 'x'.repeat(81))).toThrow('80 caracteres');
});
