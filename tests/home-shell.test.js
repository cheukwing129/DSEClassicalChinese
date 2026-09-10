const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('homepage separates learning, path, weakness, and results into focused views',()=>{
  const html=read('public/index.html');
  for(const view of ['today','path','weakness','results'])assert.match(html,new RegExp('data-home-tab="'+view+'"'));
  assert.match(html,/id="homeToday" data-home-view="today"/);
  assert.match(html,/id="homePath" data-home-view="path" hidden/);
  assert.match(html,/id="homeWeakness" data-home-view="weakness" hidden/);
  assert.match(html,/id="homeResults" data-home-view="results" hidden/);
  assert.match(html,/id="learningPath"/);
  assert.match(html,/id="weaknessPanel"/);
  assert.match(html,/id="masteryDashboard"/);
});

test('quiz lives inside the today view and start focuses it instead of leaving it below other panels',()=>{
  const html=read('public/index.html');
  const todayStart=html.indexOf('id="homeToday"'),todayEnd=html.indexOf('</section>',todayStart),plan=html.indexOf('id="plan"',todayStart),quiz=html.indexOf('id="quiz"',todayStart);
  assert.ok(todayStart>=0&&todayEnd>todayStart);
  assert.ok(plan>todayStart&&quiz>plan&&quiz<todayEnd);
  assert.match(html,/document\.getElementById\('plan'\)\.classList\.add\('hidden'\)/);
  assert.match(html,/document\.getElementById\('quiz'\)\.classList\.remove\('hidden'\)/);
  assert.match(html,/shell\.focusQuiz\(\)/);
});

test('home shell opens result tab for mastery dashboard return links',()=>{
  const source=read('public/home-shell.js');
  assert.match(source,/#masteryDashboard'\)return'results'/);
  assert.match(source,/#weaknessPanel'\)return'weakness'/);
  assert.match(source,/#learningPath'\)return'path'/);
  assert.match(source,/scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/);
  assert.match(source,/\[data-home-view\]/);
  assert.match(source,/\[data-home-tab\]/);
});

test('starting a quiz enters a distraction-free study shell with progress and exit controls',()=>{
  const source=read('public/home-shell.js');
  assert.match(source,/const STUDY_CLASS='study-focus'/);
  assert.match(source,/function focusQuiz\(\)\{enterStudy\(\)/);
  assert.match(source,/id='studyFocusBar'/);
  assert.match(source,/退出本輪學習/);
  assert.match(source,/學習進度/);
  assert.match(source,/role="progressbar"/);
  assert.match(source,/body\.'\+STUDY_CLASS\+'>\.home-tabs\{display:none!important\}/);
  assert.match(source,/body\.'\+STUDY_CLASS\+'>\.card\.top\+\.card/);
  assert.match(source,/\[data-home-view\]:not\(\[data-home-view="today"\]\)/);
});

test('study shell tracks question position and restores the homepage after completion',()=>{
  const source=read('public/home-shell.js');
  assert.match(source,/text\.match\(\/\(\\d\+\)\\s\*\\\/\\s\*\(\\d\+\)\//);
  assert.match(source,/updateStudyProgress\(progress\.current,progress\.total\)/);
  assert.match(source,/if\(progress\.done\)\{exitStudy\(\);return\}/);
  assert.match(source,/new MutationObserver\(syncStudyProgress\)/);
  assert.match(source,/document\.body\.classList\.remove\(STUDY_CLASS\)/);
  assert.match(source,/已完成的進度會保留/);
});
