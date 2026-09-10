const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const source=file=>fs.readFileSync(path.join(root,file),'utf8');
const difficulty=require('../public/question-difficulty.js');

const CORE_KPS=[
 'kp_virtual_zhi','kp_virtual_er','kp_virtual_yi','kp_virtual_yu','kp_virtual_qi','kp_virtual_ze',
 'sx_001','sx_003','sx_004','sx_005','sx_006','sx_008'
];

function loadAdaptivePack(){
 const context={window:{},Map,Set,Array,Object,Number,String,Math};
 vm.createContext(context);
 vm.runInContext(source('public/question-pack-adaptive-01.js'),context);
 return context.window.ManjingoQuestionPackAdaptive01;
}

function loadReviewedRuntime(){
 const context={window:{},Map,Set,Array,Object,Number,String,Math};
 vm.createContext(context);
 for(const file of [
  'public/question-pack-02.js','public/question-pack-03.js','public/question-pack-lesson.js',
  'public/question-pack-capacity-01.js','public/content-catalog.js',
  'public/question-pack-adaptive-01.js','public/question-difficulty.js'
 ]) vm.runInContext(source(file),context,{filename:file});
 return context.window;
}

test('mastery maps to foundation application and transfer tiers',()=>{
 assert.equal(difficulty.tierForMastery(0),'foundation');
 assert.equal(difficulty.tierForMastery(39),'foundation');
 assert.equal(difficulty.tierForMastery(40),'application');
 assert.equal(difficulty.tierForMastery(74),'application');
 assert.equal(difficulty.tierForMastery(75),'transfer');
 assert.equal(difficulty.tierForMastery(100),'transfer');
});

test('recent mistakes temporarily step difficulty down while intervention modes override mastery',()=>{
 assert.equal(difficulty.tierForMastery(82,{lastCorrect:false}),'application');
 assert.equal(difficulty.tierForMastery(62,{lastCorrect:false}),'foundation');
 assert.equal(difficulty.tierForMastery(95,{mode:'remedial'}),'foundation');
 assert.equal(difficulty.tierForMastery(10,{mode:'reteach'}),'transfer');
});

test('adaptive pack gives every core particle and sentence KP all three tiers',()=>{
 const pack=loadAdaptivePack();
 assert.equal(pack.kind,'adaptive-tiered');
 assert.equal(pack.questions.length,36);
 assert.equal(new Set(pack.questions.map(q=>q.id)).size,36);
 for(const kpId of CORE_KPS){
  const tiers=new Set(pack.questions.filter(q=>q.kpId===kpId).map(q=>q.difficultyTier));
  assert.deepEqual([...tiers].sort(),['application','foundation','transfer']);
 }
 for(const q of pack.questions){
  assert.ok(q.q&&q.explanation&&q.a,`${q.id} needs complete teaching content`);
  assert.ok(Array.isArray(q.o)&&q.o.includes(q.a),`${q.id} answer must be present`);
 }
});

test('tier ranking prefers the target level but lets unseen adjacent material rotate ahead of a repeated exact-tier item',()=>{
 const list=[
  {id:'f',kpId:'k',difficultyTier:'foundation'},
  {id:'a',kpId:'k',difficultyTier:'application'},
  {id:'t',kpId:'k',difficultyTier:'transfer'}
 ];
 const unseen=difficulty.rank(list,{mastery:80,rotation:{recentIds:()=>[]}});
 assert.equal(unseen[0].id,'t');
 const rotated=difficulty.rank(list,{mastery:80,rotation:{recentIds:()=>['t']}});
 assert.equal(rotated[0].id,'a');
});

test('misconception-targeted question stays ahead of difficulty preference',()=>{
 const list=[
  {id:'foundation',kpId:'k',difficultyTier:'foundation'},
  {id:'targeted',kpId:'k',difficultyTier:'transfer'}
 ];
 const ranked=difficulty.rank(list,{mastery:5,preferredIds:['targeted'],rotation:{recentIds:()=>[]}});
 assert.equal(ranked[0].id,'targeted');
});

test('reviewed runtime becomes v2 with 258 questions and concept metadata on tiered questions',()=>{
 const runtime=loadReviewedRuntime(),catalog=runtime.ManjingoContent;
 assert.equal(catalog.catalogVersion,'reviewed-v2');
 assert.equal(catalog.questions.length,258);
 assert.equal(catalog.knowledgePoints.filter(kp=>kp.teachable!==false).length,59);
 const zhi=catalog.questions.find(q=>q.id==='ad1q002');
 const passive=catalog.questions.find(q=>q.id==='ad1q025');
 assert.equal(zhi.difficultyTier,'application');
 assert.equal(zhi.misconceptionKey,'zhi_verb_vs_particle');
 assert.equal(passive.misconceptionKey,'sentence_passive_receiver');
});

test('browser loader and Firestore importer include adaptive tier runtime and metadata',()=>{
 const rotation=source('public/question-rotation.js');
 const importer=source('scripts/import_to_firestore.js');
 assert.match(rotation,/question-pack-adaptive-01\.js/);
 assert.match(rotation,/question-difficulty\.js/);
 assert.match(importer,/question-pack-adaptive-01\.js/);
 assert.match(importer,/question-difficulty\.js/);
 assert.match(importer,/difficultyTier: question\.difficultyTier \|\| null/);
});
