(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
root.ManjingoQuestionDiversityV1=api;
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

function canTake(q,state,policy,options){
 const source=sourceOf(q),sentence=sentenceOf(q);
 if(sentence&&state.sentences.get(sentence)>=policy.maxQuestionsPerSourceSentence)return false;
 if(source&&state.sources.get(source)>=policy.maxQuestionsPerSourceText)return false;
 if(sentence&&options.avoidSentenceIds.has(sentence))return false;
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

function buildState(){return{ids:new Set(),sources:new Map(),sentences:new Map()}}

/**
 * Preserve candidate priority/order while enforcing source diversity when alternatives exist.
 * Pass 1 is strict. Pass 2 allows recent-sentence history but keeps per-session caps.
 * Pass 3 fills any remaining slots from unique questions so the session target is not lost.
 */
function select(candidates,limit,opts){
 const source=Array.isArray(candidates)?candidates.filter(Boolean):[];
 const max=Math.max(0,Number(limit)||0);
 const options=opts||{};
 const policy={
  maxQuestionsPerSourceText:Math.max(1,Number(options.maxQuestionsPerSourceText)||DEFAULTS.maxQuestionsPerSourceText),
  maxQuestionsPerSourceSentence:Math.max(1,Number(options.maxQuestionsPerSourceSentence)||DEFAULTS.maxQuestionsPerSourceSentence)
 };
 const avoidSentenceIds=new Set((options.avoidSentenceIds||[]).map(String));
 const state=buildState(),out=[];
 const strictOptions={avoidSentenceIds};

 for(const q of source){
  if(out.length>=max)break;
  if(!idOf(q)||state.ids.has(idOf(q)))continue;
  if(canTake(q,state,policy,strictOptions))add(q,state,out);
 }

 if(out.length<max&&avoidSentenceIds.size){
  const relaxedHistory={avoidSentenceIds:new Set()};
  for(const q of source){
   if(out.length>=max)break;
   if(!idOf(q)||state.ids.has(idOf(q)))continue;
   if(canTake(q,state,policy,relaxedHistory))add(q,state,out);
  }
 }

 if(out.length<max){
  for(const q of source){
   if(out.length>=max)break;
   if(!idOf(q)||state.ids.has(idOf(q)))continue;
   // Last-resort fill: preserve unique IDs. Same-sentence/source overflow is explicit
   // and only happens when the available pool cannot satisfy the diversity policy.
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

return{VERSION,DEFAULTS,select,measure,sourceOf,sentenceOf};
});
