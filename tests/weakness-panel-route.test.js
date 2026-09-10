const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('weakness panel and mastery dashboard both launch adaptive targeted practice',()=>{
 const weakness=read('public/weakness-panel.js');
 const dashboard=read('public/mastery-dashboard.js');
 assert.match(weakness,/lesson\.html\?kpId=.*&mode=practice/);
 assert.match(weakness,/立即補強/);
 assert.match(dashboard,/lesson\.html\?kpId=.*&mode=practice/);
 assert.match(dashboard,/立即補強/);
});
