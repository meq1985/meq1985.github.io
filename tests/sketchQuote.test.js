import { it, expect } from 'vitest';
import { emptySketch, encodeSketch, decodeSketch } from '../src/services/sketch';
import { emptyQuoteSettings, validateQuoteSettings } from '../src/services/sketchQuoteSettings';
import { quoteFromSketch } from '../src/services/sketchQuote';
import { LABOR_CATALOG } from '../src/data/laborCatalog';
const drawing = () => ({ ...emptySketch(), quote: emptyQuoteSettings(), rooms: [{ id: 'room', levelId: 'planta-baja', name: 'Cocina', x: 0, y: 0, width: 4, depth: 3, points: ['luminaria', 'toma', 'toma', 'llave'].map((type, i) => ({ id: `p${i}`, type, x: 0.5, y: 0.5 })) }] });
it('counts lights and outlets, includes switches and bills at least 30 m² using account prices', () => {
  const entries = LABOR_CATALOG.map(item => ({ ...item, price: item.id === 'boca_completa' ? 100 : item.id === 'proyecto_m2' ? 10 : item.price }));
  const result = quoteFromSketch(drawing(), entries);
  expect(result).toMatchObject({ bocas: 3, area: 30, total: 600 });
  expect(result.rows.map(row => row.codigo)).toEqual(['A26-003', LABOR_CATALOG.find(item => item.id === 'proyecto_m2').code]);
  expect(result.rows).toHaveLength(2);
});
it('uses actual areas above 30 m², sums levels and supports omitting documentation', () => {
  const s = drawing(); s.rooms[0].width = 10; s.rooms[0].depth = 6;
  s.levels.push({ id: 'upper', name: 'Planta alta' }); s.rooms.push({ ...s.rooms[0], id: 'r2', levelId: 'upper', points: [] });
  expect(quoteFromSketch(s, LABOR_CATALOG).area).toBe(120);
  s.quote.includeProject = false; expect(quoteFromSketch(s, LABOR_CATALOG).rows).toHaveLength(1);
});
it('adds selected boards, separate PAT and service exactly once, with additional extension mouths', () => {
  const s = drawing(); Object.assign(s.quote, { board: 'seccional_8', pat: 'tp_pat', service: 'cano', extraBocas: 2 });
  const result = quoteFromSketch(s, LABOR_CATALOG);
  expect(result.bocas).toBe(5); expect(result.rows).toHaveLength(5);
  expect(result.rows.every(row => row.precioUnitario === LABOR_CATALOG.find(item => item.code === row.codigo).price)).toBe(true);
});
it('blocks duplicate principal boards and PAT included in package prices', () => {
  const s = drawing(); s.quote.board = 'tp_mono'; s.quote.pat = 'tp_pat';
  expect(() => quoteFromSketch(s, LABOR_CATALOG)).toThrow('ya incluyen PAT');
  s.quote.pat = ''; s.quote.service = 'pilar'; expect(() => quoteFromSketch(s, LABOR_CATALOG)).toThrow('ya incluye tablero');
  s.quote.board = ''; s.quote.pat = 'pat_servicio'; expect(() => quoteFromSketch(s, LABOR_CATALOG)).toThrow('ya incluyen PAT');
});
it('rejects missing account prices and overlapping rooms instead of guessing quantities or prices', () => {
  expect(() => quoteFromSketch(drawing(), [])).toThrow('Falta un precio');
  const s = drawing(); s.rooms.push({ ...s.rooms[0], id: 'overlap', points: [] });
  expect(() => quoteFromSketch(s, LABOR_CATALOG)).toThrow('superpuestos');
});
it('round trips heights and choices and rejects impossible or malformed settings', () => {
  const s = drawing(); s.quote.heights = { toma: 0.4, llave: 1.1, techo: 2.8 }; s.quote.board = 'tp_tri';
  expect(decodeSketch(encodeSketch(s)).quote).toEqual(s.quote);
  for (const edit of [q => q.heights.toma = -1, q => { q.heights.llave = 1.1; q.heights.techo = 0.1; }, q => q.heights.llave = Infinity, q => q.board = 'anything', q => q.extraBocas = 0.5, q => q.workType = 'reforma']) {
    const input = emptyQuoteSettings(); edit(input); expect(() => validateQuoteSettings(input)).toThrow();
  }
});
