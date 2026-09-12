# Manyingo v2 部署指南

## 目前架構

Manyingo production 以 **Cloudflare Pages + Pages Functions Advanced Mode + Firebase Spark / Firestore** 為主：

```text
Browser
  ├─ static HTML/JS ───────────────→ Cloudflare Pages assets
  ├─ Firebase Auth (anonymous) ────→ Firebase Authentication
  └─ /api/* + Firebase ID token ──→ public/_worker.js
                                      ↓ verify user token
                                      ↓ service-account OAuth
                                    Firestore REST API
                                      ├─ knowledge
                                      ├─ concepts
                                      ├─ gamification
                                      └─ answerLogs
```

`public/_worker.js` 使用 Cloudflare Pages Advanced Mode。所有 `/api/*` 由 Worker 處理，其餘請求交給 `env.ASSETS.fetch()`，因此現有靜態網站路由維持不變。根目錄舊 `functions/` 會被 Advanced Mode 忽略，不會與 Firebase Cloud Functions 原始碼衝突。

## 目錄結構

```text
manyingo/
├── public/
│   ├── _worker.js                 <- Cloudflare server-side learning API
│   ├── index.html
│   └── firebase-config.js         <- Firebase Auth + read-only Firestore client
├── functions/                     <- legacy Firebase Functions implementation / parity tests
├── firebase.json                  <- Firebase deploy targets
├── firestore.rules                <- client-side Firestore security rules
├── wrangler.toml                  <- Pages config + non-secret project id
├── data/
├── scripts/
└── package.json
```

## Cloudflare learning API

目前 server-authoritative endpoints：

- `POST /api/submit-answer`
- `GET /api/daily-plan`
- `GET /api/due-knowledge-points`
- `GET /api/health`

`submit-answer` 在 Firestore transaction 內處理 answerId 去重、XP、KP Mastery、SM-2、Concept Mastery、streak 與 answer log。瀏覽器不直接寫這些 server-owned collections。

### Pages runtime secrets

`wrangler.toml` 只保存非敏感設定。Firebase project ID 是既有技術識別碼，為避免高風險後端遷移，**即使品牌已改為 Manyingo 亦繼續保留舊 project ID**：

```toml
[vars]
FIREBASE_PROJECT_ID = "manjingo-95d9a"
```

Cloudflare Pages production / preview environment 需要兩個 **encrypted secrets**：

- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

請在 Cloudflare Pages 專案的 **Settings → Variables and Secrets** 建立；或以 Wrangler 的 `pages secret put` / `pages secret bulk` 設定。不要把 service-account private key 放進 Git、`wrangler.toml` 或任何公開前端檔案。

本機開發可建立未提交的 `.dev.vars`：

