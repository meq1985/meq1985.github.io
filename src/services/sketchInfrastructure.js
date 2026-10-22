export const EQUIPMENT_TYPES = { medidor_tp: 'Medidor + tablero principal', principal: 'Tablero principal', general: 'Tablero general', seccional: 'Tablero seccional', jabalina: 'Jabalina de protección' };
const sectional = ['seccional_8', 'seccional_36', 'seccional_54'];
export const EQUIPMENT_ITEMS = { medidor_tp: ['pilar', 'gabinete_adicional'], principal: ['tp_mono', 'tp_tri'], general: sectional, seccional: sectional, jabalina: ['tp_pat', 'pat_servicio'] };
export const FEEDER_ITEMS = ['subterraneo_tierra', 'subterraneo_piso', 'mamposteria_comun_metro', 'mamposteria_hueco_metro'];
export const PACKAGE_PAT = ['tp_mono', 'tp_tri', 'gabinete_1', 'gabinete_2', 'gabinete_3', 'gabinete_4', 'pilar'];
export function validateInfrastructure(input, levels, unique) {
  const fail = () => { throw Error('Revisá los tableros, jabalinas y recorridos del croquis.'); };
  const numeric = (n, max) => { if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > max) fail(); return n; };
  const coords = p => ({ x: numeric(p.x, 200), y: numeric(p.y, 200) });
  if (!Array.isArray(input.equipment) || !Array.isArray(input.feeders) || input.equipment.length > 50 || input.feeders.length > 50) fail();
  const equipment = input.equipment.map(e => {
    if (!Object.hasOwn(EQUIPMENT_TYPES, e.type) || !levels.some(l => l.id === e.levelId) || typeof e.name !== 'string' || !e.name.trim() || e.name.length > 60 || !['', ...EQUIPMENT_ITEMS[e.type]].includes(e.itemId)) fail();
    return { id: unique(e.id), type: e.type, name: e.name.trim(), levelId: e.levelId, ...coords(e), itemId: e.itemId };
  });
  const pairs = new Set();
  const feeders = input.feeders.map(f => {
    const from = equipment.find(e => e.id === f.fromId), to = equipment.find(e => e.id === f.toId);
    if (!from || !to || !['medidor_tp', 'principal'].includes(from.type) || to.type !== 'general' || from.levelId !== to.levelId || !Array.isArray(f.bends) || f.bends.length > 50 || !['', 'measure-only', ...FEEDER_ITEMS].includes(f.itemId)) fail();
    const pair = `${from.id}:${to.id}`; if (pairs.has(pair)) fail(); pairs.add(pair);
    return { id: unique(f.id), fromId: from.id, toId: to.id, bends: f.bends.map(coords), verticalMeters: numeric(f.verticalMeters, 200), itemId: f.itemId };
  });
  return { equipment, feeders };
}
export function feederPoints(sketch, feeder) {
  const from = sketch.equipment.find(e => e.id === feeder.fromId), to = sketch.equipment.find(e => e.id === feeder.toId);
  return [from, ...feeder.bends, to];
}
export function feederLength(sketch, feeder) {
  const points = feederPoints(sketch, feeder);
  const horizontal = points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0);
  return Math.round((horizontal + feeder.verticalMeters) * 100) / 100;
}
