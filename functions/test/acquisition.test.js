import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordAcquisition } from '../acquisition.js';
function fixture() {
  const records=new Map();
  const db={doc:path=>path,runTransaction:async operation=>operation({get:async path=>({exists:records.has(path),data:()=>records.get(path)}),set:(path,data)=>records.set(path,{...records.get(path),...data})})};
  return {records,record:(stage,uid='new-account')=>recordAcquisition({db,uid,stage,now:Date.UTC(2026,10,4)})};
}
test('counts unique confirmed stages without storing email or project data',async()=>{
  const f=fixture();for(const stage of ['registrations','trials','firstProjects','firstSubscriptions']) {assert.equal(await f.record(stage),true);assert.equal(await f.record(stage),false);}
  assert.deepEqual(f.records.get('acquisitionDays/2026-11-04'),{registrations:1,trials:1,firstProjects:1,firstSubscriptions:1});
  assert.equal(Object.keys(f.records.get('acquisitionAccounts/new-account')).length,4);
});
test('does not count older users, administrator or QA accounts, even disabled QA',async()=>{
  const f=fixture();assert.equal(await f.record('trials'),false);assert.equal(await f.record('firstProjects'),false);
  f.records.set('administradores/admin',{enabled:true});f.records.set('billingTesters/qa',{enabled:false});
  assert.equal(await f.record('registrations','admin'),false);assert.equal(await f.record('registrations','qa'),false);assert.equal(f.records.has('acquisitionDays/2026-11-04'),false);
});
test('rejects arbitrary milestones and invalid identity',async()=>{
  const f=fixture();await assert.rejects(()=>f.record('purchase'));await assert.rejects(()=>f.record('registrations',''));
});
