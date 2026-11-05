import { createHmac } from 'node:crypto';
import { registrationCounter,verifyRegistration } from './registration.js';
export function validConsumerRequest(data){return ['baja','arrepentimiento'].includes(data?.kind) && /^[a-f0-9-]{36}$/i.test(data?.requestId ?? '') && typeof data.email==='string' && data.email.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) && typeof data.reference==='string' && data.reference.length<=100 && typeof data.message==='string' && data.message.length<=500 && typeof data.token==='string' && data.token.length>0 && data.token.length<=2048;}
export async function submitConsumerRequest({data,ip,secret,db,Timestamp,verify=(s,t)=>verifyRegistration(s,t,undefined,'consumer_request'),now=Date.now()}){
  if(!validConsumerRequest(data) || !await verify(secret,data.token))throw Error('invalid-request');
  const email=data.email.trim().toLowerCase(),ref=db.doc(`gestionesConsumo/${data.requestId}`);
  const receipt=`EX-${data.requestId.toUpperCase()}`;
  const hash=createHmac('sha256',secret).update('consumer:'+ (ip || 'unknown')).digest('hex');
  await db.runTransaction(async tx=>{
    const [existing,global,address]=await Promise.all([tx.get(ref),tx.get(db.doc('registrationLimits/consumer-global')),tx.get(db.doc('registrationLimits/request-ip-'+hash))]);
    if(existing.exists){if(existing.data().email!==email || existing.data().kind!==data.kind)throw Error('request-conflict');return;}
    const g=registrationCounter(global.data(),now,100),a=registrationCounter(address.data(),now,5);
    tx.set(db.doc('registrationLimits/consumer-global'),{count:g.count,startedAt:Timestamp.fromMillis(g.startedAt)});
    tx.set(db.doc('registrationLimits/request-ip-'+hash),{count:a.count,startedAt:Timestamp.fromMillis(a.startedAt),expiresAt:Timestamp.fromMillis(now+7*86400000)});
    tx.set(ref,{kind:data.kind,email,reference:data.reference.trim(),message:data.message.trim(),receipt,status:'received',createdAt:Timestamp.fromMillis(now),updatedAt:Timestamp.fromMillis(now)});
  });
  return {receipt,status:'received'};
}
