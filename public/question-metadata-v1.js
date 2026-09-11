(function(root,factory){
'use strict';
let curriculum=root&&root.ManjingoCurriculumV1;
if(typeof module==='object'&&module.exports){
  curriculum=require('./curriculum-v1.js');
  module.exports=factory(curriculum);
  return;
}
root.ManjingoQuestionMetadataV1=factory(curriculum);
})(typeof globalThis!=='undefined'?globalThis:this,function(curriculum){
'use strict';

const VERSION='question-metadata-v1';

// These questions live under article-specific legacy KPs, but the question itself
// tests a transferable language skill and should survive the curriculum migration.
const QUESTION_OVERRIDES={
 p2q001:{mode:'core',skillIds:['lex.context-inference']},
 p2q002:{mode:'core',skillIds:['trans.integrated']},
 p2q003:{mode:'core',skillIds:['lex.polysemy']},
 p2q004:{mode:'core',skillIds:['lex.polysemy']},
 p2q008:{mode:'core',skillIds:['lex.context-inference']},
 p2q009:{mode:'core',skillIds:['lex.polysemy']},
 p2q013:{mode:'core',skillIds:['lex.polysemy']},
 p2q015:{mode:'core',skillIds:['lex.context-inference']},
 p2q016:{mode:'core',skillIds:['lex.polysemy']},
 p2q018:{mode:'core',skillIds:['lex.context-inference']},
 p2q027:{mode:'core',skillIds:['lex.context-inference']},
 p2q029:{mode:'core',skillIds:['fw.yu']},
 p2q031:{mode:'core',skillIds:['read.referent-tracking']},
 p2q034:{mode:'core',skillIds:['lex.causative']},
 p2q041:{mode:'core',skillIds:['lex.ancient-modern']},
 p2q043:{mode:'core',skillIds:['lex.context-inference']},
 p2q057:{mode:'core',skillIds:['lex.context-inference']},
 p2q058:{mode:'core',skillIds:['lex.ancient-modern']},
 p2q060:{mode:'core',skillIds:['lex.polysemy']},
 p2q065:{mode:'core',skillIds:['lex.polysemy']},
 p2q071:{mode:'core',skillIds:['syn.object-fronting']},
 p2q072:{mode:'core',skillIds:['syn.object-fronting']},
 p2q085:{mode:'core',skillIds:['lex.word-class-shift']},
 p2q089:{mode:'core',skillIds:['lex.polysemy']},
 p2q095:{mode:'core',skillIds:['lex.polysemy']},
 cap1q018:{mode:'core',skillIds:['read.referent-tracking']},
 cap1q025:{mode:'core',skillIds:['fw.nai']},
 cap1q026:{mode:'core',skillIds:['fw.qi','read.referent-tracking']},
 cap1q027:{mode:'core',skillIds:['lex.polysemy']},
 cap1q028:{mode:'core',skillIds:['lex.polysemy']}
};

// Distinct question IDs that visibly reuse the same source sentence are grouped
// so later scheduling can cool down the sentence, not merely the question ID.
const SOURCE_SENTENCE_GROUPS={
 q001:'sentence:yueyanglou:tengzijing-zhe-shou-baling',
 cap1q001:'sentence:yueyanglou:tengzijing-zhe-shou-baling',
 cap1q002:'sentence:yueyanglou:tengzijing-zhe-shou-baling',
 cap1q003:'sentence:yueyanglou:tengzijing-zhe-shou-baling',

 q008:'sentence:yueyanglou:xianyou-houle',
 cap1q004:'sentence:yueyanglou:xianyou-houle',
 cap1q005:'sentence:yueyanglou:xianyou-houle',
 cap1q006:'sentence:yueyanglou:xianyou-houle',
 lpq053:'sentence:yueyanglou:xianyou-houle',

 q006:'sentence:yueyanglou:wei-siren-wushuiyugui',
 q010:'sentence:yueyanglou:wei-siren-wushuiyugui',
 cap1q013:'sentence:yueyanglou:wei-siren-wushuiyugui',
 cap1q014:'sentence:yueyanglou:wei-siren-wushuiyugui',
 cap1q015:'sentence:yueyanglou:wei-siren-wushuiyugui',
 p3q029:'sentence:yueyanglou:wei-siren-wushuiyugui',
 p3q041:'sentence:yueyanglou:wei-siren-wushuiyugui',

 p3q009:'sentence:yueyanglou:buyi-wuxi-jibei',
 lpq052:'sentence:yueyanglou:buyi-wuxi-jibei',

 p2q071:'sentence:loushiming:helouzhiyou',
 p2q072:'sentence:loushiming:helouzhiyou',
 lpq045:'sentence:loushiming:helouzhiyou',
 p3q030:'sentence:loushiming:helouzhiyou'
};

const CORE_ACTIONS=new Set(['retain','refactor','merge']);

function migrationFor(kpId){
  if(!curriculum)return null;
  if(typeof curriculum.migrationFor==='function')return curriculum.migrationFor(kpId);
  return curriculum.migration&&curriculum.migration[String(kpId)]||null;
}

function normalizeSentence(value){
  return String(value||'')
    .replace(/[\s\u3000，。！？；：、,.!?;:“”"'（）()《》〈〉【】\[\]—…]/g,'')
    .toLowerCase();
}

function quotedSegments(text){
  const source=String(text||''),out=[];
  const re=/「([^」]+)」/g;
  let match;
  while((match=re.exec(source)))if(match[1])out.push(match[1]);
  return out;
}

function inferSourceSentenceId(question){
  const id=String(question&&question.id||'');
  if(SOURCE_SENTENCE_GROUPS[id])return SOURCE_SENTENCE_GROUPS[id];
  const segments=quotedSegments(question&&question.q);
  if(!segments.length)return null;
  const longest=segments.slice().sort((a,b)=>normalizeSentence(b).length-normalizeSentence(a).length)[0];
  const normalized=normalizeSentence(longest);
  return normalized.length>=4?'sentence:'+normalized:null;
}

function inferSourceKind(question){
  const textId=String(question&&question.textId||'');
  return !textId||textId==='CROSS'?'cross':'set-text';
}

function defaultTransferLevel(question,mode){
  if(mode!=='core')return 0;
  return String(question&&question.textId||'')==='CROSS'?1:0;
}

function classify(question){
  const id=String(question&&question.id||'');
  const kpId=String(question&&question.kpId||'');
  const override=QUESTION_OVERRIDES[id]||null;
  const migration=migrationFor(kpId);
  let mode='unmapped',skillIds=[];

  if(override){
    mode=override.mode;
    skillIds=override.skillIds.slice();
  }else if(migration){
    skillIds=Array.isArray(migration.targetSkillIds)?migration.targetSkillIds.slice():[];
    if(CORE_ACTIONS.has(migration.action))mode='core';
    else if(migration.action==='advanced-reading')mode='advanced';
    else if(migration.action==='optional-set-text')mode='set-text';
  }

  return{
    curriculumMode:mode,
    skillIds,
    normalCore:mode==='core',
    sourceTextId:String(question&&question.textId||'')||null,
    sourceSentenceId:inferSourceSentenceId(question),
    sourceKind:inferSourceKind(question),
    transferLevel:override&&Number.isInteger(override.transferLevel)?override.transferLevel:defaultTransferLevel(question,mode)
  };
}

function annotate(question){return{...question,...classify(question)}}
function annotateAll(questions){return(Array.isArray(questions)?questions:[]).map(annotate)}
function normalCoreQuestions(questions){return annotateAll(questions).filter(q=>q.normalCore)}

function audit(questions){
  const annotated=annotateAll(questions),byMode={},bySkill={},bySourceText={};
  for(const q of annotated){
    byMode[q.curriculumMode]=(byMode[q.curriculumMode]||0)+1;
    const source=q.sourceTextId||'UNKNOWN';
    bySourceText[source]=(bySourceText[source]||0)+1;
    for(const skillId of q.skillIds)bySkill[skillId]=(bySkill[skillId]||0)+1;
  }
  return{total:annotated.length,byMode,bySkill,bySourceText};
}

return{
  VERSION,
  QUESTION_OVERRIDES,
  SOURCE_SENTENCE_GROUPS,
  normalizeSentence,
  quotedSegments,
  inferSourceSentenceId,
  classify,
  annotate,
  annotateAll,
  normalCoreQuestions,
  audit
};
});
