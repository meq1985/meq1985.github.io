import { it, expect } from 'vitest';
import { encodeSketch, decodeSketch } from '../src/services/sketch';
import { DEFAULT_CALCULATION, proposeElectrical } from '../src/services/automaticDesign';
import { TECHNICAL_DEFAULTS, conduitSizing, minimumEndFault, reviewKey } from '../src/services/electricalReview';
import { emptyMaterialNetwork, pruneMaterialNetwork } from '../src/services/materialNetwork';
import { sketchMaterials } from '../src/services/sketchMaterials';
export function technicalFixture() {
  return {schema:2,levels:[{id:'pb',name:'PB'}],rooms:[{id:'room',name:'Sala',levelId:'pb',x:0,y:0,width:4,depth:3,points:[
    {id:'outlet',type:'toma',x:0.5,y:0.5},
    {id:'air',type:'toma',x:1,y:1,load:{kind:'TUE',name:'Climatización',powerW:2800,powerFactor:0.8}},
    {id:'oven',type:'toma',x:0,y:1,load:{kind:'dedicated',name:'Horno',powerW:4000,powerFactor:1}},
  ]}],equipment:[{id:'tg',name:'TG',type:'general',levelId:'pb',x:0,y:0,itemId:''}],feeders:[],
  materials:{...emptyMaterialNetwork(),calculation:{...DEFAULT_CALCULATION,profile:'cu-pvc-iram-40-v2',technical:structuredClone(TECHNICAL_DEFAULTS)},
    routes:['outlet','air','oven'].map(id=>({id:'route-'+id,fromId:'tg',toId:id,feederId:null,bends:[],verticalMeters:0,conduit:'',assignments:[]}))}};
}
const configure = (s, values={}) => s.materials.calculation.technical.boards.push({id:'tg',ikMaxKA:6,ikMinA:1000,sourceNote:'Informe de red de ejemplo',enclosureModules:null,...values});
it('separates special loads from TUG, uses absorbed W/pf and includes every load in the feeder',()=>{
  const s=technicalFixture();s.equipment.push({id:'tp',name:'TP',type:'principal',levelId:'pb',x:0,y:2,itemId:''});
  s.feeders.push({id:'feed',fromId:'tp',toId:'tg',bends:[],verticalMeters:0,itemId:'measure-only'});
  s.materials.routes.push({id:'route-feed',fromId:'tp',toId:'tg',feederId:'feed',bends:[],verticalMeters:0,conduit:'',assignments:[]});
  const d=proposeElectrical(s), tug=d.circuits.find(c=>c.type==='TUG'), tue=d.circuits.find(c=>c.type==='TUE'), dedicated=d.circuits.find(c=>c.type==='otro');
  expect(tug.pointIds).toEqual(['outlet']);expect(tug.demandVA).toBe(150);
  expect(tue.pointIds).toEqual(['air']);expect(tue.demandVA).toBe(3500);expect(tue.breaker).toBe(16);
  expect(dedicated.pointIds).toEqual(['oven']);expect(dedicated.current).toBeCloseTo(18.1818,3);expect(dedicated.breaker).toBe(20);
  expect(d.feederCircuits[0].demandVA).toBeCloseTo(7650);expect(d.feederCircuits[0].sourceBoardId).toBe('tp');
  expect(d.review.boards.find(b=>b.id==='tg').rcdRatedA).toBe(40);
  expect(d.review.boards.find(b=>b.id==='tp')).toMatchObject({circuitCount:1,hasRcd:false,hasSeparateMain:false,occupiedModules:2,minimumModules:3,proposedModules:4,rcdRatedA:null});
  const materials=sketchMaterials(s);
  expect(materials.rows.filter(r=>r.description.startsWith('Diferencial ·'))).toHaveLength(1);
  expect(materials.rows.find(r=>r.description.startsWith('Diferencial ·')).description).toContain('TG');
  const tpMain=materials.rows.filter(r=>r.description.startsWith('Interruptor general · TP'));
  expect(tpMain).toHaveLength(1);expect(tpMain[0].description).toContain('termomagnética 2P');
  expect(materials.rows.filter(r=>r.description.startsWith('Interruptor general · TG'))).toHaveLength(1);
  expect(materials.rows.some(r=>r.description.includes('Maniobra de entrada'))).toBe(false);
  expect(materials.warnings.some(w=>w.includes('selectividad TP–TG pendiente'))).toBe(true);
  expect(materials.warnings.some(w=>w.includes('Confirmar protección por Clase II'))).toBe(true);
  // A combined meter/TP uses the same component and module rules.
  s.equipment.find(e=>e.id==='tp').type='medidor_tp';
  expect(proposeElectrical(s).review.boards.find(b=>b.id==='tp')).toMatchObject({hasRcd:false,occupiedModules:2});
});
it('keeps a minimum TUE demand and refuses to disguise an over-32A TUE as a valid circuit',()=>{
  const s=technicalFixture();s.rooms[0].points[1].load.powerW=100;
  expect(proposeElectrical(s).circuits.find(c=>c.type==='TUE').demandVA).toBe(3300);
  s.rooms[0].points[1].load.powerW=8000;
  const d=proposeElectrical(s),c=d.circuits.find(c=>c.type==='TUE');
  expect(c.status).toBe('unresolved');expect(c.breaker).toBeNull();expect(c.section).toBeUndefined();
  expect(d.assignments.get('route-air')).toEqual([]);expect(d.review.conduits.find(r=>r.id==='route-air').status).toBe('pending');
});
it('preserves old drawings and user-selected TUG demand rather than silently replacing their assumptions',()=>{
  const s=technicalFixture();delete s.materials.calculation.technical;delete s.rooms[0].points[1].load;
  s.materials.calculation.profile='cu-pvc-b1-v1';
  expect(proposeElectrical(s).review).toBeNull();
  expect(decodeSketch(encodeSketch(s)).materials.calculation.profile).toBe('cu-pvc-b1-v1');
  expect(proposeElectrical(s).circuits.filter(c=>c.type==='TUG').reduce((n,c)=>n+c.demandVA,0)).toBe(300);
});
it('does not invent source fault levels or turn missing model data into passing checks',()=>{
  const s=technicalFixture();const noData=proposeElectrical(s).review.circuits.find(c=>!c.reserved);
  expect(noData.minimumFaultA).toBeNull();expect(noData.breaking).toBe('pending');expect(noData.thermal).toBe('pending');
  configure(s,{sourceNote:''});expect(proposeElectrical(s).review.circuits.find(c=>!c.reserved).minimumFaultA).toBeNull();
});
it('computes the minimum phase-neutral fault using source impedance and both warm conductors',()=>{
  // U=220, source Z=0.22 ohm, warm loop 0.474 ohm: 176/0.694.
  expect(minimumEndFault({voltage:220,meters:25,section:2.5,ikMinA:1000})).toBeCloseTo(253.6023,3);
  expect(minimumEndFault({voltage:220,meters:25,section:2.5,ikMinA:null})).toBeNull();
});
it('checks actual breaking capacity and resizes by manufacturer let-through without assuming a trip time',()=>{
  const s=technicalFixture();configure(s);
  const circuit=proposeElectrical(s).circuits.find(c=>c.type==='TUG');
  s.materials.calculation.technical.protections.push({key:reviewKey(circuit),modelReference:'Protección de ejemplo',curve:'C',breakingKA:4.5,letThrough:150000,atIkKA:6});
  const d=proposeElectrical(s),selected=d.circuits.find(c=>c.type==='TUG'),check=d.review.circuits.find(c=>c.id===selected.id);
  expect(selected.section).toBe(4);expect(check.thermalLimit).toBe(211600);expect(check.thermal).toBe('pass');expect(check.breaking).toBe('fail');expect(check.requiredBreakingKA).toBe(6);
  expect(check.magnetic).toBe('pass');
});
it('does not reuse a model against a different circuit when automatic circuit indices change',()=>{
  const s=technicalFixture();configure(s);const c=proposeElectrical(s).circuits.find(c=>c.type==='TUG');
  const key=reviewKey(c);s.materials.calculation.technical.protections.push({key,modelReference:'Protección de ejemplo',curve:'B',breakingKA:10,letThrough:1000,atIkKA:6});
  s.rooms[0].points[0].load={kind:'dedicated',name:'Otra carga',powerW:1000,powerFactor:1};
  const changed=proposeElectrical(s).review.circuits.filter(c=>!c.reserved);
  expect(changed.every(c=>c.key!==key&&c.breakingKA===null)).toBe(true);
});
it('rejects a circuit when even the source cannot assure the selected magnetic trip',()=>{
  const s=technicalFixture();configure(s,{ikMinA:100});
  const c=proposeElectrical(s).circuits.find(c=>c.type==='TUG');
  expect(c.status).toBe('unresolved');expect(c.section).toBeUndefined();
});
it('sizes conduit with insulated diameters for every conductor, including PE, returns and travellers',()=>{
  const a=[{wires:[{role:'phase',count:1,section:2.5},{role:'neutral',count:1,section:2.5},{role:'pe',count:1,section:2.5}]}];
  expect(conduitSizing(a,10)).toMatchObject({minimumInner:10.6,wireCount:3,status:'fail'});
  expect(conduitSizing(a,11)).toMatchObject({status:'pass'});
  expect(conduitSizing(a).status).toBe('pending');expect(conduitSizing(a,20,true).status).toBe('pending');
  a[0].wires.push({role:'traveller',count:2,section:1.5},{role:'return',count:1,section:1.5});
  expect(conduitSizing(a,11).wireCount).toBe(6);expect(conduitSizing(a,11).minimumInner).toBeGreaterThan(11);
  a[0].wires.push({role:'phase',count:1,section:240});expect(conduitSizing(a,100).minimumInner).toBeNull();
});
it('counts module reserve as free cabinet capacity and reports insufficient enclosures',()=>{
  const s=technicalFixture();configure(s,{enclosureModules:12});
  const b=proposeElectrical(s).review.boards[0];
  expect(b.circuitCount).toBe(4);expect(b.occupiedModules).toBe(14);expect(b.minimumModules).toBe(18);expect(b.proposedModules).toBe(18);expect(b.status).toBe('fail');
  s.materials.calculation.technical.boards[0].enclosureModules=24;expect(proposeElectrical(s).review.boards[0].status).toBe('pass');
});
it('round-trips new inputs, prunes deleted boards, and rejects malformed or inconsistent technical data',()=>{
  const s=technicalFixture();configure(s);s.materials.routes[0].innerDiameter=13;
  expect(decodeSketch(encodeSketch(s))).toEqual(s);
  s.materials.calculation.technical.boards[0].ikMinA=7000;expect(()=>encodeSketch(s)).toThrow();
  s.materials.calculation.technical.boards[0].ikMinA=500;s.rooms[0].points[1].load.powerFactor=0;expect(()=>encodeSketch(s)).toThrow();
  s.rooms[0].points[1].load.powerFactor=0.8;s.equipment=[];pruneMaterialNetwork(s);
  expect(s.materials.calculation.technical.boards).toEqual([]);expect(()=>encodeSketch(s)).not.toThrow();
});
it('propagates conduit and cabinet results into materials without mutating the stored sketch',()=>{
  const s=technicalFixture();configure(s,{enclosureModules:4});s.materials.routes[0].innerDiameter=5;
  const before=JSON.stringify(s),materials=sketchMaterials(s);
  expect(JSON.stringify(s)).toBe(before);
  expect(materials.rows.some(r=>r.description.includes('corrugado CL') && r.description.includes('aislante rígido RSP'))).toBe(true);
  expect(materials.rows.some(r=>r.description.includes('Termomagnética 2P'))).toBe(true);
  expect(materials.rows.filter(r=>r.description.startsWith('Diferencial ·'))).toHaveLength(1);
  expect(materials.rows.filter(r=>r.description.startsWith('Canalización')).every(r=>r.pending)).toBe(true);
  expect(materials.warnings.some(w=>w.includes('gabinete no alcanza'))).toBe(true);
});

