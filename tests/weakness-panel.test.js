const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('weakness panel ranks misconception weight and links to targeted KP practice',()=>{
  const source=read('public/weakness-panel.js');
  assert.match(source,/record\.misconceptions/);
  assert.match(source,/sort\(\(a,b\)=>b\.count-a\.count\)/);
  assert.match(source,/slice\(0,limit\|\|3\)/);
  assert.match(source,/常把「/);
  assert.match(source,/誤答成「/);
  assert.match(source,/lesson\.html\?kpId=/);
  assert.match(source,/針對練習/);
});

test('content catalog loads weakness panel on homepage flow',()=>{
  const source=read('public/content-catalog.js');
  assert.match(source,/weakness-panel\.js/);
});
