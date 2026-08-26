# Firebase匯入腳本使用說明

## 前置準備
1. 在 Firebase Console 建立/確認你的專案
2. 到「專案設定 → 服務帳戶」下載 serviceAccountKey.json，放在 scripts/ 目錄下
3. cd scripts && npm install firebase-admin csv-parser

## 執行方式
cd scripts
node import_to_firestore.js

## 資料流向說明
- data/texts_template.csv        -> Firestore: texts collection
- data/knowledgePoints_template.csv (textId=篇章ID) -> Firestore: knowledgePoints collection
- data/knowledgePoints_template.csv (textId=CROSS)  -> Firestore: crossTextVocab collection（跨篇虛詞/語法庫）
- data/questions_template.csv    -> Firestore: questions collection

## 之後擴充建議
- userProgress collection 不從CSV匯入，由前端/Cloud Function在學生答題時動態寫入
  結構：userProgress/{userId}/kpRecords/{kpId} -> { easeFactor, repetition, interval, nextReviewAt, lastQuality }
- 新增文言語法知識點：補充 data/grammar_knowledge_starter.csv 與 data/virtual_words_reference.csv 後，
  依相同格式併入 knowledgePoints_template.csv 再重新執行匯入
