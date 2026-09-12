(function(root,factory){
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
root.ManjingoPracticeOutbox=api;
if(root.window&&root.window!==root)root.window.ManjingoPracticeOutbox=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const KEY='manjingo_practice_outbox_v1';
const VERSION=1;
const BASE_RETRY_MS=5000;
const MAX_RETRY_MS=300000;
function storage(){return root.localStorage||(root.window&&root.window.localStorage)||null}
function read(){const s=storage();if(!s)return{version:VERSION,items:[]};try{const value=JSON.parse(s.getItem(KEY)||'null');return value&&Array.isArray(value.items)?{version:VERSION,items:value.items}:{version:VERSION,items:[]}}catch(_){return{version:VERSION,items:[]}}}
function emit(detail){const target=root.window||root,EventCtor=root.CustomEvent||(root.window&&root.window.CustomEvent);if(target&&typeof target.dispatchEvent==='function'&&typeof EventCtor==='function')try{target.dispatchEvent(new EventCtor('manjingo:practice-outbox-changed',{detail}))}catch(_){}}
function write(data){const s=storage();if(!s)return false;try{s.setItem(KEY,JSON.stringify({version:VERSION,items:Array.isArray(data&&data.items)?data.items:[]}));emit({pending:Array.isArray(data&&data.items)?data.items.length:0});return true}catch(_){return false}}
function normalizePracticeId(value){const id=String(value||'');return /^[A-Za-z0-9_-]{8,128}$/.test(id)?id:''}
function enqueue(payload,uid){if(!payload||typeof payload!=='object')return false;const practiceId=normalizePracticeId(payload.practiceId);if(!practiceId)return false;const data=read(),index=data.items.findIndex(item=>String(item&&item.practiceId)===practiceId),existing=index>=0?data.items[index]:null,item={practiceId,uid:existing&&existing.uid?String(existing.uid):uid?String(uid):null,payload:{...payload,practiceId},queuedAt:existing&&existing.queuedAt||new Date().toISOString(),attempts:Number(existing&&existing.attempts)||0,nextAttemptAt:Number(existing&&existing.nextAttemptAt)||0,lastError:existing&&existing.lastError||null};if(index>=0)data.items[index]=item;else data.items.push(item);return write(data)}
function remove(practiceId){const id=normalizePracticeId(practiceId);if(!id)return false;const data=read(),before=data.items.length;data.items=data.items.filter(item=>String(item&&item.practiceId)!==id);return before!==data.items.length?write(data):false}
function retryDelay(attempts){const count=Math.max(1,Number(attempts)||1);return Math.min(MAX_RETRY_MS,BASE_RETRY_MS*Math.pow(2,Math.min(10,count-1)))}
function markFailure(practiceId,error,now){const id=normalizePracticeId(practiceId);if(!id)return false;const data=read(),index=data.items.findIndex(item=>String(item&&item.practiceId)===id);if(index<0)return false;const item={...data.items[index]},attempts=(Number(item.attempts)||0)+1,base=Number(now)||Date.now();item.attempts=attempts;item.nextAttemptAt=base+retryDelay(attempts);item.lastError=String(error&&error.message||error||'unknown error').slice(0,240);data.items[index]=item;return write(data)}
function bindUnowned(uid){const id=String(uid||'');if(!id)return false;const data=read();let changed=false;data.items=data.items.map(item=>{if(item&&item.uid)return item;changed=true;return{...item,uid:id}});return changed?write(data):false}
function list(options){const opts=options||{},uid=opts.uid==null?null:String(opts.uid),includeUnowned=opts.includeUnowned!==false,dueOnly=!!opts.dueOnly,now=Number(opts.now)||Date.now();return read().items.filter(item=>{if(!item||!item.practiceId)return false;const owner=item.uid==null?null:String(item.uid);if(uid!=null&&owner!==uid&&!(includeUnowned&&owner==null))return false;if(uid==null&&!includeUnowned&&owner==null)return false;if(dueOnly&&Number(item.nextAttemptAt||0)>now)return false;return true}).map(item=>({...item,payload:{...(item.payload||{})}}))}
function pendingCount(uid){return list(uid==null?{}:{uid,includeUnowned:false}).length}
function nextDueAt(uid){const items=list(uid==null?{}:{uid,includeUnowned:false});if(!items.length)return null;return Math.min(...items.map(item=>Math.max(0,Number(item.nextAttemptAt)||0)))}
function clear(){const s=storage();if(!s)return false;try{s.removeItem(KEY);emit({pending:0});return true}catch(_){return false}}
return{KEY,VERSION,BASE_RETRY_MS,MAX_RETRY_MS,enqueue,remove,retryDelay,markFailure,bindUnowned,list,pendingCount,nextDueAt,clear};
});
