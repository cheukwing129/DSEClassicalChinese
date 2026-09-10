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
 const total=result.reduce((n,g)=>n+g.total,0),masterySum=groups.reduce((n,g)=>n+g.masterySum,0);
 return{overall:total?Math.round(masterySum/total):0,total,mastered:result.reduce((n,g)=>n+g.mastered,0),weak:result.reduce((n,g)=>n+g.weak,0),groups:result};
}
function render(host){
 if(!host)return;const data=build();
 host.innerHTML='<div class="dashboard-head"><div><div class="dashboard-title">📊 學習成果</div><div class="dashboard-sub">'+data.total+' 個知識點的掌握度總覽</div></div><div class="dashboard-overall">'+data.overall+'%</div></div><div class="dashboard-summary"><span>✅ 已掌握 '+data.mastered+'</span><span>🎯 弱項 '+data.weak+'</span><span>📚 共 '+data.total+' KP</span></div><div class="dashboard-groups">'+data.groups.map(g=>'<div class="dashboard-group"><div class="dashboard-row"><strong>'+g.icon+' '+g.title+'</strong><span>'+g.average+'%</span></div><div class="dashboard-bar"><div style="width:'+Math.max(0,Math.min(100,g.average))+'%"></div></div><div class="dashboard-meta">已掌握 '+g.mastered+' / '+g.total+' · 弱項 '+g.weak+'</div></div>').join('')+'</div>';
}
function mount(){
 const plan=document.getElementById('plan');if(!plan)return;
 let host=document.getElementById('masteryDashboard');
 if(!host){host=document.createElement('div');host.id='masteryDashboard';host.className='card';const weakness=document.getElementById('weaknessPanel');(weakness||plan).insertAdjacentElement('afterend',host)}
 if(!document.getElementById('masteryDashboardStyle')){
   const style=document.createElement('style');style.id='masteryDashboardStyle';style.textContent='.dashboard-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.dashboard-title{font-size:24px;font-weight:900;color:var(--ink)}.dashboard-sub,.dashboard-meta{color:var(--gray);font-size:12px;font-weight:700}.dashboard-overall{font-size:28px;font-weight:900;color:var(--green)}.dashboard-summary{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.dashboard-summary span{background:#f5f5f5;border-radius:10px;padding:7px 9px;font-size:12px;font-weight:800}.dashboard-group{padding:10px 0;border-top:1px solid #eee}.dashboard-row{display:flex;justify-content:space-between;gap:12px;font-size:14px}.dashboard-row span{font-weight:900;color:var(--ink)}.dashboard-bar{height:9px;background:#e5e5e5;border-radius:999px;overflow:hidden;margin:7px 0}.dashboard-bar div{height:100%;background:var(--green);border-radius:999px}';document.head.appendChild(style)
 }
 render(host);
}
window.ManjingoMasteryDashboard={build,render,mount,groupId};
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();}
})();
