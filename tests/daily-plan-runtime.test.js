const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function load(){const context={window:{},Set,Array,Object,String,Number,Math};vm.createContext(context);vm.runInContext(read('public/daily-plan-runtime.js'),context);return context.window.ManjingoDailyPlanRuntime;}
function q(id,category){return{id,category:category||'new'};}

test('live replan preserves an unanswered current question and replaces only its tail',()=>{
 const runtime=load(),queue=[q('q1','review'),q('q2','weak'),q('old','new')];
 const reservation=runtime.sessionReservation(queue,1,new Set(['q1']),4);
 assert.equal(reservation.current.id,'q2');
 assert.equal(reservation.currentPending,true);
 assert.equal(reservation.remainingSlots,2);
 const merged=runtime.mergeReservation(reservation,[q('q1'),q('q2'),q('q4','review'),q('q5','new'),q('q6','weak')]);
 assert.deepEqual(Array.from(merged.questions,x=>x.id),['q1','q2','q4','q5']);
 assert.deepEqual(Array.from(merged.remaining,x=>x.id),['q2','q4','q5']);
});

test('answered questions are never reinserted and the session target stays capped',()=>{
 const runtime=load(),queue=[q('q1','review'),q('q2','weak'),q('old','new')],completed=new Set(['q1','q2']);
 const reservation=runtime.sessionReservation(queue,1,completed,4);
 assert.equal(reservation.currentPending,false);
 assert.equal(reservation.remainingSlots,2);
 const merged=runtime.mergeReservation(reservation,[q('q2','weak'),q('q3','new'),q('q4','review'),q('q5','new')]);
 assert.deepEqual(Array.from(merged.questions,x=>x.id),['q1','q2','q3','q4']);
 assert.deepEqual(Array.from(merged.remaining,x=>x.id),['q3','q4']);
 assert.equal(new Set(Array.from(merged.questions,x=>x.id)).size,4);
});

test('remaining-plan summary reports live review weak and new counts',()=>{
 const runtime=load(),items=[q('r','review'),q('w1','weak'),q('w2','weak'),q('n','new')],counts=runtime.counts(items);
 assert.deepEqual(JSON.parse(JSON.stringify(counts)),{review:1,weak:2,newKnowledge:1,total:4});
 assert.equal(runtime.summary(items),'剩餘安排：複習 1 · 弱項 2 · 新知識 1');
 assert.equal(runtime.summary([]),'本輪已沒有剩餘題目。');
});

test('homepage replans remaining queue on learning-state changes without resetting the active session',()=>{
 const html=read('public/index.html');
 assert.match(html,/daily-plan-runtime\.js/);
 assert.match(html,/const SESSION_TARGET=10/);
 assert.match(html,/completedQuestionIds\.add\(String\(q\.id\)\)/);
 assert.match(html,/function replanWithCandidates\(candidates,source\)/);
 assert.match(html,/function scheduleRemainingPlanRefresh\(\)/);
 assert.match(html,/function refreshCloudRemainingPlan\(\)/);
 assert.match(html,/manjingo:learning-state-changed/);
 assert.match(html,/剩餘學習已按最新掌握度即時重排/);
 assert.match(html,/id="queueSummary"/);
});
