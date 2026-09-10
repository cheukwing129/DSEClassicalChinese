const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

function load(records){
 const source=read('public/weakness-panel.js');
 const knowledgePoints=[
  {kpId:'untouched',content:'未開始',teachable:true},
  {kpId:'weak_a',content:'低掌握',teachable:true},
  {kpId:'weak_b',content:'最近答錯',teachable:true},
  {kpId:'pattern_c',content:'常見錯誤',teachable:true},
  {kpId:'weak_d',content:'其他弱項',teachable:true}
 ];
 const window={
  ManjingoContent:{knowledgePoints},
  ManjingoLocalLearning:{getKnowledge:id=>records[id]||{mastery:0,attempts:0,lastCorrect:null,lastAnsweredAt:null,misconceptions:{}}}
 };
 const document={readyState:'loading',addEventListener(){}};
 const context={window,document,Map,Set,Object,Array,String,Number,Math,encodeURIComponent};
 vm.createContext(context);vm.runInContext(source,context);
 return window.ManjingoWeaknessPanel;
}

test('weakness diagnosis prioritizes at most three actionable items and excludes untouched KPs',()=>{
 const panel=load({
  weak_a:{mastery:40,attempts:2,lastCorrect:true,misconceptions:{}},
  weak_b:{mastery:55,attempts:2,lastCorrect:false,misconceptions:{}},
  pattern_c:{mastery:75,attempts:3,lastCorrect:true,misconceptions:{q1:{questionId:'q1',count:3,selectedAnswer:'工具義',correctAnswer:'原因義'}}},
  weak_d:{mastery:58,attempts:1,lastCorrect:true,misconceptions:{}}
 });
 const result=panel.diagnosis();
 assert.equal(result.priority.length,3);
 assert.equal(result.priority.some(x=>x.kpId==='untouched'),false);
 assert.equal(result.otherWeak.length,1);
 assert.equal(result.otherWeak[0].kpId,'weak_d');
 assert.equal(result.patterns.length,1);
 assert.match(panel.describe(result.patterns[0]),/常把「原因義」誤答成「工具義」/);
});

test('weakness panel groups priority, misconception patterns, and other weaknesses while keeping targeted practice',()=>{
 const source=read('public/weakness-panel.js');
 assert.match(source,/最需要處理/);
 assert.match(source,/常見錯誤模式/);
 assert.match(source,/其他弱項/);
 assert.match(source,/slice\(0,3\)/);
 assert.match(source,/item\.attempted&&\(item\.mastery<60\|\|item\.lastWrong\)/);
 assert.match(source,/lesson\.html\?kpId=/);
 assert.match(source,/&mode=practice/);
 assert.match(source,/立即補強/);
});

test('content catalog loads weakness panel on homepage flow',()=>{
 const source=read('public/content-catalog.js');
 assert.match(source,/weakness-panel\.js/);
});
