(function(){
'use strict';
const UNLOCK_MASTERY=70;
const STAGE_DEFS=[
 {id:'foundation',title:'字詞基礎',icon:'🌱',description:'先掌握常見實詞義與高頻虛詞'},
 {id:'word-advanced',title:'字詞進階',icon:'🔤',description:'處理活用、通假及較進階虛詞'},
 {id:'syntax',title:'句法拆解',icon:'🧩',description:'辨認句式、省略與語序'},
 {id:'reading',title:'閱讀推斷',icon:'📚',description:'利用上下文、邏輯與人物線索讀懂句意'},
 {id:'translation',title:'翻譯表達',icon:'✍️',description:'把文言準確而自然地轉成現代漢語'},
 {id:'transfer',title:'遷移實戰',icon:'🎯',description:'把能力帶到陌生單句、句組與微篇章'}
];
function classifySkill(skill){
 const domain=String(skill&&skill.domain||''),stage=Number(skill&&skill.stage)||99;
 if((domain==='lex'||domain==='fw')&&stage<=1)return'foundation';
 if(domain==='lex'||domain==='fw')return'word-advanced';
 if(domain==='syn')return'syntax';
 if(domain==='read')return'reading';
 if(domain==='trans')return'translation';
 if(domain==='transfer')return'transfer';
 return null;
}
function coreSkills(skills){return(Array.isArray(skills)?skills:[]).filter(skill=>skill&&skill.id&&Number(skill.stage)<=2&&classifySkill(skill));}
function masteryOf(record){return Math.max(0,Math.min(100,Number(record&&record.mastery)||0));}
function buildStages(skills,getSkillMastery){
 const source=coreSkills(skills),groups=new Map(STAGE_DEFS.map(stage=>[stage.id,[]]));
 source.forEach(skill=>groups.get(classifySkill(skill)).push(skill));
 let priorUnlocked=true;
 return STAGE_DEFS.map((def,index)=>{
  const stageSkills=groups.get(def.id)||[],masteries=stageSkills.map(skill=>masteryOf(typeof getSkillMastery==='function'?getSkillMastery(skill.id):null));
  const mastery=stageSkills.length?Math.round(masteries.reduce((sum,value)=>sum+value,0)/stageSkills.length):0;
  const unlocked=index===0?true:priorUnlocked,complete=stageSkills.length>0&&mastery>=UNLOCK_MASTERY;
  priorUnlocked=unlocked&&complete;
  return{...def,index,skillIds:stageSkills.map(skill=>String(skill.id)),count:stageSkills.length,mastery,unlocked,complete};
 });
}
function availableSkillIds(stages){return(stages||[]).filter(stage=>stage.unlocked).flatMap(stage=>stage.skillIds||[]);}
function currentStage(stages){const unlocked=(stages||[]).filter(stage=>stage.unlocked);return unlocked.find(stage=>!stage.complete)||unlocked[unlocked.length-1]||null;}
function stageForSkill(skillId,skills){const def=coreSkills(skills).find(skill=>String(skill.id)===String(skillId));if(!def)return null;const id=classifySkill(def);return STAGE_DEFS.find(stage=>stage.id===id)||null;}
window.ManjingoLearningPath={UNLOCK_MASTERY,STAGE_DEFS,coreSkills,classifySkill,buildStages,availableSkillIds,currentStage,stageForSkill};
})();
