(function(){
'use strict';
function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function unique(items){return Array.from(new Set((items||[]).map(clean).filter(Boolean)))}
function questionFor(feedback){
 const content=window.ManjingoContent;if(!content||!Array.isArray(content.questions))return null;
 const scope=feedback.closest&&((feedback.closest('#quiz'))||(feedback.closest('.lesson-content'))||(feedback.parentElement));
 const node=scope&&scope.querySelector&&scope.querySelector('.question,.lesson-question');
 const text=clean(node&&node.textContent);if(!text)return null;
 return content.questions.find(q=>clean(q&&q.q)===text)||null;
}
function selectedAnswer(feedback){
 const scope=feedback.closest&&((feedback.closest('#quiz'))||(feedback.closest('.lesson-content'))||(feedback.parentElement));
 if(!scope||!scope.querySelector)return'';
 const wrong=scope.querySelector('.option.wrong');if(wrong)return clean(wrong.textContent);
 const input=scope.querySelector('.input,.fill-input');return input?clean(input.value):'';
}
function sliceLabel(text,label,nextLabels){
 const source=clean(text),start=source.indexOf(label);if(start<0)return'';
 const from=start+label.length;let end=source.length;
 (nextLabels||[]).forEach(next=>{const i=source.indexOf(next,from);if(i>=0&&i<end)end=i});
 return clean(source.slice(from,end));
}
function explanationFromText(text){return sliceLabel(text,'為甚麼？',['你可能混淆了：','判斷提示：','相似例子：','概念掌握度：','下一步：'])}
function parseCorrectAnswer(text){return sliceLabel(text,'正確答案：',['為甚麼？','你可能混淆了：','判斷提示：','相似例子：','概念掌握度：','下一步：'])}
function metricLines(text){
 const raw=clean(text),lines=[];
 const concept=raw.match(/概念(?:掌握度)?[： ]+([0-9]{1,3}%)/);if(concept)lines.push('概念掌握度 '+concept[1]);
 const mastery=raw.match(/(?:🧠\s*)?掌握度[： ]+([0-9]{1,3}%)/);if(mastery)lines.push('掌握度 '+mastery[1]);
 const xp=raw.match(/(?:本題獲得[： ]*)?\+?([0-9]+)\s*XP/);if(xp)lines.push('本題 +'+xp[1]+' XP');
 const review=raw.match(/建議下次複習[： ]+([^📅⭐]+?)(?=本題|$)/);if(review)lines.push('下次複習 '+clean(review[1]));
 return unique(lines);
}
function supportingLines(feedback,question,raw){
 const lines=[];
 feedback.querySelectorAll&&feedback.querySelectorAll('.mastery').forEach(node=>{const text=clean(node.textContent);if(/^✅|^🔁/.test(text))lines.push(text.replace(/^[✅🔁]\s*/,''))});
 const selected=selectedAnswer(feedback);
 if(question&&question.misconception){lines.push('常見混淆：'+clean(String(question.misconception).replace('{answer}',selected||'這個答案')))}
 else {const mixed=sliceLabel(raw,'你可能混淆了：',['判斷提示：','相似例子：','概念掌握度：','下一步：']);if(mixed)lines.push('常見混淆：'+mixed)}
 if(question&&question.example)lines.push('對照例子：'+clean(question.example));
 else {const example=sliceLabel(raw,'相似例子：',['概念掌握度：','下一步：']);if(example)lines.push('對照例子：'+example)}
 return unique(lines);
}
function explanation(feedback,question,raw,isCorrect){
 if(question&&question.explanation)return clean(question.explanation);
 const parsed=explanationFromText(raw);if(parsed)return parsed;
 if(!isCorrect&&question&&question.misconceptionLabel)return '這題考的是「'+clean(question.misconceptionLabel)+'」，先比較各選項在語境中的功能。';
 if(!isCorrect)return '先對照正確答案，再回到題目的語境與判斷規則。';
 return'';
}
function build(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=text;return node}
function enhance(feedback){
 if(!feedback||!feedback.classList||!feedback.classList.contains('feedback')||feedback.dataset.feedbackUi==='1')return false;
 const raw=clean(feedback.textContent);if(!raw)return false;
 const isCorrect=feedback.classList.contains('correct'),question=questionFor(feedback),answer=question?clean(question.a):parseCorrectAnswer(raw),why=explanation(feedback,question,raw,isCorrect),notes=supportingLines(feedback,question,raw),metrics=metricLines(raw);
 feedback.dataset.feedbackUi='1';feedback.classList.add('feedback-ui');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.innerHTML='';
 const result=build('div','feedback-result'),icon=build('span','feedback-result-icon',isCorrect?'✓':'×'),copy=build('div','feedback-result-copy'),title=build('strong','feedback-result-title',isCorrect?'答對了':'這題答錯了');
 copy.appendChild(title);if(!isCorrect&&answer)copy.appendChild(build('span','feedback-answer','正確答案：'+answer));result.appendChild(icon);result.appendChild(copy);feedback.appendChild(result);
 if(why||notes.length){const teaching=build('div','feedback-teaching');if(why){teaching.appendChild(build('strong','feedback-section-title','為甚麼？'));teaching.appendChild(build('p','feedback-explanation',why))}notes.forEach(line=>teaching.appendChild(build('p','feedback-note',line)));feedback.appendChild(teaching)}
 if(metrics.length){const details=build('details','feedback-progress'),summary=build('summary','', '查看學習進度');details.appendChild(summary);const rows=build('div','feedback-progress-rows');metrics.forEach(line=>rows.appendChild(build('span','',line)));details.appendChild(rows);feedback.appendChild(details)}
 const nextText=isCorrect?'下一步：繼續下一題':raw.includes('優先安排複習')?'下一步：這個知識點會優先安排複習':'下一步：系統會提高這個知識點的複習優先度';feedback.appendChild(build('div','feedback-next',nextText));
 return true;
}
function scan(root){if(!root)return;if(root.matches&&root.matches('.feedback'))enhance(root);if(root.querySelectorAll)root.querySelectorAll('.feedback').forEach(enhance)}
function install(){scan(document);if(typeof MutationObserver!=='function'||!document.body)return;const observer=new MutationObserver(records=>records.forEach(record=>{if(record.target&&record.target.classList&&record.target.classList.contains('feedback'))enhance(record.target);record.addedNodes&&record.addedNodes.forEach(scan)}));observer.observe(document.body,{childList:true,subtree:true});window.ManjingoFeedbackUI.observer=observer}
window.ManjingoFeedbackUI={enhance,scan,install,questionFor,explanationFromText,parseCorrectAnswer,metricLines,supportingLines,clean,observer:null};
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install()}
})();
