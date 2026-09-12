(function(root,factory){
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
root.ManjingoAccountSync=api;
if(root.window&&root.window!==root)root.window.ManjingoAccountSync=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const LEARNING_KEY='manjingo_progress_cache';
const ROTATION_KEY='manjingo_question_rotation_v1';
const SENTENCE_HISTORY_KEY='__sourceSentences';
const MAX_ROTATION_PER_KP=8;
const MAX_SENTENCE_HISTORY=24;
let modulePromise=null,syncPromise=null,timer=null,installed=false;
function storage(){return root.localStorage||(root.window&&root.window.localStorage)||null}
function parse(key,fallback){const s=storage();if(!s)return fallback;try{const value=JSON.parse(s.getItem(key)||'null');return value&&typeof value==='object'?value:fallback}catch(e){return fallback}}
function write(key,value){const s=storage();if(!s)return false;try{s.setItem(key,JSON.stringify(value||{}));return true}catch(e){return false}}
function timeValue(value){if(!value)return 0;try{if(typeof value.toDate==='function')return value.toDate().getTime();if(Number.isFinite(Number(value._seconds)))return Number(value._seconds)*1000;if(Number.isFinite(Number(value.seconds)))return Number(value.seconds)*1000;const time=new Date(value).getTime();return Number.isFinite(time)?time:0}catch(e){return 0}}
function recordTime(record){const value=record&&typeof record==='object'?record:{};const answered=timeValue(value.lastAnsweredAt||value.updatedAt),observed=timeValue(value.difficultyObservability&&value.difficultyObservability.lastDecision&&value.difficultyObservability.lastDecision.observedAt);return Math.max(answered,observed)}
function newerRecord(a,b){const left=a&&typeof a==='object'?a:{},right=b&&typeof b==='object'?b:{},la=Number(left.attempts)||0,ra=Number(right.attempts)||0;if(la!==ra)return la>ra?left:right;const lt=recordTime(left),rt=recordTime(right);return rt>lt?right:left}
function practiceSignature(item){return [String(item&&item.kpId||''),String(item&&item.completedAt||''),String(item&&item.strategy||'legacy'),Number(item&&item.beforeMastery)||0,Number(item&&item.afterMastery)||0].join('|')}
function mergePracticeHistory(a,b){const seen=new Set(),items=[];[...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])].forEach(item=>{const key=practiceSignature(item);if(!item||!item.kpId||seen.has(key))return;seen.add(key);items.push({...item})});return items.sort((x,y)=>timeValue(y.completedAt)-timeValue(x.completedAt)).slice(0,200)}
function mergeObjectRecords(a,b){const result={},keys=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);keys.forEach(key=>{result[key]={...newerRecord(a&&a[key],b&&b[key])}});return result}
function mergeLearningState(local,remote){const a=local&&typeof local==='object'?local:{},b=remote&&typeof remote==='object'?remote:{},todayA=String(a.todayDate||''),todayB=String(b.todayDate||''),sameDay=todayA&&todayB&&todayA===todayB;return{
 totalXp:Math.max(Number(a.totalXp)||0,Number(b.totalXp)||0),
 todayXp:sameDay?Math.max(Number(a.todayXp)||0,Number(b.todayXp)||0):(timeValue(todayB)>timeValue(todayA)?Number(b.todayXp)||0:Number(a.todayXp)||0),
 streak:Math.max(Number(a.streak)||0,Number(b.streak)||0),
 todayDate:todayB&&(!todayA||todayB>todayA)?todayB:todayA||todayB||null,
 lastGoalDate:[a.lastGoalDate,b.lastGoalDate].filter(Boolean).sort().pop()||null,
 knowledge:mergeObjectRecords(a.knowledge,b.knowledge),
 skillMastery:mergeObjectRecords(a.skillMastery,b.skillMastery),
 conceptMastery:mergeObjectRecords(a.conceptMastery,b.conceptMastery),
 practiceHistory:mergePracticeHistory(a.practiceHistory,b.practiceHistory)
}}
function mergeRotation(local,remote){const a=local&&typeof local==='object'?local:{},b=remote&&typeof remote==='object'?remote:{},result={},keys=new Set([...Object.keys(a),...Object.keys(b)]);keys.forEach(key=>{const seen=new Set(),ids=[];[...(Array.isArray(a[key])?a[key]:[]),...(Array.isArray(b[key])?b[key]:[])].forEach(id=>{const value=String(id);if(!value||seen.has(value))return;seen.add(value);ids.push(value)});const limit=key===SENTENCE_HISTORY_KEY?MAX_SENTENCE_HISTORY:MAX_ROTATION_PER_KP;result[key]=ids.slice(0,limit)});return result}
function firebase(){if(!modulePromise)modulePromise=import('./firebase-config.js');return modulePromise}
function learning(){return root.ManjingoLocalLearning||(root.window&&root.window.ManjingoLocalLearning)||null}
function emit(detail){const target=root.window||root,EventCtor=root.CustomEvent||(root.window&&root.window.CustomEvent);if(target&&typeof target.dispatchEvent==='function'&&typeof EventCtor==='function')target.dispatchEvent(new EventCtor('manjingo:account-sync-state',{detail}))}
function remoteKnowledgeWins(local,remote){return newerRecord(local,remote)===remote}
function mergeGame(local,remote){const a=local||{},b=remote||{},remoteDate=String(b.todayXpDate||b.todayDate||''),localDate=String(a.todayDate||'');return{totalXp:Math.max(Number(a.totalXp)||0,Number(b.totalXp)||0),todayXp:remoteDate&&localDate&&remoteDate===localDate?Math.max(Number(a.todayXp)||0,Number(b.todayXp)||0):Number(a.todayXp)||Number(b.todayXp)||0,streak:Math.max(Number(a.streak)||0,Number(b.streak)||0),lastGoalDate:[a.lastGoalDate,b.lastActiveDate].filter(Boolean).sort().pop()||null}}
async function syncNow(options){if(syncPromise)return syncPromise;syncPromise=(async()=>{const silent=options&&options.silent;try{if(!silent)emit({status:'syncing'});const fb=await firebase(),uid=await fb.ensureLogin();if(!uid)return{ok:false,reason:'auth'};let local=parse(LEARNING_KEY,{}),rotation=parse(ROTATION_KEY,{});const [snapshot,knowledgeState,conceptState,game]=await Promise.all([fb.fetchClientSyncState(uid),fb.fetchUserKnowledgeState(uid),fb.fetchUserConceptState(uid),fb.fetchUserGamification(uid)]);if(snapshot&&snapshot.learningState)local=mergeLearningState(local,snapshot.learningState);if(snapshot&&snapshot.questionRotation)rotation=mergeRotation(rotation,snapshot.questionRotation);write(LEARNING_KEY,local);write(ROTATION_KEY,rotation);const engine=learning();if(engine){Object.entries(knowledgeState||{}).forEach(([kpId,record])=>{const current=engine.getKnowledge(kpId)||{};if(remoteKnowledgeWins(current,record)&&typeof engine.syncRemoteResult==='function')engine.syncRemoteResult(kpId,record)});if(typeof engine.syncRemoteConceptState==='function')engine.syncRemoteConceptState(conceptState||{});if(game&&typeof engine.syncGamification==='function')engine.syncGamification(mergeGame(engine.getProgress?engine.getProgress():local,game));local=parse(LEARNING_KEY,local)}local=mergeLearningState(local,snapshot&&snapshot.learningState);rotation=mergeRotation(parse(ROTATION_KEY,rotation),snapshot&&snapshot.questionRotation);write(LEARNING_KEY,local);write(ROTATION_KEY,rotation);const saved=await fb.saveClientSyncState(uid,{learningState:local,questionRotation:rotation});emit({status:saved?'synced':'local-only',uid});return{ok:!!saved,uid,learningState:local,questionRotation:rotation}}catch(error){emit({status:'error',error:String(error&&error.message||error)});return{ok:false,error}}finally{syncPromise=null}})();return syncPromise}
function schedule(){if(timer)clearTimeout(timer);timer=setTimeout(()=>{timer=null;void syncNow({silent:true})},1800)}
function clearLocal(){const s=storage();if(!s)return false;try{s.removeItem(LEARNING_KEY);s.removeItem(ROTATION_KEY);return true}catch(e){return false}}
function install(){if(installed)return true;installed=true;const target=root.window||root;if(target&&typeof target.addEventListener==='function'){target.addEventListener('manjingo:learning-state-changed',event=>{if(event&&event.detail&&event.detail.source==='account-sync')return;schedule()});target.addEventListener('online',()=>schedule())}const doc=root.document||(root.window&&root.window.document);if(doc){const start=()=>{setTimeout(()=>void syncNow({silent:true}),0)};if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start);else start()}return true}
const api={LEARNING_KEY,ROTATION_KEY,SENTENCE_HISTORY_KEY,MAX_ROTATION_PER_KP,MAX_SENTENCE_HISTORY,timeValue,recordTime,newerRecord,mergePracticeHistory,mergeLearningState,mergeRotation,mergeGame,syncNow,schedule,clearLocal,install};
if(typeof document!=='undefined'||root.document||(root.window&&root.window.document))install();
return api;
});