export function switchTopology(sketch) {
  const points = sketch.rooms.flatMap(r => r.points), types = new Map(points.map(p => [p.id, p.type]));
  for (const j of sketch.materials?.junctions ?? []) types.set(j.id, 'junction');
  const routes = sketch.materials?.routes ?? [], graph = new Map([...types].filter(([,t]) => ['luminaria','junction'].includes(t)).map(([id]) => [id, []]));
  for (const r of routes) if (graph.has(r.fromId) && graph.has(r.toId)) { graph.get(r.fromId).push(r.toId); graph.get(r.toId).push(r.fromId); }
  const seen = new Set(), groups = [];
  for (const p of points.filter(p => p.type === 'luminaria')) {
    if (seen.has(p.id)) continue;
    const nodes = [], queue = [p.id]; seen.add(p.id);
    while (queue.length) { const id = queue.pop(); nodes.push(id); for (const n of graph.get(id) ?? []) if (!seen.has(n)) { seen.add(n); queue.push(n); } }
    const switchIds = [...new Set(routes.flatMap(r => nodes.includes(r.fromId) && types.get(r.toId) === 'llave' ? [r.toId] : nodes.includes(r.toId) && types.get(r.fromId) === 'llave' ? [r.fromId] : []))];
    groups.push({ id: `lighting-${groups.length}`, lightIds: nodes.filter(id => types.get(id) === 'luminaria'), switchIds });
  }
  // Direct switch-to-switch links are conventional two-way wiring when one lighting group is involved.
  for (let pass = 0; pass < points.length; pass++) {
    let changed = false;
    for (const r of routes.filter(r => types.get(r.fromId) === 'llave' && types.get(r.toId) === 'llave')) {
      const related = groups.filter(g => g.switchIds.includes(r.fromId) || g.switchIds.includes(r.toId));
      if (related.length !== 1) continue;
      for (const id of [r.fromId,r.toId]) if (!related[0].switchIds.includes(id)) { related[0].switchIds.push(id); changed = true; }
    }
    if (!changed) break;
  }
  const switches = points.filter(p => p.type === 'llave').map(p => {
    const controls = groups.filter(g => g.switchIds.includes(p.id)), gangs = Math.max(1, controls.length);
    const combined = controls.filter(g => g.switchIds.length === 2).length, unsupported = controls.some(g => g.switchIds.length > 2);
    const label = gangs === 1 ? combined ? 'Llave combinada' : 'Llave simple' : gangs === 2 ? 'Llave doble' : gangs === 3 ? 'Llave triple' : `Llave de ${gangs} teclas`;
    return { id: p.id, gangs, combined, unsupported, groupIds: controls.map(g => g.id), label: label + (gangs > 1 && combined ? ` · ${combined} combinada(s)` : '') + (unsupported ? ' · mando de más de dos puntos a revisar' : '') };
  });
  return { groups, switches };
}
