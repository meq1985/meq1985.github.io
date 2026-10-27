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
  s.quote.heights.toma = null; s.materials.routes[0].verticalMeters = 0; expect(calculatedRouteLength(s, s.materials.routes[0])).toBeCloseTo(24.2);
});
it('does not add ceiling rises between outlets and lets the user choose ceiling routing explicitly', () => {
  const s=fixture(2);s.materials.routes[1].fromId='p0';const r=s.materials.routes[1];
  expect(calculatedRouteLength(s,r)).toBeCloseTo(0.5);
  const circuit=proposeElectrical(s).circuits.find(c=>c.type==='TUG');expect(circuit.meters).toBeCloseTo(24.7);
  expect(materialsFromSketch(withAutomaticConductors(s)).rows.find(r=>r.description.startsWith('Canalización')).quantity).toBe(24.7);
  r.routing='ceiling';expect(calculatedRouteLength(s,r)).toBeCloseTo(5.9);
  expect(decodeSketch(encodeSketch(s)).materials.routes[1].routing).toBe('ceiling');
  r.verticalMeters=2;expect(calculatedRouteLength(s,r)).toBeCloseTo(2.5);
  r.routing='invalid';expect(()=>encodeSketch(s)).toThrow();
});
it('increases cable section with distance and never rounds before selecting', () => {
  const short = proposeElectrical(fixture(1, 10)).circuits.find(c => c.type === 'TUG');
  const long = proposeElectrical(fixture(1, 50)).circuits.find(c => c.type === 'TUG');
  expect(short.section).toBe(2.5); expect(long.section).toBe(6); expect(long.percent).toBeLessThanOrEqual(2);
  expect(selectCable({ current: 10, meters: 10000, minimum: 2.5, breaker: 16, settings: DEFAULT_CALCULATION })).toBe(null);
  const exact = 2 * 10 / 1000 * 10 * 23.7 / 2.5 * 100 / 220;
  expect(selectCable({ current: 10, meters: 10, minimum: 2.5, breaker: 16, settings: { ...DEFAULT_CALCULATION, limitPercent: exact - 1e-9 } }).section).toBe(4);
});
it('keeps independent TUG departures separate and reserves area minimums', () => {
  const result = proposeElectrical(fixture(16));
  const tug = result.circuits.filter(c => c.type === 'TUG');
  expect(tug).toHaveLength(16); expect(tug.flatMap(c => c.pointIds)).toHaveLength(16);
  expect(tug.every(c => c.pointIds.length <= 15)).toBe(true);
  const large = fixture(1, 50); large.rooms[0].depth = 3;
  expect(proposeElectrical(large).circuits.filter(c => c.type === 'TUG')).toHaveLength(3);
});
const lightingBranches = sizes => {
  const s = fixture(sizes.reduce((sum, n) => sum + n, 0));
  s.rooms[0].points.forEach(p => { p.type = 'luminaria'; });
  let offset = 0;
  for (const size of sizes) {
    for (let i = 0; i < size; i++) s.materials.routes[offset + i].fromId = i ? `p${offset + i - 1}` : 'tg';
    offset += size;
  }
  return s;
};
it.each([false, true])('keeps the 4-light and 12-light drawn branches as independent circuits (reversed=%s)', reversed => {
  const s = lightingBranches([4, 12]);
  if (reversed) { s.materials.routes.reverse(); for (const r of s.materials.routes) [r.fromId, r.toId] = [r.toId, r.fromId]; }
  const result = proposeElectrical(s), circuits = result.circuits.filter(c => c.type === 'IUG');
  expect(circuits).toHaveLength(2);
  const a = circuits.find(c => c.pointIds.includes('p0')), b = circuits.find(c => c.pointIds.includes('p4'));
  expect(new Set(a.pointIds)).toEqual(new Set(['p0', 'p1', 'p2', 'p3']));
  expect(new Set(b.pointIds)).toEqual(new Set(Array.from({ length: 12 }, (_, i) => `p${i + 4}`)));
  expect(a.demandVA).toBe(160); expect(b.demandVA).toBe(480);
  expect(a.departureRouteId).toBe('r0'); expect(b.departureRouteId).toBe('r4');
  expect(a.groupFactor).toBe(1); expect(b.groupFactor).toBe(1);
  expect(a.routeIds.some(id => b.routeIds.includes(id))).toBe(false);
  expect(result.assignments.get('r0').map(a => a.circuitId)).toEqual([a.id]);
  expect(result.assignments.get('r4').map(a => a.circuitId)).toEqual([b.id]);
  expect(proposeElectrical(decodeSketch(encodeSketch(s))).circuits).toEqual(result.circuits);
});
it('splits only the oversized branch at 15 points without mixing the other branch', () => {
  const result = proposeElectrical(lightingBranches([16, 4]));
  const circuits = result.circuits.filter(c => c.type === 'IUG');
  expect(circuits).toHaveLength(3);
  expect(circuits.filter(c => c.departureRouteId === 'r0').map(c => c.pointIds.length).sort((a,b) => a-b)).toEqual([1,15]);
  const other = circuits.find(c => c.departureRouteId === 'r16');
  expect(new Set(other.pointIds)).toEqual(new Set(['p16', 'p17', 'p18', 'p19']));
  expect(result.assignments.get('r0')).toHaveLength(2); expect(result.assignments.get('r16')).toHaveLength(1);
});
it('uses drawn graph routes, applies grouping to common conduits and counts conduit only once', () => {
  const s = fixture(16, 5); s.materials.junctions = [{ id: 'j', levelId: 'planta-baja', name: 'Caja', x: 1, y: 0 }];
  s.materials.routes.forEach(r => { r.fromId = 'j'; });
  s.materials.routes.push({ id: 'trunk', fromId: 'tg', toId: 'j', feederId: null, bends: [], verticalMeters: 0, conduit: '', assignments: [] });
  const result = proposeElectrical(s);
  expect(result.circuits.filter(c => c.type === 'TUG')).toHaveLength(2);
  expect(result.circuits.filter(c => c.type === 'TUG').every(c => c.groupFactor === 0.8 && c.section === 2.5)).toBe(true);
  const computed = withAutomaticConductors(s), list = materialsFromSketch(computed);
  expect(computed.materials.routes.find(r => r.id === 'trunk').assignments).toHaveLength(2);
  expect(list.rows.filter(r => r.description.startsWith('Canalización'))).toHaveLength(1);
  expect(s.materials.routes[0].assignments).toEqual([]);
});
it('does not invent paths or zero verticals when points are disconnected or heights are inconsistent', () => {
  const s = fixture(); s.materials.calculation.boardHeight = 4;
  expect(proposeElectrical(s).pending).toEqual(['p0']);
  expect(withAutomaticConductors(s).materials.routes).toHaveLength(0);
  s.materials.calculation.boardHeight = 1.5; s.materials.routes = [];
  expect(proposeElectrical(s).pending).toEqual(['p0']);
});
it('uses requested default heights for old drawings without discarding custom heights', () => {
  const s = fixture(); delete s.quote;
  expect(calculatedRouteLength(s, s.materials.routes[0])).toBeCloseTo(23);
  s.quote = { ...emptyQuoteSettings(), heights: { toma: null, llave: null, techo: null } };
  expect(calculatedRouteLength(s, s.materials.routes[0])).toBeCloseTo(23);
  s.quote.heights = { toma: 0.6, llave: 1.2, techo: 3 };
  expect(calculatedRouteLength(s, s.materials.routes[0])).toBeCloseTo(23.9);
});
it.each([false, true])('supplies lighting through a switch box, including chained lights and correct wire roles (reversed=%s)', reversed => {
  const s = fixture(2); s.rooms[0].points.forEach(p => { p.type = 'luminaria'; });
  s.rooms[0].points.push({ id: 'sw', type: 'llave', x: 0.25, y: 0.5 });
  const edge = (id, fromId, toId, kind = 'physical') => ({ id, fromId, toId, kind, feederId: null, bends: [], verticalMeters: 0, conduit: '', assignments: [] });
  s.materials.routes = [edge('supply', 'tg', 'sw'), edge('control', reversed ? 'p0' : 'sw', reversed ? 'sw' : 'p0', 'control'), edge('chain', 'p0', 'p1')];
  const result = proposeElectrical(s), c = result.circuits.find(c => c.type === 'IUG');
  expect(result.pending).toEqual([]); expect(c.pointIds).toHaveLength(2); expect(c.demandVA).toBe(80);
  expect(c.meters).toBeCloseTo(s.materials.routes.reduce((sum, r) => sum + calculatedRouteLength(s, r), 0));
  expect(result.assignments.get('supply')[0].wires.map(w => w.role)).toEqual(['phase', 'neutral', 'pe']);
  expect(result.assignments.get('control')).toHaveLength(1);
  expect(result.assignments.get('control')[0].wires.map(w => w.role).sort()).toEqual(['neutral', 'pe', 'return']);
  expect(result.assignments.get('chain')[0].wires.map(w => w.role).sort()).toEqual(['neutral', 'pe', 'return']);
});
it('does not route a TUG circuit through a switch', () => {
  const s = fixture(); s.rooms[0].points.push({ id: 'sw', type: 'llave', x: 0.5, y: 0 });
  const r = s.materials.routes[0]; r.fromId = 'sw';
  s.materials.routes.push({ ...r, id: 'supply', fromId: 'tg', toId: 'sw' });
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
  expect(feeder.meters).toBeCloseTo(Math.hypot(20,20)+3);
  expect(feeder.section).toBeGreaterThanOrEqual(4); expect(feeder.percent).toBeGreaterThan(0);
  expect(feeder.percent).toBeLessThanOrEqual(1);
  expect(c.percent).toBeCloseTo(c.drop * 100 / 220 + feeder.percent);
  expect(c.percent).toBeLessThanOrEqual(2);
  expect(withAutomaticConductors(s).materials.routes.find(r => r.id === 'fr').assignments).toHaveLength(1);
  const computed=withAutomaticConductors(s);
  expect(calculatedRouteLength(computed,computed.materials.routes.find(r=>r.id==='fr'))).toBeCloseTo(feeder.meters);
});
it('keeps terminal and total drop budgets separate and does not prorate TUG demand by outlet count', () => {
  const s = fixture(10, 10); s.materials.calculation.upstreamPercent = 0.9;
  const circuit = proposeElectrical(s).circuits.find(c => c.type === 'TUG');
  expect(circuit.demandVA).toBe(2200); expect(circuit.current).toBe(10);
  expect(circuit.section).toBe(2.5);
  expect(circuit.percent).toBeGreaterThan(2); expect(circuit.percent).toBeLessThanOrEqual(3);
  expect(circuit.drop * 100 / 220).toBeLessThanOrEqual(2);
});
it('preserves calculation inputs, equipment specifications and heights across persistence', () => {
  const s = fixture(); s.equipment[0].specification = 'Embutido 24 módulos';
  const saved = decodeSketch(encodeSketch(s));
  expect(saved.materials.calculation).toEqual(s.materials.calculation);
  expect(saved.equipment[0].specification).toBe('Embutido 24 módulos');
  expect(proposeElectrical(saved).circuits).toEqual(proposeElectrical(s).circuits);
  s.materials.calculation.correctionFactor = 0; expect(() => encodeSketch(s)).toThrow();
});
