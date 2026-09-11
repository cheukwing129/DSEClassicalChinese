(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
root.ManjingoQuestionDiversityV1=api;
if(root.window&&root.window!==root)root.window.ManjingoQuestionDiversityV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const VERSION='question-diversity-v1';
const DEFAULTS={
 maxQuestionsPerSourceText:2,
 maxQuestionsPerSourceSentence:1
};

function idOf(q){return String(q&&q.id||'')}
function sourceOf(q){
 const source=String(q&&q.sourceTextId||'');
 return !source||source==='CROSS'||source==='UNKNOWN'?null:source;
}
function sentenceOf(q){return String(q&&q.sourceSentenceId||'')||null}
function policyFrom(options){
 const value=options||{};
 return{
  maxQuestionsPerSourceText:Math.max(1,Number(value.maxQuestionsPerSourceText)||DEFAULTS.maxQuestionsPerSourceText),
  maxQuestionsPerSourceSentence:Math.max(1,Number(value.maxQuestionsPerSourceSentence)||DEFAULTS.maxQuestionsPerSourceSentence)
 };
}
function buildState(questions){
 const state={ids:new Set(),sources:new Map(),sentences:new Map()};
 for(const q of Array.isArray(questions)?questions:[]){
  const id=idOf(q),source=sourceOf(q),sentence=sentenceOf(q);
  if(id)state.ids.add(id);
  if(source)state.sources.set(source,(state.sources.get(source)||0)+1);
  if(sentence)state.sentences.set(sentence,(state.sentences.get(sentence)||0)+1);
 }
 return state;
}
function canTake(q,state,policy,avoidSentenceIds){
 const source=sourceOf(q),sentence=sentenceOf(q);
 if(!idOf(q)||state.ids.has(idOf(q)))return false;
 if(sentence&&(state.sentences.get(sentence)||0)>=policy.maxQuestionsPerSourceSentence)return false;
 if(source&&(state.sources.get(source)||0)>=policy.maxQuestionsPerSourceText)return false;
 if(sentence&&avoidSentenceIds.has(sentence))return false;
 return true;
}
function add(q,state,out){
 const source=sourceOf(q),sentence=sentenceOf(q),id=idOf(q);
 if(!id||state.ids.has(id))return false;
 state.ids.add(id);
 if(source)state.sources.set(source,(state.sources.get(source)||0)+1);
 if(sentence)state.sentences.set(sentence,(state.sentences.get(sentence)||0)+1);
 out.push(q);
 return true;
}

/**
 * Pick one candidate against questions already selected for the session.
 * Candidate order is pedagogical priority: callers may put misconception or
 * rotation-preferred questions first. Diversity only changes the choice when a
 * same-priority alternative can avoid source/sentence repetition.
 */
function choose(candidates,selected,opts){
 const source=Array.isArray(candidates)?candidates.filter(Boolean):[];
 if(!source.length)return null;
 const state=buildState(selected),policy=policyFrom(opts),options=opts||{};
 const avoidSentenceIds=new Set((options.avoidSentenceIds||[]).map(String));
 for(const q of source)if(canTake(q,state,policy,avoidSentenceIds))return q;
 if(avoidSentenceIds.size){
  const none=new Set();
  for(const q of source)if(canTake(q,state,policy,none))return q;
 }
 return source.find(q=>idOf(q)&&!state.ids.has(idOf(q)))||null;
}

/**
 * Preserve candidate priority/order while enforcing source diversity when alternatives exist.
 * Pass 1 is strict. Pass 2 allows recent-sentence history but keeps per-session caps.
 * Pass 3 fills any remaining slots from unique questions so the session target is not lost.
 */
function select(candidates,limit,opts){
 const source=Array.isArray(candidates)?candidates.filter(Boolean):[];
 const max=Math.max(0,Number(limit)||0),options=opts||{},policy=policyFrom(options);
 const avoidSentenceIds=new Set((options.avoidSentenceIds||[]).map(String));
 const state=buildState(),out=[];
 for(const q of source){
  if(out.length>=max)break;
  if(canTake(q,state,policy,avoidSentenceIds))add(q,state,out);
 }
 if(out.length<max&&avoidSentenceIds.size){
  const none=new Set();
  for(const q of source){
   if(out.length>=max)break;
   if(canTake(q,state,policy,none))add(q,state,out);
  }
 }
 if(out.length<max){
  for(const q of source){
   if(out.length>=max)break;
   if(!idOf(q)||state.ids.has(idOf(q)))continue;
   add(q,state,out);
  }
 }
 return out;
}

function measure(questions){
 const sourceCounts={},sentenceCounts={};
 for(const q of Array.isArray(questions)?questions:[]){
  const source=sourceOf(q),sentence=sentenceOf(q);
  if(source)sourceCounts[source]=(sourceCounts[source]||0)+1;
  if(sentence)sentenceCounts[sentence]=(sentenceCounts[sentence]||0)+1;
 }
 return{sourceCounts,sentenceCounts};
}

return{VERSION,DEFAULTS,select,choose,measure,sourceOf,sentenceOf,buildState};
});
