const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

function load(){
  const context={window:{},Set,Array,Object,String,Number,Math,RegExp};
  vm.createContext(context);
  vm.runInContext(read('public/feedback-ui.js'),context);
  return context.window.ManjingoFeedbackUI;
}

test('feedback UI parses teaching content into answer explanation and progress layers',()=>{
  const ui=load();
  const raw='正確答案：因為 為甚麼？「以」在此表示原因。你可能混淆了：把它當成工具義。概念掌握度：42% 掌握度：61% 本題獲得：8 XP 下一步：優先安排複習。';
  assert.equal(ui.parseCorrectAnswer(raw),'因為');
  assert.equal(ui.explanationFromText(raw),'「以」在此表示原因。');
  assert.deepEqual(Array.from(ui.metricLines(raw)),['概念掌握度 42%','掌握度 61%','本題 +8 XP']);
});

test('feedback enhancement is shared, accessible and reacts to answer DOM changes',()=>{
  const source=read('public/feedback-ui.js');
  assert.match(source,/question\.explanation/);
  assert.match(source,/question\.misconception/);
  assert.match(source,/question\.example/);
  assert.match(source,/feedback-result-title/);
  assert.match(source,/feedback-teaching/);
  assert.match(source,/查看學習進度/);
  assert.match(source,/feedback-next/);
  assert.match(source,/aria-live','polite'/);
  assert.match(source,/new MutationObserver/);
});

test('homepage answer feedback is revealed synchronously before cloud persistence finishes',()=>{
  const source=read('public/feedback-ui.js');
  assert.match(source,/function instantAnswer\(event\)/);
  assert.match(source,/target\.closest&&target\.closest\('#quiz'\)/);
  assert.match(source,/document\.addEventListener\('click',instantAnswer,true\)/);
  assert.match(source,/feedback\.textContent=correct\?'答對了！':'正確答案：'/);
  assert.match(source,/answerKey\(button\.textContent\)===answerKey\(question\.a\)/);
  const home=read('public/index.html');
  assert.match(home,/await cloudSubmit\(q,correct,answerId,value\)/);
});

test('instant feedback can be enhanced again when cloud progress replaces it',()=>{
  const source=read('public/feedback-ui.js');
  assert.match(source,/feedback\.dataset\.feedbackRendered===raw/);
  assert.match(source,/feedback\.dataset\.feedbackRendered=clean\(feedback\.textContent\)/);
  assert.match(source,/delete feedback\.dataset\.feedbackUi/);
  assert.match(source,/delete feedback\.dataset\.feedbackRendered/);
});

test('catalog loads layered feedback UI on both homepage and lesson flows',()=>{
  const catalog=read('public/content-catalog.js');
  assert.match(catalog,/feedback-ui\.js/);
  const lesson=read('public/lesson.html');
  const home=read('public/index.html');
  assert.match(lesson,/content-catalog\.js/);
  assert.match(home,/content-catalog\.js/);
});

test('shared UI foundation styles result teaching progress and next-step hierarchy',()=>{
  const css=read('public/app-ui.css');
  assert.match(css,/\.feedback-result/);
  assert.match(css,/\.feedback-teaching/);
  assert.match(css,/\.feedback-progress/);
  assert.match(css,/\.feedback-next/);
  assert.match(css,/\.feedback-ui\.correct/);
  assert.match(css,/\.feedback-ui\.wrong/);
});
