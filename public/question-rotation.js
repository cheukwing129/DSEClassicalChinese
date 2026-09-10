(function(root,factory){
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
root.ManjingoQuestionRotation=api;
if(root.window&&root.window!==root)root.window.ManjingoQuestionRotation=api;
const doc=root.document||(root.window&&root.window.document);
const catalog=root.ManjingoContent||(root.window&&root.window.ManjingoContent);
if(doc&&doc.readyState==='loading'&&catalog){
 doc.write('<script src="./question-pack-adaptive-01.js"><\/script><script src="./question-pack-adaptive-02.js"><\/script><script src="./question-difficulty.js"><\/script>');
}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const KEY='manjingo_question_rotation_v1';
const MAX_PER_KP=8;
let observer=null;
function store(){return root.localStorage||(root.window&&root.window.localStorage)||null}
function read(){const s=store();if(!s)return{};try{const raw=JSON.parse(s.getItem(KEY)||'{}');return raw&&typeof raw==='object'?raw:{}}catch(e){return{}}}
function write(data){const s=store();if(!s)return false;try{s.setItem(KEY,JSON.stringify(data||{}));return true}catch(e){return false}}
function idOf(question){return question&&question.id!=null?String(question.id):''}
function kpOf(question){return question&&question.kpId!=null?String(question.kpId):''}
function recentIds(kpId){const data=read(),ids=data[String(kpId)];return Array.isArray(ids)?ids.map(String):[]}
function remember(question){const id=idOf(question),kpId=kpOf(question);if(!id||!kpId)return false;const data=read(),current=Array.isArray(data[kpId])?data[kpId].map(String):[];data[kpId]=[id,...current.filter(x=>x!==id)].slice(0,MAX_PER_KP);return write(data)}
function rank(list){const source=Array.isArray(list)?list.slice():[];if(!source.length)return source;const byKp=new Map();source.forEach(q=>{const kpId=kpOf(q);if(!byKp.has(kpId))byKp.set(kpId,recentIds(kpId))});return source.map((q,index)=>{const ids=byKp.get(kpOf(q))||[],position=ids.indexOf(idOf(q));return{q,index,position}}).sort((a,b)=>{const aUnseen=a.position<0,bUnseen=b.position<0;if(aUnseen!==bUnseen)return aUnseen?-1:1;if(aUnseen&&bUnseen)return a.index-b.index;if(a.position!==b.position)return b.position-a.position;return a.index-b.index}).map(item=>item.q)}
function select(list,limit){return rank(list).slice(0,Math.max(0,Number(limit)||0))}
function choose(list,preferredIds){const source=Array.isArray(list)?list:[],preferred=new Set((Array.isArray(preferredIds)?preferredIds:[]).map(String)),preferredPool=preferred.size?source.filter(q=>preferred.has(idOf(q))):[];const pool=preferredPool.length?preferredPool:source;return rank(pool)[0]||null}
function clean(value){return String(value||'').replace(/\s+/g,' ').trim()}
function catalog(){return root.ManjingoContent||(root.window&&root.window.ManjingoContent)||null}
function rememberNode(node){if(!node||!node.matches)return false;const questionNode=node.matches('.question,.lesson-question')?node:node.querySelector&&node.querySelector('.question,.lesson-question');if(!questionNode)return false;const text=clean(questionNode.textContent),content=catalog();if(!text||!content||!Array.isArray(content.questions))return false;const question=content.questions.find(q=>clean(q&&q.q)===text);return question?remember(question):false}
function install(){const doc=root.document||(root.window&&root.window.document);if(!doc)return false;rememberNode(doc);if(observer||typeof MutationObserver!=='function'&&!root.MutationObserver)return true;const Observer=root.MutationObserver||(root.window&&root.window.MutationObserver);if(typeof Observer!=='function'||!doc.body)return true;observer=new Observer(records=>records.forEach(record=>record.addedNodes&&record.addedNodes.forEach(rememberNode)));observer.observe(doc.body,{childList:true,subtree:true});return true}
function clear(){const s=store();if(!s)return false;try{s.removeItem(KEY);return true}catch(e){return false}}
const api={KEY,MAX_PER_KP,idOf,kpOf,recentIds,remember,rank,select,choose,rememberNode,install,clear};
const doc=root.document||(root.window&&root.window.document);if(doc){if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',install);else install()}
return api;
});
