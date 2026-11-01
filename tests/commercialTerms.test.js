import { it, expect } from 'vitest';
import { newCommercialTerms, validateCommercialTerms, validityEnd, displayDate, advanceSummary, localDate } from '../src/services/commercialTerms';
import { projectBudget } from '../src/services/projectValidation';
const terms = () => newCommercialTerms('1234-abcd', '2026-10-31T12:00:00Z');
it('uses an editable stable reference and the Argentine calendar date', () => {
  expect(terms()).toMatchObject({ reference: 'EX-1234ABCD', issuedOn: '2026-10-31', validityDays: 15, advancePercent: 0 });
  expect(localDate('2026-11-01T01:00:00Z')).toBe('2026-10-31');
  expect(displayDate(terms().issuedOn)).toBe('31/10/2026');
});
it('calculates validity using calendar days across months and leap years', () => {
  expect(validityEnd(terms())).toBe('2026-11-15');
  expect(validityEnd({ ...terms(), issuedOn: '2028-02-28', validityDays: 1 })).toBe('2028-02-29');
  expect(validityEnd({ ...terms(), validityDays: 0 })).toBeNull();
  for (const issuedOn of ['2026-02-29', '2026-04-31', 'bad', '2026-13-01', '']) expect(() => validateCommercialTerms({ ...terms(), issuedOn })).toThrow('fecha');
});
it('calculates the advance after cash discount, without deducting it from installments', () => {
  const options = { discountPercent: 10, installments: [{count:3,surchargePercent:20}] };
  expect(advanceSummary(1000, options, {...terms(),advancePercent:30})).toEqual({cashTotal:900,percent:30,advance:270,balance:630});
  expect(advanceSummary(.05, undefined, {...terms(),advancePercent:50})).toMatchObject({advance:.03,balance:.02});
  expect(advanceSummary(1000, undefined, {...terms(),advancePercent:100})).toMatchObject({advance:1000,balance:0});
});
it('rejects invalid percentages, excessive texts and validity ranges', () => {
  for (const patch of [{advancePercent:101},{advancePercent:NaN},{advancePercent:-1},{validityDays:1.5},{validityDays:366},{scope:'x'.repeat(801)},{reference:4},{paymentTerms:null}]) expect(()=>validateCommercialTerms({...terms(),...patch})).toThrow();
});
it('preserves optional terms with budget snapshots and leaves legacy documents untouched', () => {
  const budget = { cliente:'Cliente',createdAt:'2026-10-31T12:00:00Z',items:[{descripcion:'Trabajo',cantidad:1,precioUnitario:1000}] };
  expect(projectBudget(budget)).not.toHaveProperty('commercialTerms');
  const stored = projectBudget({...budget,commercialTerms:{...terms(),scope:' Canalización ',advancePercent:30}});
  expect(stored.commercialTerms.scope).toBe('Canalización');
  expect(stored.total).toBe(1000);
  expect(projectBudget(stored)).toEqual(stored);
});
