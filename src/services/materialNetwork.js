// Physical routes are independent of labour prices and of regulatory design rules.
export const WIRE_ROLES = { phase: 'Fase', neutral: 'Neutro', pe: 'Protección PE', return: 'Retorno', traveller: 'Viajero' };
export const emptyMaterialNetwork = () => ({ schema: 1, circuits: [], junctions: [], routes: [], extras: [], reservePercent: 0 });
export function materialAnchors(sketch) {
  return [
    ...sketch.rooms.flatMap(room => room.points.map((point, i) => ({ ...point, levelId: room.levelId,
      x: room.x + point.x * room.width, y: room.y + point.y * room.depth,
      name: `${room.name} · ${{ luminaria: 'Luminaria', toma: 'Toma', llave: 'Llave' }[point.type]} ${i + 1}` }))),
    ...(sketch.equipment ?? []), ...(sketch.materials?.junctions ?? []),
  ];
}
export function validateMaterialNetwork(input, sketch, unique) {
  const fail = () => { throw Error('Revisá los circuitos, materiales y recorridos interiores.'); };
  const number = (n, min, max) => { if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) fail(); return n; };
  const text = (s, max) => { if (typeof s !== 'string' || !s.trim() || s.length > max) fail(); return s.trim(); };
  const list = (a, max) => { if (!Array.isArray(a) || a.length > max) fail(); return a; };
  if (!input || input.schema !== 1) fail();
  const circuits = list(input.circuits, 50).map(c => ({ id: unique(c.id), name: text(c.name, 60),
    type: ['IUG', 'TUG', 'TUE', 'otro'].includes(c.type) ? c.type : fail() }));
  const coords = p => ({ x: number(p.x, 0, 200), y: number(p.y, 0, 200) });
  const junctions = list(input.junctions, 50).map(j => ({ id: unique(j.id), name: text(j.name, 60),
    levelId: sketch.levels.some(l => l.id === j.levelId) ? j.levelId : fail(), ...coords(j) }));
  const anchors = materialAnchors({ ...sketch, materials: { junctions } });
  const pairs = new Set();
  const routes = list(input.routes, 150).map(r => {
    const from = anchors.find(a => a.id === r.fromId), to = anchors.find(a => a.id === r.toId);
    if (!from || !to || from.id === to.id || from.levelId !== to.levelId) fail();
    if (r.kind !== undefined && !['physical', 'control'].includes(r.kind)) fail();
    if (r.kind === 'control' && ![from.type, to.type].sort().every((type, i) => type === ['llave', 'luminaria'][i])) fail();
    const key = [from.id, to.id].sort().join(':'); if (pairs.has(key)) fail(); pairs.add(key);
    const feeder = r.feederId === null ? null : (sketch.feeders ?? []).find(f => f.id === r.feederId);
    if (r.feederId !== null && (!feeder || feeder.fromId !== from.id || feeder.toId !== to.id)) fail();
    const used = new Set();
    const assignments = list(r.assignments, 50).map(a => {
      if (!circuits.some(c => c.id === a.circuitId) || used.has(a.circuitId)) fail(); used.add(a.circuitId);
      const roles = new Set();
      return { circuitId: a.circuitId, wires: list(a.wires, 5).map(w => {
        if (!Object.hasOwn(WIRE_ROLES, w.role) || roles.has(w.role) || !Number.isInteger(w.count)) fail(); roles.add(w.role);
        return { role: w.role, count: number(w.count, 1, 20), section: number(w.section, 0.1, 240) };
      }) };
    });
    return { id: unique(r.id), fromId: from.id, toId: to.id, feederId: r.feederId, ...(r.kind === undefined ? {} : { kind: r.kind }),
      bends: list(r.bends, 50).map(coords), verticalMeters: number(r.verticalMeters, 0, 200),
      conduit: typeof r.conduit === 'string' && r.conduit.length <= 120 ? r.conduit.trim() : fail(), assignments };
  });
  const extras = list(input.extras, 100).map(e => ({ id: unique(e.id), description: text(e.description, 120),
    unit: ['ud.', 'm'].includes(e.unit) ? e.unit : fail(), quantity: number(e.quantity, 0.01, 100000),
    ...(e.unit === 'ud.' && !Number.isInteger(e.quantity) ? fail() : {}) }));
  let calculation;
  if (input.calculation !== undefined) {
    const c = input.calculation;
    if (!c || c.profile !== 'cu-pvc-b1-v1') fail();
    calculation = { profile: c.profile, voltage: number(c.voltage, 200, 240), limitPercent: number(c.limitPercent, 0.1, 5),
      upstreamPercent: number(c.upstreamPercent, 0, 5), correctionFactor: number(c.correctionFactor, 0.1, 1), boardHeight: number(c.boardHeight ?? 1.5, 0.1, 5) };
  }
  return { schema: 1, circuits, junctions, routes, extras, reservePercent: number(input.reservePercent, 0, 50), ...(calculation ? { calculation } : {}) };
}
export function materialRoutePoints(sketch, route) {
  if (route.feederId) {
    const feeder = sketch.feeders.find(f => f.id === route.feederId);
    return [sketch.equipment.find(e => e.id === feeder.fromId), ...feeder.bends, sketch.equipment.find(e => e.id === feeder.toId)];
  }
  const anchors = materialAnchors(sketch);
  return [anchors.find(a => a.id === route.fromId), ...route.bends, anchors.find(a => a.id === route.toId)];
}
export function materialRouteLength(sketch, route) {
  const points = materialRoutePoints(sketch, route);
  const vertical = route.feederId ? sketch.feeders.find(f => f.id === route.feederId).verticalMeters : route.verticalMeters;
  return points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0) + vertical;
}
// Only called after deliberate editor changes, never while loading untrusted stored data.
export function pruneMaterialNetwork(sketch) {
  if (!sketch.materials) return;
  sketch.materials.junctions = sketch.materials.junctions.filter(j => sketch.levels.some(l => l.id === j.levelId));
  const ids = new Set(materialAnchors(sketch).map(a => a.id));
  sketch.materials.routes = sketch.materials.routes.filter(r => ids.has(r.fromId) && ids.has(r.toId) &&
    (!r.feederId || (sketch.feeders ?? []).some(f => f.id === r.feederId)));
}
const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
export function materialsFromSketch(sketch) {
  const network = sketch.materials ?? emptyMaterialNetwork(), rows = new Map(), warnings = [];
  const add = (key, description, unit, quantity, source, pending = false) => {
    if (!rows.has(key)) rows.set(key, { description, unit, quantity: 0, sources: [], pending });
    const row = rows.get(key); row.quantity += quantity; row.sources.push(source);
  };
  for (const room of sketch.rooms) for (const point of room.points) {
    add(point.type === 'luminaria' ? 'box-light' : 'box-mechanism', point.type === 'luminaria' ? 'Caja para luminaria · modelo a definir' : 'Caja para mecanismo · modelo a definir', 'ud.', 1, point.id, true);
    add(`device-${point.type}`, { luminaria: 'Luminaria · artefacto a definir', toma: 'Tomacorriente · mecanismo a definir', llave: 'Llave · mecanismo a definir' }[point.type], 'ud.', 1, point.id, true);
  }
  for (const j of network.junctions) add('junction', 'Caja de paso · modelo a definir', 'ud.', 1, j.id, true);
  for (const e of sketch.equipment ?? []) add(`equipment-${e.type}-${e.specification ?? ''}`, ({ general: 'Gabinete TG', seccional: 'Gabinete TS', principal: 'Conjunto TP', medidor_tp: 'Conjunto medidor + TP', jabalina: 'Jabalina' }[e.type]) + ' · ' + (e.specification || 'componentes a definir'), 'ud.', 1, e.id, true);
  const linked = new Set(network.routes.map(r => r.feederId).filter(Boolean));
  for (const f of sketch.feeders ?? []) if (!linked.has(f.id)) warnings.push('Un recorrido TP → TG no está incorporado a materiales.');
  for (const r of network.routes) {
    const meters = materialRouteLength(sketch, r);
    if (meters <= 0) warnings.push('Hay un recorrido sin longitud: revisá sus extremos y quiebres.');
    add(`conduit-${r.conduit.toLowerCase()}`, r.conduit || 'Canalización · tipo y diámetro a definir', 'm', meters, r.id, !r.conduit);
    if (!r.assignments.length || r.assignments.some(a => !a.wires.length)) warnings.push('Hay recorridos sin conductores definidos.');
    for (const a of r.assignments) for (const w of a.wires) {
      add(`wire-${w.role}-${w.section}`, `Conductor ${WIRE_ROLES[w.role]} · ${w.section} mm² · familia a confirmar`, 'm', meters * w.count, `${r.id}/${a.circuitId}`, true);
    }
  }
  for (const e of network.extras) add(`extra-${e.id}`, e.description, e.unit, e.quantity, e.id);
  if (!network.routes.length) warnings.push('Dibujá los recorridos para computar canalizaciones y conductores.');
  warnings.push('Una caja y un mecanismo por símbolo. Revisá cajas compartidas, luminarias y componentes de tableros y PAT.');
  warnings.push('Las medidas incluyen planta y metros verticales ingresados, sin inferir bajadas a partir de las alturas generales.');
  warnings.push('Lista parcial: no verifica circuitos, secciones, protecciones ni dimensiona la puesta a tierra. Los componentes manuales se suman a los dibujados.');
  return { status: 'partial', rows: [...rows.values()].map(r => ({ ...r, quantity: round(r.quantity),
    purchaseQuantity: r.unit === 'm' ? Math.ceil(r.quantity * (1 + network.reservePercent / 100) * 100 - 1e-8) / 100 : r.quantity })), warnings: [...new Set(warnings)] };
}
export function materialsCsv(result) {
  const cell = value => {
    let text = String(value); if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + [['Estado', 'Lista parcial para revisar'], ['Material', 'Unidad', 'Cantidad calculada', 'Cantidad con reserva', 'Especificación'],
    ...result.rows.map(r => [r.description, r.unit, r.quantity, r.purchaseQuantity, r.pending ? 'Por definir / confirmar' : 'Ingresado manualmente']),
    ...result.warnings.map(w => ['Observación', w])].map(row => row.map(cell).join(';')).join('\r\n');
}
