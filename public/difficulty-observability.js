(function(root,factory){
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
root.ManjingoDifficultyObservability=api;
if(root.window&&root.window!==root)root.window.ManjingoDifficultyObservability=api;
api.install();
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const STATE_KEY='manjingo_progress_cache';
const RECENT_LIMIT=12;
const TIERS=['foundation','application','transfer'];
const TIER_LABELS={foundation:'基礎辨識',application:'語境應用',transfer:'跨篇遷移'};
const REASON_LABELS={
 mastery:'依目前掌握度安排',
 'foundation-ready':'基礎層近期表現穩定，提早升至語境應用',
 'application-ready':'語境應用近期表現穩定，提早試跨篇遷移',
 'application-struggling':'語境應用近期表現偏弱，暫回基礎辨識',
 'transfer-struggling':'跨篇遷移近期表現偏弱，暫回語境應用',
 'recent-mistake':'最近答錯，暫時降低一級難度',
 remedial:'補救模式固定使用基礎辨識',
 reteach:'概念重教以跨篇遷移驗證'
};
const SELECTION_LABELS={
 'target-tier':'選用目前目標難度',
 'misconception-target':'優先處理近期錯誤概念',
 rotation:'避免近期重複，輪換到鄰近難度'
};
function fromRoot(name){return root[name]||(root.window&&root.window[name])||null}
function storage(){return root.localStorage||(root.window&&root.window.localStorage)||null}
function readState(){const s=storage();if(!s)return null;try{const value=JSON.parse(s.getItem(STATE_KEY)||'{}');return value&&typeof value==='object'?value:{}}catch(e){return{}}}
function writeState(state){const s=storage();if(!s)return false;try{s.setItem(STATE_KEY,JSON.stringify(state||{}));return true}catch(e){return false}}
function validTier(tier){return TIERS.includes(String(tier||''))?String(tier):'application'}
function tierLabel(tier){return TIER_LABELS[validTier(tier)]}
function reasonLabel(reason){return REASON_LABELS[String(reason||'')]||REASON_LABELS.mastery}
function selectionLabel(reason){return SELECTION_LABELS[String(reason||'')]||SELECTION_LABELS['target-tier']}
function timeValue(value){const t=new Date(value||0).getTime();return Number.isFinite(t)?t:0}
function profileSnapshot(profile){const p=profile&&typeof profile==='object'?profile:{};return{recentAttempts:Number(p.recentAttempts)||0,recentAccuracy:p.recentAccuracy==null?null:Number(p.recentAccuracy),recentCorrectStreak:Number(p.recentCorrectStreak)||0,overallAccuracy:p.overallAccuracy==null?null:Number(p.overallAccuracy)}}
function decisionFor(list,preferredIds,candidate){
 const difficulty=fromRoot('ManjingoQuestionDifficulty'),calibration=fromRoot('ManjingoDifficultyCalibration');
 const source=Array.isArray(list)?list:[],context=difficulty&&typeof difficulty.contextFor==='function'?difficulty.contextFor(source,preferredIds):{mastery:0,lastCorrect:null,mode:'normal',tierStats:null};
 const decision=calibration&&typeof calibration.calibrationDecision==='function'?calibration.calibrationDecision(context.mastery,context):{baseTier:difficulty&&typeof difficulty.tierForMastery==='function'?difficulty.tierForMastery(context.mastery,{...context,lastCorrect:null}):'application',targetTier:difficulty&&typeof difficulty.tierForMastery==='function'?difficulty.tierForMastery(context.mastery,context):'application',reason:context.lastCorrect===false?'recent-mistake':'mastery',profile:null};
 const selectedTier=difficulty&&typeof difficulty.tierOf==='function'?difficulty.tierOf(candidate):validTier(candidate&&candidate.difficultyTier),preferred=new Set((Array.isArray(preferredIds)?preferredIds:[]).map(String));
 let selectionReason='target-tier';
 if(candidate&&preferred.has(String(candidate.id)))selectionReason='misconception-target';
 else if(selectedTier!==validTier(decision.targetTier))selectionReason='rotation';
 return{kpId:candidate&&candidate.kpId?String(candidate.kpId):'',questionId:candidate&&candidate.id?String(candidate.id):null,mastery:Number(context.mastery)||0,mode:String(context.mode||'normal'),lastCorrect:context.lastCorrect===true?true:context.lastCorrect===false?false:null,baseTier:validTier(decision.baseTier),targetTier:validTier(decision.targetTier),selectedTier,reason:String(decision.reason||'mastery'),reasonLabel:reasonLabel(decision.reason),selectionReason,selectionLabel:selectionLabel(selectionReason),profile:profileSnapshot(decision.profile),observedAt:new Date().toISOString()};
}
function normalizeObservability(value){const raw=value&&typeof value==='object'?value:{},recent=(Array.isArray(raw.recent)?raw.recent:[]).filter(x=>x&&x.kpId).slice(0,RECENT_LIMIT);return{totalDecisions:Math.max(0,Number(raw.totalDecisions)||0),reasonCounts:{...(raw.reasonCounts||{})},selectionCounts:{...(raw.selectionCounts||{})},lastDecision:raw.lastDecision&&raw.lastDecision.kpId?{...raw.lastDecision}:recent[0]||null,recent}}
function sameDecision(a,b){return !!a&&!!b&&String(a.kpId)===String(b.kpId)&&String(a.questionId||'')===String(b.questionId||'')&&String(a.targetTier)===String(b.targetTier)&&String(a.selectedTier)===String(b.selectedTier)&&String(a.reason)===String(b.reason)&&String(a.selectionReason)===String(b.selectionReason)&&Number(a.mastery)===Number(b.mastery)}
function persistDecision(decision){
 if(!decision||!decision.kpId)return null;const state=readState();if(!state)return null;if(!state.knowledge||typeof state.knowledge!=='object')state.knowledge={};
 const kpId=String(decision.kpId),record=state.knowledge[kpId]&&typeof state.knowledge[kpId]==='object'?{...state.knowledge[kpId]}:{},obs=normalizeObservability(record.difficultyObservability),last=obs.lastDecision;
 if(sameDecision(last,decision)&&timeValue(decision.observedAt)-timeValue(last.observedAt)<10000)return last;
 obs.totalDecisions+=1;obs.reasonCounts[decision.reason]=(Number(obs.reasonCounts[decision.reason])||0)+1;obs.selectionCounts[decision.selectionReason]=(Number(obs.selectionCounts[decision.selectionReason])||0)+1;obs.lastDecision={...decision};obs.recent=[{...decision},...obs.recent].slice(0,RECENT_LIMIT);record.difficultyObservability=obs;state.knowledge[kpId]=record;if(!writeState(state))return null;
 const sync=fromRoot('ManjingoAccountSync');if(sync&&typeof sync.schedule==='function')sync.schedule();
 const target=root.window||root,EventCtor=root.CustomEvent||(root.window&&root.window.CustomEvent);if(target&&typeof target.dispatchEvent==='function'&&typeof EventCtor==='function')target.dispatchEvent(new EventCtor('manjingo:difficulty-observed',{detail:{kpId,decision:{...decision}}}));
 return obs.lastDecision;
}
function observeChoice(list,preferredIds,candidate){if(!candidate)return null;return persistDecision(decisionFor(list,preferredIds,candidate))}
function recentDecisions(limit){const state=readState(),items=[];if(!state||!state.knowledge)return items;Object.entries(state.knowledge).forEach(([kpId,record])=>{const obs=normalizeObservability(record&&record.difficultyObservability);obs.recent.forEach(item=>items.push({...item,kpId:String(item.kpId||kpId)}))});const seen=new Set(),unique=[];items.sort((a,b)=>timeValue(b.observedAt)-timeValue(a.observedAt)).forEach(item=>{const key=String(item.kpId);if(seen.has(key))return;seen.add(key);unique.push(item)});return unique.slice(0,Math.max(0,Number(limit)||5))}
function evidenceText(decision){const p=decision&&decision.profile||{},bits=['掌握度 '+(Number(decision&&decision.mastery)||0)+'%'];if(Number(p.recentAttempts)>0&&p.recentAccuracy!=null)bits.push('目標層近期 '+p.recentAttempts+' 題 '+p.recentAccuracy+'%');if(Number(p.recentCorrectStreak)>1)bits.push('連對 '+p.recentCorrectStreak+' 題');return bits.join(' · ')}
function escapeHtml(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function kpLabel(kpId){const content=fromRoot('ManjingoContent'),kp=content&&Array.isArray(content.knowledgePoints)?content.knowledgePoints.find(x=>String(x.kpId)===String(kpId)):null;return kp?String(kp.content||kp.kpId):String(kpId)}
function render(){
 const doc=root.document||(root.window&&root.window.document);if(!doc)return false;const results=doc.getElementById('homeResults'),dashboard=doc.getElementById('masteryDashboard');if(!results||!dashboard)return false;let host=doc.getElementById('difficultyObservability');if(!host){host=doc.createElement('div');host.id='difficultyObservability';host.className='card calibration-observability-card';dashboard.insertAdjacentElement('afterend',host)}
 const items=recentDecisions(5);host.innerHTML='<div class="calibration-observability-title">自適應難度依據</div><div class="calibration-observability-sub">最近選題會記錄掌握度、近期層級表現，以及補救／重教或錯誤概念優先等原因。</div>'+(items.length?'<div class="calibration-observability-list">'+items.map(item=>'<div class="calibration-observability-row"><div><strong>'+escapeHtml(kpLabel(item.kpId))+'</strong><span>'+escapeHtml(item.reasonLabel||reasonLabel(item.reason))+(item.selectionReason!=='target-tier'?' · '+escapeHtml(item.selectionLabel||selectionLabel(item.selectionReason)):'')+'</span><small>'+escapeHtml(evidenceText(item))+(item.selectedTier!==item.targetTier?' · 原目標 '+escapeHtml(tierLabel(item.targetTier)):'')+'</small></div><b>'+escapeHtml(tierLabel(item.selectedTier))+'</b></div>').join('')+'</div>':'<div class="calibration-observability-empty">完成幾題後，這裡會顯示系統為甚麼調整難度。</div>');
 if(!doc.getElementById('difficultyObservabilityStyle')){const style=doc.createElement('style');style.id='difficultyObservabilityStyle';style.textContent='.calibration-observability-card{margin-top:12px}.calibration-observability-title{font-size:18px;font-weight:950;color:var(--ink)}.calibration-observability-sub,.calibration-observability-empty{margin-top:4px;color:var(--gray);font-size:11px;font-weight:700;line-height:1.5}.calibration-observability-list{display:grid;gap:7px;margin-top:12px}.calibration-observability-row{display:flex;align-items:flex-start;gap:10px;padding:10px;border:1px solid #eee;border-radius:12px;background:#fcfdfb}.calibration-observability-row>div{min-width:0;flex:1}.calibration-observability-row strong,.calibration-observability-row span,.calibration-observability-row small{display:block}.calibration-observability-row strong{color:var(--ink);font-size:12px}.calibration-observability-row span{margin-top:2px;font-size:11px;font-weight:800;line-height:1.45}.calibration-observability-row small{margin-top:3px;color:var(--gray);font-size:9px;font-weight:700}.calibration-observability-row b{white-space:nowrap;background:#eef8e8;color:#398500;border-radius:999px;padding:5px 7px;font-size:9px}';doc.head.appendChild(style)}return true;
}
function install(){
 const rotation=fromRoot('ManjingoQuestionRotation');if(!rotation||rotation.__difficultyObservabilityInstalled||typeof rotation.choose!=='function')return false;const original=rotation.choose.bind(rotation);rotation.choose=function(list,preferredIds){const candidate=original(list,preferredIds);observeChoice(list,preferredIds,candidate);return candidate};rotation.__difficultyObservabilityInstalled=true;
 const doc=root.document||(root.window&&root.window.document),target=root.window||root;if(target&&typeof target.addEventListener==='function')target.addEventListener('manjingo:difficulty-observed',()=>render());if(doc){const mount=()=>setTimeout(render,0);if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',mount,{once:true});else mount()}return true;
}
return{STATE_KEY,RECENT_LIMIT,TIERS,TIER_LABELS,REASON_LABELS,SELECTION_LABELS,validTier,tierLabel,reasonLabel,selectionLabel,decisionFor,normalizeObservability,persistDecision,observeChoice,recentDecisions,evidenceText,render,install};
});
