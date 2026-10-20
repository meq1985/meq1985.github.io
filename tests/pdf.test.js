import { it, expect } from 'vitest';
import { buildBudgetPdf } from '../src/services/budgetPdf';
import { validateBudget } from '../src/services/budgetValidation';
it('generates a usable PDF with the validated items, owner and exact total', async () => {
  const budget = validateBudget('Cliente Demo', [{ codigo: 101, descripcion: 'Cableado', unidad: 'tramo de 5 m', cantidad: 2, precioUnitario: 125.25 }]);
  const document = await buildBudgetPdf(budget, { nombre1: 'Demo', apellido1: 'Test', cuit1: '123',
    empresa1: 'Demo', matricula1: 'ABC', telefono1: '555' });
  const blob = document.output('blob');
  expect(blob.type).toBe('application/pdf');
  const pdf = await blob.text();
  expect(pdf.startsWith('%PDF-')).toBe(true);
  expect(pdf).toContain('Cliente Demo');
  expect(pdf).toContain('Cableado');
  expect(pdf).toContain('tramo de 5 m');
  expect(pdf).toContain('250.5');
  expect(pdf).not.toContain('undefined');
  expect(pdf).not.toContain('NaN');
});
