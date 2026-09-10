(function(){
'use strict';
const GROUPS=[
 {id:'words',title:'實詞',icon:'📖'},
 {id:'particles',title:'虛詞',icon:'🔤'},
 {id:'sentences',title:'句式',icon:'🧩'},
 {id:'translation',title:'翻譯',icon:'✍️'},
 {id:'reading',title:'篇章',icon:'📚'},
 {id:'argument',title:'論證',icon:'🎯'}
];
function groupId(type){
 const t=String(type||'');
 if(/虛詞/.test(t))return'particles';
 if(/句式/.test(t))return'sentences';
 if(/翻譯/.test(t))return'translation';
 if(/論證|說理/.test(t))return'argument';
 if(/實詞|古今異義|詞類活用/.test(t))return'words';
 return'reading';
}
function build(){
 const content=window.ManjingoContent,learning=window.ManjingoLocalLearning;
 const kps=content&&Array.isArray(content.knowledgePoints)?content.knowledgePoints.filter(k=>k.teachable):[];
 const groups=GROUPS.map(g=>({...g,total:0,mastered:0,weak:0,masterySum:0,kpIds:[]}));
 const byId=new Map(groups.map(g=>[g.id,g]));
 kps.forEach(kp=>{
   const g=byId.get(groupId(kp.type));if(!g)return;
   const record=learning?learning.getKnowledge(kp.kpId):{mastery:0,lastCorrect:null};
   const mastery=Number(record&&record.mastery)||0;
   g.total+=1;g.masterySum+=mastery;g.kpIds.push(kp.kpId);
   if(mastery>=90)g.mastered+=1;
   if(mastery<60||record&&record.lastCorrect===false)g.weak+=1;
 });
 const result=groups.map(g=>({id:g.id,title:g.title,icon:g.icon,total:g.total,mastered:g.mastered,weak:g.weak,average:g.total?Math.round(g.masterySum/g.total):0,kpIds:g.kpIds.slice()}));
 const total=result.reduce((n,g)=>n+g.total,0),weighted=result.reduce((n,g)=>n+g.average*g.total,0);
 return{overall:total?Math.round(weighted/total):0,total,mastered:result.reduce((n,g)=>n+g.mastered,0),weak:result.reduce((n,g)=>n+g.weak,0),groups:result};
}
function render(host){
 if(!host)return;const data=build();
 host.innerHTML='<div class="dashboard-head"><div><div class="dashboard-title">學習成果</div><div class="dashboard-sub">59 個知識點的掌握度總覽</div></div><div class="dashboard-overall">'+data.overall+'%</div></div><div class="dashboard-summary"><span>✅ 已掌握 '+data.mastered+'</span><span>🎯 弱項 '+data.weak+'</span><span>📚 共 '+data.total+' KP</span></div><div class="dashboard-groups">'+data.groups.map(g=>'<div class="dashboard-group"><div class="dashboard-row"><strong>'+g.icon+' '+g.title+'</strong><span>'+g.average+'%</span></div><div class="dashboard-bar"><div style="width:'+Math.max(0,Math.min(100,g.average))+'%"></div></div><div class="dashboard-meta">已掌握 '+g.mastered+' / '+g.total+' · 弱項 '+g.weak+'</div></div>').join('')+'</div>';
}
window.ManjingoMasteryDashboard={build,render,groupId};
})();
