# Firebase 內容匯入說明

## 正式題庫來源

Manjingo 現在以 `public/` 下的 reviewed catalog 為唯一正式題庫來源：

- `question-pack-02.js`
- `question-pack-03.js`
- `question-pack-lesson.js`（已整理為 foundation 題）
- `question-pack-capacity-01.js`
- `content-catalog.js`

`data/questions_v2_template.csv`、`data/questions_generated_01.csv` 與更早的 template CSV 都屬於 **legacy / historical files**。它們包含早期測試題、舊 KP ID、舊題型格式，以及已知錯字／錯誤內容，**不可再作為 production Firestore 題庫來源**。

## 前置準備

1. 確認 Firebase project：`manjingo-95d9a`
2. 到 Firebase Console → Project settings → Service accounts 取得 service account JSON
3. 把檔案只放在本機 `scripts/serviceAccountKey.json`，不要 commit
4. 在 `scripts/` 安裝 `firebase-admin` 與 `csv-parser`

## 匯入 reviewed catalog

```bash
cd scripts
node import_to_firestore.js
```

這會 upsert：

- `data/texts_template.csv` → `texts`
- reviewed JS catalog → `knowledgePoints`
- reviewed JS catalog → `questions`

預設 **不會刪除** Firestore 中的舊文件。

## 清除已淘汰的舊題

確認 reviewed catalog 無誤後才使用：

```bash
node import_to_firestore.js --prune
```

`--prune` 會刪除 `questions` 與 `knowledgePoints` collection 中不在目前 reviewed catalog 的文件。因此 production 使用前應先確認目前 catalog／測試均通過。

## 新增或修改題目的規則

不要再編輯 legacy CSV。請直接更新相應的 `public/question-pack-*.js`，並遵守以下最低品質要求：

- question ID 固定且唯一；不要因重新排序而改變既有 ID 的語義
- 每題必須指向有效且可教的 KP
- choice 題的正確答案必須唯一存在於 options
- 每題都要有有意義的 `explanation`
- 不以湊題數為目的加入近乎重複的題目
- 文言詞義、句式分類、原文引用及答案必須先校對
- 新增內容後必須通過 `npm test`

## 舊 CSV 的定位

Legacy CSV 目前只保留作版本追溯與舊 Firestore 資料辨識用途。`scripts/import_to_firestore.js` 已不再讀取它們，因此不會因誤執行匯入腳本而把舊測試題重新寫回 production。
