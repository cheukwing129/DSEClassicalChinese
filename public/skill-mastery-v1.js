(function(root,factory){
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
root.ManjingoSkillMasteryV1=api;
if(root.window&&root.window!==root)root.window.ManjingoSkillMasteryV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';

const VERSION='skill-mastery-projection-v1';
const LEARNING_KEY='manjingo_progress_cache';

function runtimeRoot(){return root&&root.window||root}
function storage(){return root.localStorage||(root.window&&root.window.localStorage)||null}
function timeValue(value){if(!value)return 0;try{if(typeof value.toDate==='function')return value.toDate().getTime();if(Number.isFinite(Number(value._seconds)))return Number(value._seconds)*1000;if(Number.isFinite(Number(value.seconds)))return Number(value.seconds)*1000;const time=new Date(value).getTime();return Number.isFinite(time)?time:0}catch(e){return 0}}
function readState(){const s=storage();if(!s)return{};try{const value=JSON.parse(s.getItem(LEARNING_KEY)||'{}');return value&&typeof value==='object'?value:{}}catch(e){return{}}}
function writeState(state){const s=storage();if(!s)return false;try{s.setItem(LEARNING_KEY,JSON.stringify(state||{}));return true}catch(e){return false}}
function unique(values){return Array.from(new Set((values||[]).map(String).filter(Boolean)))}
function attempted(record){return !!(record&&(Number(record.attempts)>0||Number(record.correctCount)>0||Number(record.wrongCount)>0||record.lastAnsweredAt))}
function recordTime(record){return timeValue(record&&record.lastAnsweredAt||record&&record.updatedAt)}
function newerRecord(a,b){if(!a)return b||null;if(!b)return a;const at=recordTime(a),bt=recordTime(b);if(at!==bt)return at>bt?a:b;const aa=Number(a.attempts)||0,ba=Number(b.attempts)||0;if(aa!==ba)return aa>ba?a:b;if(String(a.source||'').includes('native')&&!String(b.source||'').includes('native'))return a;if(String(b.source||'').includes('native')&&!String(a.source||'').includes('native'))return b;return a}
function metadata(){const r=runtimeRoot();return r&&r.ManjingoQuestionMetadataV1||null}
function content(){const r=runtimeRoot();return r&&r.ManjingoContent||null}
function annotatedQuestions(){const c=content(),list=c&&Array.isArray(c.questions)?c.questions:[],m=metadata();return m&&typeof m.annotateAll==='function'?m.annotateAll(list):list}
function kpIdsForSkill(skillId,provided){if(Array.isArray(provided)&&provided.length)return unique(provided);const id=String(skillId||'');if(!id)return[];return unique(annotatedQuestions().filter(q=>q&&q.normalCore!==false&&Array.isArray(q.skillIds)&&q.skillIds.map(String).includes(id)).map(q=>q.kpId))}
function emptySkill(skillId,kpIds){return{skillId:String(skillId||''),mastery:0,repetition:0,easeFactor:2.5,interval:0,nextReviewAt:null,attempts:0,correctCount:0,wrongCount:0,hintCount:0,lastCorrect:null,lastAnsweredAt:null,kpIds:unique(kpIds),source:'unlearned',projectionVersion:VERSION}}
function knowledgeRecord(engine,state,kpId){if(engine&&typeof engine.getKnowledge==='function')return engine.getKnowledge(kpId);return state&&state.knowledge&&state.knowledge[kpId]||null}
function earliestReview(records){if(records.some(r=>!r.nextReviewAt))return null;let best=null,bestTime=Infinity;for(const r of records){const t=timeValue(r.nextReviewAt);if(t&&t<bestTime){bestTime=t;best=r.nextReviewAt}}return best}
function projectLegacy(skillId,options){const opts=options||{},state=opts.state||readState(),kpIds=kpIdsForSkill(skillId,opts.kpIds),records=kpIds.map(kpId=>({kpId,record:knowledgeRecord(opts.engine,state,kpId)})).filter(x=>attempted(x.record));if(!records.length)return emptySkill(skillId,kpIds);let weightTotal=0,masteryTotal=0,latest=records[0];for(const row of records){const weight=Math.max(1,Number(row.record.attempts)||0);weightTotal+=weight;masteryTotal+=(Number(row.record.mastery)||0)*weight;if(recordTime(row.record)>recordTime(latest.record))latest=row}return{skillId:String(skillId),mastery:Math.round(masteryTotal/Math.max(1,weightTotal)),repetition:Number(latest.record.repetition)||0,easeFactor:Number(latest.record.easeFactor)||2.5,interval:Number(latest.record.interval)||0,nextReviewAt:earliestReview(records.map(x=>x.record)),attempts:records.reduce((n,x)=>n+(Number(x.record.attempts)||0),0),correctCount:records.reduce((n,x)=>n+(Number(x.record.correctCount)||0),0),wrongCount:records.reduce((n,x)=>n+(Number(x.record.wrongCount)||0),0),hintCount:records.reduce((n,x)=>n+(Number(x.record.hintCount)||0),0),lastCorrect:latest.record.lastCorrect??null,lastAnsweredAt:latest.record.lastAnsweredAt||null,kpIds:unique(kpIds),source:'legacy-projection',projectionVersion:VERSION}}
function normalizeStored(skillId,record,kpIds){if(!record||typeof record!=='object')return null;return{...emptySkill(skillId,kpIds),...record,skillId:String(skillId),kpIds:unique([...(Array.isArray(record.kpIds)?record.kpIds:[]),...(kpIds||[])])}}
function getSkillMastery(skillId,options){const id=String(skillId||''),opts=options||{},state=opts.state||readState(),kpIds=kpIdsForSkill(id,opts.kpIds),stored=normalizeStored(id,state.skillMastery&&state.skillMastery[id],kpIds),projected=projectLegacy(id,{...opts,state,kpIds}),chosen=newerRecord(stored,projected)||emptySkill(id,kpIds);if(storage()&&attempted(chosen)){state.skillMastery=state.skillMastery&&typeof state.skillMastery==='object'?state.skillMastery:{};const current=state.skillMastery[id];if(!current||JSON.stringify(current)!==JSON.stringify(chosen)){state.skillMastery[id]=chosen;writeState(state)}}return chosen}
function getSkillMasteries(skillIds,options){return unique(skillIds).map(id=>getSkillMastery(id,options))}
function mergeSkillMastery(local,remote){const a=local&&typeof local==='object'?local:{},b=remote&&typeof remote==='object'?remote:{},out={},keys=new Set([...Object.keys(a),...Object.keys(b)]);for(const key of keys){const chosen=newerRecord(normalizeStored(key,a[key],[]),normalizeStored(key,b[key],[]));if(chosen)out[key]=chosen}return out}
function refreshSkillsForKp(kpId,options){const id=String(kpId||''),opts=options||{},skills=new Set();for(const q of annotatedQuestions())if(String(q&&q.kpId||'')===id&&Array.isArray(q.skillIds))q.skillIds.forEach(x=>skills.add(String(x)));return Array.from(skills).map(skillId=>getSkillMastery(skillId,opts))}

return{VERSION,LEARNING_KEY,timeValue,attempted,recordTime,newerRecord,kpIdsForSkill,emptySkill,projectLegacy,getSkillMastery,getSkillMasteries,mergeSkillMastery,refreshSkillsForKp};
});
