(function(){
'use strict';
const KEY='manjingo_progress_cache';
const LEGACY_KEY='manjingo_learning_state_v1';
const DAILY_GOAL_XP=20;
function localDate(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function readRaw(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(e){return {}}}
function normalizeState(raw){const today=localDate();const state={
 totalXp:Number(raw.totalXp)||0,
 todayXp:Number(raw.todayXp)||0,
 streak:Number(raw.streak)||0,
 todayDate:raw.todayDate||today,
 lastGoalDate:raw.lastGoalDate||null,
 knowledge:raw.knowledge&&typeof raw.knowledge==='object'?raw.knowledge:{}
};
 Object.keys(state.knowledge).forEach(kpId=>{const record=state.knowledge[kpId];if(record&&typeof record==='object'&&!record.misconceptions)record.misconceptions={}});
 if(state.todayDate!==today){state.todayXp=0;state.todayDate=today;}
 return state;
}
function persist(data){try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch(e){return false}}
function load(){
 const state=normalizeState(readRaw(KEY));
 if(!Object.keys(state.knowledge).length){
   const legacy=readRaw(LEGACY_KEY);
   if(legacy&&typeof legacy==='object'&&!Array.isArray(legacy)&&Object.keys(legacy).length){
     state.knowledge=legacy;
     Object.keys(state.knowledge).forEach(kpId=>{const record=state.knowledge[kpId];if(record&&typeof record==='object'&&!record.misconceptions)record.misconceptions={}});
     persist(state);
   }
 }
 return state;
}
function getProgress(){const data=load();persist(data);return{totalXp:data.totalXp,todayXp:data.todayXp,streak:data.streak,todayDate:data.todayDate,lastGoalDate:data.lastGoalDate}}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function emptyKnowledge(){return{mastery:0,repetition:0,easeFactor:2.5,interval:0,nextReviewAt:null,attempts:0,correctCount:0,lastCorrect:null,lastAnsweredAt:null,misconceptions:{}}}
function getKnowledge(kpId){const data=load();return data.knowledge[kpId]||emptyKnowledge()}
function status(mastery){if(mastery>=90)return'mastered';if(mastery>=75)return'stable';if(mastery>=60)return'familiar';if(mastery>=35)return'unstable';if(mastery>0)return'learning';return'unlearned'}
function isDue(record){return !record.nextReviewAt||new Date(record.nextReviewAt).getTime()<=Date.now()}
function updateStreak(state){
 if(state.todayXp<DAILY_GOAL_XP)return;
 const today=localDate();
 if(state.lastGoalDate===today)return;
 const previous=state.lastGoalDate;
 const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-1);
 const yesterday=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 state.streak=previous===yesterday?Math.max(1,state.streak)+1:1;
 state.lastGoalDate=today;
}
function reviewUpdate(previous,correct){
 const p={...emptyKnowledge(),...previous,misconceptions:{...(previous&&previous.misconceptions||{})}};
 p.attempts+=1;
 p.lastAnsweredAt=new Date().toISOString();
 p.lastCorrect=!!correct;
 if(correct)p.correctCount+=1;
 if(correct){
   p.repetition+=1;
   if(p.repetition===1)p.interval=1;
   else if(p.repetition===2)p.interval=6;
   else p.interval=Math.max(1,Math.round(p.interval*p.easeFactor));
   p.easeFactor=clamp(p.easeFactor+0.1,1.3,3.0);
   p.mastery=clamp(Math.round(p.mastery+(100-p.mastery)*0.22),0,100);
 }else{
   p.repetition=0;p.interval=1;p.easeFactor=clamp(p.easeFactor-0.2,1.3,3.0);
   p.mastery=clamp(Math.round(p.mastery*0.7),0,100);
 }
 const d=new Date();d.setDate(d.getDate()+p.interval);p.nextReviewAt=d.toISOString();
 return p;
}
function recordMisconception(record,detail){
 if(!detail||!detail.questionId||detail.selectedAnswer==null||detail.correctAnswer==null)return record;
 const p={...record,misconceptions:{...(record.misconceptions||{})}};
 const questionId=String(detail.questionId),selectedAnswer=String(detail.selectedAnswer),correctAnswer=String(detail.correctAnswer);
 const key=questionId+'::'+selectedAnswer,previous=p.misconceptions[key]||{};
 p.misconceptions[key]={questionId,selectedAnswer,correctAnswer,count:(Number(previous.count)||0)+1,lastAt:new Date().toISOString()};
 return p;
}
function resolveMisconceptions(record,detail){
 if(!detail||!detail.questionId)return{record,resolvedCount:0,remainingWeight:0};
 const questionId=String(detail.questionId),p={...record,misconceptions:{...(record.misconceptions||{})}};
 let resolvedCount=0,remainingWeight=0;
 Object.keys(p.misconceptions).forEach(key=>{
   const entry=p.misconceptions[key];
   if(!entry||String(entry.questionId)!==questionId)return;
   const nextCount=Math.max(0,(Number(entry.count)||0)-1);
   resolvedCount+=1;
   if(nextCount===0){delete p.misconceptions[key];return;}
   p.misconceptions[key]={...entry,count:nextCount,lastResolvedAt:new Date().toISOString()};
   remainingWeight+=nextCount;
 });
 return{record:p,resolvedCount,remainingWeight};
}
function submit(kpId,correct,detail){
 const data=load(),previous=data.knowledge[kpId]||getKnowledge(kpId);let next=reviewUpdate(previous,correct),resolvedCount=0,remainingMisconceptionWeight=0;
 if(correct){const resolved=resolveMisconceptions(next,detail);next=resolved.record;resolvedCount=resolved.resolvedCount;remainingMisconceptionWeight=resolved.remainingWeight}else next=recordMisconception(next,detail);
 data.knowledge[kpId]=next;
 if(correct){data.totalXp+=8;data.todayXp+=8;updateStreak(data)}
 persist(data);
 return {...next,kpId,status:status(next.mastery),xpEarned:correct?8:0,totalXp:data.totalXp,todayXp:data.todayXp,streak:data.streak,resolvedMisconceptions:resolvedCount,remainingMisconceptionWeight};
}
function syncRemoteResult(kpId,result){
 if(!result||typeof result!=='object')return getProgress();
 const data=load();
 if(kpId){
   const previous=data.knowledge[kpId]||getKnowledge(kpId);
   const next={...previous};
   ['mastery','repetition','easeFactor','interval','nextReviewAt','attempts','correctCount','lastCorrect','lastAnsweredAt','misconceptions'].forEach(key=>{if(result[key]!==undefined&&result[key]!==null)next[key]=result[key]});
   if(!next.misconceptions)next.misconceptions={};
   data.knowledge[kpId]=next;
 }
 if(result.totalXp!==undefined)data.totalXp=Number(result.totalXp)||0;
 if(result.todayXp!==undefined)data.todayXp=Number(result.todayXp)||0;
 if(result.streak!==undefined)data.streak=Number(result.streak)||0;
 data.todayDate=localDate();
 if(result.lastGoalDate)data.lastGoalDate=result.lastGoalDate;
 persist(data);
 return{...getProgress(),...(kpId?{kpId,...data.knowledge[kpId],status:status(data.knowledge[kpId].mastery)}:{})};
}
function syncGamification(game){return syncRemoteResult(null,game)}
function records(){const data=load();return Object.keys(data.knowledge).map(kpId=>({kpId,...data.knowledge[kpId],misconceptions:{...(data.knowledge[kpId].misconceptions||{})},status:status(data.knowledge[kpId].mastery)}))}
function getDueKnowledgePoints(limit){return records().filter(isDue).sort((a,b)=>(a.mastery||0)-(b.mastery||0)).slice(0,limit||10)}
function getWeakKnowledgePoints(limit){return records().filter(r=>r.mastery<60||r.lastCorrect===false).sort((a,b)=>{const wrongA=a.lastCorrect===false?1:0,wrongB=b.lastCorrect===false?1:0;if(wrongA!==wrongB)return wrongB-wrongA;return(a.mastery||0)-(b.mastery||0)}).slice(0,limit||10)}
function misconceptionQuestionIds(record){
 const grouped=new Map();
 Object.values(record&&record.misconceptions||{}).forEach(entry=>{if(!entry||!entry.questionId)return;const id=String(entry.questionId),current=grouped.get(id)||0;grouped.set(id,current+(Number(entry.count)||0))});
 return Array.from(grouped.entries()).sort((a,b)=>b[1]-a[1]).map(([id])=>id);
}
function buildDailyPlan(kpIds,targetCount){
 const ids=Array.from(new Set((kpIds||[]).map(String))),known=new Map(records().map(r=>[r.kpId,r]));
 const due=ids.filter(id=>known.has(id)&&isDue(known.get(id))).sort((a,b)=>(known.get(a).mastery||0)-(known.get(b).mastery||0));
 const weak=ids.filter(id=>known.has(id)&&!due.includes(id)&&(known.get(id).mastery<60||known.get(id).lastCorrect===false)).sort((a,b)=>{const A=known.get(a),B=known.get(b),wa=A.lastCorrect===false?1:0,wb=B.lastCorrect===false?1:0;return wb-wa||(A.mastery||0)-(B.mastery||0)});
 const fresh=ids.filter(id=>!known.has(id));
 const items=[],used=new Set();
 function add(list,category,count){for(const id of list){if(used.has(id)||items.length>=targetCount||items.filter(x=>x.category===category).length>=count)continue;used.add(id);const record=known.get(id);items.push({kpId:id,category,priority:category==='review'?1:category==='weak'?2:3,...(record?{misconceptionQuestionIds:misconceptionQuestionIds(record)}:{})})}}
 add(due,'review',5);add(weak,'weak',3);add(fresh,'new',2);add(due,'review',targetCount);add(weak,'weak',targetCount);add(fresh,'new',targetCount);
 return{targetCount:items.length,items,review:items.filter(x=>x.category==='review').map(x=>x.kpId),weak:items.filter(x=>x.category==='weak').map(x=>x.kpId),newKnowledgePoints:items.filter(x=>x.category==='new').map(x=>x.kpId),totalRecommended:items.length};
}
window.ManjingoLocalLearning={getProgress,getKnowledge,submit,syncRemoteResult,syncGamification,getDueKnowledgePoints,getWeakKnowledgePoints,buildDailyPlan,status,isDue};
})();
