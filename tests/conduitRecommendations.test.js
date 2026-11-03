import { it, expect } from 'vitest';
import { recommendConduits } from '../src/services/conduitRecommendations';
import { proposeElectrical, withAutomaticConductors, calculatedRouteLength } from '../src/services/automaticDesign';
import { DEFAULT_CALCULATION } from '../src/services/automaticDesign';
import { TECHNICAL_DEFAULTS } from '../src/services/electricalReview';
import { emptyMaterialNetwork } from '../src/services/materialNetwork';
const technicalFixture=()=>({schema:2,levels:[{id:'pb',name:'PB'}],rooms:[{id:'room',name:'Sala',levelId:'pb',x:0,y:0,width:4,depth:3,points:[{id:'outlet',type:'toma',x:.5,y:.5}]}],equipment:[{id:'tg',name:'TG',type:'general',levelId:'pb',x:0,y:0,itemId:''}],feeders:[],materials:{...emptyMaterialNetwork(),calculation:{...DEFAULT_CALCULATION,profile:'cu-pvc-iram-40-v2',technical:structuredClone(TECHNICAL_DEFAULTS)},routes:[{id:'route-outlet',fromId:'tg',toId:'outlet',feederId:null,bends:[],verticalMeters:0,conduit:'',assignments:[]}]}});
import { sketchMaterials } from '../src/services/sketchMaterials';
import { encodeSketch,decodeSketch } from '../src/services/sketch';
const assignment=(count,section=2.5)=>[{wires:[{role:'phase',count,section},{role:'pe',count:1,section:Math.max(2.5,section)}]}];
it('recommends CL19 and RSP16 for 3x2.5 plus PE using the tabulated allowance',()=>{
  expect(recommendConduits(assignment(3))).toEqual({corrugated:'CL19',rigid:'RSP16',method:'table'});
  expect(recommendConduits(assignment(4))).toMatchObject({corrugated:'CL22',rigid:'RSP20'});
});
it('counts returns and travellers, respects minimum pipe dimensions and handles mixed sections conservatively',()=>{
  expect(recommendConduits(assignment(2,1.5))).toMatchObject({corrugated:'CL19',rigid:'RSP16'});
  const a=assignment(2);a[0].wires.push({role:'traveller',count:2,section:1.5});
  expect(recommendConduits(a)).toEqual({corrugated:'CL22',rigid:'RSP20',method:'mixed-fill'});
  expect(recommendConduits([{wires:[{role:'phase',count:1,section:4},{role:'neutral',count:1,section:4}]}],{feeder:true})).toMatchObject({corrugated:'CL22',rigid:'RSP20'});
  expect(recommendConduits(assignment(3),{incomplete:true}).corrugated).toBeNull();
  expect(recommendConduits(assignment(1,240)).rigid).toBeNull();
});
function groundFixture(){
  const s=technicalFixture();s.rooms[0].points=s.rooms[0].points.slice(0,1);s.materials.routes=s.materials.routes.slice(0,1);
  s.equipment.push({id:'tp',name:'TP',type:'principal',levelId:'pb',x:0,y:2,itemId:''},
    {id:'rod-tg',name:'PAT vivienda',type:'jabalina',levelId:'pb',x:3,y:0,itemId:'tp_pat'},
    {id:'rod-tp',name:'PAT servicio',type:'jabalina',levelId:'pb',x:0,y:4,itemId:'pat_servicio'});
  s.feeders.push({id:'f',fromId:'tp',toId:'tg',bends:[],verticalMeters:0,itemId:'measure-only'});
  s.materials.routes.push(...[['feed','tp','tg','f'],['earth-tg','tg','rod-tg',null],['earth-tp','rod-tp','tp',null]].map(([id,fromId,toId,feederId])=>({id,fromId,toId,feederId,bends:[],verticalMeters:0,conduit:'',assignments:[]})));
  return s;
}
it('computes only phase and neutral in TP-TG and separate measured earth conductors without a feeder allowance',()=>{
  const s=groundFixture(), before=JSON.stringify(s), d=proposeElectrical(s);
  expect(d.assignments.get('feed')[0].wires.map(w=>w.role)).toEqual(['phase','neutral']);
  expect(d.earthingCircuits).toHaveLength(2);
  expect(d.earthingCircuits.find(c=>c.boardId==='tg')).toMatchObject({section:4,meters:4.5,status:'proposal'});
  expect(d.earthingCircuits.find(c=>c.boardId==='tp')).toMatchObject({section:4,meters:3.5,status:'proposal'});
  expect(d.assignments.get('earth-tg')[0].wires).toEqual([{role:'earth',count:1,section:4}]);
  expect(d.assignments.get('earth-tp')[0].wires).toEqual([{role:'serviceEarth',count:1,section:4}]);
  const derived=withAutomaticConductors(s,d);
  expect(calculatedRouteLength(derived,derived.materials.routes.find(r=>r.id==='earth-tg'))).toBe(4.5);
  const m=sketchMaterials(s);
  expect(m.rows.find(r=>r.description.startsWith('Conductor Puesta a tierra')).quantity).toBe(4.5);
  expect(m.rows.find(r=>r.description.startsWith('Conductor Tierra de servicio')).quantity).toBe(3.5);
  expect(m.rows.filter(r=>r.description.startsWith('Canalización')).reduce((n,r)=>n+r.quantity,0)).toBeCloseTo(18.5);
  expect(JSON.stringify(s)).toBe(before);expect(decodeSketch(encodeSketch(s))).toEqual(s);
});
it('does not invent missing earth paths and includes drawn bends and manual verticals',()=>{
  const s=groundFixture();s.materials.routes=s.materials.routes.filter(r=>r.id!=='earth-tp');
  const r=s.materials.routes.find(r=>r.id==='earth-tg');r.bends=[{x:0,y:2}];r.verticalMeters=2;
  const d=proposeElectrical(s);expect(d.earthingCircuits[0].meters).toBeCloseTo(2+Math.hypot(3,2)+2);
  expect(d.warnings.some(w=>w.startsWith('TP: no se midió'))).toBe(true);
  expect(d.earthingCircuits.some(c=>c.boardId==='tp')).toBe(false);
});
