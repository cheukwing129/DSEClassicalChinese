# Manjingo v2 部署指南

## 目錄結構
```text
manjingo/
├── public/                      <- Cloudflare Pages 靜態前端
│   ├── index.html
│   ├── firebase-config.js
│   └── levelSystem.js
├── functions/                   <- Firebase Cloud Functions
│   ├── index.js
│   ├── learningEngine.js
│   └── package.json
├── firestore.rules              <- Firestore v2 安全規則
├── data/                         <- CSV 內容範本
├── scripts/                      <- 資料匯入腳本
├── wrangler.toml
└── package.json
```

## Firebase Functions

```bash
cd functions
npm install
npm run lint
firebase deploy --only functions
```

`submitAnswer` 現在由 server-side function 決定 XP、Mastery、SM-2 及答題紀錄；前端不應直接寫入學生的學習狀態。

## Firestore Rules

```bash
firebase deploy --only firestore:rules
```

v2 規則允許學生讀取自己的 `users/{uid}` 學習資料，但禁止前端直接寫入 `gamification`、`knowledge` 和 `answerLogs`。學習狀態由 Cloud Functions 使用 Admin SDK 寫入。

## 內容資料

公開教材資料可由前端讀取：

- `texts`
- `questions`
- `knowledgePoints`

資料匯入仍可使用 `scripts/import_to_firestore.js`，service account 憑證不得提交到 GitHub。

## Cloudflare Pages

```bash
npm install
npm run dev
npm run deploy
```

Cloudflare Pages 只負責靜態前端；Firebase Cloud Functions 及 Firestore 是獨立部署。

## v2 學習流程

```text
學生答題
  ↓
submitAnswer
  ↓
Quality
  ├── Mastery
  ├── SM-2 / nextReviewAt
  ├── XP
  └── answerLog
        ↓
  Daily Learning Plan
        ↓
  Review → Weak points → New learning → Mixed practice
```
