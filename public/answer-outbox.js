(function(root,factory){
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
root.ManjingoAnswerOutbox=api;
if(root.window&&root.window!==root)root.window.ManjingoAnswerOutbox=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const KEY='manjingo_answer_outbox_v1';
const VERSION=1;
const BASE_RETRY_MS=5000;
const MAX_RETRY_MS=300000;
function storage(){return root.localStorage||(root.window&&root.window.localStorage)||null}
function nowValue(value){const n=Number(value);return Number.isFinite(n)&&n>0?n:Date.now()}
function answerIdOf(value){return value&&value.answerId!=null?String(value.answerId):''}
function normalizeItem(value){
 const raw=value&&typeof value==='object'?value:{};
 const payload=raw.payload&&typeof raw.payload==='object'?{...raw.payload}:null;
 const answerId=answerIdOf(payload)||String(raw.answerId||'');
 if(!payload||!answerId)return null;
 payload.answerId=answerId;
 return{answerId,uid:raw.uid?String(raw.uid):null,payload,queuedAt:nowValue(raw.queuedAt),attempts:Math.max(0,Number(raw.attempts)||0),nextAttemptAt:Math.max(0,Number(raw.nextAttemptAt)||0),lastError:raw.lastError?String(raw.lastError).slice(0,160):null};
}
function read(){
 const s=storage();if(!s)return[];
 try{const raw=JSON.parse(s.getItem(KEY)||'{}'),source=Array.isArray(raw)?raw:Array.isArray(raw.items)?raw.items:[];const seen=new Set(),items=[];source.forEach(value=>{const item=normalizeItem(value);if(!item||seen.has(item.answerId))return;seen.add(item.answerId);items.push(item)});return items.sort((a,b)=>a.queuedAt-b.queuedAt)}catch(e){return[]}
}
function write(items){const s=storage();if(!s)return false;try{s.setItem(KEY,JSON.stringify({version:VERSION,items:(Array.isArray(items)?items:[]).map(normalizeItem).filter(Boolean)}));emit();return true}catch(e){return false}}
function emit(){const target=root.window||root,EventCtor=root.CustomEvent||(root.window&&root.window.CustomEvent);if(target&&typeof target.dispatchEvent==='function'&&typeof EventCtor==='function'){try{target.dispatchEvent(new EventCtor('manjingo:answer-outbox-changed',{detail:{pending:read().length}}))}catch(e){}}}
function enqueue(payload,uid){
 const answerId=answerIdOf(payload);if(!answerId||!payload||typeof payload!=='object')return false;
 const items=read(),index=items.findIndex(item=>item.answerId===answerId),existing=index>=0?items[index]:null,next={answerId,uid:uid?String(uid):existing&&existing.uid||null,payload:{...payload,answerId},queuedAt:existing?existing.queuedAt:Date.now(),attempts:existing?existing.attempts:0,nextAttemptAt:existing?existing.nextAttemptAt:0,lastError:existing?existing.lastError:null};
 if(index>=0)items[index]=next;else items.push(next);return write(items);
}
function remove(answerId){const id=String(answerId||'');if(!id)return false;const items=read(),next=items.filter(item=>item.answerId!==id);if(next.length===items.length)return true;return write(next)}
function retryDelay(attempts){const n=Math.max(1,Number(attempts)||1);return Math.min(MAX_RETRY_MS,BASE_RETRY_MS*Math.pow(2,Math.min(6,n-1)))}
function markFailure(answerId,error,at){const id=String(answerId||''),items=read(),index=items.findIndex(item=>item.answerId===id);if(index<0)return false;const attempts=items[index].attempts+1,when=nowValue(at);items[index]={...items[index],attempts,nextAttemptAt:when+retryDelay(attempts),lastError:String(error&&error.message||error||'sync failed').slice(0,160)};return write(items)}
function bindUnowned(uid){const id=String(uid||'');if(!id)return false;const items=read();let changed=false;items.forEach(item=>{if(!item.uid){item.uid=id;changed=true}});return changed?write(items):true}
function list(options){const opts=options||{},uid=opts.uid?String(opts.uid):null,includeUnowned=opts.includeUnowned!==false,dueOnly=!!opts.dueOnly,at=nowValue(opts.now);return read().filter(item=>(!uid||item.uid===uid||(includeUnowned&&!item.uid))&&(!dueOnly||!item.nextAttemptAt||item.nextAttemptAt<=at)).map(item=>({...item,payload:{...item.payload}}))}
function pendingCount(uid){return list(uid?{uid,includeUnowned:true}:{}).length}
function nextDueAt(uid){const items=list(uid?{uid,includeUnowned:true}:{});if(!items.length)return null;return Math.min(...items.map(item=>item.nextAttemptAt||0))}
function clear(){const s=storage();if(!s)return false;try{s.removeItem(KEY);emit();return true}catch(e){return false}}
return{KEY,VERSION,BASE_RETRY_MS,MAX_RETRY_MS,enqueue,remove,markFailure,bindUnowned,list,pendingCount,nextDueAt,retryDelay,clear};
});
