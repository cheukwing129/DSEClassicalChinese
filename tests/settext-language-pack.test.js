const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const curriculum=require('../public/curriculum-v1.js');
const metadata=require('../public/question-metadata-v1.js');
const read=file=>fs.readFileSync(path.join(root,'public',file),'utf8');
const packSource=read('question-pack-settext-language-01.js');

function loadPack(){const context={window:{},Array,Object,Number,String,Math,Set,Map};vm.createContext(context);vm.runInContext(packSource,context);return context.window.ManjingoQuestionPackSetTextLanguage01;}
function loadCatalog(){
 const context={window:{},Array,Object,Number,String,Math,Set,Map};vm.createContext(context);
 for(const file of ['question-pack-02.js','question-pack-03.js','question-pack-lesson.js','question-pack-capacity-01.js','question-pack-transfer-01.js','question-pack-transfer-03.js','question-pack-transfer-04.js','question-pack-transfer-05.js','question-pack-transfer-06.js','question-pack-transfer-07.js','question-pack-settext-language-01.js','content-catalog.js'])vm.runInContext(read(file),context,{filename:file});
 return context.window.ManjingoContent;
}

const DSE_GROUPS=[
 'lunyu','yuwosuoyu','xiaoyaoyou','quanxue','lianpo-linxiangru','chushibiao',
 'shishuo','shidexishan','yueyanglou','liuguolun','tangshi-sanshou','songci-sanshou'
];

test('current DSE prescribed-text registry contains the twelve canonical groups',()=>{
 assert.deepEqual([...metadata.DSE_SET_TEXT_IDS],DSE_GROUPS);
 assert.equal(metadata.isDseSetTextId('lianpo'),true);
 assert.equal(metadata.canonicalDseSetTextId('lianpo'),'lianpo-linxiangru');
 assert.equal(metadata.isDseSetTextId('xunzi-quanxue-stage3'),true);
 assert.equal(metadata.isDseSetTextId('taohuayuan'),false);
});

test('language pack adds three questions at three tiers for every prescribed group',()=>{
 const pack=loadPack();
 assert.equal(pack.kind,'set-text-language');
 assert.equal(pack.questions.length,36);
 assert.equal(new Set(pack.questions.map(q=>q.id)).size,36);
 assert.equal(pack.questions.every(q=>/^stl1q\d{3}$/.test(q.id)),true);
 const bySource=new Map(DSE_GROUPS.map(id=>[id,[]]));
 for(const q of pack.questions){assert.ok(bySource.has(q.sourceTextId),`unexpected prescribed group ${q.sourceTextId}`);bySource.get(q.sourceTextId).push(q);}
 for(const [sourceId,rows] of bySource){
  assert.equal(rows.length,3,`${sourceId} should contribute three language questions`);
  assert.deepEqual([...new Set(rows.map(q=>q.difficultyTier))].sort(),['application','foundation','transfer']);
 }
 assert.equal(new Set(pack.questions.filter(q=>q.sourceTextId==='tangshi-sanshou').map(q=>q.sourceWorkId)).size,3);
 assert.equal(new Set(pack.questions.filter(q=>q.sourceTextId==='songci-sanshou').map(q=>q.sourceWorkId)).size,3);
});

test('prescribed texts are used as language material rather than content-recall mode',()=>{
 const pack=loadPack(),validSkills=new Map(curriculum.skills.map(skill=>[skill.id,skill]));
 for(const q of pack.questions){
  assert.equal(q.textId,'CROSS');
  assert.equal(q.sourceKind,'set-text');
  assert.equal(q.setTextLanguage,true);
  assert.equal(q.transferLevel,2);
  assert.ok(String(q.sourceSentenceId||'').startsWith('sentence:'),`${q.id}: stable source sentence required`);
  assert.ok(Array.isArray(q.skillIds)&&q.skillIds.length>0,`${q.id}: skill provenance required`);
  for(const skillId of q.skillIds){const skill=validSkills.get(skillId);assert.ok(skill,`${q.id}: unknown skill ${skillId}`);assert.ok(skill.stage<=2,`${q.id}: language pack should remain in the core skill tree`);}
  assert.ok(Array.isArray(q.o)&&q.o.length===4&&q.o.includes(q.a),`${q.id}: valid four-option answer required`);
  assert.ok(String(q.explanation||'').length>=12,`${q.id}: teaching explanation required`);
  assert.doesNotMatch(q.q,/(主旨|中心思想|寫作手法|修辭手法|人物形象|象徵|寄託|主要作用)/,`${q.id}: content-recall framing leaked into language pack`);
  const classified=metadata.classify(q);
  assert.equal(classified.curriculumMode,'core',`${q.id}: prescribed source must not force set-text review mode`);
  assert.equal(classified.normalCore,true);
  assert.equal(classified.sourceKind,'set-text');
 }
});

test('reviewed browser catalog includes all 36 new language questions without new knowledge points',()=>{
 const catalog=loadCatalog(),setRows=catalog.questions.filter(q=>String(q.id).startsWith('stl1q'));
 assert.equal(catalog.questions.length,505);
 assert.equal(catalog.knowledgePoints.filter(kp=>kp.teachable!==false).length,89);
 assert.equal(setRows.length,36);
 assert.equal(new Set(setRows.map(q=>q.id)).size,36);
});

test('browser catalog and Firestore importer both include the prescribed-text language pack',()=>{
 const catalog=fs.readFileSync(path.join(root,'public','content-catalog.js'),'utf8');
 const importer=fs.readFileSync(path.join(root,'scripts','import_to_firestore.js'),'utf8');
 assert.match(catalog,/question-pack-settext-language-01\.js/);
 assert.match(catalog,/ManjingoQuestionPackSetTextLanguage01/);
 assert.match(catalog,/setTextLanguagePack\.questions/);
 assert.match(importer,/question-pack-settext-language-01\.js/);
 assert.match(importer,/sourceWorkId:question\.sourceWorkId/);
 assert.match(importer,/setTextLanguage:question\.setTextLanguage===true\?true:null/);
});
