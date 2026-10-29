import { expect, it } from 'vitest';
import { emptySketch, encodeSketch, decodeSketch, validateSketch } from '../src/services/sketch';
import { emptyMaterialNetwork, materialRouteLength, materialsFromSketch, materialsCsv, pruneMaterialNetwork } from '../src/services/materialNetwork';
const drawing = () => ({ ...emptySketch(), schema: 2,
  rooms: [{ id: 'room', name: 'Estar', levelId: 'planta-baja', x: 0, y: 0, width: 6, depth: 8,
    points: [{ id: 'p1', type: 'luminaria', x: 0, y: 0 }, { id: 'p2', type: 'toma', x: 1, y: 1 }] }],
  materials: { ...emptyMaterialNetwork(), circuits: [{ id: 'c1', name: 'Luces', type: 'IUG' }, { id: 'c2', name: 'Tomas', type: 'TUG' }],
    routes: [{ id: 'r1', fromId: 'p1', toId: 'p2', bends: [], feederId: null, verticalMeters: 2, conduit: 'Caño elegido 25 mm',
      assignments: [{ circuitId: 'c1', wires: [{ role: 'phase', count: 1, section: 1.5 }, { role: 'return', count: 2, section: 1.5 }] },
        { circuitId: 'c2', wires: [{ role: 'phase', count: 1, section: 2.5 }, { role: 'neutral', count: 1, section: 2.5 }] }] }] } });
it('round trips the new schema without migrating legacy drawings or losing material data', () => {
  const input = drawing(); expect(decodeSketch(encodeSketch(input))).toEqual(input);
  expect(decodeSketch(encodeSketch(emptySketch())).schema).toBe(1);
  expect(() => validateSketch({ ...input, schema: 1 })).toThrow();
  expect(() => validateSketch({ ...emptySketch(), schema: 2 })).toThrow();
});
it('counts shared physical conduit once and each specified conductor including returns independently', () => {
  const sketch = validateSketch(drawing()), result = materialsFromSketch(sketch);
  expect(materialRouteLength(sketch, sketch.materials.routes[0])).toBe(12);
  expect(result.rows.find(r => r.description === 'Caño elegido 25 mm').quantity).toBe(12);
  expect(result.rows.find(r => r.description.includes('Retorno')).quantity).toBe(24);
  expect(result.rows.filter(r => r.description.startsWith('Conductor')).reduce((sum, r) => sum + r.quantity, 0)).toBe(60);
  expect(result.status).toBe('partial');
  expect(result.rows.some(r => r.description.includes('PE'))).toBe(false); // Never invent missing wires.
});
it('does not use labour PAT discounts to remove drawn physical electrodes', () => {
  const s = drawing(); s.equipment = [{ id: 'e1', type: 'medidor_tp', name: 'Pilar', itemId: 'pilar', levelId: 'planta-baja', x: 0, y: 0 },
    { id: 'e2', type: 'jabalina', name: 'PAT', itemId: 'tp_pat', levelId: 'planta-baja', x: 1, y: 0 }];
  const result = materialsFromSketch(validateSketch(s));
  expect(result.rows.find(r => r.description.startsWith('Jabalina')).quantity).toBe(1);
});
it('keeps reserves explicit and separate and applies them only to lengths', () => {
  const s = drawing(); s.materials.reservePercent = 20;
  s.materials.extras.push({ id: 'extra', description: 'Accesorio elegido', unit: 'ud.', quantity: 3 });
  const result = materialsFromSketch(validateSketch(s));
  expect(result.rows.find(r => r.description === 'Caño elegido 25 mm')).toMatchObject({ quantity: 12, purchaseQuantity: 14.4 });
  expect(result.rows.find(r => r.description === 'Accesorio elegido').purchaseQuantity).toBe(3);
});
it('links existing feeders to live geometry without counting copied routes or doubling vertical distance', () => {
  const s = drawing(); s.equipment = [{ id: 'tp', type: 'principal', name: 'TP', itemId: 'tp_mono', levelId: 'planta-baja', x: 0, y: 0 },
    { id: 'tg', type: 'general', name: 'TG', itemId: 'seccional_8', levelId: 'planta-baja', x: 6, y: 8 }];
  s.feeders = [{ id: 'feeder', fromId: 'tp', toId: 'tg', bends: [], verticalMeters: 3, itemId: 'measure-only' }];
  s.materials.routes = [{ ...s.materials.routes[0], fromId: 'tp', toId: 'tg', feederId: 'feeder', verticalMeters: 99 }];
  expect(materialRouteLength(validateSketch(s), s.materials.routes[0])).toBe(16);
  s.equipment[1].x = 0; expect(materialRouteLength(validateSketch(s), s.materials.routes[0])).toBe(14);
  expect(materialsFromSketch(s).warnings.some(w => w.includes('no está incorporado'))).toBe(false);
});
it('rejects broken references, reverse duplicates and malformed conductor quantities', () => {
  const cases = [s => s.materials.routes[0].fromId = 'missing', s => s.materials.routes[0].assignments[0].circuitId = 'missing',
    s => s.materials.routes.push({ ...s.materials.routes[0], id: 'r2', fromId: 'p2', toId: 'p1' }),
    s => s.materials.routes[0].assignments[0].wires[0].count = 1.5,
    s => s.materials.routes[0].assignments[0].wires[0].section = Infinity,
    s => s.materials.reservePercent = -1,
    s => s.materials.extras.push({ id: 'e', description: 'x', unit: 'ud.', quantity: 1.5 }),
    s => s.materials.routes[0].assignments[0].wires.push({ role: 'phase', count: 1, section: 2.5 })];
  for (const edit of cases) { const s = drawing(); edit(s); expect(() => encodeSketch(s)).toThrow(); }
  const s = drawing(); s.levels.push({ id: 'upper', name: 'Alta' });
  s.materials.junctions.push({ id: 'j', name: 'Caja', levelId: 'upper', x: 0, y: 0 }); s.materials.routes[0].toId = 'j';
  expect(decodeSketch(encodeSketch(s)).materials.routes[0].toId).toBe('j');
});
it('prunes attached routes only for deliberate removals; loading broken data fails instead of silently repairing it', () => {
  const s = drawing(); s.rooms[0].points = s.rooms[0].points.slice(1);
  expect(() => encodeSketch(s)).toThrow(); pruneMaterialNetwork(s);
  expect(s.materials.routes).toEqual([]); expect(decodeSketch(encodeSketch(s))).toEqual(s);
});
it('exports partial status, explicit units and observations and neutralizes spreadsheet formulas', () => {
  const s = drawing(); s.materials.extras.push({ id: 'extra', description: '  =HYPERLINK("example")', unit: 'ud.', quantity: 2 });
  const csv = materialsCsv(materialsFromSketch(validateSketch(s)));
  expect(csv).toContain('Lista parcial para revisar'); expect(csv).toContain("'=HYPERLINK");
  expect(csv).toContain('Cantidad con reserva'); expect(csv).toContain('Observación');
});
