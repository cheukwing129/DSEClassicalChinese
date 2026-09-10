const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

function load(){
  const context={window:{},Map,Set,Array,Object,Number,String,Math,RegExp};
  vm.createContext(context);
  vm.runInContext(read('public/question-pack-02.js'),context);
  vm.runInContext(read('public/question-pack-03.js'),context);
  vm.runInContext(read('public/question-pack-lesson.js'),context);
  vm.runInContext(read('public/content-catalog.js'),context);
  context.window.ManjingoLocalLearning={
    getKnowledge(kpId){return{mastery:kpId==='kp_virtual_zhi'?100:50,lastCorrect:true}}
  };
  vm.runInContext(read('public/mastery-dashboard.js'),context);
  return context.window.ManjingoMasteryDashboard;
}

test('mastery dashboard covers all 59 teachable knowledge points in six learning groups',()=>{
  const dashboard=load(),data=dashboard.build();
  assert.equal(data.total,59);
  assert.equal(data.groups.length,6);
  assert.deepEqual(Array.from(data.groups,g=>g.title),['實詞','虛詞','句式','翻譯','篇章','論證']);
  assert.equal(data.groups.reduce((n,g)=>n+g.total,0),59);
  assert.ok(data.groups.every(g=>g.total>0));
});

test('mastery dashboard derives overall, mastered and weak counts from local learning state',()=>{
  const dashboard=load(),data=dashboard.build();
  assert.equal(data.overall,51);
  assert.equal(data.mastered,1);
  assert.equal(data.weak,58);
  const particles=data.groups.find(g=>g.id==='particles');
  assert.ok(particles.average>50);
});

test('content catalog loads mastery dashboard on browser pages',()=>{
  const source=read('public/content-catalog.js');
  assert.match(source,/mastery-dashboard\.js/);
  const dashboard=read('public/mastery-dashboard.js');
  assert.match(dashboard,/學習成果/);
  assert.match(dashboard,/masteryDashboard/);
  assert.match(dashboard,/DOMContentLoaded/);
});
