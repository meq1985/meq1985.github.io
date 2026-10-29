import { it, expect } from 'vitest';
import { emptySketch, encodeSketch, decodeSketch } from '../src/services/sketch';
import { emptyMaterialNetwork, materialRouteLength, materialRoutePlanePoints, pruneMaterialNetwork, materialsFromSketch } from '../src/services/materialNetwork';
import { calculatedRouteLength, DEFAULT_CALCULATION, proposeElectrical, withAutomaticConductors } from '../src/services/automaticDesign';
import { switchTopology } from '../src/services/switchTopology';
const edge = (id,fromId,toId,kind='physical') => ({ id,fromId,toId,kind,feederId:null,bends:[],verticalMeters:0,conduit:'',assignments:[] });
const room = (id,levelId,points) => ({ id,levelId,name:id,x:0,y:0,width:4,depth:3,points });
const point = (id,type,x=0,y=0) => ({id,type,x,y});
function fixture() { return { ...emptySketch(), schema:2, levels:[{id:'planta-baja',name:'Baja',elevation:0},{id:'alta',name:'Alta',elevation:3}],
  equipment:[{id:'tg',type:'general',name:'TG',levelId:'planta-baja',x:0,y:0,itemId:''}],feeders:[],
  rooms:[room('r0','planta-baja',[point('a','llave'),point('l0','luminaria',1,1)]),room('r1','alta',[point('b','llave'),point('l1','luminaria',1,1),point('t','toma')])],
  materials:{...emptyMaterialNetwork(),calculation:{...DEFAULT_CALCULATION}} }; }
it('connects upper-floor outlets to a downstairs board and counts floor elevation exactly once', () => {
  const s=fixture(),r=edge('up','tg','t');s.materials.routes=[r];
  expect(materialRouteLength(s,r)).toBe(3);
  expect(calculatedRouteLength(s,r)).toBeCloseTo(6);
  const c=proposeElectrical(s).circuits.find(c=>c.type==='TUG'); expect(c.pointIds).toEqual(['t']);expect(c.meters).toBeCloseTo(6);
  expect(materialsFromSketch(withAutomaticConductors(s)).rows.find(r=>r.description.startsWith('Conductor Fase')).quantity).toBe(6);
  s.levels[1].elevation=3.5;expect(calculatedRouteLength(s,r)).toBeCloseTo(6.5);
  r.verticalMeters=7;expect(calculatedRouteLength(s,r)).toBe(7);expect(materialRouteLength(s,r)).toBe(7);
  expect(decodeSketch(encodeSketch(s))).toEqual(s);
});
it('preserves floor-specific bends, shows each floor segment and rejects unknown or repeated floor visits', () => {
  const s=fixture(),r=edge('up','tg','l1');s.materials.routes=[r];
  r.bends=[{x:1,y:0,levelId:'planta-baja'},{x:1,y:2,levelId:'alta'}];
  expect(materialRouteLength(s,r)).toBeCloseTo(1+2+Math.hypot(3,1)+3);
  expect(materialRoutePlanePoints(s,r,'planta-baja').map(p=>[p.x,p.y])).toEqual([[0,0],[1,0]]);
  expect(materialRoutePlanePoints(s,r,'alta').map(p=>[p.x,p.y])).toEqual([[1,0],[1,2],[4,3]]);
  expect(decodeSketch(encodeSketch(s)).materials.routes[0].bends).toEqual(r.bends);
  r.bends.push({x:2,y:2,levelId:'missing'});expect(()=>encodeSketch(s)).toThrow();
  r.bends.at(-1).levelId='planta-baja';expect(()=>encodeSketch(s)).toThrow();
});
it('identifies two independent switch outputs as a double switch and computes their separate returns', () => {
  const s=fixture();s.materials.routes=[edge('feed','tg','a'),edge('c0','a','l0','control'),edge('c1','a','l1','control')];
  // Avoid a zero-length feed so it is a real supply path.
  s.equipment[0].x=1;
  const t=switchTopology(s).switches.find(k=>k.id==='a');expect(t.gangs).toBe(2);expect(t.label).toBe('Llave doble');
  const design=proposeElectrical(s),c=design.circuits.find(c=>c.type==='IUG');expect(c.pointIds).toHaveLength(2);expect(c.section).toBeDefined();
  for(const id of ['c0','c1']) expect(design.assignments.get(id)[0].wires.find(w=>w.role==='return').count).toBe(1);
  expect(materialsFromSketch(withAutomaticConductors(s)).rows.some(r=>r.description.startsWith('Llave doble'))).toBe(true);
});
it.each(['luminaire','switch'])('identifies combined switches on different floors and counts two travellers (supply=%s)', supply => {
  const s=fixture();s.equipment[0].x=1;
  s.materials.routes=[edge('feed','tg',supply==='luminaire'?'l0':'a'),edge('ca','a','l0','control'),edge('cb','b','l0','control')];
  const t=switchTopology(s);expect(t.switches.filter(k=>k.combined===1)).toHaveLength(2);
  const d=proposeElectrical(s),c=d.circuits.find(c=>c.type==='IUG');expect(c.pointIds).toEqual(['l0']);expect(c.section).toBeDefined();
  expect(d.assignments.get('cb')[0].wires.find(w=>w.role==='traveller').count).toBe(2);
  expect(d.assignments.get('cb')[0].wires.some(w=>w.role==='return')).toBe(true);
  expect(d.assignments.get('ca')[0].wires.find(w=>w.role==='traveller').count).toBe(2);
  expect(d.assignments.get('ca')[0].wires.some(w=>w.role==='phase')).toBe(supply==='luminaire');
  const rows=materialsFromSketch(withAutomaticConductors(s)).rows;expect(rows.find(r=>r.description.startsWith('Llave combinada')).quantity).toBe(2);
});
it('supports conventional switch-to-switch travellers followed by luminaires', () => {
  const s=fixture();s.equipment[0].x=1;s.materials.routes=[edge('f','tg','a'),edge('ab','a','b'),edge('bl','b','l1','control')];
  const d=proposeElectrical(s);expect(switchTopology(s).switches.filter(k=>k.combined===1)).toHaveLength(2);
  expect(d.assignments.get('ab')[0].wires.find(w=>w.role==='traveller').count).toBe(2);
  expect(d.assignments.get('bl')[0].wires.some(w=>w.role==='return')).toBe(true);
});
it('removes cross-floor routes when their endpoint floor is deleted', () => {
  const s=fixture();s.materials.routes=[edge('up','tg','t')];s.levels.pop();s.rooms=s.rooms.filter(r=>r.levelId==='planta-baja');pruneMaterialNetwork(s);
  expect(s.materials.routes).toHaveLength(0);
});
