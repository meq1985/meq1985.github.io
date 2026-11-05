import {test} from 'node:test';import assert from 'node:assert/strict';
import {submitConsumerRequest,validConsumerRequest} from '../consumerRequests.js';
const data={kind:'baja',requestId:'12345678-1234-1234-1234-123456789abc',email:'owner@example.invalid',reference:'',message:'',token:'test'};
const Timestamp={fromMillis:n=>({toMillis:()=>n})};
test('validates public requests and performs no storage before challenge validation',async()=>{
 assert.equal(validConsumerRequest(data),true);for(const patch of [{kind:'delete-account'},{email:'invalid'},{message:'x'.repeat(501)},{token:''},{requestId:'../../bad'}])assert.equal(validConsumerRequest({...data,...patch}),false);
 let reads=0;await assert.rejects(submitConsumerRequest({data,secret:'private',db:{doc(){reads++;}},verify:async()=>false}));assert.equal(reads,0);
});
test('issues an idempotent receipt, keeps request details private and bounds abuse counters',async()=>{
 const records=new Map();const db={doc:p=>p,runTransaction:fn=>fn({get:async p=>({exists:records.has(p),data:()=>records.get(p)}),set:(p,v)=>records.set(p,v)})};
 const input={data,secret:'private',ip:'192.0.2.1',db,Timestamp,verify:async()=>true,now:1000};
 const first=await submitConsumerRequest(input);assert.equal(first.status,'received');assert.ok(first.receipt.startsWith('EX-'));
 assert.deepEqual(await submitConsumerRequest(input),first);
 assert.equal(records.get('registrationLimits/consumer-global').count,1);
 assert.equal([...records.keys()].some(p=>p.includes(input.ip)),false);
 const saved=records.get('gestionesConsumo/'+data.requestId);assert.equal(saved.email,data.email);assert.equal('token' in saved,false);assert.equal('ip' in saved,false);
 await assert.rejects(submitConsumerRequest({...input,data:{...data,email:'another@example.invalid'}}),/conflict/);
 for(let n=1;n<=4;n++)await submitConsumerRequest({...input,data:{...data,requestId:`12345678-1234-1234-1234-123456789ab${n}`}});
 await assert.rejects(submitConsumerRequest({...input,data:{...data,requestId:'12345678-1234-1234-1234-123456789ab9'}}),/registration-limit/);
});
