# 小墨靈 `happy` P1 Artwork Handoff

此文件只處理 Mascot System v1 的第一張真正 production pose：`happy`。它不是重新設計角色，而是把現有 approved `neutral` 小墨靈轉成「答對／完成小步驟」時的明顯開心狀態。

## 1. 目標

在沒有星星、彩帶、文字或動畫的情況下，單看角色靜態表情與姿勢，學生仍能判斷「小墨靈剛剛因為我答對而開心」。

情緒強度必須介乎：

`neutral < happy < celebrate`

`happy` 應是輕快的成功感，不是大型勝利慶典。

## 2. 必須保留的角色 DNA

- 同一墨滴／墨靈主輪廓，上窄下寬。
- 與 `neutral` 相同的頭身比例、臉部高度與眼睛識別。
- 墨青／深墨色仍為角色本體主色。
- 暖金只能少量使用，不應變成角色主色。
- 保持親切、聰明、略有書卷氣，但不要變幼兒卡通或老師角色。
- 215 × 320 的透明畫布契約不變。

## 3. 表情方向

建議：

- 眼神比 neutral 明顯有光／微彎，視線仍朝向學生或前方。
- 面部呈自然笑意；如角色現有設計沒有明顯嘴部，也可用眼神和臉頰／頭部角度表達。
- 頭部可輕微抬高，呈現「抓到重點了」的即時反應。

避免：

- 閉眼大笑到失去眼睛辨識度。
- 張嘴過大、狂喜表情。
- 大量 blush、愛心、emoji 式符號。

## 4. 姿勢方向

優先姿勢：

- 身體有輕微向上的動勢，但重心仍接近原位置。
- 雙手微微抬高，或一手向前／向上；手勢像自然的「很好！」。
- 下身可以有非常輕的離地感，但不要做完整跳躍。

與其他 state 的邊界：

- 不像 `encouraging` 那樣向學生前傾支援。
- 不像 `thinking` 那樣托下巴／偏頭思考。
- 不像 `determined` 那樣站穩、握拳、向前準備。
- 不像 `celebrate` 那樣大幅張手或跳起。

## 5. 生成／插畫指令核心

可把以下內容直接交給插畫師或圖像生成流程：

> 以 Manjingo 已核准的「小墨靈」neutral 角色為唯一角色基準，保持相同墨滴輪廓、頭身比例、眼睛位置、墨青主色與整體筆觸。創作一個 `happy` 狀態：角色剛答對題目後自然地變得更開心，眼神明亮、頭部輕抬、身體略向上、雙手微抬或向前，帶輕快成功感。情緒強度高於 neutral、低於 celebrate。透明背景，完整角色置於 215×320 畫布內，四周保留安全透明邊界。不要文字、不要彩帶、不要大量星星、不要大跳、不要誇張卡通表情。角色在 64px 靜態顯示時也必須能看出比 neutral 更開心。

## 6. Negative constraints

不得：

- 重新設計角色輪廓或改變頭身比例。
- 改成其他動物／人物／精靈造型。
- 使用 Duolingo owl 或其他既有品牌角色的明顯特徵。
- 以 overlay 星星、彩帶、對勾作為主要 happy 訊號。
- 只改顏色而不改表情／姿勢。
- 加入文字、分數、XP、勾號。
- 做成 celebrate 的大幅跳躍。
- 在 SVG 內留下固定背景。

## 7. 檔案與 integration contract

最終只替換：

`public/mascot/moling-happy.svg`

保持：

- `viewBox="0 0 215 320"`
- state id = `happy`
- runtime asset path 不變
- feedback UI integration 不變

Artwork 初放入 branch 時，先不要把 `artStatus` 改成 `production`。

## 8. Candidate gate

候選 artwork 放入 branch 後，先執行：

```bash
npm run mascot:happy:p1
npm run mascot:check
```

`mascot:happy:p1` 會檢查 P1 專屬結構契約：固定 asset path、P1 priority、215×320 viewBox、accessibility title/desc、禁止 embedded text，以及 promotion 後不得再依賴 `mascot-moling.svg`。

在 `placeholder-treatment` 階段，validator 允許目前 baseline-derived artwork 存在；升為 `production` 後，若仍直接引用 baseline 或仍以 overlay treatment 描述自己，CI 會失敗。

## 9. Review gate

人工驗收使用 `docs/mascot-happy-p1-review.md`，核心順序為：

1. 同一角色 DNA。
2. 靜態畫面本身已是 happy。
3. 情緒強度低於 celebrate。
4. 48 / 64 / 96 / 160px 均可讀。
5. 放回答對 feedback 時自然、不遮擋學習內容。

通過人工 review 後：

1. 將 manifest/runtime 的 `happy.artStatus` 改為 `production`。
2. 執行 `npm run mascot:happy:p1`。
3. 執行 `npm run mascot:check`。
4. 執行 `npm test`。
5. 將 PR #5 由 draft 轉為 ready for review。
6. 更新 Issue #4 checklist。

如果 `artStatus=production` 後 SVG 仍直接引用 `mascot-moling.svg`，validator 會失敗，這是刻意的防線。

## 10. 完成定義

`happy` 只有在以下全部成立後才算完成：

- 靜態表情／姿勢本身已與 neutral 有清楚差異。
- 不靠 overlay、動畫、文字或顏色單獨傳達 happy。
- 與 neutral 明確屬同一角色。
- 48 / 64 / 96 / 160px visual QA 通過。
- 未越界成 celebrate。
- `happy.artStatus = production`。
- `npm run mascot:happy:p1`、`npm run mascot:check` 及 `npm test` 全綠。

Tracks #4 and #3.
