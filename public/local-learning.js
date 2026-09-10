(function(){
'use strict';
const KEY='manjingo_learning_state_v1';
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
function save(data){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}}
function today(){const d=new Date();d.setHours(0,0,0,0);return d}
function addDays(days){const d=today();d.setDate(d.getDate()+days);return d.toISOString()}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function getKnowledge(kpId){const data=load();return data[kpId]||{mastery:0,repetition:0,easeFactor:2.5,interval:0,nextReviewAt:null,attempts:0,correctCount:0}}
function status(mastery){if(mastery>=90)return'mastered';if(mastery>=75)return'stable';if(mastery>=60)return'familiar';if(mastery>=35)return'unstable';if(mastery>0)return'learning';return'unlearned'}
function reviewUpdate(previous,correct){
 const p={...previous};
 p.attempts+=1;
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
function submit(kpId,correct){const data=load();const previous=getKnowledge(kpId);const next=reviewUpdate(previous,correct);data[kpId]=next;save(data);return {...next,kpId,status:status(next.mastery),xpEarned:correct?8:0}}
function getDueKnowledgePoints(limit){const data=load(),now=Date.now();return Object.keys(data).filter(k=>!data[k].nextReviewAt||new Date(data[k].nextReviewAt).getTime()<=now).sort((a,b)=>(data[a].mastery||0)-(data[b].mastery||0)).slice(0,limit||10).map(k=>({kpId:k,...data[k],status:status(data[k].mastery)}))}
window.ManjingoLocalLearning={getKnowledge,submit,getDueKnowledgePoints,status};
})();
