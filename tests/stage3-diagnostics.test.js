const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const curriculum=require('../public/curriculum-v1.js');

function memoryStorage(){
  const data=new Map();
  return{
    getItem:key=>data.has(String(key))?data.get(String(key)):null,
    setItem:(key,value)=>data.set(String(key),String(value)),
    removeItem:key=>data.delete(String(key)),
    clear:()=>data.clear()
  };
}

function freshDiagnostics(){
  global.localStorage=memoryStorage();
  global.ManjingoCurriculumV1=curriculum;
  delete global.ManjingoStage3Diagnostics;
  const file=require.resolve('../public/stage3-diagnostics.js');
  delete require.cache[file];
  return require(file);
}

function cleanup(){
  delete global.localStorage;
  delete global.ManjingoCurriculumV1;
  delete global.ManjingoStage3Diagnostics;
  delete global.ManjingoLocalLearning;
}

test.afterEach(cleanup);

test('all 36 Stage 3 questions carry separate core diagnostic provenance',()=>{
  const diagnostics=freshDiagnostics();
  const ids=Object.keys(diagnostics.DIAGNOSTIC_MAP).sort();
  assert.equal(ids.length,36);
  assert.deepEqual(ids,Array.from({length:36},(_,i)=>`tr10q${String(i+1).padStart(3,'0')}`));
  const core=new Set(curriculum.coreSkills().map(x=>x.id));
  const advanced=new Set(curriculum.advancedSkills().map(x=>x.id));
  for(const [questionId,skillIds] of Object.entries(diagnostics.DIAGNOSTIC_MAP)){
    assert.ok(skillIds.length>=1,questionId+' has a diagnostic skill');
    for(const skillId of skillIds){
      assert.ok(core.has(skillId),questionId+' maps only to a core skill');
      assert.equal(advanced.has(skillId),false,questionId+' never reuses Stage 3 identity as diagnosis');
    }
  }
});

test('one noisy Stage 3 miss never becomes a core weakness signal',()=>{
  const diagnostics=freshDiagnostics();
  diagnostics.recordAttempt('tr10q001',false,'2026-09-12T10:00:00Z');
  assert.equal(diagnostics.signals().length,0);
  const signal=diagnostics.signalForSkill('read.logical-relation');
  assert.equal(signal.wrongCount,1);
  assert.equal(signal.eligible,false);
});

test('repeating the same Stage 3 question cannot manufacture a verification candidate',()=>{
  const diagnostics=freshDiagnostics();
  diagnostics.recordAttempt('tr10q001',false,'2026-09-12T10:00:00Z');
  diagnostics.recordAttempt('tr10q001',false,'2026-09-12T10:01:00Z');
  const signal=diagnostics.signalForSkill('read.logical-relation');
  assert.equal(signal.wrongCount,2);
  assert.equal(signal.distinctWrongQuestions,1);
  assert.equal(signal.eligible,false);
});

test('two different Stage 3 misses can request verification without mutating mastery',()=>{
  const diagnostics=freshDiagnostics();
  let masteryWrites=0;
  global.ManjingoLocalLearning={submit(){masteryWrites+=1;}};
  diagnostics.recordAttempt('tr10q001',false,'2026-09-12T10:00:00Z');
  diagnostics.recordAttempt('tr10q002',false,'2026-09-12T10:01:00Z');
  const signals=diagnostics.signals();
  assert.equal(signals.length,1);
  assert.equal(signals[0].skillId,'read.logical-relation');
  assert.equal(signals[0].distinctWrongQuestions,2);
  assert.equal(masteryWrites,0,'soft diagnostic evidence must not call the mastery submit path');
});

test('passing a two-question core verification retires earlier Stage 3 evidence',()=>{
  const diagnostics=freshDiagnostics();
  diagnostics.recordAttempt('tr10q001',false,'2026-09-12T10:00:00Z');
  diagnostics.recordAttempt('tr10q002',false,'2026-09-12T10:01:00Z');
  assert.equal(diagnostics.signals().length,1);
  const verdict=diagnostics.recordVerification('read.logical-relation',{correctCount:2,total:2,at:'2026-09-12T10:05:00Z'});
  assert.equal(verdict.passed,true);
  assert.equal(diagnostics.signals().length,0);
  assert.equal(diagnostics.signalForSkill('read.logical-relation').wrongCount,0);
});

test('failed verification keeps the signal so real core evidence can take over',()=>{
  const diagnostics=freshDiagnostics();
  diagnostics.recordAttempt('tr10q001',false,'2026-09-12T10:00:00Z');
  diagnostics.recordAttempt('tr10q002',false,'2026-09-12T10:01:00Z');
  const verdict=diagnostics.recordVerification('read.logical-relation',{correctCount:1,total:2,at:'2026-09-12T10:05:00Z'});
  assert.equal(verdict.passed,false);
  assert.equal(diagnostics.signals().length,1);
});

test('homepage and lesson wire diagnostics without changing the Stage 3 advanced pack',()=>{
  const theme=fs.readFileSync(path.join(root,'public/theme-runtime.js'),'utf8');
  const lesson=fs.readFileSync(path.join(root,'public/lesson.html'),'utf8');
  const pack=fs.readFileSync(path.join(root,'public/question-pack-transfer-07.js'),'utf8');
  assert.match(theme,/stage3-diagnostics\.js/);
  const localLesson=lesson.indexOf('<script src="./local-lesson.js"></script>');
  const diagnostics=lesson.indexOf('<script src="./stage3-diagnostics.js"></script>');
  const open=lesson.indexOf('window.ManjingoLocalLesson.open');
  assert.ok(localLesson>=0&&diagnostics>localLesson&&open>diagnostics,'diagnostics must patch local lesson before open()');
  assert.match(pack,/skillIds:\['read\.argumentation'\]/);
  assert.match(pack,/skillIds:\['transfer\.short-passage'\]/);
  assert.match(pack,/skillIds:\['transfer\.mixed'\]/);
  assert.doesNotMatch(pack,/diagnosticSkillIds/,'advanced scoring metadata stays separate from diagnostic provenance');
});

test('browser integration exposes a two-question verification route and soft-evidence copy',()=>{
  const source=fs.readFileSync(path.join(root,'public/stage3-diagnostics.js'),'utf8');
  assert.match(source,/verify=stage3/);
  assert.match(source,/\.slice\(0,2\)/);
  assert.match(source,/不會直接降低核心技能掌握度/);
  assert.match(source,/這 2 題才是核心能力證據/);
  assert.match(source,/recordVerification\(skillId/);
  assert.doesNotMatch(source,/MutationObserver/,'diagnostic refresh should stay event-driven and avoid observer feedback loops');
});
