const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const skillPlan=require('../public/skill-first-plan.js');
const metadata=require('../public/question-metadata-v1.js');
const diversity=require('../public/question-diversity-v1.js');
function source(file){return fs.readFileSync(path.join(root,file),'utf8')}
function loadCatalog(){const context={window:{},Map,Set,Array,Object,Number,String,Math,RegExp};vm.createContext(context);for(const file of ['public/question-pack-02.js','public/question-pack-03.js','public/question-pack-lesson.js','public/question-pack-capacity-01.js','public/question-pack-transfer-01.js','public/question-pack-transfer-03.js','public/question-pack-transfer-04.js','public/question-pack-transfer-05.js','public/question-pack-transfer-06.js','public/content-catalog.js'])vm.runInContext(source(file),context,{filename:file});return context.window.ManjingoContent;}
const targets=new Map([['kp_virtual_hu','fw.hu'],['kp_virtual_qie','fw.qie'],['kp_virtual_yan','fw.yan'],['kp_lex_tongjia','lex.tongjia'],['kp_lex_intentional','lex.intentional'],['kp_lex_semantic_role','lex.semantic-role']]);
const learning={getKnowledge(){return{mastery:0,attempts:0,correctCount:0,wrongCount:0,lastCorrect:null,lastAnsweredAt:null,nextReviewAt:null}},isDue(){return false}};
const rotation={rank:list=>list.slice(),recentSentenceIds:()=>[]};
test('native stage 2 KPs enter skill-first scheduling with their direct skill identity',()=>{const catalog=loadCatalog(),pools=skillPlan.poolsFor(catalog.questions),items=[];for(const[kpId,skillId]of targets){const pool=pools.get(skillId);assert.ok(pool&&pool.length>=6,`${skillId} missing pool`);assert.equal(pool.every(q=>metadata.annotate(q).normalCore),true);const adapted=skillPlan.adaptPlan({targetCount:1,items:[{kpId,category:'new',priority:3}]},catalog.questions,1,{learning});assert.equal(adapted.items[0].skillId,skillId);items.push({kpId,category:'new',priority:3});}const selected=skillPlan.selectQuestionsForPlan({targetCount:6,items},catalog.questions,6,{learning,rotation,diversity});assert.equal(selected.length,6);assert.deepEqual(new Set(selected.map(q=>q.skillId)),new Set(targets.values()));});
