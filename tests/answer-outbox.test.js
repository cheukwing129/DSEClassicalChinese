const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function loadOutbox(){
  const data=new Map();
  const localStorage={getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};
  const context={localStorage,Date,Math,JSON,String,Number,Array,Object,Set,Map,CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail},dispatchEvent(){},window:null,module:{exports:{}},exports:{}};
  context.window=context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','public','answer-outbox.js'),'utf8'),context,{filename:'answer-outbox.js'});
  return{api:context.module.exports,localStorage,data};
}

test('answer outbox persists one copy per answerId and preserves original payload for retry',()=>{
  const{api}=loadOutbox();
  const first={answerId:'answer_12345678',kpId:'kp_one',questionId:'q1',isCorrect:true};
  assert.equal(api.enqueue(first,'user-a'),true);
  assert.equal(api.enqueue({...first,isCorrect:false},'user-a'),true);
  const items=api.list({uid:'user-a'});
  assert.equal(items.length,1);
  assert.equal(items[0].answerId,'answer_12345678');
  assert.equal(items[0].payload.answerId,'answer_12345678');
  assert.equal(items[0].payload.isCorrect,false);
  assert.equal(api.pendingCount('user-a'),1);
  assert.equal(api.remove('answer_12345678'),true);
  assert.equal(api.pendingCount('user-a'),0);
});

test('answer outbox applies bounded exponential backoff and only returns due work',()=>{
  const{api}=loadOutbox();
  const now=1700000000000;
  api.enqueue({answerId:'answer_abcdefgh',kpId:'kp_one'},'user-a');
  api.markFailure('answer_abcdefgh',new Error('offline'),now);
  let item=api.list({uid:'user-a'})[0];
  assert.equal(item.attempts,1);
  assert.equal(item.nextAttemptAt,now+5000);
  assert.equal(api.list({uid:'user-a',dueOnly:true,now:now+4999}).length,0);
  assert.equal(api.list({uid:'user-a',dueOnly:true,now:now+5000}).length,1);
  for(let i=0;i<10;i++)api.markFailure('answer_abcdefgh',new Error('offline'),now);
  item=api.list({uid:'user-a'})[0];
  assert.ok(item.nextAttemptAt-now<=api.MAX_RETRY_MS);
  assert.equal(api.retryDelay(99),api.MAX_RETRY_MS);
});

test('unowned offline answers bind once and never cross into a different signed-in account',()=>{
  const{api}=loadOutbox();
  api.enqueue({answerId:'answer_offline01',kpId:'kp_one'},null);
  assert.equal(api.bindUnowned('user-a'),true);
  assert.equal(api.list({uid:'user-a',includeUnowned:false}).length,1);
  assert.equal(api.list({uid:'user-b',includeUnowned:false}).length,0);
  api.bindUnowned('user-b');
  assert.equal(api.list({uid:'user-b',includeUnowned:false}).length,0);
});

test('firebase client queues before submit, retries on reconnect, and reconciles successful background results',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','public','firebase-config.js'),'utf8');
  assert.match(source,/import '\.\/answer-outbox\.js'/);
  const submitStart=source.indexOf('export async function submitAnswer');
  const enqueue=source.indexOf('box.enqueue(payload,currentUserId)',submitStart);
  const send=source.indexOf('sendAnswerOnce(payload)',submitStart);
  assert.ok(enqueue>submitStart&&send>enqueue,'answer must be durable before the first network attempt');
  assert.match(source,/window\.addEventListener\('online',\(\)=>void flushAnswerOutbox\(\{force:true\}\)\)/);
  assert.match(source,/visibilityState==='visible'/);
  assert.match(source,/setTimeout\(\(\)=>void flushAnswerOutbox\(\{force:true\}\),0\)/);
  assert.match(source,/box\.bindUnowned\(uid\)/);
  assert.match(source,/box\.markFailure\(item\.answerId,error\)/);
  assert.match(source,/learning\.syncRemoteResult\(payload\.kpId,result\)/);
  assert.match(source,/error\.queued=!!\(queued&&retryable\)/);
});

test('server answerId idempotency makes retry-after-commit safe',()=>{
  const worker=fs.readFileSync(path.join(__dirname,'..','public','_worker.js'),'utf8');
  assert.match(worker,/answerLogs\/\$\{answer\.answerId\}/);
  assert.match(worker,/if \(logDoc\)/);
  assert.match(worker,/duplicate: true/);
});