it('requires a dedicated classification for a load above the 20 A TUE outlet rating',()=>{const s=technicalFixture();s.rooms[0].points[1].load={kind:'TUE',name:'Carga grande',powerW:5000,powerFactor:1};expect(proposeElectrical(s).circuits.find(c=>c.type==='TUE').status).toBe('unresolved');s.rooms[0].points[1].load.kind='dedicated';expect(proposeElectrical(s).circuits.find(c=>c.name.includes('Carga grande')).breaker).toBe(25);});
it('invalidates manufacturer energy data after a new fault level or breaker rating',()=>{const s=technicalFixture();configure(s);const c=proposeElectrical(s).circuits.find(c=>c.type==='otro');s.materials.calculation.technical.protections.push({key:reviewKey(c),modelReference:'Protección de ejemplo',curve:'C',breakingKA:10,letThrough:1000,atIkKA:6});expect(proposeElectrical(s).review.circuits.find(r=>r.name.includes('Horno')).thermal).toBe('pass');s.materials.calculation.technical.boards[0].ikMaxKA=10;expect(proposeElectrical(s).review.circuits.find(r=>r.name.includes('Horno')).thermal).toBe('pending');s.rooms[0].points[2].load.powerW=6000;const changed=proposeElectrical(s).review.circuits.find(r=>r.name.includes('Horno'));expect(changed.breakingKA).toBeNull();expect(changed.thermal).toBe('pending');});

