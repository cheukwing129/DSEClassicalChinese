# 小墨靈 `happy` P1 Review Rubric

本文件把 `happy` artwork 的人工驗收拆成可重複、可記錄的 review gate。目的不是用分數取代設計判斷，而是避免「看起來差不多」就把 candidate 誤升為 production。

## Current candidate

P1 已有獨立 vector candidate，`happy.artStatus = candidate`。這表示：

- artwork 已不再引用 `mascot-moling.svg` baseline；
- 215×320 viewBox、accessible title/desc、無 embedded text 等結構契約已可自動驗證；
- 本地已成功 rasterize 34 / 42 / 48 / 64 / 96 / 160px 作尺寸檢查；
- **尚未**因為工程檢查通過而視為 production；仍需 A–E 人工 Visual QA。

`candidate` 是刻意加入的中間狀態：比 `placeholder-treatment` 更進一步，但不等於已核准。

## Candidate v2 review record

第一版 candidate 在小尺寸 review 找到兩個問題：

- 角色腹部的暖金弧線在 48–64px 比真正笑容更搶眼，容易被讀成第二張嘴；
- 抬手訊號偏弱，縮小後幾乎只剩側邊小突起。

v2 已作以下修正：

- 移除腹部暖金裝飾弧線，讓面部笑容成為唯一主要嘴形；
- 將主笑容加粗，提升 34–48px 的靜態辨識；
- 抬手改為在主身體之上繪製，讓手勢在 42–64px 更可見；
- 保留低透明度暖金臉頰作次要細節，不靠它傳達 happy。

本地 raster review 暫時判斷：

- **Gate B：pass（candidate-level）** — 不靠星點或動畫，笑容與眼神已能讀出 happy。
- **Gate C：pass（candidate-level）** — 動勢克制，沒有大跳、彩帶或 celebrate 級張手。
- **Gate D：pass（candidate-level）** — 48 / 64 / 96 / 160px 清楚；實際 feedback 的 34 / 42px 仍可辨識表情，但手勢是次要訊號。
- **Gate A：仍需 neutral A/B 最終確認** — `/mascot-sheet.html` 已新增同尺寸 neutral / happy A/B 區，避免只看 candidate 自己。
- **Gate E：provisional pass** — `feedback-ui.js` 實際使用 42×62px（desktop）與 34×50px（mobile）；v2 已針對這兩個尺寸 raster 檢查，但仍需在完整 feedback 版面做最終 live visual check。

目前決定：**保留 candidate，不升 production。**

## Gate A — 同一角色

必須全部成立：

- 與 `neutral` 並排時，一眼看出是同一個小墨靈。
- 頭身比例、眼睛位置、墨滴主輪廓沒有漂移。
- 墨青／深墨色仍是主要角色識別。
- 沒有新增會改變角色身份的大型配件。

任何一項失敗：直接退回，不進下一 gate。

## Gate B — 靜態就是 happy

遮掉文字標籤、星點、動畫後檢查：

- 眼神比 `neutral` 更明亮／更有笑意。
- 頭部與身體有輕微向上動勢。
- 手勢能讀成「很好／抓到重點」，而不是 neutral 站姿。
- 不依賴顏色改變才看得出開心。

如果只靠外加星星、光點或位移 transform 才成立：不通過。

## Gate C — 情緒邊界

`happy` 必須落在：

`neutral < happy < celebrate`

不應出現：

- 大幅跳躍
- 雙手完全張開的大型勝利姿勢
- 大量彩帶／星星／煙花
- 過度張嘴或閉眼狂喜

如果與 `celebrate` 難以區分：不通過。

## Gate D — 小尺寸可讀性

在 `/mascot-sheet.html` 逐尺寸檢查：

| 尺寸 | 必須看得見的訊號 |
|---|---|
| 34px | mobile feedback 實際寬度；至少眼神／笑容仍讀得到 |
| 42px | desktop feedback 實際寬度；表情要明確，手勢可作次要訊號 |
| 48px | 不應退化成 neutral；至少眼神或手勢仍可讀 |
| 64px | happy 狀態應明顯，不看標籤也能大致猜出 |
| 96px | 角色比例自然，不搶答題內容 |
| 160px | 邊緣、手勢、眼神與透明區域乾淨 |

32px 不作 P1 pose 驗收，沿用共用 `moling-head.svg`。

## Gate E — 產品語境

把角色放回答對 feedback 情境判斷：

- 反應像「你抓到重點了」，不是慶功動畫。
- 不遮擋答案解釋或下一步 CTA。
- reduced-motion 下仍能靠靜態圖成立。
- 不顯得過幼兒化、過度遊戲化或像其他品牌角色。
- 特別檢查 `feedback-ui.js` 的 42×62px desktop 與 34×50px mobile 呈現。

## Promotion checklist

只有 A–E 全部通過後才可：

1. 將 `happy.artStatus` 由 `candidate` 改為 `production`。
2. 同步更新 `public/mascot-runtime.js` 的 `happy.artStatus`。
3. 執行 `npm run mascot:happy:p1`。
4. 執行 `npm run mascot:check`。
5. 執行 `npm test`。
6. 將 PR #5 由 draft 轉為 ready for review。
7. 更新 Issue #4 checklist。

## Review note template

```text
Happy P1 review
A same character: pass / fail
B static happy: pass / fail
C below celebrate: pass / fail
D 34/42 product + 48/64/96/160px: pass / fail
E product context: pass / fail
Decision: keep candidate / revise / promote to production
Notes:
```

Tracks #4, #3 and PR #5.
