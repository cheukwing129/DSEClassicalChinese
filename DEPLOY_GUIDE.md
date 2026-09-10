# Manjingo v2 部署指南

## 目錄結構
```text
manjingo/
├── public/                      <- Cloudflare Pages 靜態前端
│   ├── index.html
│   └── firebase-config.js
├── functions/                   <- Firebase Cloud Functions
│   ├── index.js
│   ├── learningEngine.js
│   └── package.json
├── firebase.json                <- Firebase deploy targets
├── firestore.rules              <- Firestore v2 安全規則
├── data/                         <- CSV 內容範本
├── scripts/                      <- 資料匯入腳本
├── wrangler.toml
└── package.json
```

## GitHub Actions：Firebase backend

`.github/workflows/firebase-backend-deploy.yml` 會在 `Tests` workflow 對 `main` 成功後觸發，也可由 `workflow_dispatch` 手動觸發。部署預設關閉，避免尚未設定憑證或仍使用 Spark 時意外部署。

啟用前需要在 GitHub repository 的 **Settings → Secrets and variables → Actions** 設定：

- Secret `FIREBASE_SERVICE_ACCOUNT_MANJINGO`：Firebase / Google Cloud service account JSON。workflow 透過 Application Default Credentials 使用它；不要把 JSON key 提交到 repository。
- Variable `ENABLE_FIREBASE_DEPLOY=true`：開啟 Firebase backend deployment。未設定或不是 `true` 時，deploy job 會跳過。
- Variable `ENABLE_FIREBASE_FUNCTIONS_DEPLOY=true`：只有在專案已使用 Blaze 且確定要部署 Cloud Functions 時才設定。Spark 專案請保持未設定或 `false`。

安全流程：

```text
push main
  ↓
Tests
  ↓ success only
Firebase Backend Deploy
  ↓
checkout exactly tested commit
  ↓
Functions lint + full npm test
  ↓
ADC authentication
  ↓
Spark-safe: Firestore Rules only
  OR
Blaze-enabled: Firestore Rules + Functions
```

workflow 使用固定 Firebase CLI 版本，並加上 deployment concurrency；不會取消正在進行的 production deployment。

## Firebase pricing constraint

Cloud Functions for Firebase 的 production deployment 需要 Blaze pricing plan。若 Manjingo 要維持 Spark/free，`ENABLE_FIREBASE_FUNCTIONS_DEPLOY` 必須保持關閉；這時 workflow 只部署 Firestore Rules，而 Functions 程式碼仍會被 lint / tests 保護。

因此，目前 Cloud / Local concept mastery 的 Cloud Functions 版本只有在 Firebase project 已是 Blaze 時才能正式部署。不要為了 CI 自動把 project 升級到 Blaze。

## Firebase Functions

本機或 Blaze 環境可執行：

```bash
cd functions
npm install
npm run lint
cd ..
firebase deploy --only functions --project manjingo-95d9a
```

`submitAnswer` 由 server-side function 決定 XP、KP Mastery、Concept Mastery、SM-2 及答題紀錄；前端不應直接寫入學生的學習狀態。

## Firestore Rules

```bash
firebase deploy --only firestore:rules --project manjingo-95d9a
```

v2 規則允許學生讀取自己的 `users/{uid}` 學習資料，包括 `gamification`、`knowledge`、`answerLogs` 與 `concepts`，但禁止前端直接寫入這些 server-owned 學習狀態。

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
  ├── KP Mastery
  ├── Concept Mastery
  ├── SM-2 / nextReviewAt
  ├── XP
  └── answerLog
        ↓
  Daily Learning Plan
        ↓
  Review → Concept weakness → Weak points → New learning
```
