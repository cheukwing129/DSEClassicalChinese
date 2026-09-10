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

test('successful remedial verification is measured as effective without escalating',()=>{
 const result=policy.interventionOutcome([{strategy:'remedial',beforeMastery:90,afterMastery:92,delta:2,accuracy:100,conceptBeforeMastery:60,conceptAfterMastery:69,conceptDelta:9,completedAt:'2026-09-10T12:00:00Z'}],{currentMastery:92});
 assert.equal(result.hasIntervention,true);
 assert.equal(result.strategy,'remedial');
 assert.equal(result.effective,true);
 assert.equal(result.conceptDelta,9);
 assert.equal(result.needsConceptReteach,false);
});

test('failed latest remedial verification escalates to concept reteaching',()=>{
 const result=policy.interventionOutcome([{strategy:'remedial',beforeMastery:55,afterMastery:48,delta:-7,accuracy:50,conceptBeforeMastery:40,conceptAfterMastery:28,conceptDelta:-12,completedAt:'2026-09-10T12:00:00Z'}],{currentMastery:48});
 assert.equal(result.strategy,'remedial');
 assert.equal(result.effective,false);
 assert.equal(result.needsConceptReteach,true);
});

test('newer targeted evidence clears a stale failed remedial escalation',()=>{
 const result=policy.interventionOutcome([
  {strategy:'targeted',delta:8,accuracy:100,completedAt:'2026-09-10T13:00:00Z'},
  {strategy:'remedial',delta:-6,accuracy:50,completedAt:'2026-09-10T12:00:00Z'}
 ],{currentMastery:60});
 assert.equal(result.hasIntervention,false);
 assert.equal(result.needsConceptReteach,false);
});

test('reteach completion is measured but never recursively requests another reteach',()=>{
 const result=policy.interventionOutcome([{strategy:'reteach',delta:-5,accuracy:33,conceptDelta:-8,completedAt:'2026-09-10T12:00:00Z'}],{currentMastery:40});
 assert.equal(result.strategy,'reteach');
 assert.equal(result.effective,false);
 assert.equal(result.needsConceptReteach,false);
});

test('installed policy records strategy and concept outcome metadata on local engine',()=>{
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
 let saved=JSON.parse(store.get('manjingo_progress_cache'));
 assert.equal(saved.practiceHistory[0].strategy,'targeted');
 assert.equal(saved.practiceHistory[1].strategy,'targeted');
 const status=engine.getRemediationStatus('kp_high');
 assert.equal(status.currentMastery,94);
 assert.equal(status.ceilingProtected,true);
 assert.equal(status.needsRemediation,false);
 const remedial=engine.recordPracticeSession({kpId:'kp_high',beforeMastery:94,afterMastery:95,correctCount:2,questionCount:2,strategy:'remedial',conceptKey:'concept_x',conceptLabel:'概念 X',conceptBeforeMastery:70,conceptAfterMastery:78,conceptDelta:8});
 assert.equal(remedial.strategy,'remedial');
 assert.equal(remedial.conceptDelta,8);
 saved=JSON.parse(store.get('manjingo_progress_cache'));
 assert.equal(saved.practiceHistory[0].conceptKey,'concept_x');
 assert.equal(saved.practiceHistory[0].conceptBeforeMastery,70);
 assert.equal(saved.practiceHistory[0].conceptAfterMastery,78);
 assert.equal(engine.getRemediationStatus('kp_high').sessions,0);
 assert.equal(engine.getRemediationStatus('kp_high').remedialEffective,true);
 assert.equal(engine.getRemediationStatus('kp_high').needsConceptReteach,false);
});
