const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','public','server-skill-plan.js'),'utf8');
const curriculum=require('../public/curriculum-v1.js');

test('server skill planner publishes its API through the CommonJS worker bundle path',()=>{
  const context={
    module:{exports:{}},
    exports:{},
    require:id=>{
      if(id==='./curriculum-v1.js')return curriculum;
      throw new Error(`unexpected require: ${id}`);
    },
    globalThis:null,
    Map,Set,Array,Object,String,Number,Math,Date
  };
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context,{filename:'server-skill-plan.js'});
  assert.equal(typeof context.module.exports.buildPlan,'function');
  assert.equal(context.ManjingoServerSkillPlan,context.module.exports);
  assert.equal(context.ManjingoServerSkillPlan.VERSION,'server-skill-native-v1');
});

test('Cloudflare worker reads the planner from the global published by its side-effect import',()=>{
  const worker=fs.readFileSync(path.join(__dirname,'..','public','_worker.js'),'utf8');
  assert.match(worker,/import '\.\/server-skill-plan\.js'/);
  assert.match(worker,/const SERVER_SKILL_PLAN=globalThis\.ManjingoServerSkillPlan/);
  assert.match(worker,/SERVER_SKILL_PLAN\.buildPlan/);
});
