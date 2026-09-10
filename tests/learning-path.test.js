const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'learning-path.js'), 'utf8');
function loadPath(){const context={window:{},Set,Array,Object,String,Number,Math};vm.createContext(context);vm.runInContext(source,context);return context.window.ManjingoLearningPath;}
const sample=[
 {kpId:'kp_yueyang_001',type:'實詞',teachable:true},
 {kpId:'kp_yueyang_004',type:'名句默寫',teachable:true},
 {kpId:'gj_004',type:'古今異義',teachable:true},
 {kpId:'sx_001',type:'句式',teachable:true},
 {kpId:'kp_translation_001',type:'翻譯',teachable:true},
 {kpId:'extra_word',type:'實詞語境',teachable:true},
 {kpId:'extra_particle',type:'虛詞用法',teachable:true},
 {kpId:'extra_sentence',type:'句式',teachable:true},
 {kpId:'extra_translation',type:'翻譯策略',teachable:true},
 {kpId:'extra_reading',type:'篇章理解',teachable:true},
 {kpId:'extra_analysis',type:'論證主旨',teachable:true}
];

test('first stage is unlocked and later stages start locked',()=>{
 const lp=loadPath();const stages=lp.buildStages(sample,()=>({mastery:0}));
 assert.equal(stages[0].title,'入門');assert.equal(stages[0].unlocked,true);assert.equal(stages[1].unlocked,false);
});

test('next stage unlocks when previous stage average mastery reaches 70',()=>{
 const lp=loadPath();
 const intro=new Set(['kp_yueyang_001','kp_yueyang_004','gj_004','sx_001','kp_translation_001']);
 const stages=lp.buildStages(sample,id=>({mastery:intro.has(id)?70:0}));
 assert.equal(stages[0].complete,true);assert.equal(stages[1].unlocked,true);assert.equal(stages[2].unlocked,false);
});

test('available knowledge points only come from unlocked stages',()=>{
 const lp=loadPath();
 const intro=new Set(['kp_yueyang_001','kp_yueyang_004','gj_004','sx_001','kp_translation_001']);
 const stages=lp.buildStages(sample,id=>({mastery:intro.has(id)?70:0}));
 const ids=lp.availableKnowledgePointIds(stages);
 assert.ok(ids.includes('extra_word'));assert.equal(ids.includes('extra_particle'),false);
});

test('content is classified into the intended seven-stage path',()=>{
 const lp=loadPath();
 assert.equal(lp.classify({kpId:'x',type:'虛詞用法'}),'particles');
 assert.equal(lp.classify({kpId:'x',type:'句式'}),'sentences');
 assert.equal(lp.classify({kpId:'x',type:'翻譯策略'}),'translation');
 assert.equal(lp.classify({kpId:'x',type:'篇章理解'}),'reading');
 assert.equal(lp.classify({kpId:'x',type:'論證主旨'}),'analysis');
});
