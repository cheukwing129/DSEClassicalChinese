(function(){
'use strict';

const knowledgePoints=[
 {kpId:'kp_transfer_single_sentence',textId:'CROSS',type:'篇章',content:'陌生語境：單句推斷與辨義',difficulty:2,teachable:true}
];

const questions=[
 {id:'tr6q001',kpId:'kp_transfer_single_sentence',textId:'CROSS',skillIds:['transfer.single-sentence','lex.context-inference'],sourceTextId:'quanxue',sourceSentenceId:'sentence:xunzi-quanxue:jia-yuma-fei-lizu-er-zhi-qianli',sourceKind:'classical-canon',transferLevel:2,difficultyTier:'foundation',type:'choice',q:'《荀子・勸學》「假輿馬者，非利足也，而致千里」中，根據「非利足」卻能「致千里」，「假」最可能是甚麼意思？',o:['借助／利用','虛假','假裝','暫時'],a:'借助／利用',explanation:'句子先否定腳力特別快，再說仍能到達千里之外，可推知關鍵在借助車馬；「假」在此是「借助、利用」。'},
 {id:'tr6q002',kpId:'kp_transfer_single_sentence',textId:'CROSS',skillIds:['transfer.single-sentence','lex.context-inference'],sourceTextId:'xiaoyaoyou',sourceSentenceId:'sentence:xiaoyaoyou:nu-er-fei-qiyi-ruo-chuitian-zhiyun',sourceKind:'classical-canon',transferLevel:2,difficultyTier:'foundation',type:'choice',q:'《莊子・逍遙遊》「怒而飛，其翼若垂天之雲」中，從「飛」與巨翼的語境判斷，「怒」最接近？',o:['奮起、振翅而飛','生氣發怒','責罵別人','突然停止'],a:'奮起、振翅而飛',explanation:'後文直接說「飛」並描寫巨翼，因此「怒」不是情緒上的發怒，而是奮發、鼓動力量而飛起。'},
 {id:'tr6q003',kpId:'kp_transfer_single_sentence',textId:'CROSS',skillIds:['transfer.single-sentence','lex.polysemy'],sourceTextId:'mengzi-lianghuiwang-xia',sourceSentenceId:'sentence:mengzi-lianghuiwang-xia:zhi-hao-shisu-zhiyue-er',sourceKind:'classical-canon',transferLevel:2,difficultyTier:'application',type:'choice',q:'《孟子・梁惠王下》「寡人非能好先王之樂也，直好世俗之樂耳」中的「直」應取哪個意思？',o:['只是／不過','筆直','正直','直接'],a:'只是／不過',explanation:'前句先否定愛好先王之樂，後句用「直……耳」收窄為「只不過喜歡世俗音樂」，所以「直」取「只是」。'},
 {id:'tr6q004',kpId:'kp_transfer_single_sentence',textId:'CROSS',skillIds:['transfer.single-sentence','lex.context-inference'],sourceTextId:'hongmenyan',sourceSentenceId:'sentence:hongmenyan:ji-limin-feng-fuku-er-dai-jiangjun',sourceKind:'classical-canon',transferLevel:2,difficultyTier:'application',type:'choice',q:'《鴻門宴》「籍吏民，封府庫，而待將軍」中，結合「府庫」和後句「待將軍」，「封」最合理理解為？',o:['封閉／封存','封爵','冊封為王','寫信'],a:'封閉／封存',explanation:'對象是「府庫」，又說要等待將軍到來，可推知劉邦把倉庫封閉保存；此處不是封爵的「封」。'},
 {id:'tr6q005',kpId:'kp_transfer_single_sentence',textId:'CROSS',skillIds:['transfer.single-sentence','lex.polysemy'],sourceTextId:'shishuo',sourceSentenceId:'sentence:shishuo:wuyi-yueshi-baigong-junzi-buchi',sourceKind:'classical-canon',transferLevel:2,difficultyTier:'transfer',type:'choice',q:'《師說》「巫醫樂師百工之人，君子不齒」中的「齒」，最接近哪個意思？',o:['並列／同列看待','牙齒','年齡','咬'],a:'並列／同列看待',explanation:'「君子不齒」是在說士大夫不願與巫醫、樂師、百工同列；「齒」由牙齒排列的形象引申為「排列、同列」。'},
 {id:'tr6q006',kpId:'kp_transfer_single_sentence',textId:'CROSS',skillIds:['transfer.single-sentence','lex.polysemy'],sourceTextId:'lunyu',sourceSentenceId:'sentence:lunyu-liren:chao-wendao-xi-si-keyi',sourceKind:'classical-canon',transferLevel:2,difficultyTier:'transfer',type:'choice',q:'《論語・里仁》「朝聞道，夕死可矣」中的「道」在這一句最接近？',o:['做人處世的道理／真理','道路','說話','道教'],a:'做人處世的道理／真理',explanation:'「早上得聞、晚上死也可以」強調值得終身追求的道理，不可能只是一般道路；「道」在此指重要的道理、真理。'}
];

window.ManjingoQuestionPackTransfer06={catalogVersion:'reviewed-v1',kind:'stage1-single-sentence-closeout',knowledgePoints,questions};
})();
