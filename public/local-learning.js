(function(){
'use strict';
const KEY='manjingo_learning_state_v1';
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
function save(data){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}}
function today(){const d=new Date();d.setHours(0,0,0,0);return d}
function addDays(days){const d=today();d.setDate(d.getDate()+days);return d.toISOString()}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function getKnowledge(kpId){const data=load();return data[kpId]||{mastery:0,repetition:0,easeFactor:2.5,interval:0,nextReviewAt:null,attempts:0,correctCount:0,lastCorrect:null,lastAnsweredAt:null}}
function status(mastery){if(mastery>=90)return'mastered';if(mastery>=75)return'stable';if(mastery>=60)return'familiar';if(mastery>=35)return'unstable';if(mastery>0)return'learning';return'unlearned'}
function isDue(record){return !record.nextReviewAt||new Date(record.nextReviewAt).getTime()<=Date.now()}
function reviewUpdate(previous,correct){
 const p={...previous};
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
 p.nextReviewAt=addDays(p.interval);
 return p;
}
function submit(kpId,correct){
 const data=load(),previous=getKnowledge(kpId),next=reviewUpdate(previous,correct);
 data[kpId]=next;save(data);
 return {...next,kpId,status:status(next.mastery),xpEarned:correct?8:0};
}
function records(){
 const data=load();
 return Object.keys(data).map(kpId=>({kpId,...data[kpId],status:status(data[kpId].mastery)}));
}
function getDueKnowledgePoints(limit){
 return records().filter(isDue).sort((a,b)=>(a.mastery||0)-(b.mastery||0)).slice(0,limit||10);
}
function getWeakKnowledgePoints(limit){
 return records().filter(r=>r.mastery<60||r.lastCorrect===false).sort((a,b)=>{
   const wrongA=a.lastCorrect===false?1:0,wrongB=b.lastCorrect===false?1:0;
   if(wrongA!==wrongB)return wrongB-wrongA;
   return (a.mastery||0)-(b.mastery||0);
 }).slice(0,limit||10);
}
function buildDailyPlan(kpIds,targetCount){
 const ids=Array.from(new Set((kpIds||[]).map(String)));
 const known=new Map(records().map(r=>[r.kpId,r]));
 const due=ids.filter(id=>known.has(id)&&isDue(known.get(id))).sort((a,b)=>(known.get(a).mastery||0)-(known.get(b).mastery||0));
 const weak=ids.filter(id=>known.has(id)&&!due.includes(id)&&(known.get(id).mastery<60||known.get(id).lastCorrect===false)).sort((a,b)=>{
   const A=known.get(a),B=known.get(b);
   const wa=A.lastCorrect===false?1:0,wb=B.lastCorrect===false?1:0;
   return wb-wa||(A.mastery||0)-(B.mastery||0);
 });
 const fresh=ids.filter(id=>!known.has(id));
 const items=[];const used=new Set();
 function add(list,category,count){for(const id of list){if(used.has(id)||items.length>=targetCount||items.filter(x=>x.category===category).length>=count)continue;used.add(id);items.push({kpId:id,category,priority:category==='review'?1:category==='weak'?2:3});}}
 add(due,'review',5);add(weak,'weak',3);add(fresh,'new',2);
 add(due,'review',targetCount);add(weak,'weak',targetCount);add(fresh,'new',targetCount);
 return {targetCount:items.length,items,review:items.filter(x=>x.category==='review').map(x=>x.kpId),weak:items.filter(x=>x.category==='weak').map(x=>x.kpId),newKnowledgePoints:items.filter(x=>x.category==='new').map(x=>x.kpId),totalRecommended:items.length};
}
window.ManjingoLocalLearning={getKnowledge,submit,getDueKnowledgePoints,getWeakKnowledgePoints,buildDailyPlan,status,isDue};
})();
