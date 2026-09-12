const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const curriculum=require('../public/curriculum-v1.js');
const source=fs.readFileSync(path.join(__dirname,'..','public','learning-path.js'),'utf8');
function loadPath(){const context={window:{},Set,Map,Array,Object,String,Number,Math};vm.createContext(context);vm.runInContext(source,context);return context.window.ManjingoLearningPath;}

test('learning path contains six skill stages covering all 49 core skills exactly once',()=>{
 const lp=loadPath(),stages=lp.buildStages(curriculum.coreSkills(),()=>({mastery:0})),ids=stages.flatMap(stage=>stage.skillIds);
 assert.deepEqual(Array.from(stages,stage=>stage.title),['字詞基礎','字詞進階','句法拆解','閱讀推斷','翻譯表達','遷移實戰']);
 assert.deepEqual(Array.from(stages,stage=>stage.count),[14,8,10,7,7,3]);
 assert.equal(ids.length,49);assert.equal(new Set(ids).size,49);
 assert.deepEqual(new Set(ids),new Set(curriculum.coreSkills().map(skill=>skill.id)));
});

test('first skill stage is unlocked and later stages start locked',()=>{
 const lp=loadPath(),stages=lp.buildStages(curriculum.coreSkills(),()=>({mastery:0}));
 assert.equal(stages[0].unlocked,true);assert.equal(stages[1].unlocked,false);assert.equal(stages[5].unlocked,false);
});

test('next stage unlocks from average skill mastery rather than KP mastery',()=>{
 const lp=loadPath(),foundation=new Set(curriculum.coreSkills().filter(skill=>lp.classifySkill(skill)==='foundation').map(skill=>skill.id));
 const stages=lp.buildStages(curriculum.coreSkills(),skillId=>({mastery:foundation.has(skillId)?70:0}));
 assert.equal(stages[0].complete,true);assert.equal(stages[1].unlocked,true);assert.equal(stages[2].unlocked,false);
});

test('available ids are curriculum skills from unlocked stages',()=>{
 const lp=loadPath(),foundation=new Set(curriculum.coreSkills().filter(skill=>lp.classifySkill(skill)==='foundation').map(skill=>skill.id));
 const stages=lp.buildStages(curriculum.coreSkills(),skillId=>({mastery:foundation.has(skillId)?70:0})),ids=new Set(lp.availableSkillIds(stages));
 assert.equal(ids.has('fw.zhi'),true);assert.equal(ids.has('lex.word-class-shift'),true);assert.equal(ids.has('syn.judgment'),false);
});

test('skill classification follows pedagogical progression instead of legacy KP type',()=>{
 const lp=loadPath();
 assert.equal(lp.classifySkill(curriculum.skill('lex.polysemy')),'foundation');
 assert.equal(lp.classifySkill(curriculum.skill('fw.hu')),'word-advanced');
 assert.equal(lp.classifySkill(curriculum.skill('syn.object-fronting')),'syntax');
 assert.equal(lp.classifySkill(curriculum.skill('read.context-clues')),'reading');
 assert.equal(lp.classifySkill(curriculum.skill('trans.integrated')),'translation');
 assert.equal(lp.classifySkill(curriculum.skill('transfer.micro-passage')),'transfer');
});

test('stage 3 preview skills stay outside the core learning path',()=>{
 const lp=loadPath(),stages=lp.buildStages(curriculum.skills,()=>({mastery:0})),ids=new Set(stages.flatMap(stage=>stage.skillIds));
 assert.equal(ids.has('read.argumentation'),false);assert.equal(ids.has('transfer.short-passage'),false);assert.equal(ids.has('transfer.mixed'),false);
});
