const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
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

test('lesson completion returns learner to learning path',()=>{
  const source=read('public/local-lesson.js');
  assert.match(source,/href="\.\/index\.html"/);
  assert.match(source,/回到學習路徑/);
});
