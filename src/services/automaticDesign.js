import { materialAnchors, materialRouteLength, materialRouteVertical, materialRouteFloorRise, emptyMaterialNetwork } from './materialNetwork';
import { sketchHeights } from './sketchQuoteSettings';
import { switchTopology } from './switchTopology';
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
  const heights = sketchHeights(sketch), ceiling = heights.techo;
  if (!(ceiling > 0)) return null;
  const anchors = materialAnchors(sketch);
  const height = a => ['luminaria', undefined].includes(a.type) ? ceiling : ['toma', 'llave'].includes(a.type) ? heights[a.type] :
    ['general', 'seccional', 'principal', 'medidor_tp'].includes(a.type) ? sketch.materials.calculation.boardHeight : null;
  const ends = [route.fromId, route.toId].map(id => height(anchors.find(a => a.id === id) ?? {}));
  return ends.every(h => Number.isFinite(h) && h > 0 && h <= ceiling) ? materialRouteFloorRise(sketch, route) + ends.reduce((sum, h) => sum + ceiling - h, 0) : null;
}
export function calculatedRouteLength(sketch, route) {
  const vertical = verticalForRoute(sketch, route);
  const manual = materialRouteVertical(sketch, route);
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
  const topology = switchTopology(sketch);
  const boards = anchors.filter(a => ['general', 'seccional'].includes(a.type));
  const warnings = [], circuits = [], pending = [], assignments = new Map(routes.map(r => [r.id, []]));
  const graph = new Map(anchors.map(a => [a.id, []]));
  for (const r of routes) {
    if (r.feederId) continue;
    const from = anchors.find(a => a.id === r.fromId), to = anchors.find(a => a.id === r.toId);
    // Switch boxes may carry the lighting supply and neutral towards luminaires.
    if ([from, to].some(a => !a || ['jabalina', 'principal', 'medidor_tp'].includes(a.type))) continue;
    const meters = calculatedRouteLength(sketch, r);
    if (!(meters > 0)) continue;
    graph.get(from.id).push({ to: to.id, routeId: r.id, meters }); graph.get(to.id).push({ to: from.id, routeId: r.id, meters });
  }
  // A proposed radial tree follows the shortest DRAWN path; it never invents segments.
  function pathsFor(type, roots = boards.map(b => b.id)) {
  const paths = new Map(roots.map(id => [id, { distance: 0, boardId: id, routeIds: [] }])), done = new Set();
  while (true) {
    const next = [...paths].filter(([id]) => !done.has(id)).sort((a, b) => a[1].distance - b[1].distance || a[0].localeCompare(b[0]))[0];
    if (!next) break;
    const [id, path] = next; done.add(id);
    for (const edge of graph.get(id) ?? []) {
      if (type === 'TUG' && [id, edge.to].some(key => anchors.find(a => a.id === key)?.type === 'llave')) continue;
      if (boards.some(b => b.id === edge.to)) continue;
      const distance = path.distance + edge.meters;
      if (!paths.has(edge.to) || distance < paths.get(edge.to).distance) paths.set(edge.to, { distance, boardId: path.boardId, routeIds: [...path.routeIds, edge.routeId] });
    }
  }
  return paths;
  }
  const iugPaths = pathsFor('IUG'), tugPaths = pathsFor('TUG');
  const cache = new Map();
  const pathBetween = (from,to) => { if (!cache.has(from)) cache.set(from, pathsFor('IUG', [from])); return cache.get(from).get(to); };
  const groups = new Map();
  for (const a of anchors.filter(a => ['luminaria', 'toma'].includes(a.type))) {
    const path = (a.type === 'luminaria' ? iugPaths : tugPaths).get(a.id);
    if (!path) { pending.push(a.id); continue; }
    const type = a.type === 'luminaria' ? 'IUG' : 'TUG', key = `${path.boardId}/${type}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ anchor: a, ...path });
  }
  const area = sketch.rooms.reduce((sum, r) => sum + r.width * r.depth, 0);
  // Owner-supplied planning variants, not a declaration of regulatory compliance.
  const minimum = area <= 60 ? [1, 1] : area <= 130 ? [2, 1] : area <= 200 ? [2, 3] : [2, 4];
  for (const board of boards) for (const [t, type] of ['IUG', 'TUG'].entries()) {
    const points = groups.get(`${board.id}/${type}`) ?? [];
    // Independent departures from a board define independent proposed circuits.
    // A common initial conduit remains one branch even if it forks downstream.
    const branches = new Map();
    for (const point of points) {
      const departure = point.routeIds[0];
      if (!branches.has(departure)) branches.set(departure, []);
      branches.get(departure).push(point);
    }
    const buckets = [];
    for (const [, branch] of [...branches].sort(([a], [b]) => a.localeCompare(b))) {
      // Traverse common path prefixes together instead of alternating distant points.
      branch.sort((a, b) => a.routeIds.join('/').localeCompare(b.routeIds.join('/')) || a.anchor.id.localeCompare(b.anchor.id));
      for (let start = 0; start < branch.length; start += 15) buckets.push(branch.slice(start, start + 15));
    }
    // Reserve additional area minimums without moving points between drawn branches.
    if (boards.length === 1) while (buckets.length < minimum[t]) buckets.push([]);
    for (const bucket of buckets) {
      const index = circuits.length, id = `auto-c-${index}`, name = `${type} ${circuits.filter(c => c.type === type).length + 1}`;
      const demandVA = type === 'IUG' ? bucket.length * 60 * 2 / 3 : 2200;
      const current = demandVA / settings.voltage, breaker = type === 'IUG' ? 10 : 16;
      const controlRoutes = type === 'IUG' ? routes.filter(r => r.kind === 'control' && bucket.some(p => [r.fromId, r.toId].includes(p.anchor.id))) : [];
      const rolesByRoute = new Map();
      let missingWiring = false, length = 0;
      const addPath = (path, role, net = role, count = 1) => {
        if (!path) { missingWiring = true; return; }
        for (const routeId of path.routeIds) {
          if (!rolesByRoute.has(routeId)) rolesByRoute.set(routeId, new Map());
          const roles = rolesByRoute.get(routeId);
          if (!roles.has(role)) roles.set(role, new Map());
          roles.get(role).set(net, count);
        }
      };
      for (const p of bucket) {
        const neutral = pathBetween(board.id, p.anchor.id);
        if (type === 'TUG') {
          addPath(p, 'phase'); addPath(p, 'neutral'); length = Math.max(length, p.distance); continue;
        }
        const group = topology.groups.find(g => g.lightIds.includes(p.anchor.id));
        const switches = (group?.switchIds ?? []).slice().sort((a,b) => (pathBetween(board.id,a)?.distance ?? Infinity) - (pathBetween(board.id,b)?.distance ?? Infinity) || a.localeCompare(b));
        if (switches.length > 2) { missingWiring = true; continue; }
        const phase = switches.length ? pathBetween(board.id, switches[0]) : neutral;
        const travellers = switches.length === 2 ? pathBetween(switches[0], switches[1]) : null;
        const returned = switches.length ? pathBetween(switches.at(-1), p.anchor.id) : null;
        addPath(phase, 'phase'); addPath(neutral, 'neutral');
        if (switches.length === 2) addPath(travellers, 'traveller', group.id, 2);
        if (switches.length) addPath(returned, 'return', group.id);
        if (phase && neutral && (!switches.length || returned) && (switches.length !== 2 || travellers))
          length = Math.max(length, (phase.distance + neutral.distance + (travellers?.distance ?? 0) + (returned?.distance ?? 0)) / 2);
      }
      for (const roles of rolesByRoute.values()) roles.set('pe', new Map([['pe', 1]]));
      const missingControlHeight = missingWiring;
      const choice = bucket.length && !missingWiring ? selectCable({ current, meters: length, minimum: type === 'IUG' ? 1.5 : 2.5, breaker, settings }) : null;
      const routeIds = [...rolesByRoute.keys()];
      const circuit = { id, name, type, boardId: board.id, departureRouteId: bucket[0]?.routeIds[0] ?? null, pointIds: bucket.map(p => p.anchor.id), routeIds, controlRouteIds: controlRoutes.map(r => r.id), missingControlHeight, demandVA, current, breaker, meters: length, ...choice,
        status: !bucket.length ? 'reserved' : choice ? 'proposal' : 'unresolved' };
      circuits.push(circuit);
      const initialSection = choice?.section ?? (type === 'IUG' ? 1.5 : 2.5);
      for (const [routeId, roles] of rolesByRoute) assignments.get(routeId).push({ circuitId: id, wires: [...roles].map(([role, nets]) => ({ role, count: [...nets.values()].reduce((sum,n) => sum+n, 0), section: role === 'pe' ? Math.max(2.5, initialSection) : initialSection })) });
    }
  }
  for (const g of topology.groups.filter(g => g.switchIds.length)) {
    const controlled = circuits.filter(c => c.type === 'IUG' && c.pointIds.some(id => g.lightIds.includes(id)));
    if (controlled.length > 1) {
      controlled.forEach(c => { c.missingControlHeight = true; });
      warnings.push('Un mismo grupo con llave quedó repartido en varios circuitos: separá sus mandos antes de completar los conductores.');
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
  if (topology.groups.some(g => g.switchIds.length > 2)) warnings.push('Hay mandos de más de dos puntos: revisar cruzamientos y conductores antes de completar ese circuito.');
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
