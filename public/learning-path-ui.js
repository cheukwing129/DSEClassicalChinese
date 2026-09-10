(function(){
'use strict';
const content=window.ManjingoContent,path=window.ManjingoLearningPath;
if(!content||!path)return;
const EVENT_NAME='manjingo:learning-state-changed';
const MUTATING_METHODS=['submit','syncRemoteResult','syncGamification','syncRemoteConceptState','resolveQuestionMisconceptions','recordPracticeSession'];
const allKnowledgePoints=content.knowledgePoints.slice();
const originalGetIds=content.getKnowledgePointIds.bind(content);
const originalSelect=content.selectQuestionsForPlan.bind(content);
function engine(){return window.ManjingoLocalLearning}
function stages(){const learning=engine();return path.buildStages(allKnowledgePoints,kpId=>learning?learning.getKnowledge(kpId):{mastery:0})}
function allowedIds(){return new Set(path.availableKnowledgePointIds(stages()))}
content.getKnowledgePointIds=function(options){if(options&&options.learningPath===false)return originalGetIds(options);return Array.from(allowedIds())};
content.selectQuestionsForPlan=function(plan,sourceQuestions,limit){const allowed=allowedIds();const filtered={...(plan||{}),items:Array.isArray(plan&&plan.items)?plan.items.filter(item=>allowed.has(item.kpId)):[]};return originalSelect(filtered,sourceQuestions,limit)};
function nextLesson(stage){if(!stage||!stage.unlocked)return null;const learning=engine();return stage.kpIds.map(kpId=>({kpId,mastery:learning?Number(learning.getKnowledge(kpId).mastery||0):0})).sort((a,b)=>a.mastery-b.mastery)[0]||null}
function render(){
 const host=document.getElementById('learningPath');if(!host)return;
 const list=stages(),current=path.currentStage(list);
 host.innerHTML='<div class="lp-head"><div><div class="lp-title">學習路徑</div><div class="lp-sub">'+(current?'目前：'+current.icon+' '+current.title+' · 平均掌握度 '+current.mastery+'%':'所有階段已完成')+'</div></div><div class="lp-threshold">70% 解鎖</div></div><div class="lp-list">'+list.map(stage=>{const state=stage.complete?'complete':stage.unlocked?'current':'locked';const badge=stage.complete?'✓':stage.unlocked?stage.mastery+'%':'🔒';const lesson=nextLesson(stage);const tag=lesson?'a':'div';const attrs=lesson?' href="./lesson.html?kpId='+encodeURIComponent(lesson.kpId)+'" title="開始 '+stage.title+' 微課堂"':'';return '<'+tag+' class="lp-node '+state+(lesson?' clickable':'')+'"'+attrs+'><div class="lp-icon">'+stage.icon+'</div><div class="lp-info"><strong>'+stage.title+'</strong><span>'+stage.count+' 個知識點'+(lesson?' · 點擊學習':'')+'</span><div class="lp-bar"><i style="width:'+stage.mastery+'%"></i></div></div><div class="lp-badge">'+badge+'</div></'+tag+'>';}).join('')+'</div>';
}
function emitLearningChanged(source,result){
 const detail={source:String(source||'unknown'),kpId:result&&result.kpId?String(result.kpId):null};
 let event;
 try{event=new CustomEvent(EVENT_NAME,{detail})}catch(e){event={type:EVENT_NAME,detail}}
 window.dispatchEvent(event);
}
function installEvents(){
 const learning=engine();if(!learning||learning.__learningEventsWrapped)return false;
 MUTATING_METHODS.forEach(name=>{const original=learning[name];if(typeof original!=='function')return;learning[name]=function(){const result=original.apply(this,arguments);emitLearningChanged(name,result);return result}});
 learning.__learningEventsWrapped=true;
 return true;
}
function refreshLearningViews(){
 render();
 const weakness=window.ManjingoWeaknessPanel;if(weakness&&typeof weakness.render==='function')weakness.render();
 const dashboard=window.ManjingoMasteryDashboard;if(dashboard&&typeof dashboard.mount==='function')dashboard.mount();
}
function install(){
 if(!document.getElementById('learningPath')){const plan=document.getElementById('plan');if(plan){const card=document.createElement('div');card.className='card';card.id='learningPath';plan.parentNode.insertBefore(card,plan)}}
 if(!document.getElementById('learningPathStyle')){const style=document.createElement('style');style.id='learningPathStyle';style.textContent='.lp-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:12px}.lp-title{font-size:22px;font-weight:900;color:var(--ink)}.lp-sub{font-size:12px;color:var(--gray);font-weight:700;margin-top:3px}.lp-threshold{font-size:11px;font-weight:800;background:#eef8e8;color:#398500;padding:5px 8px;border-radius:9px;white-space:nowrap}.lp-list{display:grid;gap:8px}.lp-node{display:flex;align-items:center;gap:10px;padding:9px;border:2px solid #e5e5e5;border-radius:14px;text-decoration:none;color:inherit}.lp-node.clickable{cursor:pointer}.lp-node.current{border-color:var(--green);background:#f6ffef}.lp-node.complete{border-color:#b7e694}.lp-node.locked{opacity:.48}.lp-icon{font-size:22px;width:30px;text-align:center}.lp-info{flex:1;min-width:0}.lp-info strong{display:block;color:var(--ink);font-size:14px}.lp-info span{font-size:11px;color:var(--gray);font-weight:700}.lp-bar{height:6px;background:#e5e5e5;border-radius:99px;overflow:hidden;margin-top:5px}.lp-bar i{display:block;height:100%;background:var(--green)}.lp-badge{font-size:12px;font-weight:900;color:var(--ink);min-width:32px;text-align:right}';document.head.appendChild(style)}
 installEvents();render();
}
window.addEventListener(EVENT_NAME,refreshLearningViews);
window.ManjingoLearningEvents={eventName:EVENT_NAME,emit:emitLearningChanged,install:installEvents,refresh:refreshLearningViews};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
