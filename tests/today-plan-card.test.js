const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','public','home-shell.js'),'utf8');

function loadShell(){
  const context={
    window:{addEventListener(){}},
    document:{readyState:'loading',addEventListener(){}},
    location:{hash:'',pathname:'/',search:''},
    console,Math,Number,String,Object
  };
  vm.createContext(context);
  vm.runInContext(source,context);
  return context.window.ManjingoHomeShell;
}

test('today plan summary turns adaptive counts into a student-friendly task estimate',()=>{
  const shell=loadShell();
  assert.deepEqual({...shell.planSummary(5,3,2)},{total:10,minutes:8,focus:'先處理 3 個弱點 · 5 個複習'});
  assert.deepEqual({...shell.planSummary(0,0,5)},{total:5,minutes:4,focus:'今天學習 5 個新知識'});
  assert.deepEqual({...shell.planSummary(0,0,0)},{total:0,minutes:0,focus:'今天先建立新知識'});
});

test('today plan card keeps detailed counts secondary and the start action primary',()=>{
  assert.match(source,/title\.textContent='今天的任務'/);
  assert.match(source,/id=\"todayQuestionCount\"/);
  assert.match(source,/id=\"todayMinutes\"/);
  assert.match(source,/id='todayFocus'/);
  assert.match(source,/details\.className='today-plan-details'/);
  assert.match(source,/summary\.textContent='查看今日安排'/);
  assert.match(source,/start\.textContent='開始學習'/);
  assert.match(source,/start\.classList\.add\('today-start'\)/);
});

test('today plan hero follows live review weak and new counts',()=>{
  assert.match(source,/document\.getElementById\('reviewCount'\)/);
  assert.match(source,/document\.getElementById\('weakCount'\)/);
  assert.match(source,/document\.getElementById\('newCount'\)/);
  assert.match(source,/new MutationObserver\(refreshTodayPlanHero\)/);
  assert.match(source,/planObserver\.observe\(stats,\{childList:true,subtree:true,characterData:true\}\)/);
});
