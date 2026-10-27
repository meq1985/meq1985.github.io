import { it, expect } from 'vitest';
import { emptySketch, encodeSketch, decodeSketch } from '../src/services/sketch';
import { feederLength } from '../src/services/sketchInfrastructure';
import { quoteFromSketch } from '../src/services/sketchQuote';
import { LABOR_CATALOG } from '../src/data/laborCatalog';
export const scene = () => ({ ...emptySketch(), rooms: [{ id: 'room', name: 'Casa', levelId: 'planta-baja', x: 1, y: 1, width: 6, depth: 8, points: [] }], equipment: [
  { id: 'meter', type: 'medidor_tp', name: 'Pilar', levelId: 'planta-baja', x: 0, y: 0, itemId: 'pilar' },
  { id: 'general', type: 'general', name: 'General', levelId: 'planta-baja', x: 6, y: 8, itemId: 'seccional_8' },
  { id: 'sectional', type: 'seccional', name: 'Taller', levelId: 'planta-baja', x: 10, y: 8, itemId: 'seccional_36' },
  ...[1, 2].map(i => ({ id: `earth-${i}`, type: 'jabalina', name: `PAT ${i}`, levelId: 'planta-baja', x: i, y: 0, itemId: 'tp_pat' })),
], feeders: [{ id: 'feed', fromId: 'meter', toId: 'general', bends: [], verticalMeters: 2, itemId: 'subterraneo_tierra' }] });
it('round trips equipment and routes; measures a drawn path plus explicit vertical metres', () => {
  const s = scene(); expect(decodeSketch(encodeSketch(s))).toEqual(s);
  expect(feederLength(s, s.feeders[0])).toBe(15);
  s.feeders[0].bends.push({ x: 0, y: 8 }); expect(feederLength(s, s.feeders[0])).toBe(19);
  s.equipment[1].x = 8; expect(feederLength(s, s.feeders[0])).toBe(21);
});
it('quotes roles and rounds 5m work packages upward, discounting only PAT already included', () => {
  const result = quoteFromSketch(scene(), LABOR_CATALOG);
  expect(result.measurements[0].meters).toBe(15);
  expect(result.rows.find(r => r.descripcion.includes('tramo de 5 m')).cantidad).toBe(3);
  expect(result.rows.filter(r => r.descripcion.includes('Jabalina de protección'))).toHaveLength(1);
  expect(result.warnings.join()).toContain('1 jabalina cubierta');
  expect(result.rows.some(r => r.descripcion.includes('Tablero general'))).toBe(true);
  expect(result.rows.some(r => r.descripcion.includes('Tablero seccional: Taller'))).toBe(true);
});
it('quotes metre items without rounding to 5m and requires explicit measure-only choice', () => {
  const s = scene(); s.feeders[0].itemId = 'mamposteria_comun_metro';
  expect(quoteFromSketch(s, LABOR_CATALOG).rows.find(r => r.descripcion.includes('Alimentación')).cantidad).toBe(15);
  s.feeders[0].itemId = ''; expect(() => quoteFromSketch(s, LABOR_CATALOG)).toThrow('Pilar → General');
  expect(() => quoteFromSketch(s, LABOR_CATALOG)).toThrow('Mano de obra del recorrido');
  expect(() => quoteFromSketch(s, LABOR_CATALOG)).toThrow('Solo medir');
  s.feeders[0].itemId = 'measure-only'; const result = quoteFromSketch(s, LABOR_CATALOG);
  expect(result.warnings.join()).toContain('no incluido en el importe');
  expect(result.rows.some(r => r.descripcion.includes('Alimentación'))).toBe(false);
});
it('rejects orphan routes, role mismatches, repeated endpoints, invalid items and cross-level routes', () => {
  for (const edit of [s => s.feeders[0].toId = 'missing', s => s.equipment[1].type = 'seccional', s => s.feeders.push({ ...s.feeders[0], id: 'repeated' }), s => s.equipment[0].itemId = 'seccional_8', s => { s.levels.push({ id: 'upper', name: 'Alta' }); s.equipment[1].levelId = 'upper'; }, s => s.feeders[0].bends.push({ x: NaN, y: 0 })]) {
    const s = scene(); edit(s); expect(() => encodeSketch(s)).toThrow();
  }
});
it('rejects a principal drawn twice as a package and separately', () => {
  const s = scene(); s.equipment.push({ ...s.equipment[0], id: 'duplicate-tp', type: 'principal', itemId: 'tp_mono' });
  expect(() => quoteFromSketch(s, LABOR_CATALOG)).toThrow('ya incluye tablero principal');
});