it('flags forbidden conduit sharing even when the geometric fill is low',()=>{const s=technicalFixture();s.materials.junctions.push({id:'j',name:'Caja',levelId:'pb',x:1,y:1});s.materials.routes.forEach(r=>r.fromId='j');s.materials.routes.push({id:'shared',fromId:'tg',toId:'j',feederId:null,bends:[],verticalMeters:0,conduit:'',innerDiameter:50,assignments:[]});const d=proposeElectrical(s),r=d.review.conduits.find(r=>r.id==='shared');expect(r.corrugated).toBeTruthy();expect(r.sharingInvalid).toBe(true);expect(r.status).toBe('fail');expect(d.review.warnings.some(w=>w.includes('separar cañerías'))).toBe(true);});
it('applies the 13 mm terminal and 15 mm feeder minimums in the engineering review',()=>{const s=technicalFixture();s.materials.routes[0].innerDiameter=11;const r=proposeElectrical(s).review.conduits.find(r=>r.id==='route-outlet');expect(r.minimumInner).toBe(13);expect(r.status).toBe('proposal');expect(r).toMatchObject({corrugated:'CL19',rigid:'RSP16'});expect(conduitSizing([{wires:[{role:'phase',count:3,section:1.5}]}],14,false,15).status).toBe('fail');});
