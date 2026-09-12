import {ensureLogin,auth,getCurrentUserId} from './firebase-config.js';
import './practice-outbox.js';

let flushPromise=null;
let retryTimer=null;
const inFlight=new Map();

function withTimeout(promise,ms,label){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(`${label} timeout`)),ms))]);}
async function authorized(path,options={}){
  const uid=await ensureLogin();
  if(!uid||!auth||!auth.currentUser)throw new Error('Firebase authentication unavailable');
  const token=await withTimeout(auth.currentUser.getIdToken(),8000,'Firebase ID token');
  const response=await withTimeout(fetch(path,{...options,headers:{...(options.body?{'content-type':'application/json'}:{}),...(options.headers||{}),authorization:`Bearer ${token}`}}),12000,'practice API');
  let data=null;try{data=await response.json()}catch(_){}
  if(!response.ok){const error=new Error(data&&data.error?data.error:`practice API ${response.status}`);error.status=response.status;throw error}
  return data;
}
function outbox(){return typeof globalThis!=='undefined'?globalThis.ManjingoPracticeOutbox:null}
function retryable(error){const status=Number(error&&error.status)||0;return !status||status===408||status===409||status===425||status===429||status>=500}
function scheduleRetry(uid){
  if(typeof window==='undefined')return;
  if(retryTimer){clearTimeout(retryTimer);retryTimer=null;}
  const box=outbox(),next=box&&box.nextDueAt(uid||getCurrentUserId()||null);if(next==null)return;
  const delay=Math.max(1000,Math.min(300000,(next||Date.now())-Date.now()));
  retryTimer=setTimeout(()=>{retryTimer=null;void flushPracticeOutbox();},delay);
}
async function send(payload){return authorized('/api/practice-session',{method:'POST',body:JSON.stringify(payload)})}
function sendOnce(payload){
  const id=String(payload&&payload.practiceId||'');
  if(id&&inFlight.has(id))return inFlight.get(id);
  const promise=send(payload).finally(()=>{if(id)inFlight.delete(id)});
  if(id)inFlight.set(id,promise);return promise;
}
function emitSynced(payload,result){
  if(typeof window==='undefined'||!result||!result.success)return;
  try{window.dispatchEvent(new CustomEvent('manjingo:practice-sync-complete',{detail:{practiceId:payload&&payload.practiceId||null,payload,result,duplicate:!!result.duplicate}}))}catch(_){}
}
export async function flushPracticeOutbox(options={}){
  if(flushPromise)return flushPromise;
  flushPromise=(async()=>{
    const box=outbox();if(!box)return{synced:0,pending:0};
    const uid=options.uid||getCurrentUserId()||await ensureLogin();
    if(!uid){scheduleRetry(null);return{synced:0,pending:box.pendingCount()};}
    box.bindUnowned(uid);
    const items=box.list({uid,includeUnowned:false,dueOnly:!options.force}),synced=[];
    for(const item of items){
      try{
        const result=await sendOnce(item.payload);
        if(result&&result.success){box.remove(item.practiceId);emitSynced(item.payload,result);synced.push(item.practiceId);continue;}
        throw new Error('practice API did not confirm practice session');
      }catch(error){
        if(retryable(error)){box.markFailure(item.practiceId,error);break;}
        box.remove(item.practiceId);console.warn('discarding permanently rejected queued practice',item.practiceId,error);
      }
    }
    scheduleRetry(uid);
    return{synced:synced.length,pending:box.pendingCount(uid)};
  })().finally(()=>{flushPromise=null;});
  return flushPromise;
}
export async function submitPracticeSession(session){
  const payload={...(session||{})},box=outbox(),queued=box?box.enqueue(payload,getCurrentUserId()):false;
  try{
    const uid=getCurrentUserId()||await ensureLogin();if(box&&uid)box.bindUnowned(uid);
    const result=await sendOnce(payload);
    if(box&&payload.practiceId)box.remove(payload.practiceId);
    emitSynced(payload,result);
    void flushPracticeOutbox();
    return result;
  }catch(error){
    const canRetry=retryable(error);
    if(box&&queued&&payload.practiceId){if(canRetry)box.markFailure(payload.practiceId,error);else box.remove(payload.practiceId);}
    error.queued=!!(queued&&canRetry);
    scheduleRetry(getCurrentUserId());
    throw error;
  }
}
export async function fetchPracticeState(){return authorized('/api/practice-state')}
function installRetry(){
  if(typeof window==='undefined')return;
  window.addEventListener('online',()=>void flushPracticeOutbox({force:true}));
  if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void flushPracticeOutbox();});
  setTimeout(()=>void flushPracticeOutbox({force:true}),0);
}
installRetry();
