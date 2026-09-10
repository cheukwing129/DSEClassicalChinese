(function(root){
'use strict';
function questionId(question){return question&&question.id!=null?String(question.id):''}
function toSet(values){if(values instanceof Set)return new Set(Array.from(values,String));return new Set((Array.isArray(values)?values:[]).map(String))}
function sessionReservation(queue,index,completedQuestionIds,targetCount){
 const list=Array.isArray(queue)?queue:[],completed=toSet(completedQuestionIds),safeIndex=Math.max(0,Number(index)||0),current=list[safeIndex]||null,currentId=questionId(current),currentPending=!!currentId&&!completed.has(currentId),excludedIds=new Set(completed);
 if(currentPending)excludedIds.add(currentId);
 const target=Math.max(0,Number(targetCount)||0),remainingSlots=Math.max(0,target-completed.size-(currentPending?1:0));
 return{prefix:list.slice(0,Math.min(list.length,safeIndex+1)),current,currentPending,excludedIds,remainingSlots};
}
function mergeReservation(reservation,candidates){
 const r=reservation||{},seen=toSet(r.excludedIds),tail=[],limit=Math.max(0,Number(r.remainingSlots)||0);
 for(const question of Array.isArray(candidates)?candidates:[]){const id=questionId(question);if(!id||seen.has(id))continue;seen.add(id);tail.push(question);if(tail.length>=limit)break}
 const remaining=r.currentPending&&r.current?[r.current,...tail]:tail.slice();
 return{questions:[...(Array.isArray(r.prefix)?r.prefix:[]),...tail],remaining,tail};
}
function counts(items){const list=Array.isArray(items)?items:[];return{review:list.filter(x=>x&&x.category==='review').length,weak:list.filter(x=>x&&x.category==='weak').length,newKnowledge:list.filter(x=>x&&x.category==='new').length,total:list.length}}
function summary(items){const c=counts(items);return c.total?'剩餘安排：複習 '+c.review+' · 弱項 '+c.weak+' · 新知識 '+c.newKnowledge:'本輪已沒有剩餘題目。'}
root.ManjingoDailyPlanRuntime={questionId,sessionReservation,mergeReservation,counts,summary};
})(window);
