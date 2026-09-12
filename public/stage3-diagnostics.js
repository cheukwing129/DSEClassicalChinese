(function(root,factory){
'use strict';
const api=factory(root||{});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.ManjingoStage3Diagnostics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';

const STORAGE_KEY='manyingo_stage3_diagnostics_v1';
const MAX_EVENTS_PER_SKILL=24;
const DIAGNOSTIC_MAP=Object.freeze({
 tr10q001:['read.logical-relation'],
 tr10q002:['read.logical-relation'],
 tr10q003:['read.logical-relation'],
 tr10q004:['read.logical-relation'],
 tr10q005:['read.parallel-inference','read.logical-relation'],
 tr10q006:['read.logical-relation'],
 tr10q007:['read.actor-tracking','read.logical-relation'],
 tr10q008:['read.logical-relation'],
 tr10q009:['read.logical-relation'],
 tr10q010:['read.logical-relation'],
 tr10q011:['read.context-clues','read.parallel-inference'],
 tr10q012:['read.context-clues'],
 tr10q013:['lex.context-inference'],
 tr10q014:['trans.integrated'],
 tr10q015:['lex.context-inference'],
 tr10q016:['read.context-clues','read.logical-relation'],
 tr10q017:['lex.semantic-role','lex.context-inference'],
 tr10q018:['read.logical-relation'],
 tr10q019:['read.logical-relation'],
 tr10q020:['read.logical-relation'],
 tr10q021:['read.logical-relation','read.parallel-inference'],
 tr10q022:['read.logical-relation'],
 tr10q023:['read.logical-relation'],
 tr10q024:['read.logical-relation','read.context-clues'],
 tr10q025:['read.context-clues','read.logical-relation'],
 tr10q026:['read.context-clues'],
 tr10q027:['read.logical-relation'],
 tr10q028:['read.parallel-inference','read.logical-relation'],
 tr10q029:['read.logical-relation'],
 tr10q030:['read.context-clues'],
 tr10q031:['lex.context-inference'],
 tr10q032:['trans.integrated','syn.interrogative-patterns'],
 tr10q033:['read.logical-relation'],
 tr10q034:['lex.context-inference'],
 tr10q035:['trans.integrated','read.referent-tracking'],
 tr10q036:['read.logical-relation','read.referent-tracking']
});

function nowIso(value){const date=value?new Date(value):new Date();return Number.isFinite(date.getTime())?date.toISOString():new Date().toISOString();}
function readRaw(){try{return JSON.parse(root.localStorage&&root.localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){return{};}}
function normalize(raw){const source=raw&&typeof raw==='object'?raw:{};const skills={};Object.entries(source.skills&&typeof source.skills==='object'?source.skills:{}).forEach(([skillId,value])=>{const record=value&&typeof value==='object'?value:{};const events=(Array.isArray(record.events)?record.events:[]).filter(x=>x&&x.questionId&&typeof x.correct==='boolean').map(x=>({questionId:String(x.questionId),correct:!!x.correct,at:nowIso(x.at)})).slice(-MAX_EVENTS_PER_SKILL);skills[String(skillId)]={events,verifiedAt:record.verifiedAt?nowIso(record.verifiedAt):null,lastVerification:record.lastVerification&&typeof record.lastVerification==='object'?{correctCount:Math.max(0,Number(record.lastVerification.correctCount)||0),total:Math.max(0,Number(record.lastVerification.total)||0),at:nowIso(record.lastVerification.at)}:null};});return{version:1,skills};}
function readState(){return normalize(readRaw());}
function writeState(state){const clean=normalize(state);try{if(root.localStorage)root.localStorage.setItem(STORAGE_KEY,JSON.stringify(clean));return true;}catch(e){return false;}}
function coreSkillIds(){const curriculum=root.ManjingoCurriculumV1;return new Set(curriculum&&typeof curriculum.coreSkills==='function'?curriculum.coreSkills().map(x=>String(x.id)):[]);}
function diagnosticSkillIds(questionOrId){const id=typeof questionOrId==='string'?questionOrId:String(questionOrId&&questionOrId.id||'');const ids=(DIAGNOSTIC_MAP[id]||[]).map(String);const valid=coreSkillIds();return valid.size?ids.filter(id=>valid.has(id)):ids.slice();}
function skillLabel(skillId){const curriculum=root.ManjingoCurriculumV1,item=curriculum&&typeof curriculum.skill==='function'?curriculum.skill(skillId):null;return item&&item.label||String(skillId||'');}
function recordAttempt(question,correct,at){const questionId=String(question&&question.id||question||''),skills=diagnosticSkillIds(questionId);if(!questionId||!skills.length)return[];const state=readState(),time=nowIso(at);for(const skillId of skills){const record=state.skills[skillId]||{events:[],verifiedAt:null,lastVerification:null};record.events=[...(record.events||[]),{questionId,correct:!!correct,at:time}].slice(-MAX_EVENTS_PER_SKILL);state.skills[skillId]=record;}writeState(state);return skills;}
function activeEvents(record){const verifiedAt=record&&record.verifiedAt?new Date(record.verifiedAt).getTime():0;return(Array.isArray(record&&record.events)?record.events:[]).filter(event=>!verifiedAt||new Date(event.at).getTime()>verifiedAt);}
function summarizeSignal(skillId,record){const events=activeEvents(record),wrong=events.filter(x=>!x.correct),correct=events.filter(x=>x.correct),distinctWrongQuestions=new Set(wrong.map(x=>x.questionId)).size,strength=Math.max(0,wrong.length-Math.floor(correct.length/2));return{skillId:String(skillId),label:skillLabel(skillId),wrongCount:wrong.length,correctCount:correct.length,distinctWrongQuestions,strength,lastAt:events.length?events[events.length-1].at:null,eligible:distinctWrongQuestions>=2&&strength>=2,lastVerification:record&&record.lastVerification||null};}
function signalForSkill(skillId){const state=readState(),record=state.skills[String(skillId)];return record?summarizeSignal(skillId,record):null;}
function signals(){const state=readState();return Object.entries(state.skills).map(([skillId,record])=>summarizeSignal(skillId,record)).filter(x=>x.eligible).sort((a,b)=>b.strength-a.strength||b.wrongCount-a.wrongCount||new Date(b.lastAt||0).getTime()-new Date(a.lastAt||0).getTime());}
function recordVerification(skillId,result){const id=String(skillId||'');if(!id)return null;const state=readState(),record=state.skills[id]||{events:[],verifiedAt:null,lastVerification:null},correctCount=Math.max(0,Number(result&&result.correctCount)||0),total=Math.max(0,Number(result&&result.total)||0),at=nowIso(result&&result.at);record.lastVerification={correctCount,total,at};if(total>=2&&correctCount>=total){record.verifiedAt=at;record.events=[];}state.skills[id]=record;writeState(state);return{passed:total>=2&&correctCount>=total,signal:summarizeSignal(id,record)};}
function clear(){try{if(root.localStorage)root.localStorage.removeItem(STORAGE_KEY);return true;}catch(e){return false;}}

return{STORAGE_KEY,MAX_EVENTS_PER_SKILL,DIAGNOSTIC_MAP,diagnosticSkillIds,skillLabel,readState,recordAttempt,signalForSkill,signals,recordVerification,clear};
});
