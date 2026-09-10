# Manjingo v2 Firebase 資料結構

## 1. 設計目標

Manjingo 的核心不是單純儲存答題紀錄，而是建立「題目 → 知識點 → 掌握度 → 複習 → 下一步學習」的閉環。

資料結構分成四層：Content、Learning state、Answer events、Gamification。

---

## 2. Content collections

### `texts/{textId}`

儲存課文層級資料，例如 title、author、dynasty、category、difficulty、isActive、version。

### `texts/{textId}/sections/{sectionId}`

儲存課文段落／學習單元，例如 order、title、content、isActive。

### `knowledgePoints/{kpId}`

知識點是 Manjingo 最重要的內容單位。題目透過 `kpId` 指向學生真正需要掌握的能力。

建議 `type` 初步統一為：實詞、虛詞、句式、修辭／手法、主旨／內容、名句默寫、篇章理解。

### `questions/{questionId}`

題目應包含 `kpIds`、`textId`、`sectionId`、`type`、`question`、`options`、`answer`、`explanation`、`baseXp`、`difficulty`、`isActive`、`version`。

使用 `kpIds` 陣列，是因為未來一題可能同時考查多個知識點。

---

## 3. User collections

目前 v2 實際採用：

```text
users/{uid}
├── gamification/state
├── knowledge/{kpId}
└── answerLogs/{answerId}
```

### `users/{uid}`

只放身份／帳戶層級資料，不放大量學習狀態。

### `users/{uid}/gamification/state`

```json
{
  "totalXp": 1250,
  "level": 8,
  "streak": 12,
  "streakFreezes": 1,
  "lastActiveDate": "2026-09-10",
  "todayXp": 35,
  "todayXpDate": "2026-09-10",
  "dailyGoalXp": 20,
  "badges": [],
  "updatedAt": "serverTimestamp"
}
```

### `users/{uid}/knowledge/{kpId}`

這是個人化學習引擎的核心，包含 `mastery`、`status`、`repetition`、`easeFactor`、`interval`、`nextReviewAt`、`correctCount`、`wrongCount`、`hintCount`、`lastQuality`、`lastAnsweredAt` 等欄位。

`mastery` 建議標準：

| mastery | status |
|---:|---|
| 0–20 | unlearned |
| 21–40 | learning |
| 41–60 | unstable |
| 61–80 | familiar |
| 81–95 | stable |
| 96–100 | mastered |

### `users/{uid}/answerLogs/{answerId}`

答題紀錄視為 event，原則上只新增、不修改。保留 questionId、kpIds、isCorrect、usedHint、attemptCount、responseTimeMs、quality、xpEarned、localDate、answeredAt 等資料，方便日後分析錯誤模式、每日學習量及重新計算學習狀態。

---

## 4. Learning engine

學生完成一題後，固定流程：

```text
Answer
  ↓
correctness / hint / attempts / response time
  ↓
quality
  ↓
knowledge/{kpId}
  ↓
mastery + SM-2
  ↓
XP
  ↓
gamification/state
  ↓
answerLogs
```

**最終 XP、mastery、SM-2 結果由 server-side Functions 決定。** 前端只提交答題事件及顯示 server 回傳結果。

目前 `submitAnswer` 已經使用 transaction 同時更新 `knowledge`、`gamification/state`、`answerLogs`。

---

## 5. 今日學習任務

第一版由 server-side learning engine 動態產生：

```text
1. Due reviews
2. Weak knowledge points
3. New knowledge points
4. Mixed practice
```

目前 `getDailyLearningPlan` 已能產生 `review` 及 `weak`，`newKnowledgePoints` 暫為空陣列；下一步會加入真正的新知識點選擇邏輯。

---

## 6. 索引建議

`users/{uid}/knowledge` 的主要查詢包括 `nextReviewAt <= now` 及 `mastery` ascending；`answerLogs` 日後主要按 `answeredAt` 查詢。

當教師 dashboard 需要跨學生統計時，應使用聚合資料，而不是每次掃描所有 answerLogs。

---

## 7. 遷移狀態

v2 已完成核心切換：

1. 建立 server-side learning engine。
2. `submitAnswer` 由 server 決定 XP、mastery、SM-2、streak。
3. 前端 quiz flow 改用 `submitAnswer`，不再直接計算 XP。
4. `levelSystem.js` 現在只負責顯示及快取 server state。
5. Firestore rules 禁止前端直接寫入 v2 個人學習狀態。

下一階段：加入答題 idempotency、完整 Daily Learning Plan、新知識點選擇、技能樹及自動化測試。
