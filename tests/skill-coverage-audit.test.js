const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const curriculum=require('../public/curriculum-v1.js');
const metadata=require('../public/question-metadata-v1.js');
function read(file){return fs.readFileSync(path.join(root,file),'utf8')}
function loadCatalog(){
 const context={window:{},Map,Set,Array,Object,Number,String,Math,RegExp};vm.createContext(context);
 for(const file of ['public/question-pack-02.js','public/question-pack-03.js','public/question-pack-lesson.js','public/question-pack-capacity-01.js','public/question-pack-transfer-01.js','public/content-catalog.js'])vm.runInContext(read(file),context,{filename:file});
 return context.window.ManjingoContent;
}
function coverage(){
 const catalog=loadCatalog(),questions=metadata.annotateAll(catalog.questions).filter(q=>q.normalCore),policy=curriculum.qualityPolicy;
 return curriculum.coreSkills().map(skill=>{
  const matched=questions.filter(q=>q.skillIds.includes(skill.id));
  const namedSources=new Set(matched.map(q=>String(q.sourceTextId||'')).filter(x=>x&&x!=='CROSS'&&x!=='UNKNOWN'));
  const sentenceIds=new Set(matched.map(q=>String(q.sourceSentenceId||'')).filter(Boolean));
  const unseen=matched.filter(q=>q.sourceKind!=='set-text').length;
  const gaps=[];
  if(matched.length<policy.minimumQuestionsPerCoreSkill)gaps.push(`questions:${matched.length}/${policy.minimumQuestionsPerCoreSkill}`);
  if(namedSources.size<policy.minimumSourceTextsPerCoreSkill)gaps.push(`sources:${namedSources.size}/${policy.minimumSourceTextsPerCoreSkill}`);
  if(unseen<policy.minimumUnseenOrNonSetTextQuestions)gaps.push(`unseen:${unseen}/${policy.minimumUnseenOrNonSetTextQuestions}`);
  return{id:skill.id,domain:skill.domain,stage:skill.stage,questions:matched.length,sources:namedSources.size,sentences:sentenceIds.size,unseen,setText:matched.length-unseen,gaps,sourceIds:Array.from(namedSources).sort()};
 });
}

test('skill coverage audit reports current transfer-content debt without hiding zero-coverage skills',()=>{
 const report=coverage(),core=metadata.normalCoreQuestions(loadCatalog().questions);
 assert.equal(core.length,151);
 assert.equal(report.length,curriculum.coreSkills().length);
 assert.ok(report.some(x=>x.questions===0),'zero-coverage core skills must stay visible in the audit');
 assert.ok(report.some(x=>x.gaps.length===0),'audit should distinguish mature-enough skills from content debt');
 const deficits=report.filter(x=>x.gaps.length).sort((a,b)=>a.questions-b.questions||a.sources-b.sources||a.id.localeCompare(b.id));
 console.log('SKILL_COVERAGE_AUDIT='+JSON.stringify({totalCoreQuestions:core.length,coreSkills:report.length,deficitSkills:deficits.length,deficits}));
});
