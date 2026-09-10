const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const policy=require('../public/learning-policy.js');
const server=require('../functions/learningEngine.js');

function fakeDate(nowIso){const RealDate=Date,fixed=new RealDate(nowIso).getTime();return class FakeDate extends RealDate{constructor(...args){super(...(args.length?args:[fixed]))}static now(){return fixed}}}
function localResult(prev,input){const store=new Map();const initial={totalXp:0,todayXp:0,streak:0,todayDate:'2026-09-10',knowledge:{kp_test:{...prev,misconceptions:{}}},conceptMastery:{},practiceHistory:[]};store.set('manjingo_progress_cache',JSON.stringify(initial));const context={localStorage:{getItem:key=>store.has(key)?store.get(key):null,setItem:(key,value)=>store.set(key,String(value))},Date:fakeDate('2026-09-10T12:00:00.000Z'),console,JSON,Math,Number,String,Object,Array,Map,Set};context.window=context;context.ManjingoContent={questions:[{id:'q_test',kpId:'kp_test',baseXp:8}]};vm.createContext(context);vm.runInContext(read('public/learning-policy.js'),context);vm.runInContext(read('public/local-learning.js'),context);return context.ManjingoLocalLearning.submit('kp_test',input.isCorrect,{questionId:'q_test',attemptCount:input.attemptCount,usedHint:input.usedHint,baseXp:8});}
function comparable(result){return{mastery:result.mastery,status:result.status,quality:result.quality,repetition:result.repetition,interval:result.interval,easeFactor:result.easeFactor,xpEarned:result.xpEarned,attempts:result.attempts,correctCount:result.correctCount,wrongCount:result.wrongCount,hintCount:result.hintCount,lastCorrect:result.lastCorrect};}

const prev={mastery:50,repetition:2,interval:6,easeFactor:2.5,attempts:4,correctCount:3,wrongCount:1,hintCount:0,lastCorrect:true};
const cases=[
 ['first try',{isCorrect:true,attemptCount:1,usedHint:false}],
 ['retry',{isCorrect:true,attemptCount:2,usedHint:false}],
 ['hint',{isCorrect:true,attemptCount:1,usedHint:true}],
 ['wrong',{isCorrect:false,attemptCount:1,usedHint:false}]
];
for(const[name,input]of cases)test(`shared policy parity: ${name}`,()=>{const now=new Date('2026-09-10T12:00:00.000Z'),expected=policy.calculateLearningUpdate({prev,...input,baseXp:8,now}),legacy=server.calculateLearningUpdate({prev,...input,baseXp:8,now}),local=localResult(prev,input);assert.deepEqual(comparable(legacy),comparable(expected));assert.deepEqual(comparable(local),comparable(expected));assert.equal(new Date(local.nextReviewAt).toISOString(),expected.nextReviewAt.toISOString())});

test('Cloudflare worker consumes the shared policy and returns attempt metadata',()=>{const worker=read('public/_worker.js');assert.match(worker,/import '\.\/learning-policy\.js'/);assert.match(worker,/POLICY\.calculateLearningUpdate/);assert.match(worker,/POLICY\.calculateConceptMasteryUpdate/);assert.match(worker,/attempts: update\.attempts/);assert.match(worker,/lastCorrect: update\.lastCorrect/);assert.doesNotMatch(worker,/const masteryDelta = !answer\.isCorrect/)});

test('browser entry points load shared policy before local learning engine',()=>{for(const file of['public/index.html','public/lesson.html']){const html=read(file),policyIndex=html.indexOf('learning-policy.js'),localIndex=html.indexOf('local-learning.js');assert.ok(policyIndex>=0,`${file} missing learning policy`);assert.ok(localIndex>policyIndex,`${file} must load policy before local engine`)}});

test('adaptive correct mastery never stalls below 100',()=>{let mastery=0;for(let i=0;i<30&&mastery<100;i++)mastery=policy.calculateMastery({prevMastery:mastery,isCorrect:true}).mastery;assert.equal(mastery,100)});
