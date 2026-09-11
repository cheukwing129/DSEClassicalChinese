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
const LATER_STAGE_KPS=[
 'kp_p3_translation','kp_theme_001',
 'kp_yueyang_emotion','kp_chushi_loyalty','kp_chushi_reward','kp_chushi_experience','kp_fish_shame','kp_caogui_trust','kp_caogui_strategy','kp_zouji_selfknowledge','kp_taohua_society','kp_maqianli_ignorance',
 'kp_argument_001','kp_argument_002','kp_argument_003','kp_p3_argument','kp_yueyang_scene','kp_fish_righteousness','kp_shengyou_adversity','kp_shengyou_country','kp_zouji_remonstrance','kp_loushi_character','kp_ai_lotus_symbol','kp_ai_lotus_contrast','kp_maqianli_talent','kp_xiaoshi_pool','kp_xiaoshi_mood'
];
const COMPLETION_KPS=[
 'kp_yueyang_001','kp_yueyang_004','gj_004','gj_005','cy_004','cy_006','kp_translation_001',
 'kp_yueyang_context','kp_taohua_discovery','kp_loushi_allusion',
 'kp_p3_zhi','kp_p3_er','kp_p3_yi','kp_p3_yu','kp_p3_qi','kp_p3_judgment','kp_p3_passive','kp_p3_fronting','kp_p3_adverbial','kp_p3_ellipsis'
];
const STAGE1_FUNCTION_KPS=['kp_virtual_wei','kp_virtual_zhe','kp_virtual_suo','kp_virtual_ye'];
const STAGE1_READING_KPS=['kp_read_sentence_core','kp_read_context_clues','kp_read_logical_relation','kp_syn_negative_patterns'];

function loadAdaptivePack(file,key){
 const context={window:{},Map,Set,Array,Object,Number,String,Math};
 vm.createContext(context);
 vm.runInContext(source(file),context);
 return context.window[key];
}

