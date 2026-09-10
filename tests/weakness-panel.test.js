const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

function load(records,history=[]){
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
  ManjingoLocalLearning:{
   getKnowledge:id=>records[id]||{mastery:0,attempts:0,lastCorrect:null,lastAnsweredAt:null,misconceptions:{}},
   getPracticeHistory(opts={}){return history.filter(item=>!opts.kpId||String(item.kpId)===String(opts.kpId))}
  }
 };
 const document={readyState:'loading',addEventListener(){}};
 const context={window,document,Map,Set,Object,Array,String,Number,Math,Date,encodeURIComponent};
 vm.createContext(context);vm.runInContext(read('public/practice-effectiveness.js'),context);window.ManjingoPracticeEffectiveness=context.ManjingoPracticeEffectiveness;vm.runInContext(source,context);
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
 assert.equal(result.priority.length,3);assert.equal(result.priority.some(x=>x.kpId==='untouched'),false);assert.equal(result.otherWeak.length,1);assert.equal(result.otherWeak[0].kpId,'weak_d');assert.equal(result.patterns.length,1);assert.match(panel.describe(result.patterns[0]),/常把「原因義」誤答成「工具義」/);
});

test('failed intervention outranks raw low mastery and exposes the correct next action',()=>{
 const panel=load({
  weak_a:{mastery:15,attempts:4,lastCorrect:true,misconceptions:{}},
  weak_b:{mastery:45,attempts:5,lastCorrect:true,misconceptions:{}},
  pattern_c:{mastery:68,attempts:6,lastCorrect:true,misconceptions:{}},
  weak_d:{mastery:55,attempts:4,lastCorrect:true,misconceptions:{}}
 },[
  {kpId:'pattern_c',strategy:'remedial',beforeMastery:70,afterMastery:68,delta:-2,accuracy:50,conceptDelta:-8,completedAt:'2026-09-10T12:00:00Z'},
  {kpId:'weak_b',strategy:'targeted',delta:2,accuracy:50,completedAt:'2026-09-10T11:00:00Z'},
  {kpId:'weak_b',strategy:'targeted',delta:2,accuracy:60,completedAt:'2026-09-09T11:00:00Z'},
  {kpId:'weak_d',strategy:'remedial',beforeMastery:47,afterMastery:55,delta:8,accuracy:100,completedAt:'2026-09-10T10:00:00Z'}
 ]);
 const result=panel.diagnosis();
 assert.equal(result.priority[0].kpId,'pattern_c');assert.equal(result.priority[0].practiceState.label,'需要概念重教');assert.equal(panel.stateAction(result.priority[0].practiceState),'開始概念重教');
 assert.equal(result.priority[1].kpId,'weak_b');assert.equal(result.priority[1].practiceState.label,'需要補救');assert.equal(panel.stateAction(result.priority[1].practiceState),'進入補救');
 const stable=panel.weakKnowledgePoints().find(item=>item.kpId==='weak_d');assert.equal(stable.practiceState.label,'補救後已穩定');
});

test('weakness panel groups priority, misconception patterns, and other weaknesses while keeping targeted practice',()=>{
 const source=read('public/weakness-panel.js');
 assert.match(source,/最需要處理/);assert.match(source,/常見錯誤模式/);assert.match(source,/其他弱項/);assert.match(source,/slice\(0,3\)/);assert.match(source,/baseWeak/);assert.match(source,/adaptiveWeak/);assert.match(source,/practiceState/);assert.match(source,/需要概念重教/);assert.match(source,/需要補救/);assert.match(source,/補救後已穩定/);assert.match(source,/lesson\.html\?kpId=/);assert.match(source,/&mode=practice/);assert.match(source,/立即補強/);
});

test('content catalog loads weakness panel after practice effectiveness policy',()=>{
 const source=read('public/content-catalog.js');assert.match(source,/practice-effectiveness\.js[\s\S]*weakness-panel\.js/);
});
