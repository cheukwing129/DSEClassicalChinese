const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

function load(){
  const values=new Map();
  const localStorage={
    getItem:key=>values.get(key)||null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key)
  };
  const context={localStorage,Map,Set,Array,Object,String,Number,Math,JSON};
  context.window=context;
  vm.createContext(context);
  for(const file of [
    'public/question-pack-02.js',
    'public/question-pack-03.js',
    'public/question-pack-lesson.js',
    'public/question-pack-capacity-01.js',
    'public/question-pack-transfer-01.js',
    'public/content-catalog.js',
    'public/curriculum-v1.js',
    'public/question-metadata-v1.js',
    'public/question-diversity-v1.js',
    'public/question-rotation.js'
  ]) vm.runInContext(read(file),context,{filename:file});
  return{catalog:context.ManjingoContent,rotation:context.ManjingoQuestionRotation,values};
}

function q(id,kpId,sourceTextId,sourceSentenceId){
  return{
    id,kpId,textId:'CROSS',type:'choice',q:'題目 '+id,o:['甲','乙','丙'],a:'甲',explanation:'這是一個測試用的完整解說。',
    skillIds:['fw.zhi'],sourceTextId,sourceSentenceId,sourceKind:'classical-canon',transferLevel:2
  };
}

test('daily selector caps a named source at two when later KPs have alternatives',()=>{
  const{catalog}=load();
  const plan={targetCount:4,items:[
    {kpId:'kp_virtual_zhi',category:'new'},
    {kpId:'kp_virtual_er',category:'new'},
    {kpId:'kp_virtual_yi',category:'new'},
    {kpId:'kp_virtual_yu',category:'new'}
  ]};
  const source=[
    q('z-y','kp_virtual_zhi','yueyanglou','yy:1'),q('z-l','kp_virtual_zhi','lunyu','lu:1'),
    q('e-y','kp_virtual_er','yueyanglou','yy:2'),q('e-q','kp_virtual_er','quanxue','qx:1'),
    q('i-y','kp_virtual_yi','yueyanglou','yy:3'),q('i-m','kp_virtual_yi','mengzi-lianghuiwang-xia','mz:1'),
    q('u-y','kp_virtual_yu','yueyanglou','yy:4'),q('u-z','kp_virtual_yu','xiaoyaoyou','zy:1')
  ];
  const queue=catalog.selectQuestionsForPlan(plan,source,4);
  assert.deepEqual(Array.from(queue,x=>x.id),['z-y','e-y','i-m','u-z']);
  assert.equal(queue.filter(x=>x.sourceTextId==='yueyanglou').length,2);
});

test('daily selector avoids the same sentence across different question ids and KPs',()=>{
  const{catalog}=load();
  const plan={targetCount:2,items:[
    {kpId:'kp_virtual_zhi',category:'new'},
    {kpId:'kp_virtual_er',category:'new'}
  ]};
  const source=[
    q('first','kp_virtual_zhi','yueyanglou','sentence:yueyanglou:shared'),
    q('same-again','kp_virtual_er','yueyanglou','sentence:yueyanglou:shared'),
    q('fresh','kp_virtual_er','lunyu','sentence:lunyu:fresh')
  ];
  const queue=catalog.selectQuestionsForPlan(plan,source,2);
  assert.deepEqual(Array.from(queue,x=>x.id),['first','fresh']);
});

test('daily selector cools a recently displayed sentence across sessions',()=>{
  const{catalog,rotation}=load();
  rotation.remember(q('old-id','kp_virtual_zhi','caogui','sentence:caogui:old'));
  const plan={targetCount:1,items:[{kpId:'kp_virtual_zhi',category:'review'}]};
  const source=[
    q('new-id-same-sentence','kp_virtual_zhi','caogui','sentence:caogui:old'),
    q('fresh-context','kp_virtual_zhi','lunyu','sentence:lunyu:fresh')
  ];
  const queue=catalog.selectQuestionsForPlan(plan,source,1);
  assert.equal(queue[0].id,'fresh-context');
});

test('misconception targeting may override source cap when remediation is required',()=>{
  const{catalog}=load();
  const plan={targetCount:3,items:[
    {kpId:'kp_virtual_zhi',category:'review'},
    {kpId:'kp_virtual_er',category:'review'},
    {kpId:'kp_virtual_yi',category:'weak',misconceptionQuestionIds:['required-yueyang']}
  ]};
  const source=[
    q('y1','kp_virtual_zhi','yueyanglou','yy:1'),
    q('y2','kp_virtual_er','yueyanglou','yy:2'),
    q('required-yueyang','kp_virtual_yi','yueyanglou','yy:3'),
    q('generic-other','kp_virtual_yi','lunyu','lu:3')
  ];
  const queue=catalog.selectQuestionsForPlan(plan,source,3);
  assert.deepEqual(Array.from(queue,x=>x.id),['y1','y2','required-yueyang']);
  assert.equal(queue[2].misconceptionReview,true);
});

test('selector never shortens the session solely because diversity caps cannot be met',()=>{
  const{catalog}=load();
  const plan={targetCount:3,items:[
    {kpId:'kp_virtual_zhi',category:'new'},
    {kpId:'kp_virtual_er',category:'new'},
    {kpId:'kp_virtual_yi',category:'new'}
  ]};
  const source=[
    q('y1','kp_virtual_zhi','yueyanglou','yy:1'),
    q('y2','kp_virtual_er','yueyanglou','yy:2'),
    q('y3','kp_virtual_yi','yueyanglou','yy:3')
  ];
  const queue=catalog.selectQuestionsForPlan(plan,source,3);
  assert.equal(queue.length,3);
  assert.deepEqual(Array.from(queue,x=>x.id),['y1','y2','y3']);
});
