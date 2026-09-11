# 小墨靈 `happy` P1 Review Rubric

本文件記錄 `happy` artwork 的 A–E Visual QA 與最後 production 決策。目的不是用分數取代設計判斷，而是讓角色一致性、情緒邊界、小尺寸可讀性與產品語境都有可追蹤的驗收依據。

## Final production decision

P1 v2 已完成 A–E review，`happy.artStatus = production`。

Production artwork 的固定特徵：

- 獨立 215×320 SVG，不再引用 `mascot-moling.svg` baseline；
- 保留墨滴上窄下寬輪廓、大眼睛、墨青／深墨主色與暖金次要點綴；
- 以清楚笑意、明亮眼神及克制抬手傳達答對後的自然喜悅；
- 不使用星星、彩帶、勾號或動畫作主要 happy 訊號；
- 情緒強度維持 `neutral < happy < celebrate`。

## v1 → v2 refinement

第一版 candidate 在小尺寸 review 找到兩個問題：

- 腹部暖金弧線在 48–64px 比真正笑容更搶眼，容易被讀成第二張嘴；
- 抬手訊號偏弱，縮小後幾乎只剩側邊小突起。

v2 已作以下修正：

- 移除腹部暖金裝飾弧線，讓面部笑容成為唯一主要嘴形；
- 將主笑容加粗，提升 34–48px 的靜態辨識；
- 抬手改為在主身體之上繪製，讓手勢在 42–64px 更可見；
- 保留低透明度暖金臉頰作次要細節，不靠它傳達 happy。

## Gate A — 同一角色：PASS

與 approved `neutral` 的 identity contract 對照：

- 維持相同墨滴／墨靈基本輪廓與上窄下寬比例；
- 臉部仍集中在上半部，大眼睛仍是第一識別特徵；
- 主體仍以 Ink Teal / deep ink palette 為主；
- 沒有新增帽子、道具、動物特徵或其他會改變角色身份的大型配件；
- happy 的差異來自表情與姿勢，而不是重新設計角色。

`/mascot-sheet.html` 保留 neutral / production happy 同尺寸 A/B panel，方便日後持續回歸檢查。

## Gate B — 靜態就是 happy：PASS

遮掉文字標籤與動畫後：

- 笑容本身已明顯高於 neutral；
- 眼睛維持朝前而有精神；
- 雙手抬起提供次要的正向動勢；
- 沒有依靠暖金顏色或外掛符號才能看懂狀態。

## Gate C — 情緒邊界：PASS

`happy` 維持：

`neutral < happy < celebrate`

沒有大跳、彩帶、煙花、完全張臂勝利姿勢或閉眼狂喜，因此不會搶走 `celebrate` 的角色。

## Gate D — 小尺寸可讀性：PASS

已按 artwork 與實際產品尺寸檢查：

| 尺寸 | 結果 |
|---|---|
| 34px | mobile feedback 實際寬度；大眼睛與笑容仍可讀 |
| 42px | desktop feedback 實際寬度；笑意清楚，手勢作次要訊號 |
| 48px | 不會退化成 neutral |
| 64px | 不看標籤亦能讀出正向 happy 狀態 |
| 96px | 比例自然，不搶學習內容 |
| 160px | 輪廓、眼睛、手勢與透明邊界完整 |

32px 不作 pose 驗收，沿用共用 `moling-head.svg` compact crop。

## Gate E — 產品語境：PASS

`feedback-ui.js` 的真實 mascot 尺寸為 42×62px desktop 與 34×50px mobile。`/mascot-sheet.html` 已加入 feedback context preview，重現：

- 答對 icon；
- 「答對了」結果 copy；
- 小墨靈與「抓到重點了！」；
- 答案解釋；
- 下一步 CTA；
- narrow mobile 時 mascot 移到主要 copy 下方的布局。

驗收結果：角色提供清楚正向回應，但沒有遮擋答案解釋、CTA 或主結果；reduced-motion 下只看靜態 artwork 仍成立。

## Promotion record

A–E 全部通過後已執行：

1. `happy.artStatus`: `candidate → production`。
2. 同步更新 `public/mascot-runtime.js`。
3. 將 SVG accessibility description 改為 production artwork。
4. `/mascot-sheet.html` 增加 neutral / production A/B 與 feedback context preview。
5. regression tests 改為保護 production 狀態及 pending queue 從 P2 `encouraging` 開始。
6. `npm run mascot:happy:p1`、`npm run mascot:check` 及完整 `npm test` 作最後 CI gate。

## Review note

```text
Happy P1 review
A same character: pass
B static happy: pass
C below celebrate: pass
D 34/42 product + 48/64/96/160px: pass
E product context: pass
Decision: promote to production
Notes: v2 removed the misleading gold torso arc, strengthened the actual smile, and improved raised-hand readability without crossing into celebrate.
```

Tracks #4, #3 and PR #5.
