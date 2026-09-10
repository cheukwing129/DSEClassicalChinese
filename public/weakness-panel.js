(function(){
'use strict';
function topMisconceptions(limit){
 const learning=window.ManjingoLocalLearning,content=window.ManjingoContent;
 if(!learning||!content)return[];
 const grouped=[];
 content.knowledgePoints.forEach(kp=>{
   const record=learning.getKnowledge(kp.kpId),byQuestion=new Map();
   Object.values(record.misconceptions||{}).forEach(entry=>{
     if(!entry||!entry.questionId)return;
     const id=String(entry.questionId),current=byQuestion.get(id)||{kpId:kp.kpId,kpLabel:kp.content||kp.type||kp.kpId,questionId:id,count:0,answers:[]};
     current.count+=Number(entry.count)||0;
     current.answers.push({selectedAnswer:String(entry.selectedAnswer||''),correctAnswer:String(entry.correctAnswer||''),count:Number(entry.count)||0});
     byQuestion.set(id,current);
   });
   byQuestion.forEach(item=>grouped.push(item));
 });
 return grouped.sort((a,b)=>b.count-a.count).slice(0,limit||3);
}
function describe(item){
 const answers=item.answers.slice().sort((a,b)=>b.count-a.count),top=answers[0];
 if(!top)return item.kpLabel+'：需要加強';
 return item.kpLabel+'：常把「'+top.correctAnswer+'」誤答成「'+top.selectedAnswer+'」';
}
function render(){
 const host=document.getElementById('plan');if(!host)return;
 let panel=document.getElementById('weaknessPanel');
 if(!panel){panel=document.createElement('div');panel.id='weaknessPanel';panel.className='card';host.insertAdjacentElement('afterend',panel)}
 const items=topMisconceptions(3);
 if(!items.length){panel.innerHTML='<div class="plan-title">🧠 弱點診斷</div><div class="plan-sub">目前沒有持續性的錯誤模式。完成更多練習後，這裡會整理最值得複習的弱點。</div>';return;}
 panel.innerHTML='<div class="plan-title">🧠 弱點診斷</div><div class="plan-sub">根據你的錯題紀錄，優先處理這 '+items.length+' 個弱點。</div>'+items.map((item,i)=>'<div style="padding:10px 0;border-top:1px solid #eee"><strong>'+(i+1)+'. '+describe(item)+'</strong><div class="small">累計錯誤權重：'+item.count+'</div><a class="action" style="display:block;text-align:center;text-decoration:none" href="./lesson.html?kpId='+encodeURIComponent(item.kpId)+'">針對練習</a></div>').join('');
}
window.ManjingoWeaknessPanel={render,topMisconceptions};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();
