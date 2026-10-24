// Metres for rooms; points use relative coordinates so resizing preserves their layout.
import { validateQuoteSettings } from './sketchQuoteSettings';
import { validateInfrastructure } from './sketchInfrastructure';
import { validateMaterialNetwork } from './materialNetwork';
export const POINT_TYPES = { luminaria: 'Luminaria', toma: 'Toma', llave: 'Llave' };
export const SKETCH_LIMITS = { levels: 5, rooms: 20, points: 300, bytes: 80000 };
export const emptySketch = () => ({ schema: 1, levels: [{ id: 'planta-baja', name: 'Planta baja' }], rooms: [] });
const fail = () => { throw new Error('El croquis no es válido. Revisá ambientes, medidas y puntos.'); };
const label = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 60 ? value.trim() : fail();
const number = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fail();
const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,60}$/.test(value) ? value : fail();
export function validateSketch(input) {
  if (!input || ![1, 2].includes(input.schema) || (input.schema === 2) !== (input.materials !== undefined) || !Array.isArray(input.levels) || !Array.isArray(input.rooms) ||
      !input.levels.length || input.levels.length > SKETCH_LIMITS.levels || input.rooms.length > SKETCH_LIMITS.rooms) fail();
  const ids = new Set();
  const unique = value => { const key = id(value); if (ids.has(key)) fail(); ids.add(key); return key; };
  const levels = input.levels.map(level => ({ id: unique(level.id), name: label(level.name) }));
  let count = 0;
  const rooms = input.rooms.map(room => {
    if (!levels.some(level => level.id === room.levelId) || !Array.isArray(room.points)) fail();
    const result = { id: unique(room.id), levelId: room.levelId, name: label(room.name),
      x: number(room.x, 0, 100), y: number(room.y, 0, 100), width: number(room.width, 1, 50), depth: number(room.depth, 1, 50),
      points: room.points.map(point => {
        if (!Object.hasOwn(POINT_TYPES, point.type) || ++count > SKETCH_LIMITS.points) fail();
        return { id: unique(point.id), type: point.type, x: number(point.x, 0, 1), y: number(point.y, 0, 1) };
      }) };
    return result;
  });
  const infrastructure = input.equipment === undefined && input.feeders === undefined ? {} : validateInfrastructure({ equipment: input.equipment ?? [], feeders: input.feeders ?? [] }, levels, unique);
  const result = { schema: input.schema, levels, rooms, ...infrastructure, ...(input.quote === undefined ? {} : { quote: validateQuoteSettings(input.quote) }) };
  if (input.schema === 2) result.materials = validateMaterialNetwork(input.materials, result, unique);
  return result;
}
export function encodeSketch(input) {
  if (input == null) return null;
  const data = JSON.stringify(validateSketch(input));
  if (new TextEncoder().encode(data).length > SKETCH_LIMITS.bytes) fail();
  return data;
}
export function decodeSketch(data) {
  if (data == null) return null; // Projects saved before the editor remain compatible.
  if (typeof data !== 'string' || new TextEncoder().encode(data).length > SKETCH_LIMITS.bytes) fail();
  try { return validateSketch(JSON.parse(data)); } catch { return fail(); }
}
export function sketchSummary(sketch) {
  const counts = { luminaria: 0, toma: 0, llave: 0 };
  for (const room of sketch.rooms) for (const point of room.points) counts[point.type]++;
  return { area: Math.round(sketch.rooms.reduce((sum, room) => sum + room.width * room.depth, 0) * 100) / 100, ...counts };
}
export function overlapsRoom(a, b) {
  return a.id !== b.id && a.levelId === b.levelId && a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.depth && a.y + a.depth > b.y;
}