```dotenv
FIREBASE_CLIENT_EMAIL="...@...iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

`.dev.vars*` 與 `.env*` 已加入 `.gitignore`。

### Google Cloud IAM

Pages Worker 使用 service account OAuth 2.0 存取 Cloud Firestore REST API。該 service account 應只取得 Firestore 所需最小 IAM 權限，不應給 Owner / Editor。Worker 會先驗證 Firebase ID token 的 RS256 signature、audience、issuer、expiry 與 uid，再用 server credential 存取 Firestore。

這一點很重要：service-account OAuth 對 Firestore 是 IAM server access，**不依賴 Firestore Security Rules**；因此 `/api/*` 的 Firebase ID token 驗證是授權邊界。

## Cloudflare Pages 部署

目前正式 Pages project 名稱為 `manyingo`，production URL 為：

```text
https://manyingo.pages.dev
```

部署：

```bash
npm install
npm test
npm run deploy
```

`public/_worker.js` 位於 Pages output directory，因此部署 `public/` 時會啟用 Advanced Mode。未配置兩個 server secrets 時，`/api/health` 會回報 `configured:false`，受保護 learning API 會失敗；現有前端會 fallback 到 local learning engine，不會停止學生本機學習。

## Production smoke test

repo 內建 production smoke test：

```bash
MANJINGO_BASE_URL=https://manyingo.pages.dev npm run smoke:pages
```

> `MANJINGO_BASE_URL` 是沿用中的 legacy internal variable name。它不是公開品牌名稱，目前刻意保留以避免不必要的 CI／script rename 風險；其值應指向新的 Manyingo production URL。

測試會驗證：

1. `/api/health` 回報 `configured:true`。
2. 透過 Firebase Identity Toolkit 建立臨時匿名 Auth user，取得真實 Firebase ID token。
3. 以該 token 呼叫 production learning API，驗證 Worker token 驗證、service-account OAuth、Firestore IAM 與 Firestore reads。
4. 執行真實但可清理的測試寫入，驗證 production write path。
5. 最後清理臨時 Auth user 與測試學習資料。

`.github/workflows/pages-production-smoke.yml` 可手動觸發，也會每日排程；正式環境在 GitHub repository variables 設定：

- `ENABLE_PAGES_SMOKE=true`
- `MANJINGO_BASE_URL=https://manyingo.pages.dev`

清理 smoke test 臨時資料所需的 service-account credential 由 GitHub Actions secret `FIREBASE_SERVICE_ACCOUNT_MANJINGO` 提供。這個 secret 名稱同樣屬於 legacy internal identifier，暫時保留；不要把其內容提交到 Git。

Cloudflare runtime 本身所需的 `FIREBASE_PRIVATE_KEY` 與 `FIREBASE_CLIENT_EMAIL` 則只存在 Cloudflare Pages 的 encrypted secrets。

## Firebase Spark

Firestore、Firebase Authentication 與 client read rules 可維持 Spark/free 使用。新的 production learning write path 不再依賴 Firebase Cloud Functions，因此不需要為了更新 `submitAnswer` 升級到 Blaze。

Firestore Rules 仍允許登入者讀自己的 `gamification`、`knowledge`、`answerLogs`、`concepts`，但 client write 保持禁止。server write 改由 Cloudflare Worker 經 IAM 執行。

## GitHub Actions：Firebase backend（legacy / rules）

`.github/workflows/firebase-backend-deploy.yml` 仍保留作為 Firestore Rules deploy 與 legacy Firebase Functions 驗證流程，預設關閉：

- `ENABLE_FIREBASE_DEPLOY=true`：才允許 Firebase deploy job。
- Spark 專案保持 `ENABLE_FIREBASE_FUNCTIONS_DEPLOY=false`；只需部署 rules。
- 若未來刻意升級 Blaze 才考慮重新啟用 Firebase Functions deploy。

目前正式學習 API 以 `public/_worker.js` 為準，`functions/` 主要保留演算法 parity、migration 與 rollback 參考。

## 品牌與 legacy technical IDs

公開品牌一律使用 **Manyingo 文言年糕**；GitHub repository、Cloudflare Pages project 與公開網址亦使用 `manyingo`。

以下既有名稱屬內部 technical IDs，為保持資料、登入、同步及部署相容性，目前刻意保留，不應只為品牌一致性而改名：

- Firebase project ID：`manjingo-95d9a`
- GitHub variable：`MANJINGO_BASE_URL`
- GitHub secret：`FIREBASE_SERVICE_ACCOUNT_MANJINGO`
- JavaScript `Manjingo*` namespaces
- `manjingo_*` localStorage / outbox keys
- internal service identifiers

## 學習流程

```text
學生答題
  ↓ Firebase ID token
Cloudflare /api/submit-answer
  ↓ Firestore transaction
  ├── answerId dedupe
  ├── KP Mastery
  ├── Concept Mastery
  ├── SM-2 / nextReviewAt
  ├── XP / streak
  └── answerLog
        ↓
/api/daily-plan
        ↓
Review → Concept weakness → Weak points → New learning
```
