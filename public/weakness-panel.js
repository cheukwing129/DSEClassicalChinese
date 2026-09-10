(function(){
'use strict';
function learning(){return window.ManjingoLocalLearning}
function content(){return window.ManjingoContent}
function wasAttempted(record){
 const dashboard=window.ManjingoMasteryDashboard;
 if(dashboard&&typeof dashboard.wasAttempted==='function')return dashboard.wasAttempted(record,Number(record&&record.mastery)||0);
 return Number(record&&record.attempts||0)>0||!!(record&&record.lastAnsweredAt)||!!(record&&typeof record.lastCorrect==='boolean')||Number(record&&record.mastery||0)>0;
}
function misconceptionWeight(record){return Object.values(record&&record.misconceptions||{}).reduce((sum,item)=>sum+Math.max(0,Number(item&&item.count)||0),0)}
function neutralPracticeState(){return{key:'none',label:'尚未補強',priority:0,actionable:false,tone:'neutral'}}
function practiceState(kpId){
 const engine=learning(),policy=window.ManjingoPracticeEffectiveness;
 if(!engine)return neutralPracticeState();
 if(typeof engine.getRemediationStatus==='function'){
  const status=engine.getRemediationStatus(kpId)||{};
  if(status.learningState)return status.learningState;
  if(status.needsConceptReteach)return{key:'reteach',label:'需要概念重教',priority:4,actionable:true,tone:'danger'};
  if(status.needsRemediation)return{key:'remedial',label:'需要補救',priority:3,actionable:true,tone:'warning'};
  if(status.remedialEffective)return{key:'remedial-effective',label:'補救後已穩定',priority:0,actionable:false,tone:'success'};
  if(status.reteachEffective)return{key:'reteach-effective',label:'概念重教有效',priority:0,actionable:false,tone:'success'};
 }
 if(policy&&typeof policy.learningState==='function'&&typeof engine.getPracticeHistory==='function'){
  const record=typeof engine.getKnowledge==='function'?engine.getKnowledge(kpId):{};
  return policy.learningState(engine.getPracticeHistory({kpId,days:7,limit:50})||[],{currentMastery:Number(record&&record.mastery)||0});
 }
 return neutralPracticeState();
}
function stateAction(state){if(state&&state.key==='reteach')return'開始概念重教';if(state&&state.key==='remedial')return'進入補救';return'立即補強'}
function topMisconceptions(limit){
 const engine=learning(),catalog=content();if(!engine||!catalog)return[];const grouped=[];
 catalog.knowledgePoints.forEach(kp=>{const record=engine.getKnowledge(kp.kpId),byQuestion=new Map();Object.values(record&&record.misconceptions||{}).forEach(entry=>{if(!entry||!entry.questionId)return;const id=String(entry.questionId),current=byQuestion.get(id)||{kpId:kp.kpId,kpLabel:kp.content||kp.type||kp.kpId,questionId:id,count:0,answers:[]};current.count+=Number(entry.count)||0;current.answers.push({selectedAnswer:String(entry.selectedAnswer||''),correctAnswer:String(entry.correctAnswer||''),count:Number(entry.count)||0});byQuestion.set(id,current)});byQuestion.forEach(item=>grouped.push(item))});
 const sorted=grouped.sort((a,b)=>b.count-a.count);return limit==null?sorted:sorted.slice(0,Math.max(0,Number(limit)||0));
}
function describe(item){const answers=(item&&item.answers||[]).slice().sort((a,b)=>b.count-a.count),top=answers[0];if(!top)return(item&&item.kpLabel||'這個知識點')+'：需要加強';return item.kpLabel+'：常把「'+top.correctAnswer+'」誤答成「'+top.selectedAnswer+'」'}
function weakKnowledgePoints(){
 const engine=learning(),catalog=content();if(!engine||!catalog)return[];
 return catalog.knowledgePoints.filter(kp=>kp&&kp.teachable!==false).map(kp=>{const record=engine.getKnowledge(kp.kpId)||{},mastery=Math.max(0,Math.min(100,Number(record.mastery)||0)),attempted=wasAttempted(record),weight=misconceptionWeight(record),lastWrong=record.lastCorrect===false,state=practiceState(kp.kpId),baseWeak=attempted&&(mastery<60||lastWrong),adaptiveWeak=attempted&&Number(state.priority)>=3;return{kpId:kp.kpId,label:kp.content||kp.type||kp.kpId,mastery,attempted,lastWrong,misconceptionWeight:weight,record,practiceState:state,baseWeak,adaptiveWeak}}).filter(item=>item.baseWeak||item.adaptiveWeak).sort((a,b)=>{const stateA=Number(a.practiceState&&a.practiceState.priority)||0,stateB=Number(b.practiceState&&b.practiceState.priority)||0;if(stateA!==stateB)return stateB-stateA;const scoreA=(a.lastWrong?35:0)+(60-Math.min(60,a.mastery))+a.misconceptionWeight*12,scoreB=(b.lastWrong?35:0)+(60-Math.min(60,b.mastery))+b.misconceptionWeight*12;return scoreB-scoreA||a.mastery-b.mastery});
}
function diagnosis(){
 const patterns=topMisconceptions(),weak=weakKnowledgePoints(),byKp=new Map();
 patterns.forEach(pattern=>{const state=practiceState(pattern.kpId),current=byKp.get(pattern.kpId)||{kpId:pattern.kpId,label:pattern.kpLabel,mastery:100,lastWrong:false,misconceptionWeight:0,pattern:null,practiceState:state};current.misconceptionWeight+=Math.max(0,Number(pattern.count)||0);if(!current.pattern||Number(pattern.count)>Number(current.pattern.count))current.pattern=pattern;current.practiceState=state;byKp.set(pattern.kpId,current)});
 weak.forEach(item=>{const current=byKp.get(item.kpId)||{kpId:item.kpId,label:item.label,mastery:item.mastery,lastWrong:item.lastWrong,misconceptionWeight:item.misconceptionWeight,pattern:null,practiceState:item.practiceState};current.label=item.label;current.mastery=item.mastery;current.lastWrong=item.lastWrong;current.misconceptionWeight=Math.max(current.misconceptionWeight,item.misconceptionWeight);current.practiceState=item.practiceState;byKp.set(item.kpId,current)});
 const candidates=Array.from(byKp.values()).map(item=>{const state=item.practiceState||neutralPracticeState(),masteryPenalty=Math.max(0,60-Math.min(60,Number(item.mastery)||0)),score=Number(state.priority||0)*250+item.misconceptionWeight*18+(item.lastWrong?35:0)+masteryPenalty;let reason=item.pattern?describe(item.pattern):item.lastWrong?'最近一次仍答錯':('掌握度 '+item.mastery+'%，建議先補強');if(state.key==='reteach')reason='補救驗證仍未穩定，下一步改用概念重教';else if(state.key==='remedial')reason='多次補強成效有限，下一步先重新教學再驗證';else if(state.key==='remedial-effective')reason='補救後表現已改善，可用較低頻率繼續鞏固';else if(state.key==='reteach-effective')reason='概念重教後已改善，暫時以正常複習維持';else if(state.key==='targeted-effective')reason='近期補強有效，繼續按正常複習節奏鞏固';return{...item,score,reason,practiceState:state}}).sort((a,b)=>b.score-a.score||a.mastery-b.mastery);
 const priority=candidates.slice(0,3),priorityIds=new Set(priority.map(item=>item.kpId)),otherWeak=weak.filter(item=>!priorityIds.has(item.kpId));
 return{priority,patterns:patterns.slice(0,3),otherWeak,totalCandidates:candidates.length};
}
function href(kpId){return'./lesson.html?kpId='+encodeURIComponent(kpId)+'&mode=practice'}
function stateChip(state){if(!state||state.key==='none')return'';return'<span class="weak-state weak-state-'+state.tone+'">'+state.label+'</span>'}
function installStyle(){
 if(document.getElementById('weaknessPanelStyle'))return;const style=document.createElement('style');style.id='weaknessPanelStyle';style.textContent='.weak-head{margin-bottom:16px}.weak-title{font-size:22px;font-weight:950;color:var(--ink)}.weak-sub{font-size:12px;line-height:1.55;color:var(--gray);font-weight:750;margin-top:4px}.weak-section{margin-top:18px}.weak-section-title{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--ink);font-size:14px;font-weight:950;margin-bottom:9px}.weak-section-title span{color:var(--gray);font-size:11px}.weak-priority-list{display:grid;gap:10px}.weak-priority{border:2px solid #e6e6e6;border-radius:16px;padding:13px}.weak-priority:first-child{border-color:#ffcf66;background:#fffaf0}.weak-priority-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.weak-priority-rank{font-size:10px;font-weight:950;color:#8a5a00;background:#fff0c2;padding:4px 7px;border-radius:999px}.weak-priority strong{display:block;color:var(--ink);font-size:14px;margin-top:7px}.weak-reason{font-size:12px;line-height:1.45;color:var(--text);font-weight:750;margin:5px 0 10px}.weak-mastery{font-size:11px;color:var(--gray);font-weight:800}.weak-state{display:inline-flex;align-items:center;min-height:24px;padding:3px 7px;border-radius:999px;font-size:10px;font-weight:900}.weak-state-danger{background:#ffe6e6;color:#b42323}.weak-state-warning{background:#fff1cc;color:#8a5a00}.weak-state-success{background:#eef9e8;color:#398500}.weak-state-watch{background:#eef4ff;color:#35608f}.weak-state-neutral{background:#f3f3f3;color:#777}.weak-action{display:block;text-align:center;text-decoration:none;padding:10px 12px;border-radius:11px;background:var(--green);color:#fff;font-size:13px;font-weight:900;margin-top:10px}.weak-patterns{display:grid;gap:7px}.weak-pattern{padding:10px 11px;border-radius:12px;background:#f7f7f7}.weak-pattern strong{display:block;color:var(--ink);font-size:12px;line-height:1.45}.weak-pattern span{font-size:10px;color:var(--gray);font-weight:800}.weak-more{margin-top:16px;border-top:1px solid #eee;padding-top:10px}.weak-more>summary{cursor:pointer;list-style:none;color:var(--gray);font-size:12px;font-weight:900;padding:4px 0}.weak-more>summary::-webkit-details-marker{display:none}.weak-more-list{display:grid;gap:7px;margin-top:8px}.weak-more-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid #f1f1f1}.weak-more-copy{min-width:0}.weak-more-copy strong{display:block;color:var(--ink);font-size:12px}.weak-more-copy span{font-size:10px;color:var(--gray);font-weight:750}.weak-more-item a{flex:0 0 auto;color:#398500;font-size:11px;font-weight:900;text-decoration:none}.weak-empty{padding:18px 4px;text-align:center}.weak-empty strong{display:block;color:var(--ink);font-size:16px;margin-bottom:5px}.weak-empty span{color:var(--gray);font-size:12px;font-weight:750;line-height:1.5}';document.head.appendChild(style);
}
function render(){
 const fallback=document.getElementById('plan');if(!fallback)return;let panel=document.getElementById('weaknessPanel');if(!panel){panel=document.createElement('div');panel.id='weaknessPanel';panel.className='card';fallback.insertAdjacentElement('afterend',panel)}installStyle();const data=diagnosis();
 if(!data.priority.length&&!data.patterns.length&&!data.otherWeak.length){panel.innerHTML='<div class="weak-head"><div class="weak-title">🎯 弱點診斷</div></div><div class="weak-empty"><strong>目前沒有需要優先補強的弱點</strong><span>繼續完成今日學習；出現持續性錯誤後，這裡會自動整理。</span></div>';return;}
 const priorityHtml=data.priority.length?'<section class="weak-section"><div class="weak-section-title">最需要處理 <span>先完成 1–3 項</span></div><div class="weak-priority-list">'+data.priority.map((item,i)=>'<article class="weak-priority"><div class="weak-priority-top"><span class="weak-priority-rank">優先 '+(i+1)+'</span><span class="weak-mastery">掌握度 '+item.mastery+'%</span>'+stateChip(item.practiceState)+'</div><strong>'+item.label+'</strong><div class="weak-reason">'+item.reason+'</div><a class="weak-action" href="'+href(item.kpId)+'">'+stateAction(item.practiceState)+'</a></article>').join('')+'</div></section>':'';
 const patternsHtml=data.patterns.length?'<section class="weak-section"><div class="weak-section-title">常見錯誤模式 <span>最近持續出現</span></div><div class="weak-patterns">'+data.patterns.map(item=>'<div class="weak-pattern"><strong>'+describe(item)+'</strong><span>錯誤權重 '+item.count+'</span></div>').join('')+'</div></section>':'';
 const otherHtml=data.otherWeak.length?'<details class="weak-more"><summary>其他弱項 · '+data.otherWeak.length+' 項</summary><div class="weak-more-list">'+data.otherWeak.slice(0,8).map(item=>'<div class="weak-more-item"><div class="weak-more-copy"><strong>'+item.label+'</strong><span>掌握度 '+item.mastery+'%'+(item.lastWrong?' · 最近答錯':'')+(item.practiceState&&item.practiceState.key!=='none'?' · '+item.practiceState.label:'')+'</span></div><a href="'+href(item.kpId)+'">'+stateAction(item.practiceState)+' →</a></div>').join('')+'</div></details>':'';
 panel.innerHTML='<div class="weak-head"><div class="weak-title">🎯 弱點診斷</div><div class="weak-sub">優先處理真正反覆無效的概念；補強／補救成效會直接影響排序，不再只看掌握度。</div></div>'+priorityHtml+patternsHtml+otherHtml;
}
window.ManjingoWeaknessPanel={render,topMisconceptions,weakKnowledgePoints,diagnosis,describe,wasAttempted,practiceState,stateAction};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();
