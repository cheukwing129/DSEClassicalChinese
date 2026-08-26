# SM-2 Cloud Function 使用說明

## 部署步驟
1. firebase init functions (選擇 JavaScript)
2. 將本目錄 index.js 內容複製到 firebase init 產生的 functions/index.js
3. cd functions && npm install firebase-admin firebase-functions
4. firebase deploy --only functions

## 前端呼叫範例
```js
import { getFunctions, httpsCallable } from "firebase/functions";
const functions = getFunctions();
const submitAnswer = httpsCallable(functions, "submitAnswer");
const result = await submitAnswer({
  kpId: "kp_yueyang_001",
  isCorrect: true,
  usedHint: false,
  attemptCount: 1
});
console.log(result.data);
```

## quality 轉換規則
- 答對且一次過、無提示 -> quality 5
- 答對但用過提示 -> quality 3
- 答對但嘗試多次 -> quality 4
- 答錯 -> quality 0-1（依嘗試次數）
