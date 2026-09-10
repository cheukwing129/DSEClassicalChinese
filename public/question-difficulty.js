(function(root,factory){
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
root.ManjingoQuestionDifficulty=api;
if(root.window&&root.window!==root)root.window.ManjingoQuestionDifficulty=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const TIERS=['foundation','application','transfer'];
const LABELS={foundation:'基礎辨識',application:'語境應用',transfer:'跨篇遷移'};
function clampMastery(value){const n=Number(value);return Math.max(0,Math.min(100,Number.isFinite(n)?n:0))}
function tierIndex(tier){const i=TIERS.indexOf(String(tier||''));return i>=0?i:1}
function tierOf(question){return TIERS.includes(question&&question.difficultyTier)?question.difficultyTier:'application'}
function tierForMastery(mastery,options){
 const opts=options||{},mode=String(opts.mode||'normal');
 if(mode==='remedial')return'foundation';
 if(mode==='reteach')return'transfer';
 const value=clampMastery(mastery);
 let index=value>=75?2:value>=40?1:0;
 if(opts.lastCorrect===false)index=Math.max(0,index-1);
 return TIERS[index];
}
function recentPosition(rotation,question){
 if(!rotation||typeof rotation.recentIds!=='function'||!question)return-1;
 const ids=rotation.recentIds(question.kpId)||[];
 return ids.map(String).indexOf(String(question.id));
}
function rank(list,options){
 const source=Array.isArray(list)?list.slice():[],opts=options||{},rotation=opts.rotation||(root.ManjingoQuestionRotation||(root.window&&root.window.ManjingoQuestionRotation)),target=opts.targetTier||tierForMastery(opts.mastery,opts),targetIndex=tierIndex(target),preferred=new Set((Array.isArray(opts.preferredIds)?opts.preferredIds:[]).map(String)),hasPreferred=preferred.size&&source.some(q=>preferred.has(String(q&&q.id)));
 return source.map((q,index)=>{
   const position=recentPosition(rotation,q),seen=position>=0,preferredPenalty=hasPreferred&&!preferred.has(String(q&&q.id))?100:0,distance=Math.abs(tierIndex(tierOf(q))-targetIndex),seenPenalty=seen?3:0,recencyPenalty=seen?Math.max(0,1-position/20):0;
   return{q,index,score:preferredPenalty+distance*2+seenPenalty+recencyPenalty};
 }).sort((a,b)=>a.score-b.score||a.index-b.index).map(item=>item.q);
}
function select(list,limit,options){return rank(list,options).slice(0,Math.max(0,Number(limit)||0))}
function choose(list,options){return rank(list,options)[0]||null}
function labelFor(questionOrTier){const tier=typeof questionOrTier==='string'?questionOrTier:tierOf(questionOrTier);return LABELS[tier]||LABELS.application}
return{TIERS,LABELS,clampMastery,tierIndex,tierOf,tierForMastery,rank,select,choose,labelFor};
});
