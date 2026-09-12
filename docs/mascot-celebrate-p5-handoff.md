# 小墨靈 `celebrate` P5 Artwork Handoff

此文件定義 Mascot System v1 最後一張 production pose：`celebrate`。它出現在全對、完成一課與重要解鎖時，核心感受是：

**「這一步值得好好慶祝！」**

它要比 `happy` 更強烈，但仍是與學生分享喜悅，不是炫耀、競爭、狂躁或要求完美。

## 1. State boundary

- `happy`：一般答對／小成功；站姿、克制抬手、較小笑容。
- `celebrate`：重要完成；全身騰空、大幅開臂、不對稱收腳、開口歡笑及上揚墨冠。
- 遮掉文案、動畫與所有裝飾後，角色本身仍須讀成 celebrate。

## 2. 角色 DNA

- 全墨炭灰至深墨藍連續漸變，不設米白／肉色面罩；
- 圓潤、略笨拙而可親的比例；
- 圓潤豆豆眼、克制腮紅、金色雲紋；
- 流動墨冠與一顆獨立墨滴，必須隨動作變形；
- 215×320 透明 artwork contract；
- 不增加毛筆、服裝、獎牌、獎盃或其他身份道具。

## 3. Production v4

`public/mascot/moling-celebrate.svg`

- 身體小幅騰空，兩手向上大幅張成 V；
- 雙腳不對稱收起，避免像站立的 happy；
- 眼睛保留圓形豆豆眼，視線共同微微向上；
- 使用橫向、嘴角上揚而比 happy 更明顯的小型開口笑容；
- 雙臂比 v1 縮短並稍微降低，讓臉部保持主要焦點；
- 每側只使用一節由身體直接伸出的圓頭墨臂，不另分手掌、手腕或關節，也不設手指、凹口、分叉或愛心形；
- 墨冠隨跳躍向上及向外伸展，獨立墨滴跟隨上升；
- 不使用星星、彩帶、煙花、勾號、獎盃或文字作主要訊號。

v1 因開口過高、手臂與手掌過大，在 34 / 42px 有驚訝／尖叫及巨手風險而被淘汰。v2 改善比例與嘴形，但分叉手掌仍像手套／愛心；v3 改用圓形墨滴手，但仍可讀成手臂加獨立手掌；v4 將每側收斂為一節連續圓頭墨臂。後續不可回退為 O 形嘴、巨手、獨立球形手掌或分叉手指。

Lifecycle：

`provisional → candidate → production`

Gate A–E 已完成，`celebrate.artStatus = production`；後續改動仍須保留本文件的身份、強度、情緒安全、尺寸及完成頁面約束。

## 4. Gate A–E

### Gate A — Same character
與 all-ink neutral 及 production P1–P4 並排，仍以全墨漸變、豆豆眼、金色雲紋、圓身與液態墨冠讀成同一小墨靈。

### Gate B — Stronger than happy
遮掉文案、裝飾與動畫後，騰空、V 形開臂、不對稱收腳、開口笑與墨冠上揚仍明顯高於 happy 的日常成功強度。

### Gate C — Joyful, not manic or pressuring
不得讀成尖叫、失控、炫耀、打敗別人或「只有滿分才值得高興」。若嘴形像驚訝／尖叫、墨臂黏成雜亂輪廓、手臂壓過臉部或動勢造成感官負荷，直接 fail。

### Gate D — Size QA
檢查 34 / 42 / 48 / 64 / 96 / 160px。34 / 42px 特別確認：圓眼及開口笑仍分開；雙臂不遮臉；騰空輪廓不退化成雜亂墨團。

### Gate E — Completion context
使用 `/mascot-celebrate-p5-qa.html` 放入 perfect-result 與 lesson-completion 的 desktop 42px、mobile 34px context。角色不可擠壓成績、學習摘要或主要 CTA。

## 5. Candidate verification

```bash
npm run mascot:celebrate:p5
npm run mascot:check
npm test
```

Tracks #14 and #3. P4 precedent: #10 / PR #11.
