# Manjingo v2 Firebase 資料結構

## 1. 設計目標

Manjingo 的核心不是單純儲存答題紀錄，而是建立「題目 → 知識點 → 掌握度 → 複習 → 下一步學習」的閉環。

資料結構因此分成四層：

1. **Content**：教材、段落、知識點、題目
2. **Learning state**：每名學生對每個知識點的掌握狀態
3. **Answer events**：不可變的答題事件，供分析及重新計算
4. **Gamification**：XP、等級、連續學習、徽章

---

## 2. Content collections

### `texts/{textId}`

儲存課文層級資料。

```json
{
  "title": "岳陽樓記",
  "author": "范仲淹",
  "dynasty": "宋",
  "category": "DSE文言",
  "difficulty": 3,
  "isActive": true,
  "version": 1
}
```

### `texts/{textId}/sections/{sectionId}`

儲存課文段落／學習單元。

```json
{
  "order": 1,
  "title": "第一段",
  "content": "慶曆四年春……",
  "isActive": true
}
```

### `knowledgePoints/{kpId}`

知識點是 Manjingo 最重要的內容單位。題目不應只存在於題庫，而要透過 `kpId` 指向學生真正需要掌握的能力。

```json
{
  "textId": "yueyanglou",
  "sectionId": "s1",
  "type": "實詞",
  "subtype": "古今異義",
  "content": "謫",
  "explanation": "貶官，降職至偏遠地方任職",
  "difficulty": 1,
  "tags": ["詞義", "DSE"],
  "isActive": true,
  "version": 1
}
```

建議 `type` 初步統一為：

- 實詞
- 虛詞
- 句式
- 修辭／手法
- 主旨／內容
- 名句默寫
- 篇章理解

### `questions/{questionId}`

```json
{
  "type": "choice",
  "kpIds": ["kp_yueyang_001"],
  "textId": "yueyanglou",
  "sectionId": "s1",
  "question": "「謫」的意思是？",
  "options": ["貶官", "升官", "旅行", "退休"],
  "answer": "貶官",
  "explanation": "謫：貶官，降職至偏遠地方任職。",
  "baseXp": 8,
  "difficulty": 1,
  "isActive": true,
  "version": 1
}
```

### 為何 `kpIds` 使用陣列？

目前一題通常對應一個知識點，但未來可能出現一題同時考查「之」的用法及倒裝句。使用陣列可以避免日後重新設計資料模型。

---

## 3. User collections

推薦把目前的 `userProgress/{uid}` 漸進式重構為以下結構：

```text
users/{uid}
├── profile
├── gamification
├── knowledge/{kpId}
└── answerLogs/{answerId}
```

### `users/{uid}`

只放身份／帳戶層級資料，不放大量學習狀態。

```json
{
  "createdAt": "serverTimestamp",
  "lastActiveAt": "serverTimestamp",
  "role": "student"
}
```

匿名帳戶也可以使用這個結構；日後由匿名帳戶升級至正式帳戶時，不需要改變資料模型。

### `users/{uid}/gamification`

```json
{
  "totalXp": 1250,
  "level": 8,
  "streak": 12,
  "streakFreezes": 1,
  "lastActiveDate": "2026-09-10",
  "todayXp": 35,
  "dailyGoalXp": 20,
  "badges": ["first_lesson", "seven_day_streak"],
  "updatedAt": "serverTimestamp"
}
```

### `users/{uid}/knowledge/{kpId}`

這是個人化學習引擎的核心。

