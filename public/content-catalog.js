(function(){
'use strict';

const knowledgePoints=[
 {kpId:'kp_yueyang_001',textId:'yueyanglou',type:'實詞',content:'謫',difficulty:1,teachable:true},
 {kpId:'kp_yueyang_002',textId:'yueyanglou',type:'句式',content:'微斯人，吾誰與歸',difficulty:3,teachable:false},
 {kpId:'kp_yueyang_003',textId:'yueyanglou',type:'主題手法',content:'覽物之情與政治理想的對比昇華',difficulty:3,teachable:false},
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

const questions=[
 {id:'q001',kpId:'kp_yueyang_001',type:'choice',q:'『謫守巴陵郡』中『謫』字的意思是？',o:['提拔','貶官','辭職','退休'],a:'貶官'},
 {id:'q004',kpId:'kp_virtual_zhi',type:'choice',q:'『輟耕之壟上』中『之』字的用法是？',o:['代詞','結構助詞（的）','動詞（到／往）','語氣助詞'],a:'動詞（到／往）'},
 {id:'q005',kpId:'sx_001',type:'choice',q:'『廉頗者，趙之良將也』屬於哪種句式？',o:['判斷句','被動句','省略句','倒裝句'],a:'判斷句'},
 {id:'q010',kpId:'sx_006',type:'choice',q:'『微斯人，吾誰與歸』的正確白話翻譯是？',o:['如果沒有這樣的人，我要跟從誰呢？','如果沒有這樣的人，誰會跟從我呢？','沒有這樣的人，我不知道去哪裡。','這個人不存在，我們一起回去。'],a:'如果沒有這樣的人，我要跟從誰呢？'},
 {id:'q008',kpId:'kp_yueyang_004',type:'fill',q:'先天下之憂而憂，____________。',a:'後天下之樂而樂'},
 {id:'q006',kpId:'sx_006',type:'choice',q:'『吾誰與歸』中『歸』的意思是？',o:['歸還','歸依、歸附','歸來','回家'],a:'歸依、歸附'},
 {id:'gq001',kpId:'kp_yueyang_001',type:'choice',q:'『謫守巴陵郡』中『謫』的意思是？',o:['提拔','貶官','辭官','調任'],a:'貶官'},
 {id:'gq002',kpId:'kp_yueyang_001',type:'choice',q:'下列哪個解釋最接近『謫守』中的『謫』？',o:['被貶職','被賞賜','主動辭職','升任京官'],a:'被貶職'},
 {id:'gq003',kpId:'kp_yueyang_004',type:'fill',q:'先天下之憂而憂，____________。',a:'後天下之樂而樂'},
 {id:'gq004',kpId:'kp_yueyang_004',type:'choice',q:'『先天下之憂而憂，後天下之樂而樂』最能表現哪種精神？',o:['以天下為己任','及時行樂','歸隱避世','追求名利'],a:'以天下為己任'},
 {id:'gq005',kpId:'kp_virtual_zhi',type:'choice',q:'『輟耕之壟上』中『之』的用法是？',o:['代詞','結構助詞','動詞（往／到）','語氣詞'],a:'動詞（往／到）'},
 {id:'gq006',kpId:'kp_virtual_zhi',type:'choice',q:'『三里之城』中『之』的用法是？',o:['代詞','結構助詞（的）','動詞（往）','賓語前置標誌'],a:'結構助詞（的）'},
 {id:'gq007',kpId:'kp_virtual_zhi',type:'choice',q:'『公與之乘』中『之』的用法是？',o:['代詞','結構助詞','動詞','語氣詞'],a:'代詞'},
 {id:'gq008',kpId:'kp_virtual_er',type:'choice',q:'『人不知而不慍』中『而』表示甚麼關係？',o:['並列','轉折','順承','因果'],a:'轉折'},
 {id:'gq009',kpId:'kp_virtual_er',type:'choice',q:'『舍魚而取熊掌』中『而』表示甚麼關係？',o:['轉折','順承','假設','因果'],a:'順承'},
 {id:'gq010',kpId:'kp_virtual_er',type:'choice',q:'下列哪一句中的『而』最明顯表示轉折？',o:['人不知而不慍','舍魚而取熊掌','蟹六跂而二螯','學而時習之'],a:'人不知而不慍'},
 {id:'gq011',kpId:'kp_virtual_yi',type:'choice',q:'『不以物喜，不以己悲』中『以』的意思是？',o:['因為','用','把','來'],a:'因為'},
 {id:'gq012',kpId:'kp_virtual_yi',type:'choice',q:'『以叢草為林』中『以』的用法最接近？',o:['因為','把／將','用來','認為'],a:'把／將'},
 {id:'gq013',kpId:'kp_virtual_yi',type:'choice',q:'下列哪一句中的『以』表示原因？',o:['不以物喜','以叢草為林','以刀劈狼首','屬予作文以記之'],a:'不以物喜'},
 {id:'gq014',kpId:'kp_virtual_yu',type:'choice',q:'『生於憂患』中『於』最接近哪個意思？',o:['在／從','比','被','對於'],a:'在／從'},
 {id:'gq015',kpId:'kp_virtual_yu',type:'choice',q:'『青，取之於藍，而青於藍』後一個『於』表示？',o:['在','比','被','從'],a:'比'},
 {id:'gq016',kpId:'kp_virtual_yu',type:'choice',q:'下列哪一句中的『於』表示比較？',o:['青於藍','生於憂患','告之於帝','困於心'],a:'青於藍'},
 {id:'gq017',kpId:'kp_virtual_qi',type:'choice',q:'『其鄉人曰』中的『其』主要用作？',o:['代詞','連詞','動詞','語氣詞'],a:'代詞'},
 {id:'gq018',kpId:'kp_virtual_qi',type:'choice',q:'『其真無馬邪？其真不知馬也』中的前一個『其』主要帶有甚麼語氣？',o:['反問／推測','肯定','命令','感嘆'],a:'反問／推測'},
 {id:'gq019',kpId:'kp_virtual_ze',type:'choice',q:'『學而不思則罔』中『則』的意思最接近？',o:['就／便','卻','如果','只有'],a:'就／便'},
 {id:'gq020',kpId:'kp_virtual_ze',type:'choice',q:'『入則無法家拂士』中的『則』在語境中較接近？',o:['如果／若','於是','卻','只有'],a:'如果／若'},
 {id:'gq021',kpId:'gj_004',type:'choice',q:'『先帝不以臣卑鄙』中『卑鄙』的古義是？',o:['品德惡劣','身分低微而見識淺薄','說話粗俗','行為自私'],a:'身分低微而見識淺薄'},
 {id:'gq022',kpId:'gj_004',type:'choice',q:'下列哪個最能說明古今『卑鄙』詞義的差異？',o:['古義指身分與見識；今義多指品行惡劣','古今意思完全相同','古義指富貴；今義指貧窮','古義指勇敢；今義指膽小'],a:'古義指身分與見識；今義多指品行惡劣'},
 {id:'gq023',kpId:'gj_005',type:'choice',q:'『由是感激，遂許先帝以驅馳』中『感激』的古義是？',o:['感謝他人','感動奮發','激動流淚','深感遺憾'],a:'感動奮發'},
 {id:'gq024',kpId:'gj_005',type:'choice',q:'下列哪個現代詞最接近文言『感激』在『由是感激』中的意思？',o:['感奮','感謝','感恩','感傷'],a:'感奮'},
 {id:'gq025',kpId:'cy_004',type:'choice',q:'『先天下之憂而憂，後天下之樂而樂』中的『先』『後』在句中有何特點？',o:['詞類活用，表示在……之前／之後','純粹名詞','通假字','被動用法'],a:'詞類活用，表示在……之前／之後'},
 {id:'gq026',kpId:'cy_004',type:'choice',q:'『先天下之憂而憂』中的『先』最接近哪個意思？',o:['在天下人之前','使天下人先憂','先離開天下','第一個天下'],a:'在天下人之前'},
 {id:'gq027',kpId:'cy_006',type:'choice',q:'『吾從而師之』中的『師』應理解為？',o:['老師','以……為師','軍隊','教導'],a:'以……為師'},
 {id:'gq028',kpId:'cy_006',type:'choice',q:'『吾從而師之』中的『師』屬於哪類詞類活用？',o:['意動用法','使動用法','名詞作狀語','通假字'],a:'意動用法'},
 {id:'gq029',kpId:'sx_001',type:'choice',q:'『廉頗者，趙之良將也』屬於哪種句式？',o:['判斷句','被動句','省略句','倒裝句'],a:'判斷句'},
 {id:'gq030',kpId:'sx_001',type:'choice',q:'文言文中『……者，……也』常用來表示哪種關係？',o:['判斷','被動','疑問','倒裝'],a:'判斷'},
 {id:'gq031',kpId:'sx_003',type:'choice',q:'『秦城恐不可得，徒見欺』中的『見』有何作用？',o:['表被動','表看見','表比較','表推測'],a:'表被動'},
 {id:'gq032',kpId:'sx_003',type:'choice',q:'下列哪一句最能判斷為『見』字表被動？',o:['徒見欺','圖窮而匕首見','風吹草低見牛羊','曹劌請見'],a:'徒見欺'},
 {id:'gq033',kpId:'sx_004',type:'choice',q:'『而智勇多困於所溺』中『於』在句式上有何作用？',o:['表被動','表示比較','表示地點','表示時間'],a:'表被動'},
 {id:'gq034',kpId:'sx_004',type:'choice',q:'『困於所溺』最適合歸入哪一類句式？',o:['被動句','判斷句','省略句','賓語前置句'],a:'被動句'},
 {id:'gq035',kpId:'sx_005',type:'choice',q:'『（廉頗）為趙將，伐齊，大破之』主要涉及哪種句式現象？',o:['省略主語','賓語前置','被動','判斷'],a:'省略主語'},
 {id:'gq036',kpId:'sx_005',type:'choice',q:'文言文中上下文已明確時省去主語，這種現象稱為？',o:['省略句','判斷句','倒裝句','被動句'],a:'省略句'},
 {id:'gq037',kpId:'sx_006',type:'choice',q:'『微斯人，吾誰與歸』中的『吾誰與歸』屬於？',o:['賓語前置','定語後置','狀語後置','被動句'],a:'賓語前置'},
 {id:'gq038',kpId:'sx_006',type:'choice',q:'『吾誰與歸』按現代漢語語序可調整為？',o:['吾與誰歸','誰吾與歸','吾歸與誰','與誰吾歸'],a:'吾與誰歸'},
 {id:'gq039',kpId:'sx_006',type:'choice',q:'下列哪一句最能體現疑問代詞作賓語前置？',o:['吾誰與歸','廉頗者，趙之良將也','徒見欺','生於憂患'],a:'吾誰與歸'},
 {id:'gq040',kpId:'sx_008',type:'choice',q:'『覆之以掌』按現代漢語語序理解較接近？',o:['以掌覆之','覆以之掌','之覆以掌','掌覆以之'],a:'以掌覆之'},
 {id:'gq041',kpId:'sx_008',type:'choice',q:'『覆之以掌』中的『以掌』置於動詞之後，屬於？',o:['狀語後置','賓語前置','定語後置','判斷句'],a:'狀語後置'},
 {id:'gq042',kpId:'kp_translation_001',type:'choice',q:'『微斯人，吾誰與歸』最恰當的白話翻譯是？',o:['如果沒有這樣的人，我和誰一道呢','這個人很微小，我應跟他回去','沒有人知道我要去哪裡','我不願與任何人同行'],a:'如果沒有這樣的人，我和誰一道呢'},
 {id:'gq043',kpId:'kp_translation_001',type:'choice',q:'翻譯『微斯人』時，『微』最接近？',o:['如果沒有','微小','卑微','稍微'],a:'如果沒有'},
 {id:'gq044',kpId:'kp_theme_001',type:'choice',q:'『不以物喜，不以己悲』表現作者提倡哪種處世態度？',o:['不因外物與個人得失而大起大落','完全沒有情感','凡事追求快樂','只關心自己'],a:'不因外物與個人得失而大起大落'},
 {id:'gq045',kpId:'kp_theme_001',type:'choice',q:'由『不以物喜，不以己悲』到『先天下之憂而憂』，文章思想層次有何推進？',o:['由個人情懷提升到天下責任','由政治轉向遊樂','由悲傷轉向逃避','由寫景轉為記事'],a:'由個人情懷提升到天下責任'},
 {id:'gq046',kpId:'kp_argument_001',type:'choice',q:'以具體事例支持中心論點，通常稱為甚麼論證方法？',o:['舉例論證','比喻論證','對比論證','引用論證'],a:'舉例論證'},
 {id:'gq047',kpId:'kp_argument_002',type:'choice',q:'把兩種相反或相對情況放在一起比較以突出觀點，通常稱為？',o:['對比論證','引用論證','比喻論證','因果論證'],a:'對比論證'},
 {id:'gq048',kpId:'kp_argument_003',type:'choice',q:'以熟悉事物作比方來說明較抽象道理，通常稱為？',o:['比喻論證','舉例論證','引用論證','歸納論證'],a:'比喻論證'}
];

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
   const candidate=available[Math.floor(Math.random()*available.length)];
   used.add(candidate.id);
   queue.push({...candidate,category:item.category||'new',priority:item.priority??3});
 });
 return queue;
}

window.ManjingoContent={
 knowledgePoints:knowledgePoints.map(x=>({...x})),
 questions:questions.map(x=>({...x})),
 getKnowledgePointIds,
 selectQuestionsForPlan
};
})();
