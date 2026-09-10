(function(){
'use strict';

if(typeof document!=='undefined'&&document.readyState==='loading'){
 if(!window.ManjingoQuestionPack02)document.write('<script src="./question-pack-02.js"><\/script>');
 if(!window.ManjingoQuestionPack03)document.write('<script src="./question-pack-03.js"><\/script>');
 if(!window.ManjingoQuestionPackLesson)document.write('<script src="./question-pack-lesson.js"><\/script>');
}

const baseKnowledgePoints=[
 {kpId:'kp_yueyang_001',textId:'yueyanglou',type:'實詞',content:'謫',difficulty:1,teachable:true},
 {kpId:'kp_yueyang_004',textId:'yueyanglou',type:'名句默寫',content:'先天下之憂而憂，後天下之樂而樂',difficulty:2,teachable:true},
 {kpId:'kp_virtual_zhi',textId:'CROSS',type:'虛詞用法',content:'之',difficulty:2,teachable:true},
 {kpId:'kp_virtual_er',textId:'CROSS',type:'虛詞用法',content:'而',difficulty:2,teachable:true},
 {kpId:'kp_virtual_yi',textId:'CROSS',type:'虛詞用法',content:'以',difficulty:2,teachable:true},
 {kpId:'kp_virtual_yu',textId:'CROSS',type:'虛詞用法',content:'於',difficulty:2,teachable:true},
 {kpId:'kp_virtual_qi',textId:'CROSS',type:'虛詞用法',content:'其',difficulty:2,teachable:true},
 {kpId:'kp_virtual_ze',textId:'CROSS',type:'虛詞用法',content:'則',difficulty:2,teachable:true},
 {kpId:'gj_004',textId:'chushibiao',type:'古今異義',content:'卑鄙',difficulty:2,teachable:true},
 {kpId:'gj_005',textId:'chushibiao',type:'古今異義',content:'感激',difficulty:2,teachable:true},
 {kpId:'cy_004',textId:'yueyanglou',type:'詞類活用',content:'先／後',difficulty:3,teachable:true},
 {kpId:'cy_006',textId:'CROSS',type:'詞類活用',content:'師',difficulty:3,teachable:true},
 {kpId:'sx_001',textId:'CROSS',type:'句式',content:'判斷句',difficulty:2,teachable:true},
 {kpId:'sx_003',textId:'CROSS',type:'句式',content:'見字表被動',difficulty:3,teachable:true},
 {kpId:'sx_004',textId:'CROSS',type:'句式',content:'於字表被動',difficulty:3,teachable:true},
 {kpId:'sx_005',textId:'CROSS',type:'句式',content:'省略句',difficulty:2,teachable:true},
 {kpId:'sx_006',textId:'CROSS',type:'句式',content:'倒裝句－賓語前置',difficulty:3,teachable:true},
 {kpId:'sx_008',textId:'CROSS',type:'句式',content:'倒裝句－狀語後置',difficulty:3,teachable:true},
 {kpId:'kp_translation_001',textId:'yueyanglou',type:'翻譯',content:'微斯人，吾誰與歸',difficulty:3,teachable:true},
 {kpId:'kp_theme_001',textId:'yueyanglou',type:'主旨',content:'不以物喜，不以己悲',difficulty:3,teachable:true},
 {kpId:'kp_argument_001',textId:'CROSS',type:'論證方法',content:'舉例論證',difficulty:2,teachable:true},
 {kpId:'kp_argument_002',textId:'CROSS',type:'論證方法',content:'對比論證',difficulty:2,teachable:true},
 {kpId:'kp_argument_003',textId:'CROSS',type:'論證方法',content:'比喻論證',difficulty:2,teachable:true}
];

const baseQuestions=[
 {id:'q001',kpId:'kp_yueyang_001',type:'choice',q:'『謫守巴陵郡』中『謫』字的意思是？',o:['提拔','貶官','辭職','退休'],a:'貶官'},
 {id:'q004',kpId:'kp_virtual_zhi',type:'choice',q:'『輟耕之壟上』中『之』字的用法是？',o:['代詞','結構助詞（的）','動詞（到／往）','語氣助詞'],a:'動詞（到／往）'},
 {id:'q005',kpId:'sx_001',type:'choice',q:'『廉頗者，趙之良將也』屬於哪種句式？',o:['判斷句','被動句','省略句','倒裝句'],a:'判斷句'},
 {id:'q010',kpId:'sx_006',type:'choice',q:'『微斯人，吾誰與歸』的正確白話翻譯是？',o:['如果沒有這樣的人，我要跟從誰呢？','如果沒有這樣的人，誰會跟從我呢？','沒有這樣的人，我不知道去哪裡。','這個人不存在，我們一起回去。'],a:'如果沒有這樣的人，我要跟從誰呢？'},
 {id:'q008',kpId:'kp_yueyang_004',type:'fill',q:'先天下之憂而憂，____________。',a:'後天下之樂而樂'},
 {id:'q006',kpId:'sx_006',type:'choice',q:'『吾誰與歸』中『歸』的意思是？',o:['歸還','歸依、歸附','歸來','回家'],a:'歸依、歸附'}
];

const pack02=window.ManjingoQuestionPack02||{knowledgePoints:[],questions:[]};
const pack03=window.ManjingoQuestionPack03||{knowledgePoints:[],questions:[]};
const lessonPack=window.ManjingoQuestionPackLesson||{questions:[]};
const knowledgePoints=[...baseKnowledgePoints,...pack02.knowledgePoints,...pack03.knowledgePoints];
const questions=[...baseQuestions,...pack02.questions,...pack03.questions,...lessonPack.questions];

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
   const available=(byKp.get(item.kpId)||[]).filter(q=>!used.has(q.id));
   if(!available.length)return;
   const preferred=Array.isArray(item.misconceptionQuestionIds)?item.misconceptionQuestionIds:[];
   let candidate=null;
   for(const id of preferred){candidate=available.find(q=>q.id===id);if(candidate)break;}
   if(!candidate)candidate=available[Math.floor(Math.random()*available.length)];
   used.add(candidate.id);
   queue.push({...candidate,category:item.category||'new',priority:item.priority??3,misconceptionReview:preferred.includes(candidate.id)});
 });
 return queue;
}

window.ManjingoContent={
 knowledgePoints:knowledgePoints.map(x=>({...x})),
 questions:questions.map(x=>({...x})),
 getKnowledgePointIds,
 selectQuestionsForPlan
};

if(typeof document!=='undefined'&&document.readyState==='loading'){
 document.write('<script src="./learning-path.js"><\/script><script src="./learning-path-ui.js"><\/script>');
}
})();
