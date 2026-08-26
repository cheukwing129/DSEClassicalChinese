# Firebase匯入腳本使用說明（v2：統一題型格式）

## 前置準備
1. 在 Firebase Console 建立/確認你的專案（manjingo-95d9a）
2. 到「專案設定 → 服務帳戶」下載 serviceAccountKey.json，放在 scripts/ 目錄下
3. cd scripts && npm install firebase-admin csv-parser

## 執行方式
cd scripts
node import_to_firestore.js

## 資料流向說明
- data/texts_template.csv         -> Firestore: texts collection
- data/questions_v2_template.csv  -> Firestore: questions collection
  （type欄位決定前端用哪種題型引擎渲染：choice/reorder/match/fill/mark）

## 新增題目的方法
1. 打開 data/questions_v2_template.csv，新增一行
   - type=choice：options用 | 分隔選項，answer填正確選項文字
   - type=reorder：options用 | 分隔正確順序的詞塊，answer與options相同
   - type=match：options用 ; 分隔配對組，每組內用 | 分隔左右兩邊，answer留空
   - type=fill：options留空，answer填正確答案文字
   - type=mark：options用 / 分隔句中每個字，answer填活用字的index（從0開始，用|分隔多個）
2. 重新執行 node import_to_firestore.js（會覆寫同ID的題目，新增ID則新增文件）
3. 重新整理網頁，新題目會自動出現在練習流程中，不需要改任何程式碼

## 舊版CSV已停用
data/knowledgePoints_template.csv 與 data/questions_template.csv 是舊格式，
已被 data/questions_v2_template.csv 取代，可保留作參考但不再匯入。
