(function(root){
'use strict';
function questionId(question){return question&&question.id!=null?String(question.id):''}
function toSet(values){if(values instanceof Set)return new Set(Array.from(values,String));return new Set((Array.isArray(values)?values:[]).map(String))}
function hash32(value){let h=2166136261>>>0;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function randomRank(seed,step){let x=(hash32(seed)+Math.imul((Number(step)||0)+1,0x9e3779b9))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d)>>>0;x^=x>>>15;x=Math.imul(x,0x846ca68b)>>>0;x^=x>>>16;return x>>>0;}
function stableShuffle(values,seed){const result=(Array.isArray(values)?values:[]).slice();for(let i=result.length-1;i>0;i--){const j=randomRank(seed,i)%(i+1),tmp=result[i];result[i]=result[j];result[j]=tmp;}return result;}
function balancedAnswerSlots(targetCount,optionCount,seed){
 const target=Math.max(0,Math.floor(Number(targetCount)||0)),count=Math.max(0,Math.floor(Number(optionCount)||0));
 if(!target||!count)return[];if(count===1)return Array(target).fill(0);
 const remaining=Array(count).fill(Math.floor(target/count));
 for(let i=0;i<target%count;i++)remaining[stableShuffle(Array.from({length:count},(_,x)=>x),String(seed||'')+':remainder')[i]]++;
 const slots=[];
 for(let i=0;i<target;i++){
   const previous=slots.length?slots[slots.length-1]:-1;
   const candidates=remaining.map((left,slot)=>({left,slot,rank:randomRank(String(seed||'')+':slot:'+i,slot)})).filter(x=>x.left>0&&x.slot!==previous).sort((a,b)=>b.left-a.left||a.rank-b.rank||a.slot-b.slot);
   const fallback=remaining.map((left,slot)=>({left,slot})).filter(x=>x.left>0).sort((a,b)=>b.left-a.left||a.slot-b.slot);
   const chosen=(candidates[0]||fallback[0]).slot;slots.push(chosen);remaining[chosen]--;
 }
 return slots;
}
function arrangeOptions(options,answer,desiredSlot,seed){
 const list=(Array.isArray(options)?options:[]).map(String);if(list.length<2)return list;
 const answerText=String(answer==null?'':answer),answerIndex=list.findIndex(x=>x===answerText);
 if(answerIndex<0)return stableShuffle(list,seed);
 const distractors=list.filter((_,index)=>index!==answerIndex),shuffled=stableShuffle(distractors,String(seed||'')+':distractors'),slot=((Math.floor(Number(desiredSlot)||0)%list.length)+list.length)%list.length;
 shuffled.splice(slot,0,list[answerIndex]);return shuffled;
}
function sessionReservation(queue,index,completedQuestionIds,targetCount){
 const list=Array.isArray(queue)?queue:[],completed=toSet(completedQuestionIds),safeIndex=Math.max(0,Number(index)||0),current=list[safeIndex]||null,currentId=questionId(current),currentPending=!!currentId&&!completed.has(currentId),excludedIds=new Set(completed);
 if(currentPending)excludedIds.add(currentId);
 const target=Math.max(0,Number(targetCount)||0),remainingSlots=Math.max(0,target-completed.size-(currentPending?1:0));
 return{prefix:list.slice(0,Math.min(list.length,safeIndex+1)),current,currentPending,excludedIds,remainingSlots};
}
function mergeReservation(reservation,candidates){
 const r=reservation||{},seen=toSet(r.excludedIds),tail=[],limit=Math.max(0,Number(r.remainingSlots)||0);
 for(const question of Array.isArray(candidates)?candidates:[]){if(tail.length>=limit)break;const id=questionId(question);if(!id||seen.has(id))continue;seen.add(id);tail.push(question)}
 const remaining=r.currentPending&&r.current?[r.current,...tail]:tail.slice();
 return{questions:[...(Array.isArray(r.prefix)?r.prefix:[]),...tail],remaining,tail};
}
function counts(items){const list=Array.isArray(items)?items:[];return{review:list.filter(x=>x&&x.category==='review').length,weak:list.filter(x=>x&&x.category==='weak').length,newKnowledge:list.filter(x=>x&&x.category==='new').length,total:list.length}}
function summary(items){const c=counts(items);return c.total?'剩餘安排：複習 '+c.review+' · 弱項 '+c.weak+' · 新知識 '+c.newKnowledge:'本輪已沒有剩餘題目。'}
root.ManjingoDailyPlanRuntime={questionId,hash32,stableShuffle,balancedAnswerSlots,arrangeOptions,sessionReservation,mergeReservation,counts,summary};
})(window);
