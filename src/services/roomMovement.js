// Translate room-owned route bends, while keeping external runs and other floors fixed.
export function moveRoom(sketch, roomId, x, y) {
  const room = sketch.rooms.find(r => r.id === roomId); if (!room) return;
  const dx = x - room.x, dy = y - room.y;
  const owned = new Set(room.points.map(p => p.id));
  const startLevel = id => sketch.rooms.find(r => r.points.some(p => p.id === id))?.levelId ??
    sketch.equipment?.find(e => e.id === id)?.levelId ?? sketch.materials?.junctions.find(j => j.id === id)?.levelId;
  for (const route of sketch.materials?.routes ?? []) {
    const from = owned.has(route.fromId), to = owned.has(route.toId);
    if (!from && !to) continue;
    const level = startLevel(route.fromId);
    for (const bend of route.bends) {
      const local = (bend.levelId ?? level) === room.levelId;
      const inside = bend.x >= room.x && bend.x <= room.x + room.width && bend.y >= room.y && bend.y <= room.y + room.depth;
      if (local && ((from && to) || inside)) {
        bend.x = Math.round((bend.x + dx) * 1e6) / 1e6;
        bend.y = Math.round((bend.y + dy) * 1e6) / 1e6;
      }
    }
  }
  room.x = x; room.y = y;
}
