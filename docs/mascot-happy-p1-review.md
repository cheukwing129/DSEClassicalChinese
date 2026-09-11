# 小墨靈 `happy` P1 Review Rubric

本文件把 `happy` artwork 的人工驗收拆成可重複、可記錄的 review gate。目的不是用分數取代設計判斷，而是避免「看起來差不多」就把 placeholder 誤升為 production。

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

## Promotion checklist

只有 A–E 全部通過後才可：

1. 將 `happy.artStatus` 由 `placeholder-treatment` 改為 `production`。
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
D 48/64/96/160px: pass / fail
E product context: pass / fail
Decision: keep candidate / revise / promote to production
Notes:
```

Tracks #4, #3 and PR #5.
