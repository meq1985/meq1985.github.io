import { it, expect } from 'vitest';
import { emptySketch, encodeSketch, decodeSketch } from '../src/services/sketch';
import { emptyQuoteSettings } from '../src/services/sketchQuoteSettings';
import { emptyMaterialNetwork, materialsFromSketch } from '../src/services/materialNetwork';
import { DEFAULT_CALCULATION, calculatedRouteLength, proposeElectrical, selectCable, withAutomaticConductors } from '../src/services/automaticDesign';
const fixture = (count = 1, width = 20) => ({ ...emptySketch(), schema: 2, quote: { ...emptyQuoteSettings(), heights: { toma: 0.3, llave: 1.2, techo: 3 } },
  equipment: [{ id: 'tg', type: 'general', name: 'TG', levelId: 'planta-baja', x: 0, y: 0, itemId: '' }], feeders: [],
  rooms: [{ id: 'room', levelId: 'planta-baja', name: 'Sala', x: 0, y: 0, width, depth: 1, points: Array.from({ length: count }, (_, i) => ({ id: `p${i}`, type: 'toma', x: 1, y: i / count })) }],
  materials: { ...emptyMaterialNetwork(), calculation: { ...DEFAULT_CALCULATION }, routes: Array.from({ length: count }, (_, i) => ({ id: `r${i}`, fromId: 'tg', toId: `p${i}`, feederId: null, kind: 'physical', bends: [], verticalMeters: 0, conduit: '', assignments: [] })) } });
it('adds rises and drops at both ends, with a manual override that is not counted twice', () => {
  const s = fixture(); expect(calculatedRouteLength(s, s.materials.routes[0])).toBeCloseTo(24.2);
  s.materials.routes[0].verticalMeters = 6; expect(calculatedRouteLength(s, s.materials.routes[0])).toBeCloseTo(26);
  s.quote.heights.toma = null; s.materials.routes[0].verticalMeters = 0; expect(calculatedRouteLength(s, s.materials.routes[0])).toBe(null);
});
it('increases cable section with distance and never rounds before selecting', () => {
  const short = proposeElectrical(fixture(1, 10)).circuits.find(c => c.type === 'TUG');
  const long = proposeElectrical(fixture(1, 50)).circuits.find(c => c.type === 'TUG');
  expect(short.section).toBe(2.5); expect(long.section).toBe(6); expect(long.percent).toBeLessThanOrEqual(2);
  expect(selectCable({ current: 10, meters: 10000, minimum: 2.5, breaker: 16, settings: DEFAULT_CALCULATION })).toBe(null);
  const exact = 2 * 10 / 1000 * 10 * 23.7 / 2.5 * 100 / 220;
  expect(selectCable({ current: 10, meters: 10, minimum: 2.5, breaker: 16, settings: { ...DEFAULT_CALCULATION, limitPercent: exact - 1e-9 } }).section).toBe(4);
});
it('splits 16 TUG into circuits of at most 15 and reserves area minimums', () => {
  const result = proposeElectrical(fixture(16));
  const tug = result.circuits.filter(c => c.type === 'TUG');
  expect(tug).toHaveLength(2); expect(tug.flatMap(c => c.pointIds)).toHaveLength(16);
  expect(tug.every(c => c.pointIds.length <= 15)).toBe(true);
  const large = fixture(1, 50); large.rooms[0].depth = 3;
  expect(proposeElectrical(large).circuits.filter(c => c.type === 'TUG')).toHaveLength(3);
});
it('uses drawn graph routes, applies grouping to common conduits and counts conduit only once', () => {
  const s = fixture(16, 5); s.materials.junctions = [{ id: 'j', levelId: 'planta-baja', name: 'Caja', x: 1, y: 0 }];
  s.materials.routes.forEach(r => { r.fromId = 'j'; });
  s.materials.routes.push({ id: 'trunk', fromId: 'tg', toId: 'j', feederId: null, bends: [], verticalMeters: 0, conduit: '', assignments: [] });
  const result = proposeElectrical(s);
  expect(result.circuits.filter(c => c.type === 'TUG').every(c => c.groupFactor === 0.8 && c.section === 2.5)).toBe(true);
  const computed = withAutomaticConductors(s), list = materialsFromSketch(computed);
  expect(computed.materials.routes.find(r => r.id === 'trunk').assignments).toHaveLength(2);
  expect(list.rows.filter(r => r.description.startsWith('Canalización'))).toHaveLength(1);
  expect(s.materials.routes[0].assignments).toEqual([]);
});
it('does not invent paths or zero verticals when points are disconnected or heights are missing', () => {
  const s = fixture(); s.quote.heights.toma = null;
  expect(proposeElectrical(s).pending).toEqual(['p0']);
  expect(withAutomaticConductors(s).materials.routes).toHaveLength(0);
  s.quote.heights.toma = 0.3; s.materials.routes = [];
  expect(proposeElectrical(s).pending).toEqual(['p0']);
});
it('counts automatic vertical metres in the exported takeoff and leaves stored geometry unchanged', () => {
  const s = fixture(), result = materialsFromSketch(withAutomaticConductors(s));
  expect(result.rows.find(r => r.description.startsWith('Conductor Fase')).quantity).toBe(24.2);
  expect(result.rows.find(r => r.description.startsWith('Canalización')).quantity).toBe(24.2);
  expect(s.materials.routes[0].verticalMeters).toBe(0);
  s.materials.routes[0].bends = [{ x: 0, y: 10 }];
  expect(proposeElectrical(s).circuits.find(c => c.type === 'TUG').meters).toBeCloseTo(10 + Math.hypot(20, 10) + 4.2);
});
it('includes the drawn feeder and its voltage drop in the outgoing circuit', () => {
  const s = fixture();
  s.equipment.push({ id: 'tp', type: 'principal', name: 'TP', levelId: 'planta-baja', x: 20, y: 20, itemId: '' });
  s.feeders.push({ id: 'feed', fromId: 'tp', toId: 'tg', bends: [], verticalMeters: 0, itemId: '' });
  s.materials.routes.push({ id: 'fr', fromId: 'tp', toId: 'tg', feederId: 'feed', bends: [], verticalMeters: 0, conduit: '', assignments: [] });
  const result = proposeElectrical(s), feeder = result.feederCircuits[0], c = result.circuits.find(c => c.type === 'TUG');
  expect(feeder.section).toBeGreaterThanOrEqual(4); expect(feeder.percent).toBeGreaterThan(0);
  expect(c.percent).toBeCloseTo(c.drop * 100 / 220 + feeder.percent);
  expect(c.percent).toBeLessThanOrEqual(2);
  expect(withAutomaticConductors(s).materials.routes.find(r => r.id === 'fr').assignments).toHaveLength(1);
});
it('preserves calculation inputs, equipment specifications and heights across persistence', () => {
  const s = fixture(); s.equipment[0].specification = 'Embutido 24 módulos';
  const saved = decodeSketch(encodeSketch(s));
  expect(saved.materials.calculation).toEqual(s.materials.calculation);
  expect(saved.equipment[0].specification).toBe('Embutido 24 módulos');
  expect(proposeElectrical(saved).circuits).toEqual(proposeElectrical(s).circuits);
  s.materials.calculation.correctionFactor = 0; expect(() => encodeSketch(s)).toThrow();
});
