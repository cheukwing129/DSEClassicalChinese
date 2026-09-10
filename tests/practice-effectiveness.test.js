const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const policy=require('../public/practice-effectiveness.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('high mastery with small gains and strong accuracy is protected from false remediation',()=>{
 const result=policy.evaluate([
  {kpId:'kp',beforeMastery:92,afterMastery:94,delta:2,accuracy:100,strategy:'targeted',completedAt:'2026-09-10T10:00:00Z'},
  {kpId:'kp',beforeMastery:90,afterMastery:92,delta:2,accuracy:80,strategy:'targeted',completedAt:'2026-09-09T10:00:00Z'}
 ],{currentMastery:94});
 assert.equal(result.sessions,2);
 assert.equal(result.totalDelta,4);
 assert.equal(result.highMastery,true);
 assert.equal(result.ceilingProtected,true);
 assert.equal(result.needsRemediation,false);
});

test('low mastery repeated low-yield practice still triggers remediation',()=>{
 const result=policy.evaluate([
  {beforeMastery:35,afterMastery:38,delta:3,accuracy:60,strategy:'targeted'},
  {beforeMastery:33,afterMastery:35,delta:2,accuracy:50,strategy:'targeted'}
 ],{currentMastery:38});
 assert.equal(result.totalDelta,5);
 assert.equal(result.averageAccuracy,55);
 assert.equal(result.needsRemediation,true);
});

test('high mastery with poor practice accuracy can still trigger remediation',()=>{
 const result=policy.evaluate([
  {beforeMastery:91,afterMastery:90,delta:-1,accuracy:60,strategy:'targeted'},
  {beforeMastery:92,afterMastery:91,delta:-1,accuracy:50,strategy:'targeted'}
 ],{currentMastery:90});
 assert.equal(result.highMastery,true);
 assert.equal(result.lowAccuracy,true);
 assert.equal(result.ceilingProtected,false);
 assert.equal(result.needsRemediation,true);
});

test('a remedial intervention resets older targeted low-yield evidence',()=>{
 const result=policy.evaluate([
  {delta:2,accuracy:80,strategy:'targeted',completedAt:'2026-09-10T12:00:00Z'},
  {delta:4,accuracy:100,strategy:'remedial',completedAt:'2026-09-10T11:00:00Z'},
  {delta:2,accuracy:50,strategy:'targeted',completedAt:'2026-09-09T12:00:00Z'},
  {delta:2,accuracy:50,strategy:'targeted',completedAt:'2026-09-08T12:00:00Z'}
 ],{currentMastery:50});
 assert.equal(result.sessions,1);
 assert.equal(result.needsRemediation,false);
});

test('legacy practice records remain valid remediation evidence',()=>{
 const result=policy.evaluate([{delta:3,accuracy:60},{delta:2,accuracy:50}],{currentMastery:40});
 assert.equal(result.sessions,2);
 assert.equal(result.needsRemediation,true);
});

test('installed policy records strategy metadata and patches remediation status on local engine',()=>{
 const store=new Map();
 const context={window:{ManjingoContent:{questions:[]}},localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,String(value))},Date,console,JSON,Math,Number,String,Object,Array,Map,Set};
 vm.createContext(context);
 vm.runInContext(read('public/local-learning.js'),context);
 vm.runInContext(read('public/practice-effectiveness.js'),context);
 const practice=context.ManjingoPracticeEffectiveness,engine=context.window.ManjingoLocalLearning;
 assert.equal(practice.install(),true);
 const first=engine.recordPracticeSession({kpId:'kp_high',beforeMastery:90,afterMastery:92,correctCount:5,questionCount:5,strategy:'targeted'});
 const second=engine.recordPracticeSession({kpId:'kp_high',beforeMastery:92,afterMastery:94,correctCount:5,questionCount:5,strategy:'targeted'});
 assert.equal(first.strategy,'targeted');
 assert.equal(second.strategy,'targeted');
 const saved=JSON.parse(store.get('manjingo_progress_cache'));
 assert.equal(saved.practiceHistory[0].strategy,'targeted');
 assert.equal(saved.practiceHistory[1].strategy,'targeted');
 const status=engine.getRemediationStatus('kp_high');
 assert.equal(status.currentMastery,94);
 assert.equal(status.ceilingProtected,true);
 assert.equal(status.needsRemediation,false);
 const remedial=engine.recordPracticeSession({kpId:'kp_high',beforeMastery:94,afterMastery:95,correctCount:2,questionCount:2,strategy:'remedial'});
 assert.equal(remedial.strategy,'remedial');
 assert.equal(engine.getRemediationStatus('kp_high').sessions,0);
});
