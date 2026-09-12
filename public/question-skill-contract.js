(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
root.ManjingoQuestionSkillContract=api;
if(root.window&&root.window!==root)root.window.ManjingoQuestionSkillContract=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const VERSION='question-skill-contract-v1';
function unique(values){return Array.from(new Set((values||[]).map(String).filter(Boolean)))}
function definition(curriculum,skillId){return curriculum&&typeof curriculum.skill==='function'?curriculum.skill(skillId):null}
function coreOnly(values,curriculum){return unique(values).filter(skillId=>{const item=definition(curriculum,skillId);return !!item&&Number(item.stage)<=2})}
function migrationSkills(kpId,curriculum){
 const rule=curriculum&&(typeof curriculum.migrationFor==='function'?curriculum.migrationFor(String(kpId||'')):curriculum.migration&&curriculum.migration[String(kpId||'')]);
 return coreOnly(rule&&rule.targetSkillIds,curriculum);
}
function allowedCoreSkillIds(questionData,kpId,curriculum){
 const explicit=coreOnly(questionData&&questionData.skillIds,curriculum);
 if(String(questionData&&questionData.skillContractVersion||'')===VERSION)return explicit;
 return unique([...explicit,...migrationSkills(kpId,curriculum)]);
}
function resolveCoreSkill(questionData,kpId,targetSkillId,curriculum){
 const allowed=allowedCoreSkillIds(questionData,kpId,curriculum),requested=String(targetSkillId||'');
 if(requested){
  if(allowed.includes(requested))return requested;
  const error=new Error('targetSkillId is not valid for questionId');error.status=400;throw error;
 }
 return allowed[0]||null;
}

return{VERSION,coreOnly,migrationSkills,allowedCoreSkillIds,resolveCoreSkill};
});
