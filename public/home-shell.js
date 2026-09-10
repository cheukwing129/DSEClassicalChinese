(function(){
'use strict';
const VIEWS={today:'homeToday',path:'homePath',weakness:'homeWeakness',results:'homeResults'};
function normalizeView(view){return Object.prototype.hasOwnProperty.call(VIEWS,view)?view:'today'}
function viewFromHash(hash){const h=String(hash||'');if(h==='#masteryDashboard')return'results';if(h==='#weaknessPanel')return'weakness';if(h==='#learningPath')return'path';return'today'}
function showView(view){const target=normalizeView(view);document.querySelectorAll('[data-home-view]').forEach(panel=>{panel.hidden=panel.getAttribute('data-home-view')!==target});document.querySelectorAll('[data-home-tab]').forEach(button=>{const active=button.getAttribute('data-home-tab')===target;button.setAttribute('aria-selected',active?'true':'false');button.tabIndex=active?0:-1;button.classList.toggle('active',active)});return target}
function focusQuiz(){showView('today');const quiz=document.getElementById('quiz');if(!quiz)return;requestAnimationFrame(()=>{try{quiz.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){quiz.scrollIntoView()}try{quiz.focus({preventScroll:true})}catch(e){try{quiz.focus()}catch(ignore){}}})}
function install(){document.querySelectorAll('[data-home-tab]').forEach(button=>button.addEventListener('click',()=>showView(button.getAttribute('data-home-tab'))));showView(viewFromHash(location.hash));window.addEventListener('hashchange',()=>showView(viewFromHash(location.hash)))}
window.ManjingoHomeShell={showView,focusQuiz,viewFromHash};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
