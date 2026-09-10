(function(root,factory){
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
root.ManjingoQuestionRotation=api;
if(root.window&&root.window!==root)root.window.ManjingoQuestionRotation=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const KEY='manjingo_question_rotation_v1';
const MAX_PER_KP=8;
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
function clear(){const s=store();if(!s)return false;try{s.removeItem(KEY);return true}catch(e){return false}}
return{KEY,MAX_PER_KP,idOf,kpOf,recentIds,remember,rank,select,choose,clear};
});
