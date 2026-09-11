const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const summary=require('../public/session-summary.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const exists=p=>fs.existsSync(path.join(__dirname,'..',p));

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

test('completion summary maps results to canonical mascot states',()=>{
  assert.equal(summary.celebrationCopy({answered:10,wrong:0},100),'全對！太棒了！');
  assert.equal(summary.celebrationCopy({answered:10,wrong:1},90),'很穩，繼續保持！');
  assert.equal(summary.celebrationCopy({answered:10,wrong:3},70),'完成了，錯題也會變成下一步。');
  assert.equal(summary.mascotState({answered:0,unlockedStages:[]},0),'neutral');
  assert.equal(summary.mascotState({answered:10,unlockedStages:[]},90),'happy');
  assert.equal(summary.mascotState({answered:10,unlockedStages:[]},100),'celebrate');
  assert.equal(summary.mascotState({answered:10,unlockedStages:['第二階段']},80),'celebrate');
  assert.equal(summary.mascotAsset('happy'),'./mascot/moling-happy.svg');
  assert.equal(summary.mascotAsset('unknown'),'./mascot/moling-neutral.svg');
});

test('completion markup uses state-specific mascot asset instead of the legacy filename',()=>{
  const perfect=summary.markup({page:'home',answered:10,correct:10,xp:80,masteryDelta:12,resolved:[],unlockedStages:[]});
  assert.match(perfect,/mascot-state-celebrate/);
  assert.match(perfect,/\.\/mascot\/moling-celebrate\.svg/);
  assert.doesNotMatch(perfect,/src="\.\/mascot-moling\.svg"/);
  const good=summary.markup({page:'home',answered:10,correct:9,xp:70,masteryDelta:8,resolved:[],unlockedStages:[]});
  assert.match(good,/mascot-state-happy/);
  assert.match(good,/\.\/mascot\/moling-happy\.svg/);
});

test('first mascot state assets exist and preserve the selected baseline artwork',()=>{
  ['neutral','happy','celebrate'].forEach(state=>{
    const file=`public/mascot/moling-${state}.svg`;
    assert.equal(exists(file),true,file+' should exist');
    assert.match(read(file),/\.\.\/mascot-moling\.svg/);
  });
});

test('mascot reactions stay decorative and do not replace learning controls',()=>{
  const feedback=read('public/feedback-ui.js');
  const summarySource=read('public/session-summary.js');
  assert.match(feedback,/aria-hidden','true'/);
  assert.match(feedback,/feedback-next/);
  assert.match(summarySource,/session-summary-action/);
  assert.match(summarySource,/aria-label="小墨靈：/);
});
