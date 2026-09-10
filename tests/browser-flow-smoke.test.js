const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('learning path links unlocked stages into lesson route',()=>{
  const source=read('public/learning-path-ui.js');
  assert.match(source,/\.\/lesson\.html\?kpId=/);
  assert.match(source,/encodeURIComponent\(lesson\.kpId\)/);
  assert.match(source,/nextLesson\(stage\)/);
});

test('lesson page loads browser flow dependencies in safe order',()=>{
  const html=read('public/lesson.html');
  const scripts=['./content-catalog.js','./local-learning.js','./lesson-content-reading.js','./lesson-content.js','./local-lesson.js'];
  let last=-1;
  for(const src of scripts){
    const index=html.indexOf(`src="${src}"`);
    assert.ok(index>last,`${src} missing or loaded out of order`);
    last=index;
  }
  assert.match(html,/new URLSearchParams\(location\.search\)\.get\('kpId'\)/);
  assert.match(html,/ManjingoLocalLesson\.open\(kpId,app\)/);
});

test('local lesson practice submits exact KP result into learning engine',()=>{
  const source=read('public/local-lesson.js');
  assert.match(source,/filter\(q=>q\.kpId===kpId\)/);
  assert.match(source,/ManjingoLocalLearning\.submit\(q\.kpId,correct\)/);
  assert.match(source,/getKnowledge\(state\.kp\.kpId\)/);
  assert.match(source,/state\.questions\.length/);
});

test('wrong answers prefer per-question feedback and fall back to KP lesson',()=>{
  const source=read('public/local-lesson.js');
  assert.match(source,/function teachingFeedback\(state,q,value\)/);
  assert.match(source,/q&&q\.explanation/);
  assert.match(source,/q&&q\.misconception/);
  assert.match(source,/q&&q\.example/);
  assert.match(source,/lesson\.explanation/);
  assert.match(source,/lesson\.tip/);
  assert.match(source,/lesson\.examples/);
  assert.match(source,/你可能混淆了：/);
  assert.match(source,/!correct&&normal\(b\.textContent\)===normal\(q\.a\)/);
});

test('core particle pack carries question-level teaching metadata',()=>{
  const context={window:{}};
  vm.createContext(context);
  vm.runInContext(read('public/question-pack-03.js'),context);
  const qs=context.window.ManjingoQuestionPack03.questions;
  const rich=qs.filter(q=>q.explanation);
  assert.ok(rich.length>=20);
  const yi=qs.find(q=>q.q.includes('不以物喜'));
  assert.ok(yi.explanation);
  assert.ok(yi.misconception);
  assert.ok(yi.example);
});

test('lesson completion returns learner to learning path',()=>{
  const source=read('public/local-lesson.js');
  assert.match(source,/href="\.\/index\.html"/);
  assert.match(source,/回到學習路徑/);
});
