# Firebase 內容同步說明

## 正式題庫來源

Manjingo 現在以 `public/` 下的 reviewed catalog 為唯一正式題庫來源：

- `question-pack-02.js`
- `question-pack-03.js`
- `question-pack-lesson.js`（已整理為 foundation 題）
- `question-pack-capacity-01.js`
- `content-catalog.js`

`data/questions_v2_template.csv`、`data/questions_generated_01.csv` 與更早的 template CSV 都屬於 **legacy / historical files**。它們包含早期測試題、舊 KP ID、舊題型格式，以及已知錯字／錯誤內容，**不可再作為 production Firestore 題庫來源**。

## 推薦：用 GitHub Actions 同步 production

正式環境請使用 **Actions → Firebase Content Sync → Run workflow**。

Workflow 有兩個 operation：

- `check`：只讀 Firestore，顯示 create / update / unchanged / stale 數量，不修改資料。
- `sync-and-prune`：先 preview，再同步 reviewed catalog，刪除 `questions` / `knowledgePoints` 中不屬於目前 catalog 的舊文件，最後 strict verify。

選擇 `sync-and-prune` 時，`confirmation` 必須輸入：

```text
PRUNE_REVIEWED_CONTENT
```

部署使用既有 GitHub Actions secret `FIREBASE_SERVICE_ACCOUNT_MANJINGO`，經 `google-github-actions/auth` 建立 Application Default Credentials。不要把 service-account JSON commit 到 repository。

每次正式同步都會先執行完整 `npm test`。同步成功後亦會寫入：

```text
contentMeta/catalog
```

其中記錄 `catalogVersion`、題目數、KP 數、同步模式與 server timestamp，方便確認 production 目前使用哪一版內容。

## 本機安全模式

本機使用前先安裝 Functions dependencies：

```bash
npm install --prefix functions
```

然後使用 Google Application Default Credentials，或以 `FIREBASE_SERVICE_ACCOUNT_PATH` 指向只存在本機的 service-account JSON。

預設執行是 **read-only check**：

```bash
node scripts/import_to_firestore.js
# 等同 --check
```

其他模式：

```bash
node scripts/import_to_firestore.js --check
node scripts/import_to_firestore.js --apply
node scripts/import_to_firestore.js --prune
node scripts/import_to_firestore.js --verify
```

- `--apply`：upsert reviewed docs，但保留 stale docs。
- `--prune`：upsert reviewed docs，並刪除 stale question / KP docs。
- `--verify`：只讀；只要 Firestore 與 reviewed catalog 有 create / update / stale drift 就失敗。

`texts` 會同步內容，但 `--prune` **不會刪除額外 text 文件**，避免題庫清理誤刪歷史文章資料。

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

Legacy CSV 目前只保留作版本追溯與舊 Firestore 資料辨識用途。`scripts/import_to_firestore.js` 已不再讀取它們，因此不會因誤執行同步腳本而把舊測試題重新寫回 production。
