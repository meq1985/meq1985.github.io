import { it, expect } from 'vitest';
import { buildBudgetPdf } from '../src/services/budgetPdf';
import { validateBudget } from '../src/services/budgetValidation';
const profile = { nombre1: 'Martin', apellido1: 'Quiroga', cuit1: '20-12345678-9',
  empresa1: 'Instalaciones Demo', matricula1: 'MAT-123', telefono1: '2964 555123',
  correo: 'electricista@example.com', direccion1: 'Direccion de ejemplo 123' };
const budget = () => ({ ...validateBudget('Cliente Demo', [{ codigo: 'A26-008', descripcion: 'Cableado', unidad: 'tramo de 5 m', cantidad: 2, precioUnitario: 125.25 }]), createdAt: '2026-10-20T01:00:00Z' });
it('generates a professional PDF with all contact, tax, client and price data', async () => {
  const document = await buildBudgetPdf(budget(), profile);
  const blob = document.output('blob');
  expect(blob.type).toBe('application/pdf');
  const pdf = await blob.text();
  for (const text of ['%PDF-', 'Martin Quiroga', '20-12345678-9', 'Instalaciones Demo', 'MAT-123', '2964 555123',
    'electricista@example.com', 'Direccion de ejemplo 123', 'Cliente Demo', 'Cableado', 'A26-008', 'tramo de 5 m', '125,25', '250,50', 'TOTAL MANO DE OBRA', '19/10/2026']) expect(pdf).toContain(text);
  for (const absent of ['undefined', 'NaN', '(null)']) expect(pdf).not.toContain(absent);
  expect(document.getNumberOfPages()).toBe(1);
});
it.each([null, undefined, '', '   '])('omits an unassigned company without printing null or an empty label', async empresa1 => {
  const document = await buildBudgetPdf(budget(), { ...profile, empresa1 });
  const pdf = document.output();
  expect(pdf).not.toContain('Instalaciones Demo'); expect(pdf).not.toContain('Empresa:');
  expect(pdf).not.toContain('(null)'); expect(pdf).not.toContain('undefined');
  expect(pdf).toContain('Martin Quiroga');
});
it('paginates long estimates, repeats table headers and prints the total exactly once', async () => {
  const rows = Array.from({ length: 90 }, (_, index) => ({ codigo: `P-${index}`, descripcion: 'Trabajo detallado de canalizacion y cableado en ambiente residencial con sus conexiones y terminaciones.', unidad: 'boca', cantidad: 2, precioUnitario: 1000.25 }));
  const validated = { ...validateBudget('Cliente con un nombre largo '.repeat(4), rows), createdAt: '2026-10-20T12:00:00Z' };
  const document = await buildBudgetPdf(validated, { ...profile, nombre1: 'Electricista '.repeat(12), empresa1: 'Empresa '.repeat(18), correo: 'contacto.muy.extenso.para.prueba@example.com' });
  expect(document.getNumberOfPages()).toBeGreaterThan(2);
  const pdf = document.output();
  expect(pdf.match(/TOTAL MANO DE OBRA/g)).toHaveLength(1);
  expect(pdf).toContain('180.045,00');
  expect(pdf.match(/\(Importe\)/g)?.length).toBe(document.getNumberOfPages());
});
it('rejects invalid issue dates', async () => {
  await expect(buildBudgetPdf({ ...budget(), createdAt: 'invalid' }, profile)).rejects.toThrow('fecha');
});
