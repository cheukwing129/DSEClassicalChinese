# Cloudflare Pages 部署指南

## 目錄結構
```
DSEClassicalChinese/
├── public/                      <- Cloudflare Pages 讀取此資料夾
│   ├── index.html
│   ├── firebase-config.js
│   ├── practice_page_prototype.html
│   └── exercise_types_prototype.html
├── functions/                    <- Firebase Cloud Functions（獨立部署，非Cloudflare）
│   └── index.js
├── scripts/                      <- 資料匯入腳本
│   └── import_to_firestore.js
├── data/                         <- CSV 內容範本
├── wrangler.toml
├── package.json
└── DEPLOY_GUIDE.md
```

## 步驟

1. git clone 這個 repository 到本機
2. 到 Firebase Console 建立專案，啟用 Firestore Database
3. 下載 serviceAccountKey.json，放到 scripts/ 目錄（此檔案已加入 .gitignore，切勿上傳）
4. cd scripts && npm install firebase-admin csv-parser && node import_to_firestore.js
5. firebase init functions，把 functions/index.js 內容複製過去，npm install，firebase deploy --only functions
6. 將 practice_page_prototype.html / exercise_types_prototype.html 的邏輯合併成 public/index.html
7. 編輯 public/firebase-config.js，填入 Firebase Console 取得的真實設定值
8. 本機測試：npm install -g wrangler && wrangler pages dev public
9. 正式部署：wrangler pages deploy public --project-name=dse-wenyan-app

## Firestore 安全規則範例
```
match /userProgress/{userId}/{document=**} {
  allow read, write: if request.auth.uid == userId;
}
match /texts/{doc=**} { allow read: if true; }
match /questions/{doc=**} { allow read: if true; }
match /knowledgePoints/{doc=**} { allow read: if true; }
match /crossTextVocab/{doc=**} { allow read: if true; }
```

## 注意事項
- Cloud Functions 需另外用 firebase deploy 部署到 Firebase，Cloudflare Pages 只負責靜態前端
- serviceAccountKey.json 絕不可提交到 GitHub，已在 .gitignore 中排除
