import { materialAnchors, materialRouteLength, emptyMaterialNetwork } from './materialNetwork';
// Conservative reference: IEC B1, copper PVC, THREE loaded conductors at 30 °C.
// Schneider Electrical Installation Guide, table G20 / IEC B.52.4.
// The correction factor remains an explicit installation input, never inferred from geometry.
export const CABLES = [[1.5, 15.5], [2.5, 21], [4, 28], [6, 36], [10, 50], [16, 68]];
export const DEFAULT_CALCULATION = { profile: 'cu-pvc-b1-v1', voltage: 220, limitPercent: 2, totalLimitPercent: 3, feederLimitPercent: 1, upstreamPercent: 0, correctionFactor: 1, boardHeight: 1.5 };
const grouping = [1, 0.8, 0.7, 0.65, 0.6, 0.57, 0.54, 0.52, 0.5];
const groupFactor = n => n <= 9 ? grouping[Math.max(0, n - 1)] : n <= 12 ? 0.45 : n <= 16 ? 0.41 : n <= 20 ? 0.38 : 0;
export function verticalForRoute(sketch, route) {
  const manual = route.feederId ? sketch.feeders.find(f => f.id === route.feederId).verticalMeters : route.verticalMeters;
  if (manual > 0) return manual;
  const ceiling = sketch.quote?.heights?.techo;
  if (!(ceiling > 0)) return null;
  const anchors = materialAnchors(sketch);
  const height = a => ['luminaria', undefined].includes(a.type) ? ceiling : ['toma', 'llave'].includes(a.type) ? sketch.quote?.heights?.[a.type] :
    ['general', 'seccional', 'principal', 'medidor_tp'].includes(a.type) ? sketch.materials.calculation.boardHeight : null;
  const ends = [route.fromId, route.toId].map(id => height(anchors.find(a => a.id === id) ?? {}));
  return ends.every(h => Number.isFinite(h) && h > 0 && h <= ceiling) ? ends.reduce((sum, h) => sum + ceiling - h, 0) : null;
}
export function calculatedRouteLength(sketch, route) {
  const vertical = verticalForRoute(sketch, route);
  const manual = route.feederId ? sketch.feeders.find(f => f.id === route.feederId).verticalMeters : route.verticalMeters;
  return vertical === null ? null : materialRouteLength(sketch, route) + vertical - manual;
}
export function selectCable({ current, meters, minimum, breaker, settings }) {
  if (![current, meters, minimum, breaker].every(n => Number.isFinite(n) && n >= 0) || !settings ||
      !Number.isFinite(settings.voltage) || settings.voltage < 200 || settings.voltage > 240 ||
      !Number.isFinite(settings.correctionFactor) || settings.correctionFactor <= 0 || settings.correctionFactor > 1 ||
      !Number.isFinite(settings.limitPercent) || settings.limitPercent <= 0 || !Number.isFinite(settings.upstreamPercent) || settings.upstreamPercent < 0) return null;
  for (const [section, capacity] of CABLES) {
    // 23.7/S is a deliberately conservative resistance model for warm copper;
    // unity power factor gives the largest resistive drop for a fixed apparent current.
    const drop = 2 * meters / 1000 * current * (23.7 / section);
    const percent = drop * 100 / settings.voltage + settings.upstreamPercent;
    if (section >= minimum && current <= breaker && breaker <= capacity * settings.correctionFactor && percent <= settings.limitPercent)
      return { section, ampacity: capacity * settings.correctionFactor, drop, percent };
  }
  return null;
}
export function proposeElectrical(sketch) {
  if (!sketch.materials?.calculation) return null;
  const settings = { ...DEFAULT_CALCULATION, ...sketch.materials.calculation };
  const anchors = materialAnchors(sketch), routes = sketch.materials.routes;
  const boards = anchors.filter(a => ['general', 'seccional'].includes(a.type));
  const warnings = [], circuits = [], pending = [], assignments = new Map(routes.map(r => [r.id, []]));
  const graph = new Map(anchors.map(a => [a.id, []]));
  for (const r of routes) {
    if (r.kind === 'control' || r.feederId) continue;
    const from = anchors.find(a => a.id === r.fromId), to = anchors.find(a => a.id === r.toId);
    // Feeders, PAT and switch legs are not terminal supply paths.
    if ([from, to].some(a => !a || ['llave', 'jabalina', 'principal', 'medidor_tp'].includes(a.type))) continue;
    const meters = calculatedRouteLength(sketch, r);
    if (!(meters > 0)) continue;
    graph.get(from.id).push({ to: to.id, routeId: r.id, meters }); graph.get(to.id).push({ to: from.id, routeId: r.id, meters });
  }
  // A proposed radial tree follows the shortest DRAWN path; it never invents segments.
  const paths = new Map(boards.map(b => [b.id, { distance: 0, boardId: b.id, routeIds: [] }])), done = new Set();
  while (true) {
    const next = [...paths].filter(([id]) => !done.has(id)).sort((a, b) => a[1].distance - b[1].distance || a[0].localeCompare(b[0]))[0];
    if (!next) break;
    const [id, path] = next; done.add(id);
    for (const edge of graph.get(id) ?? []) {
      if (boards.some(b => b.id === edge.to)) continue;
      const distance = path.distance + edge.meters;
      if (!paths.has(edge.to) || distance < paths.get(edge.to).distance) paths.set(edge.to, { distance, boardId: path.boardId, routeIds: [...path.routeIds, edge.routeId] });
    }
  }
  const groups = new Map();
  for (const a of anchors.filter(a => ['luminaria', 'toma'].includes(a.type))) {
    const path = paths.get(a.id);
    if (!path) { pending.push(a.id); continue; }
    const type = a.type === 'luminaria' ? 'IUG' : 'TUG', key = `${path.boardId}/${type}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ anchor: a, ...path });
  }
  const area = sketch.rooms.reduce((sum, r) => sum + r.width * r.depth, 0);
  // Owner-supplied planning variants, not a declaration of regulatory compliance.
  const minimum = area <= 60 ? [1, 1] : area <= 130 ? [2, 1] : area <= 200 ? [2, 3] : [2, 4];
  for (const board of boards) for (const [t, type] of ['IUG', 'TUG'].entries()) {
    const points = (groups.get(`${board.id}/${type}`) ?? []).sort((a, b) => b.distance - a.distance || a.anchor.id.localeCompare(b.anchor.id));
    // Whole-installation area minima only for one-board layouts; multi-board allocation needs review.
    const count = Math.max(Math.ceil(points.length / 15), boards.length === 1 ? minimum[t] : (points.length ? 1 : 0));
    const buckets = Array.from({ length: count }, () => []);
    points.forEach((p, i) => buckets[i % count].push(p));
    for (const bucket of buckets) {
      const index = circuits.length, id = `auto-c-${index}`, name = `${type} ${circuits.filter(c => c.type === type).length + 1}`;
      const demandVA = type === 'IUG' ? bucket.length * 60 * 2 / 3 : 2200;
      const current = demandVA / settings.voltage, breaker = type === 'IUG' ? 10 : 16;
      const controlRoutes = type === 'IUG' ? routes.filter(r => r.kind === 'control' && bucket.some(p => [r.fromId, r.toId].includes(p.anchor.id))) : [];
      const missingControlHeight = controlRoutes.some(r => calculatedRouteLength(sketch, r) === null);
      const length = bucket.length ? Math.max(...bucket.map(p => p.distance + controlRoutes.filter(r => [r.fromId, r.toId].includes(p.anchor.id)).reduce((max, r) => Math.max(max, calculatedRouteLength(sketch, r) ?? 0), 0))) : 0;
      const choice = bucket.length && !missingControlHeight ? selectCable({ current, meters: length, minimum: type === 'IUG' ? 1.5 : 2.5, breaker, settings }) : null;
      const routeIds = [...new Set(bucket.flatMap(p => p.routeIds))];
      const circuit = { id, name, type, boardId: board.id, pointIds: bucket.map(p => p.anchor.id), routeIds, controlRouteIds: controlRoutes.map(r => r.id), missingControlHeight, demandVA, current, breaker, meters: length, ...choice,
        status: !bucket.length ? 'reserved' : choice ? 'proposal' : 'unresolved' };
      circuits.push(circuit);
      if (!choice) continue;
      for (const routeId of routeIds) assignments.get(routeId).push({ circuitId: id, wires: ['phase', 'neutral', 'pe'].map(role => ({ role, count: 1, section: role === 'pe' ? Math.max(2.5, choice.section) : choice.section })) });
      for (const r of controlRoutes) assignments.get(r.id).push({ circuitId: id, wires: ['phase', 'return', 'pe'].map(role => ({ role, count: 1, section: role === 'pe' ? Math.max(2.5, choice.section) : choice.section })) });
    }
  }
  const feederCircuits = [];
  for (const board of boards) {
    const incoming = routes.filter(r => r.feederId && r.toId === board.id);
    if (incoming.length > 1) { warnings.push('El tablero tiene más de un alimentador: revisar cuál está en servicio.'); continue; }
    if (!incoming.length) continue;
    const r = incoming[0], meters = calculatedRouteLength(sketch, r), current = circuits.filter(c => c.boardId === board.id).reduce((s, c) => s + c.current, 0);
    const breaker = [16, 20, 25, 32, 40, 50, 63].find(a => a >= current);
    // Explicit 1% feeder / 2% terminal design budgets, with a separate 3% total cap.
    const choice = breaker && meters !== null ? selectCable({ current, meters, minimum: 4, breaker,
      settings: { ...settings, limitPercent: Math.min(settings.totalLimitPercent, settings.upstreamPercent + settings.feederLimitPercent) } }) : null;
    const c = { id: `auto-f-${feederCircuits.length}`, name: `Alimentador · ${board.name}`, type: 'otro', boardId: board.id, pointIds: [], routeIds: [r.id], demandVA: current * settings.voltage, current,
      breaker: breaker ?? null, meters: meters ?? 0, ...choice, status: choice ? 'proposal' : 'unresolved' };
    feederCircuits.push(c);
    if (choice) assignments.get(r.id).push({ circuitId: c.id, wires: ['phase', 'neutral', 'pe'].map(role => ({ role, count: 1, section: choice.section })) });
  }
  // Re-size after all circuit routes are known, including common conduits (IEC B.52.17).
  for (const c of circuits.filter(c => c.pointIds.length)) {
    const used = [...assignments].filter(([, a]) => a.some(a => a.circuitId === c.id));
    const factor = groupFactor(Math.max(1, ...[...c.routeIds, ...c.controlRouteIds].map(id => circuits.filter(other => [...other.routeIds, ...other.controlRouteIds].includes(id)).length)));
    const feeder = feederCircuits.find(f => f.boardId === c.boardId);
    const ambiguous = routes.filter(r => r.feederId && r.toId === c.boardId).length > 1;
    const upstream = feeder?.percent ?? settings.upstreamPercent;
    const choice = factor && !c.missingControlHeight && !ambiguous && (!feeder || feeder.section) ? selectCable({ current: c.current, meters: c.meters, minimum: c.type === 'IUG' ? 1.5 : 2.5, breaker: c.breaker,
      settings: { ...settings, limitPercent: Math.min(settings.totalLimitPercent, upstream + settings.limitPercent), upstreamPercent: upstream, correctionFactor: settings.correctionFactor * factor } }) : null;
    c.groupFactor = factor;
    if (!choice) {
      delete c.section; delete c.ampacity; delete c.drop; delete c.percent; c.status = 'unresolved';
      for (const [id, a] of assignments) assignments.set(id, a.filter(a => a.circuitId !== c.id));
    } else {
      Object.assign(c, choice, { status: 'proposal' });
      for (const [, a] of used) for (const entry of a.filter(a => a.circuitId === c.id)) for (const w of entry.wires) w.section = w.role === 'pe' ? Math.max(2.5, choice.section) : choice.section;
    }
  }
  const sharedRoutes = [...assignments].filter(([, a]) => a.length > 1).map(([id]) => id);
  if (sharedRoutes.length) warnings.push('Se aplicó reducción por cantidad de circuitos en cañerías compartidas. Confirmar temperatura y condiciones reales de instalación.');
  if (pending.length) warnings.push(`${pending.length} punto(s) sin camino dibujado hasta un tablero general o seccional.`);
  if (routes.some(r => verticalForRoute(sketch, r) === null)) warnings.push('Completá las alturas de techo, tomas, llaves y tableros: hay tramos sin verticales calculables.');
  if (!boards.length) warnings.push('Dibujá un tablero general para alimentar los circuitos.');
  if (boards.length > 1) warnings.push('Varios tableros: revisar reparto de circuitos mínimos y caída en sus alimentadores.');
  if (circuits.some(c => c.status === 'unresolved')) warnings.push('Hay circuitos sin sección disponible que cumpla las condiciones ingresadas.');
  if (feederCircuits.some(c => c.status === 'unresolved')) warnings.push('Hay alimentadores sin sección calculable: revisar longitud, demanda, alturas y límite de caída.');
  if (!feederCircuits.length) warnings.push('No hay alimentador TP → TG dibujado: la caída previa al tablero debe ingresarse en los datos del cálculo.');
  warnings.push('Propuesta monofásica para vivienda: revisar cargas reales, agrupamiento, temperatura, alimentadores, cortocircuito, desconexión y protecciones. No se dimensionan TUE ni consumos específicos.');
  return { circuits, feederCircuits, assignments, pending, warnings, settings, status: 'proposal' };
}
export function withAutomaticConductors(sketch) {
  const design = proposeElectrical(sketch); if (!design) return sketch;
  const network = sketch.materials ?? emptyMaterialNetwork();
  const known = network.routes.filter(r => verticalForRoute(sketch, r) !== null);
  return { ...sketch, feeders: (sketch.feeders ?? []).map(f => {
    const route = known.find(r => r.feederId === f.id); return route ? { ...f, verticalMeters: verticalForRoute(sketch, route) } : f;
  }), materials: { ...network, circuits: [...design.circuits, ...design.feederCircuits].map(({ id, name, type }) => ({ id, name, type })),
    routes: known.map(r => ({ ...r, verticalMeters: verticalForRoute(sketch, r), assignments: design.assignments.get(r.id) ?? [] })) } };
}
