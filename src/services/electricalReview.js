// Versioned engineering assumptions; these checks never certify an installation.
// Diameters: Prysmian Argentina Superastic Jet/Flex, 2020 catalogue, p. 3.
export const CABLE_DIAMETERS = { 1.5: 3, 2.5: 3.6, 4: 4.1, 6: 4.7, 10: 6, 16: 7 };
export const TECHNICAL_DEFAULTS = { reservePercent: 20, extraModules: 2, boards: [], protections: [] };
export const CIRCUIT_CURVES = { B: 5, C: 10, D: 20 };
export const electricalBoardTypes = ['general', 'seccional', 'principal', 'medidor_tp'];
export const reviewKey = c => c.status === 'reserved' ? `reserve:${c.boardId}/${c.id}` : c.sourceBoardId ? `feeder:${c.routeIds[0]}/${c.breaker}` : `${c.boardId}/${c.type}/${c.breaker}/${c.pointIds.slice().sort().join(',')}`;
export function validatePointLoad(load, type) {
  if (!load || type !== 'toma' || !['TUE', 'dedicated'].includes(load.kind) || typeof load.name !== 'string' || !load.name.trim() || load.name.length > 60 ||
      !Number.isFinite(load.powerW) || load.powerW <= 0 || load.powerW > 14000 || !Number.isFinite(load.powerFactor) || load.powerFactor < 0.1 || load.powerFactor > 1)
    throw Error('Revisá el nombre, la potencia absorbida y el factor de potencia de la carga.');
  return { kind: load.kind, name: load.name.trim(), powerW: load.powerW, powerFactor: load.powerFactor };
}
export function validateTechnical(input, sketch) {
  const fail = () => { throw Error('Revisá los datos de cortocircuito, protecciones y tableros.'); };
  const num = (x, min, max) => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max ? x : fail();
  const optional = (x, min, max) => x == null ? null : num(x, min, max);
  if (!input || !Array.isArray(input.boards) || input.boards.length > 50 || !Array.isArray(input.protections) || input.protections.length > 350) fail();
  const seen = new Set(), keys = new Set();
  const boards = input.boards.map(b => {
    if (!sketch.equipment?.some(e => e.id === b.id && electricalBoardTypes.includes(e.type)) || seen.has(b.id) || typeof b.sourceNote !== 'string' || b.sourceNote.length > 160) fail();
    seen.add(b.id);
    const ikMaxKA = optional(b.ikMaxKA, 0.001, 100), ikMinA = optional(b.ikMinA, 1, 100000), enclosureModules = optional(b.enclosureModules, 1, 144);
    if (ikMinA && ikMaxKA && ikMinA > ikMaxKA * 1000 || enclosureModules && !Number.isInteger(enclosureModules)) fail();
    return { id: b.id, ikMaxKA, ikMinA, sourceNote: b.sourceNote.trim(), enclosureModules };
  });
  const protections = input.protections.map(p => {
    if (typeof p.key !== 'string' || !p.key || p.key.length > 2000 || keys.has(p.key) || !Object.hasOwn(CIRCUIT_CURVES, p.curve)) fail();
    if (typeof (p.modelReference ?? '') !== 'string' || (p.modelReference ?? '').length > 120) fail();
    keys.add(p.key);
    return { key: p.key, modelReference:(p.modelReference ?? '').trim(), curve: p.curve, breakingKA: optional(p.breakingKA, 0.1, 100), letThrough: optional(p.letThrough, 1, 1e12), atIkKA:optional(p.atIkKA,0.001,100) };
  });
  const extraModules = num(input.extraModules, 0, 100); if (!Number.isInteger(extraModules)) fail();
  return { reservePercent: num(input.reservePercent, 0, 50), extraModules, boards, protections };
}
export function circuitReviewInputs(sketch, c) {
  const technical = sketch.materials?.calculation?.technical;
  const board = technical?.boards.find(b => b.id === (c.sourceBoardId ?? c.boardId));
  const model = technical?.protections.find(p => p.key === reviewKey(c));
  // A source reference is required: a number without its origin is not verified data.
  return { ikMinA: board?.sourceNote?.trim() ? board.ikMinA : null, ikMaxKA: board?.sourceNote?.trim() ? board.ikMaxKA : null,
    curve: model?.curve ?? 'C', breakingKA: model?.modelReference?.trim() ? model.breakingKA : null, letThrough: board?.sourceNote?.trim() && board.ikMaxKA && model?.modelReference?.trim() && model.atIkKA === board.ikMaxKA ? model?.letThrough ?? null : null };
}
export function minimumEndFault({ voltage, meters, section, ikMinA }) {
  if (![voltage, section, ikMinA].every(n => Number.isFinite(n) && n > 0) || !Number.isFinite(meters) || meters < 0) return null;
  // Conservative phase-neutral scalar impedance sum, warm Cu; not a PE fault-loop test.
  return 0.8 * voltage / (voltage / ikMinA + 2 * 23.7 * meters / (1000 * section));
}
export function conduitSizing(assignments, innerDiameter = null, incomplete = false, minimumDiameter = 0) {
  const wires = assignments.flatMap(a => a.wires);
  if (incomplete || !wires.length || wires.some(w => !CABLE_DIAMETERS[w.section] || !(w.count > 0)))
    return { status: 'pending', minimumInner: null, fillPercent: null, wireCount: wires.reduce((s,w) => s+w.count, 0) };
  const occupied = wires.reduce((s,w) => s + w.count * CABLE_DIAMETERS[w.section] ** 2, 0);
  const exactMinimum = Math.max(minimumDiameter, Math.sqrt(occupied / 0.35));
  return { status: innerDiameter == null ? 'pending' : innerDiameter >= exactMinimum ? 'pass' : 'fail',
    minimumInner: Math.ceil(exactMinimum * 10 - 1e-10) / 10, fillPercent: innerDiameter > 0 ? occupied / innerDiameter ** 2 * 100 : null,
    wireCount: wires.reduce((s,w) => s+w.count, 0) };
}
export function electricalReview(sketch, design, anchors = []) {
  const names = new Map(anchors.map(a=>[a.id,a.name]));
  const technical = design.settings.technical;
  if (!technical) return null;
  const circuits = [...design.feederCircuits, ...design.circuits].map(c => {
    const input = circuitReviewInputs(sketch,c), key = reviewKey(c), minimum = minimumEndFault({ voltage: design.settings.voltage, meters: c.meters, section: c.section, ikMinA: input.ikMinA });
    const selected = c.status === 'proposal';
    return { key, id: c.id, name: c.name, boardId: c.sourceBoardId ?? c.boardId, ...input, minimumFaultA: minimum,
      magneticThreshold: c.breaker ? CIRCUIT_CURVES[input.curve] * c.breaker : null,
      magnetic: !selected || minimum == null ? 'pending' : minimum >= CIRCUIT_CURVES[input.curve] * c.breaker ? 'pass' : 'fail',
      breaking: !selected || !input.ikMaxKA || !input.breakingKA ? 'pending' : input.breakingKA >= input.ikMaxKA ? 'pass' : 'fail',
      requiredBreakingKA: input.ikMaxKA ? [3,4.5,6,10,15,25,36,50,100].find(n => n >= input.ikMaxKA) ?? null : null,
      thermalLimit: c.section ? (115 * c.section) ** 2 : null,
      thermal: !selected || !input.letThrough ? 'pending' : input.letThrough <= (115 * c.section) ** 2 ? 'pass' : 'fail',
      reserved: c.status === 'reserved' };
  });
  const conduits = sketch.materials.routes.map(r => {
    const used = [...design.circuits,...design.feederCircuits].filter(c=>c.routeIds.includes(r.id));
    const sharingInvalid = used.length > 1 && (used.some(c=>!['IUG','TUG'].includes(c.type)) || used.length > 3 ||
      new Set(used.map(c=>c.boardId)).size > 1 || used.reduce((s,c)=>s+(c.breaker ?? Infinity),0)>36 || used.reduce((s,c)=>s+c.pointIds.length,0)>15);
    const size=conduitSizing(design.assignments.get(r.id) ?? [],r.innerDiameter,used.some(c=>c.status==='unresolved'),r.feederId?15:13);
    return {id:r.id,name:`${names.get(r.fromId) ?? 'Origen'} → ${names.get(r.toId) ?? 'Destino'}`,...size,sharingInvalid,status:sharingInvalid?'fail':size.status};
  });
  const boards = (sketch.equipment ?? []).filter(e => electricalBoardTypes.includes(e.type)).map(e => {
    const outgoing = [...design.circuits.filter(c => c.boardId === e.id), ...design.feederCircuits.filter(c => c.sourceBoardId === e.id)];
    const incoming = design.feederCircuits.filter(c => c.boardId === e.id), sum = outgoing.reduce((s,c) => s+c.current,0);
    // Two DIN modules per 2P MCB; one 2P RCD (2 modules); two for the incoming switch.
    const occupiedModules = outgoing.length ? outgoing.length * 2 + 4 + technical.extraModules : 0;
    const minimumModules = outgoing.length ? Math.ceil(occupiedModules / (1 - technical.reservePercent / 100)) : null;
    const proposedModules = minimumModules ? [8,12,18,24,36,48,54,72,96,144].find(n => n >= minimumModules) ?? null : null;
    const entered = technical.boards.find(b => b.id === e.id)?.enclosureModules ?? null;
    const mainBreaker = incoming.length === 1 ? incoming[0].breaker : [16,20,25,32,40,50,63].find(n=>n>=sum) ?? null;
    const rcdRatedA = outgoing.length && incoming.length === 1 && incoming[0].status === 'proposal' && mainBreaker ? [25,40,63,80,100].find(n => n >= mainBreaker) ?? null : null;
    return { id: e.id, name: e.name, circuitCount: outgoing.length, current: sum, occupiedModules, minimumModules, proposedModules, enclosureModules: entered,
      status: !outgoing.length || entered == null ? 'pending' : entered >= minimumModules ? 'pass' : 'fail', mainBreaker, rcdRatedA,
      outsideScope: sum > 63 || (technical.boards.find(b=>b.id===e.id)?.ikMaxKA ?? 0) > 10,
      supplyUnresolved: incoming.length > 1 || incoming.some(c=>c.status !== 'proposal') || sum > 63 || outgoing.some(c=>c.status === 'unresolved') };
  });
  return { circuits, conduits, boards, status: 'partial', warnings: [
    ...conduits.filter(r=>r.sharingInvalid).map(r=>`Conexión ${r.name}: separar cañerías. TUE/dedicados y alimentadores independientes; la excepción de uso general exige mismo tablero, hasta 3 circuitos, suma de térmicas ≤ 36 A y hasta 15 bocas en conjunto.`),
    ...boards.filter(b=>b.outsideScope).map(b=>`${b.name}: demanda mayor a 63 A o Icc mayor a 10 kA, fuera del alcance residencial 770:2017 de esta propuesta.`),
    'Verificación parcial: Icc ingresada en cada tablero; cálculo mínimo fase-neutro resistivo, no verifica falla fase-PE ni tiempos de desconexión de personas.',
    'La energía I²t debe corresponder al modelo, calibre y cortocircuito disponibles. Curvas y poder de corte no prueban selectividad ni respaldo en cascada.',
    'Cañerías: ocupación máxima de diseño 35%, incluyendo aislación, PE, neutros y mandos. Mínimos interiores: 13 mm terminales y 15 mm principales/seccionales; verificar tablas aplicables, diámetro útil real, curvas y tendido.',
    'Tableros: previsión de espacio con térmicas 2P, un diferencial 2P de 30 mA y maniobra de entrada. Extra y reserva son criterios editables; confirmar tipo de diferencial, módulos reales, disipación, IP y PAT. Sin protección de entrada conocida no se asigna calibre al diferencial.',
  ] };
}
