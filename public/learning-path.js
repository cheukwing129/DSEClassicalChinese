(function(){
'use strict';
const UNLOCK_MASTERY=70;
const INTRO_IDS=new Set(['kp_yueyang_001','kp_yueyang_004','gj_004','sx_001','kp_translation_001']);
const STAGE_DEFS=[
 {id:'intro',title:'入門',icon:'🌱'},
 {id:'words',title:'實詞',icon:'📖'},
 {id:'particles',title:'虛詞',icon:'🔤'},
 {id:'sentences',title:'句式',icon:'🧩'},
 {id:'translation',title:'翻譯',icon:'✍️'},
 {id:'reading',title:'篇章理解',icon:'📚'},
 {id:'analysis',title:'論證／手法',icon:'🎯'}
];
function classify(kp){
 const id=String(kp&&kp.kpId||''),type=String(kp&&kp.type||'');
 if(INTRO_IDS.has(id))return'intro';
 if(type.includes('虛詞'))return'particles';
 if(type.includes('句式'))return'sentences';
 if(type.includes('翻譯'))return'translation';
 if(type.includes('實詞')||type.includes('古今異義')||type.includes('詞類活用'))return'words';
 if(type.includes('論證')||type.includes('手法')||type.includes('寫景')||type.includes('情景')||type.includes('說理'))return'analysis';
 return'reading';
}
function buildStages(knowledgePoints,getKnowledge){
 const source=Array.isArray(knowledgePoints)?knowledgePoints.filter(kp=>kp&&kp.teachable!==false):[];
 const groups=new Map(STAGE_DEFS.map(s=>[s.id,[]]));
 source.forEach(kp=>groups.get(classify(kp)).push(kp));
 let priorUnlocked=true;
 return STAGE_DEFS.map((def,index)=>{
   const kps=groups.get(def.id)||[];
   const masteries=kps.map(kp=>{const r=typeof getKnowledge==='function'?getKnowledge(kp.kpId):null;return Math.max(0,Math.min(100,Number(r&&r.mastery)||0))});
   const mastery=kps.length?Math.round(masteries.reduce((a,b)=>a+b,0)/kps.length):0;
   const unlocked=index===0?true:priorUnlocked;
   const complete=kps.length>0&&mastery>=UNLOCK_MASTERY;
   if(index===0)priorUnlocked=complete;else priorUnlocked=unlocked&&complete;
   return{...def,index,kpIds:kps.map(kp=>kp.kpId),count:kps.length,mastery,unlocked,complete};
 });
}
function availableKnowledgePointIds(stages){
 return (stages||[]).filter(s=>s.unlocked).flatMap(s=>s.kpIds);
}
function currentStage(stages){
 const unlocked=(stages||[]).filter(s=>s.unlocked);
 return unlocked.find(s=>!s.complete)||unlocked[unlocked.length-1]||null;
}
window.ManjingoLearningPath={UNLOCK_MASTERY,buildStages,availableKnowledgePointIds,currentStage,classify};
})();
