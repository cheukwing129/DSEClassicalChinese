'use strict';

const fs=require('fs');
const path=require('path');
const vm=require('vm');
const curriculum=require('../public/curriculum-v1.js');

const root=path.join(__dirname,'..');
const publicDir=path.join(root,'public');
const packFiles=fs.readdirSync(publicDir)
 .filter(name=>/^question-pack-settext-language-\d+\.js$/.test(name))
 .sort();
const context={window:{},Array,Object,Number,String,Math,Set,Map};
vm.createContext(context);
for(const file of packFiles)vm.runInContext(fs.readFileSync(path.join(publicDir,file),'utf8'),context,{filename:file});

const packKeys=Object.keys(context.window).filter(key=>/^ManjingoQuestionPackSetTextLanguage\d+$/.test(key)).sort();
const questions=packKeys.flatMap(key=>Array.isArray(context.window[key].questions)?context.window[key].questions:[]);
const coreSkills=curriculum.coreSkills();
const intentionallyUnfamiliarOnly=new Set(['transfer.single-sentence','transfer.sentence-pair','transfer.micro-passage']);

const rows=coreSkills.map(skill=>{
 const matched=questions.filter(q=>Array.isArray(q.skillIds)&&q.skillIds.includes(skill.id));
 return {
  id:skill.id,
  domain:skill.domain,
  questions:matched.length,
  sourceGroups:new Set(matched.map(q=>q.sourceTextId).filter(Boolean)).size,
  sourceWorks:new Set(matched.map(q=>q.sourceWorkId).filter(Boolean)).size,
  tiers:Array.from(new Set(matched.map(q=>q.difficultyTier).filter(Boolean))).sort(),
  policy:intentionallyUnfamiliarOnly.has(skill.id)?'unfamiliar-context-only':'eligible-set-text-material'
 };
});
const covered=rows.filter(row=>row.questions>0);
const targetableGaps=rows.filter(row=>row.questions===0&&row.policy==='eligible-set-text-material').map(row=>row.id);
const intentionalUncovered=rows.filter(row=>row.questions===0&&row.policy==='unfamiliar-context-only').map(row=>row.id);
const summary={
 packs:packFiles,
 questionCount:questions.length,
 coreSkills:rows.length,
 coveredSkills:covered.length,
 uncoveredSkills:rows.length-covered.length,
 targetableGapCount:targetableGaps.length,
 targetableGaps,
 intentionalUncovered,
 sourceGroups:new Set(questions.map(q=>q.sourceTextId).filter(Boolean)).size
};

console.log(`Prescribed-text language coverage: ${summary.coveredSkills}/${summary.coreSkills} core skills across ${summary.questionCount} questions.`);
for(const row of rows)console.log(`${row.questions?'✓':'·'} ${row.id.padEnd(28)} ${String(row.questions).padStart(2)} q · ${row.sourceGroups} source group(s) · ${row.tiers.join('/')||'—'}${row.policy==='unfamiliar-context-only'?' · reserved for unfamiliar context':''}`);
console.log(`Targetable zero-coverage skills: ${targetableGaps.length?targetableGaps.join(', '):'none'}`);
console.log(`Intentionally not filled from prescribed texts: ${intentionalUncovered.join(', ')||'none'}`);
console.log('SETTEXT_SKILL_COVERAGE_AUDIT='+JSON.stringify(summary));
