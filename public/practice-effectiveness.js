(function(root,factory){
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
root.ManjingoPracticeEffectiveness=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const KEY='manjingo_progress_cache';
const DEFAULTS={minSessions:2,historyLimit:3,lowYieldDelta:8,stableMastery:75,lowAccuracy:70};
function numberOrNull(value){if(value==null||value==='')return null;const n=Number(value);return Number.isFinite(n)?n:null}
function strategyOf(session){const value=String(session&&session.strategy||'').toLowerCase();return value==='remedial'?'remedial':value==='targeted'?'targeted':'legacy'}
function accuracyOf(session){const direct=numberOrNull(session&&session.accuracy);if(direct!=null)return Math.max(0,Math.min(100,direct));const count=numberOrNull(session&&session.questionCount),correct=numberOrNull(session&&session.correctCount);return count&&correct!=null?Math.round(correct/count*100):null}
function completedAtValue(session){const t=new Date(session&&session.completedAt||0).getTime();return Number.isFinite(t)?t:0}
function ordered(history){return (Array.isArray(history)?history:[]).map((session,index)=>({session,index,time:completedAtValue(session)})).sort((a,b)=>b.time-a.time||a.index-b.index).map(item=>item.session)}
function targetedSinceIntervention(history,limit){const result=[];for(const session of ordered(history)){const strategy=strategyOf(session);if(strategy==='remedial')break;if(strategy==='targeted'||strategy==='legacy')result.push(session);if(result.length>=Math.max(1,Number(limit)||DEFAULTS.historyLimit))break}return result}
function evaluate(history,options){const opts={...DEFAULTS,...(options||{})},sessions=targetedSinceIntervention(history,opts.historyLimit),totalDelta=sessions.reduce((sum,item)=>sum+(Number(item&&item.delta)||0),0),accuracyValues=sessions.map(accuracyOf).filter(value=>value!=null),averageAccuracy=accuracyValues.length?Math.round(accuracyValues.reduce((sum,value)=>sum+value,0)/accuracyValues.length):null,latest=sessions[0]||null,latestAfter=numberOrNull(latest&&latest.afterMastery),currentMastery=Math.max(0,Math.min(100,latestAfter!=null?latestAfter:(numberOrNull(opts.currentMastery)||0))),lowYield=sessions.length>=opts.minSessions&&totalDelta<opts.lowYieldDelta,lowAccuracy=averageAccuracy!=null&&averageAccuracy<opts.lowAccuracy,highMastery=currentMastery>=opts.stableMastery,ceilingProtected=!!(lowYield&&highMastery&&!lowAccuracy),needsRemediation=!!(lowYield&&(!highMastery||lowAccuracy));return{sessions:sessions.length,totalDelta,averageAccuracy:averageAccuracy==null?0:averageAccuracy,currentMastery,lowYield,lowAccuracy,highMastery,ceilingProtected,needsRemediation,evidence:sessions.slice()}}
function readState(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}}
function annotateLatest(entry,strategy){if(!entry)return entry;const normalized=strategy==='remedial'?'remedial':'targeted';try{const data=readState(),history=Array.isArray(data.practiceHistory)?data.practiceHistory:[],index=history.findIndex(item=>String(item&&item.kpId)===String(entry.kpId)&&String(item&&item.completedAt)===String(entry.completedAt));if(index>=0){history[index]={...history[index],strategy:normalized};data.practiceHistory=history;localStorage.setItem(KEY,JSON.stringify(data))}}catch(e){}return{...entry,strategy:normalized}}
function install(){const engine=root.ManjingoLocalLearning;if(!engine||engine.__practiceEffectivenessInstalled)return false;const originalRecord=typeof engine.recordPracticeSession==='function'?engine.recordPracticeSession.bind(engine):null;if(originalRecord){engine.recordPracticeSession=function(session){const entry=originalRecord(session);return annotateLatest(entry,String(session&&session.strategy||'').toLowerCase()==='remedial'?'remedial':'targeted')}}engine.getRemediationStatus=function(kpId){const history=typeof engine.getPracticeHistory==='function'?engine.getPracticeHistory({kpId,days:7,limit:50}):[],record=typeof engine.getKnowledge==='function'?engine.getKnowledge(kpId):{},result=evaluate(history,{currentMastery:Number(record&&record.mastery)||0});return{kpId:String(kpId),...result}};engine.__practiceEffectivenessInstalled=true;return true}
const api={DEFAULTS,strategyOf,accuracyOf,ordered,targetedSinceIntervention,evaluate,install,annotateLatest};
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install()}
return api;
});
