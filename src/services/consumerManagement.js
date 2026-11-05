import { collection,getDocsFromServer,query,orderBy,limit,startAfter } from 'firebase/firestore';
import { getFunctions,httpsCallable } from 'firebase/functions';
import { auth,db } from '../firebase';
import { requireUser,assertCurrentUser } from '../firebase/session';
export const submitConsumerManagement=data=>httpsCallable(getFunctions(auth.app,'us-central1'),'submitConsumerManagement')(data).then(r=>r.data);
export async function loadConsumerRequests(cursor=null){const user=await requireUser();const terms=[orderBy('createdAt','desc'),limit(20)];if(cursor)terms.push(startAfter(cursor));const result=await getDocsFromServer(query(collection(db,'gestionesConsumo'),...terms));assertCurrentUser(user);return {rows:result.docs.map(d=>({id:d.id,...d.data(),createdAt:d.data().createdAt?.toMillis?.() ?? null})),cursor:result.docs.at(-1)??null,hasMore:result.size===20};}
export async function updateConsumerRequest(id,status){const user=await requireUser();const result=await httpsCallable(getFunctions(auth.app,'us-central1'),'updateConsumerManagement')({id,status});assertCurrentUser(user);return result.data;}
