const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const curriculum=require('../public/curriculum-v1.js');
const metadata=require('../public/question-metadata-v1.js');
function read(file){return fs.readFileSync(path.join(root,file),'utf8')}
function loadCatalog(){const context={window:{},Map,Set,Array,Object,Number,String,Math,RegExp};vm.createContext(context);for(const file of ['public/question-pack-02.js','public/question-pack-03.js','public/question-pack-lesson.js','public/question-pack-capacity-01.js','public/question-pack-transfer-01.js','public/question-pack-transfer-03.js','public/question-pack-transfer-04.js','public/question-pack-transfer-05.js','public/question-pack-transfer-06.js','public/content-catalog.js'])vm.runInContext(read(file),context,{filename:file});return context.window.ManjingoContent;}
function coverage(){const questions=metadata.annotateAll(loadCatalog().questions).filter(q=>q.normalCore),policy=curriculum.qualityPolicy;return curriculum.skills.filter(s=>s.stage===1).map(skill=>{const matched=questions.filter(q=>q.skillIds.includes(skill.id)),sources=new Set(matched.map(q=>String(q.sourceTextId||'')).filter(x=>x&&x!=='CROSS'&&x!=='UNKNOWN')),unseen=matched.filter(q=>q.sourceKind!=='set-text').length,gaps=[];if(matched.length<policy.minimumQuestionsPerCoreSkill)gaps.push(`questions:${matched.length}/${policy.minimumQuestionsPerCoreSkill}`);if(sources.size<policy.minimumSourceTextsPerCoreSkill)gaps.push(`sources:${sources.size}/${policy.minimumSourceTextsPerCoreSkill}`);if(unseen<policy.minimumUnseenOrNonSetTextQuestions)gaps.push(`unseen:${unseen}/${policy.minimumUnseenOrNonSetTextQuestions}`);return{id:skill.id,questions:matched.length,sources:sources.size,unseen,gaps};});}

test('stage 1 closeout leaves no skill below the curriculum quality floor',()=>{const report=coverage(),deficits=report.filter(x=>x.gaps.length);assert.deepEqual(deficits,[],`stage 1 deficits remain: ${JSON.stringify(deficits)}`);});

test('single-sentence transfer launches with six diverse three-tier questions',()=>{const c=loadCatalog(),questions=c.questions.filter(q=>q.kpId==='kp_transfer_single_sentence');assert.equal(questions.length,6);assert.ok(new Set(questions.map(q=>q.sourceTextId)).size>=3);assert.deepEqual([...new Set(questions.map(q=>q.difficultyTier))].sort(),['application','foundation','transfer']);assert.equal(questions.every(q=>q.skillIds.includes('transfer.single-sentence')&&q.sourceKind==='classical-canon'&&q.transferLevel>=2),true);});

test('existing translation evidence also credits the matching language skill',()=>{const c=loadCatalog(),byId=id=>c.questions.find(q=>q.id===id);assert.ok(byId('tr5q010').skillIds.includes('syn.judgment'));assert.ok(byId('tr5q017').skillIds.includes('syn.ellipsis-subject'));for(const id of ['tr5q019','tr5q020','tr5q021','tr5q022','tr5q023','tr5q024'])assert.ok(byId(id).skillIds.includes('lex.ancient-modern'),`${id} must credit lexical ancient-modern skill`);});