function loadReviewedRuntime(){
 const context={window:{},Map,Set,Array,Object,Number,String,Math};
 vm.createContext(context);
 for(const file of [
  'public/question-pack-02.js','public/question-pack-03.js','public/question-pack-lesson.js',
  'public/question-pack-capacity-01.js','public/question-pack-transfer-01.js','public/question-pack-transfer-03.js','public/question-pack-transfer-04.js','public/content-catalog.js',
  'public/question-pack-adaptive-01.js','public/question-pack-adaptive-02.js','public/question-pack-adaptive-03.js','public/question-difficulty.js'
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
 const pack=loadAdaptivePack('public/question-pack-adaptive-01.js','ManjingoQuestionPackAdaptive01');
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

test('later-stage pack adds only purposeful transfer questions and explicit existing-question tiers',()=>{
 const pack=loadAdaptivePack('public/question-pack-adaptive-02.js','ManjingoQuestionPackAdaptive02');
 assert.equal(pack.kind,'adaptive-later-stages');
 assert.equal(pack.catalogVersion,'reviewed-v3');
 assert.equal(pack.questions.length,LATER_STAGE_KPS.length);
 assert.equal(new Set(pack.questions.map(q=>q.id)).size,LATER_STAGE_KPS.length);
 assert.deepEqual(new Set(pack.questions.map(q=>q.kpId)),new Set(LATER_STAGE_KPS));
 for(const q of pack.questions){
  assert.equal(q.difficultyTier,'transfer');
  assert.ok(q.q&&q.explanation&&q.a,`${q.id} needs complete teaching content`);
  assert.ok(Array.isArray(q.o)&&q.o.includes(q.a),`${q.id} answer must be present`);
 }
 assert.equal(pack.tierRevisions.lpq052,'foundation');
 assert.equal(pack.tierRevisions.lpq054,'application');
 assert.equal(pack.tierRevisions.p2q042,'foundation');
 assert.equal(pack.tierRevisions.p2q044,'application');
});

test('completion pack reuses curated material and adds only seven missing transfer questions',()=>{
 const pack=loadAdaptivePack('public/question-pack-adaptive-03.js','ManjingoQuestionPackAdaptive03');
 assert.equal(pack.kind,'adaptive-completion');
 assert.equal(pack.catalogVersion,'reviewed-v4');
 assert.equal(COMPLETION_KPS.length,20);
 assert.equal(pack.questions.length,7);
 assert.equal(new Set(pack.questions.map(q=>q.id)).size,7);
 for(const q of pack.questions){
  assert.equal(q.difficultyTier,'transfer');
  assert.ok(q.q&&q.explanation&&q.a,`${q.id} needs complete teaching content`);
  assert.ok(Array.isArray(q.o)&&q.o.includes(q.a),`${q.id} answer must be present`);
 }
 assert.equal(pack.tierRevisions.q001,'foundation');
 assert.equal(pack.tierRevisions.cap1q002,'application');
 assert.equal(pack.tierRevisions.p3q001,'foundation');
 assert.equal(pack.tierRevisions.p3q003,'application');
 assert.equal(pack.tierRevisions.p3q004,'transfer');
 for(let group=0;group<4;group++){
  const start=group*6+1,ids=Array.from({length:6},(_,i)=>`tr3q${String(start+i).padStart(3,'0')}`),tiers=ids.map(id=>pack.tierRevisions[id]);
  assert.deepEqual(tiers,['foundation','foundation','application','application','transfer','transfer']);
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

test('reviewed runtime v4 gives all 67 knowledge points explicit three-tier coverage',()=>{
 const runtime=loadReviewedRuntime(),catalog=runtime.ManjingoContent;
 assert.equal(catalog.catalogVersion,'reviewed-v4');
 assert.equal(catalog.questions.length,386);
 const teachable=catalog.knowledgePoints.filter(kp=>kp.teachable!==false);
 assert.equal(teachable.length,67);
 const zhi=catalog.questions.find(q=>q.id==='ad1q002');
 const passive=catalog.questions.find(q=>q.id==='ad1q025');
 assert.equal(zhi.difficultyTier,'application');
 assert.equal(zhi.misconceptionKey,'zhi_verb_vs_particle');
 assert.equal(passive.misconceptionKey,'sentence_passive_receiver');
 for(const kp of teachable){
  const tiers=new Set(catalog.questions.filter(q=>q.kpId===kp.kpId).map(q=>q.difficultyTier).filter(Boolean));
  assert.ok(tiers.has('foundation'),`${kp.kpId} missing explicit foundation`);
  assert.ok(tiers.has('application'),`${kp.kpId} missing explicit application`);
  assert.ok(tiers.has('transfer'),`${kp.kpId} missing explicit transfer`);
 }
 for(const kpId of [...STAGE1_FUNCTION_KPS,...STAGE1_READING_KPS]){
  const tiers=new Set(catalog.questions.filter(q=>q.kpId===kpId).map(q=>q.difficultyTier).filter(Boolean));
  assert.deepEqual([...tiers].sort(),['application','foundation','transfer']);
 }
});

test('browser loader and Firestore importer include all adaptive tier packs and metadata',()=>{
 const rotation=source('public/question-rotation.js');
 const importer=source('scripts/import_to_firestore.js');
 for(const suffix of ['01','02','03']){
  assert.match(rotation,new RegExp(`question-pack-adaptive-${suffix}\\.js`));
  assert.match(importer,new RegExp(`question-pack-adaptive-${suffix}\\.js`));
 }
 assert.match(rotation,/question-difficulty\.js/);
 assert.match(importer,/question-difficulty\.js/);
 assert.match(importer,/difficultyTier: question\.difficultyTier \|\| null/);
 assert.match(importer,/question-pack-transfer-03\.js/);
 assert.match(importer,/question-pack-transfer-04\.js/);
});
