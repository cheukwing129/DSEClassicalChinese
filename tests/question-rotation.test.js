const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function load(){const values=new Map(),localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)},context={window:{localStorage},localStorage,Map,Set,Array,Object,String,Number,Math,JSON};vm.createContext(context);vm.runInContext(read('public/question-rotation.js'),context);return{rotation:context.ManjingoQuestionRotation||context.window.ManjingoQuestionRotation,values};}
function q(id,kpId='kp',sourceSentenceId=null){const value={id,kpId,q:'題目 '+id};if(sourceSentenceId)value.sourceSentenceId=sourceSentenceId;return value;}

test('recently displayed questions rotate behind unseen questions',()=>{const{rotation}=load(),list=[q('q1'),q('q2'),q('q3'),q('q4'),q('q5')];assert.deepEqual(Array.from(rotation.select(list,3),x=>x.id),['q1','q2','q3']);rotation.remember(list[0]);rotation.remember(list[1]);rotation.remember(list[2]);assert.deepEqual(Array.from(rotation.select(list,3),x=>x.id),['q4','q5','q1']);});

test('rotation keeps pedagogically preferred misconception questions ahead of generic unseen questions',()=>{const{rotation}=load(),list=[q('q1'),q('q2'),q('q3')];rotation.remember(list[0]);assert.equal(rotation.choose(list,['q1']).id,'q1');assert.equal(rotation.choose(list,[]).id,'q2');});

test('question history is capped per knowledge point',()=>{const{rotation}=load();for(let i=1;i<=12;i++)rotation.remember(q('q'+i));assert.equal(rotation.recentIds('kp').length,rotation.MAX_PER_KP);assert.deepEqual(Array.from(rotation.recentIds('kp').slice(0,3)),['q12','q11','q10']);});

test('remember stores source sentence history for cross-question cooldown',()=>{const{rotation}=load();rotation.remember(q('q1','kp1','sentence:yueyanglou:wei'));rotation.remember(q('q2','kp2','sentence:caogui:yu'));assert.deepEqual(Array.from(rotation.recentSentenceIds()),['sentence:caogui:yu','sentence:yueyanglou:wei']);});

test('same source sentence from different question ids is deduplicated and moved to front',()=>{const{rotation}=load();rotation.remember(q('q1','kp1','sentence:same'));rotation.remember(q('q2','kp2','sentence:other'));rotation.remember(q('q3','kp3','sentence:same'));assert.deepEqual(Array.from(rotation.recentSentenceIds()),['sentence:same','sentence:other']);});

test('source sentence history is capped independently from per-kp question history',()=>{const{rotation}=load();for(let i=1;i<=30;i++)rotation.remember(q('q'+i,'kp'+i,'sentence:'+i));assert.equal(rotation.recentSentenceIds().length,rotation.MAX_SENTENCES);assert.equal(rotation.MAX_SENTENCES,24);assert.deepEqual(Array.from(rotation.recentSentenceIds().slice(0,3)),['sentence:30','sentence:29','sentence:28']);});

test('clear removes both question and source sentence history',()=>{const{rotation}=load();rotation.remember(q('q1','kp1','sentence:one'));assert.equal(rotation.recentSentenceIds().length,1);rotation.clear();assert.equal(rotation.recentIds('kp1').length,0);assert.equal(rotation.recentSentenceIds().length,0);});

test('homepage plan and lesson practice share rotation while daily selection adds source diversity',()=>{const catalog=read('public/content-catalog.js'),lesson=read('public/local-lesson.js'),rotation=read('public/question-rotation.js');assert.match(catalog,/curriculum-v1\.js[\s\S]*question-metadata-v1\.js[\s\S]*question-diversity-v1\.js[\s\S]*question-rotation\.js/);assert.match(catalog,/rotation\.rank\(pool\)/);assert.match(catalog,/diversity\.choose\(ranked,queue/);assert.match(catalog,/recentSentenceIds/);assert.match(lesson,/rot\.select\(list,count\)/);assert.match(lesson,/rot\.rank\(list\)/);assert.match(lesson,/rot\.remember\(q\)/);assert.match(rotation,/\.question,\.lesson-question/);});
