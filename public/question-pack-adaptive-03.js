(function(){
'use strict';
const tierRevisions={
 q001:'foundation',cap1q002:'application',
 q008:'foundation',cap1q005:'application',
 cap1q007:'foundation',cap1q009:'application',cap1q008:'transfer',
 cap1q016:'foundation',cap1q018:'application',cap1q017:'transfer',
 cap1q019:'foundation',cap1q021:'application',
 cap1q022:'foundation',cap1q023:'application',cap1q024:'transfer',
 cap1q013:'foundation',cap1q015:'application',
 p2q001:'foundation',p2q003:'application',
 p2q057:'foundation',p2q060:'application',
 p2q069:'foundation',p2q070:'application',
 p3q001:'foundation',p3q003:'application',p3q004:'transfer',
 p3q005:'foundation',p3q007:'application',p3q008:'transfer',
 p3q009:'foundation',p3q011:'application',p3q012:'transfer',
 p3q013:'foundation',p3q015:'application',p3q016:'transfer',
 p3q017:'foundation',p3q018:'application',p3q020:'transfer',
 p3q021:'foundation',p3q023:'application',p3q024:'transfer',
 p3q025:'foundation',p3q027:'application',p3q028:'transfer',
 p3q029:'foundation',p3q030:'application',p3q031:'transfer',
 p3q033:'foundation',p3q034:'application',p3q036:'transfer',
 p3q038:'foundation',p3q040:'application',p3q037:'transfer'
};
const questions=[
 {id:'ad3q001',kpId:'kp_yueyang_001',textId:'CROSS',type:'choice',difficultyTier:'transfer',q:'比較「滕子京謫守巴陵郡」與「謫戍之眾」中的「謫」，兩者共同的核心意思最接近？',o:['因罪責而被貶降或發遣','主動辭官退隱','獲得升遷任命','短暫外出遊歷'],a:'因罪責而被貶降或發遣',explanation:'「謫」的核心都帶有因過失、罪責而受處分的意味；在《岳陽樓記》是被貶後外任，在「謫戍」語境則是被發遣戍守。'},
 {id:'ad3q002',kpId:'kp_yueyang_004',textId:'CROSS',type:'choice',difficultyTier:'transfer',q:'若要用《岳陽樓記》原句回應「士人應先承擔天下憂患，之後才享受天下安樂」這一觀點，哪一句最準確？',o:['先天下之憂而憂，後天下之樂而樂','不以物喜，不以己悲','居廟堂之高則憂其民','微斯人，吾誰與歸'],a:'先天下之憂而憂，後天下之樂而樂',explanation:'這不是單純補字，而是先理解語意，再從篇章中調用完全對應的名句；「先憂後樂」直接表達公共責任的先後次序。'},
 {id:'ad3q003',kpId:'cy_004',textId:'CROSS',type:'choice',difficultyTier:'transfer',q:'比較「先天下之憂而憂」與《出師表》「先帝創業未半而中道崩殂」中的「先」，哪項辨析正確？',o:['前者表示「在……之前」的時間關係，後者是「先帝」稱謂的一部分','兩者都表示「祖先」','兩者都表示「首先」而沒有差別','前者是地名，後者是動詞'],a:'前者表示「在……之前」的時間關係，後者是「先帝」稱謂的一部分',explanation:'詞類和詞義要看句法位置。「先天下之憂」把「先」帶入時間先後關係；「先帝」則是對已故帝王的稱謂，不能機械套用同一用法。'},
 {id:'ad3q004',kpId:'kp_translation_001',textId:'CROSS',type:'choice',difficultyTier:'transfer',q:'把「微斯人，吾誰與歸」的翻譯策略遷移到「微管仲，吾其被髮左衽矣」與「何陋之有」，最重要的共同做法是？',o:['先按語境判斷古義，再處理特殊語序','所有字都照現代常用義逐字直譯','遇到虛詞一律刪去不譯','保持文言語序不作任何調整'],a:'先按語境判斷古義，再處理特殊語序',explanation:'「微」在相關語境中要按古義理解為「如果沒有」；遇到「吾誰與歸」「何陋之有」等倒裝，還要還原成符合現代漢語的語序。'},
 {id:'ad3q005',kpId:'kp_yueyang_context',textId:'CROSS',type:'choice',difficultyTier:'transfer',q:'比較「百廢具興」與「此人一一為具言所聞」中的「具」，哪項判斷最合理？',o:['前者是「都」，後者是「詳細地」，要依語境辨義','兩者都只能解作工具','前者是「詳細地」，後者是「都」','兩者都表示擁有'],a:'前者是「都」，後者是「詳細地」，要依語境辨義',explanation:'「百廢具興」中的「具」通「俱」，表示「都」；「具言所聞」則是詳細說明所聞之事。同字在不同語境可以有不同功能。'},
 {id:'ad3q006',kpId:'kp_taohua_discovery',textId:'CROSS',type:'choice',difficultyTier:'transfer',q:'比較《桃花源記》「欲窮其林」與「所識窮乏者得我與」中的「窮」，哪項正確？',o:['前者是走到盡頭，後者指貧困困乏','兩者都只表示沒有金錢','前者指貧困，後者指走到盡頭','兩者都表示追問原因'],a:'前者是走到盡頭，後者指貧困困乏',explanation:'「欲窮其林」描述漁人想走到桃林盡頭；「窮乏者」描述生活困乏的人。判斷實詞不能只背單一義項，要放回句中。'},
 {id:'ad3q007',kpId:'kp_loushi_allusion',textId:'CROSS',type:'choice',difficultyTier:'transfer',q:'某篇文章借古代高士居住簡陋卻守志自得的故事來表明作者自己的品格。這種寫法與《陋室銘》「南陽諸葛廬，西蜀子雲亭」最接近的作用是？',o:['借前人形象自況，強化自身品格與主旨','只為交代房屋所在地','證明古人住宅都很豪華','用歷史材料取代全文論點'],a:'借前人形象自況，強化自身品格與主旨',explanation:'《陋室銘》引用諸葛亮、揚雄的居所，不只是提供史實，而是借賢者形象自況，提升「陋室不陋」的精神價值。'}
];
window.ManjingoQuestionPackAdaptive03={kind:'adaptive-completion',catalogVersion:'reviewed-v4',tierRevisions,questions};
})();