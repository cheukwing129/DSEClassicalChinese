(function(){
'use strict';

const knowledgePoints=[
 {kpId:'kp_yueyang_001',textId:'yueyanglou',type:'實詞',content:'謫',difficulty:1,teachable:true},
 {kpId:'kp_yueyang_002',textId:'yueyanglou',type:'句式',content:'微斯人，吾誰與歸',difficulty:3,teachable:false},
 {kpId:'kp_yueyang_003',textId:'yueyanglou',type:'主題手法',content:'覽物之情與政治理想的對比昇華',difficulty:3,teachable:false},
 {kpId:'kp_yueyang_004',textId:'yueyanglou',type:'名句默寫',content:'先天下之憂而憂，後天下之樂而樂',difficulty:2,teachable:true},
 {kpId:'kp_virtual_zhi',textId:'CROSS',type:'虛詞用法',content:'之',difficulty:2,teachable:true},
 {kpId:'sx_001',textId:'CROSS',type:'句式',content:'判斷句',difficulty:2,teachable:true},
 {kpId:'sx_006',textId:'CROSS',type:'句式',content:'倒裝句－賓語前置',difficulty:3,teachable:true}
];

const questions=[
 {id:'q001',kpId:'kp_yueyang_001',type:'choice',q:'『謫守巴陵郡』中『謫』字的意思是？',o:['提拔','貶官','辭職','退休'],a:'貶官'},
 {id:'q004',kpId:'kp_virtual_zhi',type:'choice',q:'『輟耕之壟上』中『之』字的用法是？',o:['代詞','結構助詞（的）','動詞（到／往）','語氣助詞'],a:'動詞（到／往）'},
 {id:'q005',kpId:'sx_001',type:'choice',q:'『廉頗者，趙之良將也』屬於哪種句式？',o:['判斷句','被動句','省略句','倒裝句'],a:'判斷句'},
 {id:'q010',kpId:'sx_006',type:'choice',q:'『微斯人，吾誰與歸』的正確白話翻譯是？',o:['如果沒有這樣的人，我要跟從誰呢？','如果沒有這樣的人，誰會跟從我呢？','沒有這樣的人，我不知道去哪裡。','這個人不存在，我們一起回去。'],a:'如果沒有這樣的人，我要跟從誰呢？'},
 {id:'q008',kpId:'kp_yueyang_004',type:'fill',q:'先天下之憂而憂，____________。',a:'後天下之樂而樂'},
 {id:'q006',kpId:'sx_006',type:'choice',q:'『吾誰與歸』中『歸』的意思是？',o:['歸還','歸依、歸附','歸來','回家'],a:'歸依、歸附'}
];

function getKnowledgePointIds(options){
 const teachableOnly=!options||options.teachableOnly!==false;
 return knowledgePoints.filter(kp=>!teachableOnly||kp.teachable).map(kp=>kp.kpId);
}

function selectQuestionsForPlan(plan,sourceQuestions,limit){
 const source=Array.isArray(sourceQuestions)?sourceQuestions:[];
 const items=Array.isArray(plan&&plan.items)?plan.items:[];
 const max=Math.max(0,Number(limit)||Number(plan&&plan.targetCount)||10);
 const byKp=new Map();
 source.forEach(q=>{if(!q||!q.id||!q.kpId)return;if(!byKp.has(q.kpId))byKp.set(q.kpId,[]);byKp.get(q.kpId).push(q)});
 const used=new Set(),queue=[];
 items.forEach(item=>{
   if(queue.length>=max)return;
   const candidate=(byKp.get(item.kpId)||[]).find(q=>!used.has(q.id));
   if(!candidate)return;
   used.add(candidate.id);
   queue.push({...candidate,category:item.category||'new',priority:item.priority??3});
 });
 return queue;
}

window.ManjingoContent={
 knowledgePoints:knowledgePoints.map(x=>({...x})),
 questions:questions.map(x=>({...x})),
 getKnowledgePointIds,
 selectQuestionsForPlan
};
})();