```json
{
  "mastery": 72,
  "status": "familiar",
  "repetition": 4,
  "easeFactor": 2.3,
  "interval": 12,
  "nextReviewAt": "serverTimestamp",
  "correctCount": 7,
  "wrongCount": 2,
  "hintCount": 1,
  "lastQuality": 4,
  "lastAnsweredAt": "serverTimestamp",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `mastery` 建議標準

| mastery | status |
|---:|---|
| 0–20 | unlearned |
| 21–40 | learning |
| 41–60 | unstable |
| 61–80 | familiar |
| 81–95 | stable |
| 96–100 | mastered |

`status` 是方便前端顯示及查詢的衍生值，真正的數值以 `mastery` 為準。

---

## 4. Answer logs

### `users/{uid}/answerLogs/{answerId}`

答題紀錄應視為事件（event），原則上只新增、不修改。

```json
{
  "questionId": "q101",
  "kpIds": ["kp_v_zhi_1"],
  "isCorrect": true,
  "usedHint": false,
  "attemptCount": 1,
  "responseTimeMs": 4200,
  "quality": 5,
  "xpEarned": 8,
  "answeredAt": "serverTimestamp"
}
```

保留 event 的好處：

- 可以分析學生錯誤模式
- 可以計算每日學習量
- 可以重新調整 mastery 演算法
- 日後可以建立教師 dashboard
- 如果演算法升級，可以重新計算學習狀態

因此不要只保存「目前分數」，否則日後會失去歷史資料。

---

## 5. Learning engine

學生完成一題後，建議流程固定為：

```text
Answer
  ↓
判斷 correctness / hint / attempts / response time
  ↓
計算 quality
  ↓
更新 users/{uid}/knowledge/{kpId}
  ↓
計算 mastery
  ↓
計算 SM-2 interval / nextReviewAt
  ↓
計算 XP
  ↓
更新 gamification
  ↓
寫入 answerLogs
```

**重要：最終的 XP、mastery、SM-2 結果應由 server-side Functions 決定。**

前端可以即時顯示預覽，但不可由前端直接決定最終 XP 或 mastery。

---

## 6. 今日學習任務

第一版不需要額外建立 `dailyTasks` collection，可以由 server-side learning engine 動態產生：

```text
1. Due reviews
2. Weak knowledge points
3. New knowledge points
4. Mixed practice
```

例如：

```json
{
  "review": ["kp_v_zhi_1", "kp_v_hu_2"],
  "weak": ["kp_v_qi_1"],
  "new": ["kp_yueyang_001", "kp_yueyang_002"],
  "targetCount": 10
}
```

這樣首頁真正回答的是：

> **「今天我應該學什麼？」**

而不是單純顯示「題庫有多少題」。

---

## 7. 索引建議

當資料量增加後，Firestore 至少需要考慮：

### `users/{uid}/knowledge`

常用查詢：

```text
nextReviewAt <= now
```

以及：

```text
mastery ascending
```

### `users/{uid}/answerLogs`

常用查詢：

```text
answeredAt descending
```

日後教師 dashboard 若需要跨學生查詢，應另外設計聚合資料，不要每次掃描所有 answerLogs。

---

## 8. 遷移原則

**不要一次性重寫整個 Manjingo。**

建議分三步：

### Phase A — 建立新結構

新增 `users/{uid}/gamification`、`knowledge`、`answerLogs` 的 server-side functions。

### Phase B — 雙寫

短期內舊結構與新結構同時寫入，確認新資料正確。

### Phase C — 切換讀取

前端改為只讀新結構；確認穩定後，再停止舊結構寫入。

這樣可以降低一次改動造成整個平台不能使用的風險。

---

## 9. 下一個實作任務

依優先次序：

1. 修正 `levelSystem.js` 使用 UTC 日期造成的 streak 邏輯問題。
2. 在 `functions/index.js` 建立統一的 `calculateLearningUpdate()`。
3. 將 `submitAnswer` 改為 server-side 更新 `knowledge` + `gamification` + `answerLogs`。
4. 前端停止直接決定 XP／mastery。
5. 加入 `getDailyLearningPlan`，產生「今日應學什麼」。
6. 再建立 Duolingo 式技能樹 UI。

這個文件是 v2 的資料模型基準；之後新增功能應優先遵守這套結構，而不是再把狀態加入單一的 `userProgress` 文件。
