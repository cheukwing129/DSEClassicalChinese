(function(root,factory){
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
root.ManjingoRemoteSyncGuard=api;
if(root.window&&root.window!==root)root.window.ManjingoRemoteSyncGuard=api;
const doc=root.document||(root.window&&root.window.document);
let tries=0;
function boot(){if(api.install())return;if(++tries<20&&typeof root.setTimeout==='function')root.setTimeout(boot,0)}
boot();
if(doc&&doc.readyState==='loading'&&typeof doc.addEventListener==='function')doc.addEventListener('DOMContentLoaded',()=>api.install(),{once:true});
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const KNOWLEDGE_FIELDS=['mastery','repetition','easeFactor','interval','nextReviewAt','attempts','correctCount','wrongCount','hintCount','lastCorrect','lastAnsweredAt','misconceptions'];
function learning(){return root.ManjingoLocalLearning||(root.window&&root.window.ManjingoLocalLearning)||null}
function timeValue(value){if(!value)return 0;try{if(typeof value.toDate==='function')return value.toDate().getTime();if(Number.isFinite(Number(value._seconds)))return Number(value._seconds)*1000;if(Number.isFinite(Number(value.seconds)))return Number(value.seconds)*1000;const t=new Date(value).getTime();return Number.isFinite(t)?t:0}catch(e){return 0}}
function number(value,fallback){const n=Number(value);return Number.isFinite(n)?n:fallback}
function remoteKnowledgeIsNewer(local,remote){const l=local&&typeof local==='object'?local:{},r=remote&&typeof remote==='object'?remote:{},la=number(l.attempts,0),ra=number(r.attempts,0);if(ra!==la)return ra>la;const lt=timeValue(l.lastAnsweredAt),rt=timeValue(r.lastAnsweredAt);if(rt||lt)return rt>=lt;return true}
function guardGamification(result,current){const safe={...(result||{})},progress=current&&typeof current==='object'?current:{};if(safe.totalXp===undefined||safe.totalXp===null)return safe;const localTotal=number(progress.totalXp,0),remoteTotal=number(safe.totalXp,0);if(remoteTotal<localTotal){safe.totalXp=localTotal;if(progress.todayXp!==undefined)safe.todayXp=number(progress.todayXp,0);if(progress.streak!==undefined)safe.streak=number(progress.streak,0);if(progress.lastGoalDate!==undefined)safe.lastGoalDate=progress.lastGoalDate}return safe}
function guardResult(kpId,result){const source=result&&typeof result==='object'?result:{},api=learning(),progress=api&&typeof api.getProgress==='function'?api.getProgress():{},safe=guardGamification(source,progress);if(kpId&&api&&typeof api.getKnowledge==='function'){const current=api.getKnowledge(kpId)||{};if(!remoteKnowledgeIsNewer(current,source))KNOWLEDGE_FIELDS.forEach(key=>{delete safe[key]})}return safe}
function install(){const api=learning();if(!api||api.__remoteSyncGuardInstalled||typeof api.syncRemoteResult!=='function')return false;const original=api.syncRemoteResult.bind(api);api.syncRemoteResult=function(kpId,result){return original(kpId,guardResult(kpId,result))};if(typeof api.syncGamification==='function'){const originalGame=api.syncGamification.bind(api);api.syncGamification=function(game){const current=typeof api.getProgress==='function'?api.getProgress():{};return originalGame(guardGamification(game,current))}}api.__remoteSyncGuardInstalled=true;return true}
return{KNOWLEDGE_FIELDS,timeValue,remoteKnowledgeIsNewer,guardGamification,guardResult,install};
});
