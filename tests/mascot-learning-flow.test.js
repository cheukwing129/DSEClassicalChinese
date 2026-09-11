const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const summary=require('../public/session-summary.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('answer feedback gives Little Ink Spirit distinct correct and thinking reactions',()=>{
  const source=read('public/feedback-ui.js');
  assert.match(source,/function mascotFeedback\(isCorrect\)/);
  assert.match(source,/\.\/mascot-moling\.svg/);
  assert.match(source,/抓到重點了！/);
  assert.match(source,/一起看清這一步。/);
  assert.match(source,/moling-correct/);
  assert.match(source,/moling-think/);
  assert.match(source,/prefers-reduced-motion:reduce/);
});

test('completion summary celebrates with the same mascot and adapts the message to results',()=>{
  assert.equal(summary.celebrationCopy({answered:10,wrong:0},100),'全對！太棒了！');
  assert.equal(summary.celebrationCopy({answered:10,wrong:1},90),'很穩，繼續保持！');
  assert.equal(summary.celebrationCopy({answered:10,wrong:3},70),'完成了，錯題也會變成下一步。');
  const html=summary.markup({page:'home',answered:10,correct:10,xp:80,masteryDelta:12,resolved:[],unlockedStages:[]});
  assert.match(html,/session-summary-icon mascot-celebrate/);
  assert.match(html,/mascot-moling\.svg/);
  assert.match(html,/全對！太棒了！/);
});

test('mascot reactions stay decorative and do not replace learning controls',()=>{
  const feedback=read('public/feedback-ui.js');
  const summarySource=read('public/session-summary.js');
  assert.match(feedback,/aria-hidden','true'/);
  assert.match(feedback,/feedback-next/);
  assert.match(summarySource,/session-summary-action/);
  assert.match(summarySource,/aria-label="小墨靈：/);
});
