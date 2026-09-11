# 小墨靈 `thinking` P3 Artwork Handoff

此文件定義 Mascot System v1 第三張 production pose：`thinking`。角色出現在提示、概念理解與重新教學時，核心感受是：

**「讓我陪你想一想。」**

它要表達平靜、好奇與專注，不是困惑、焦慮、沉悶或老師式審視。

## 1. 角色 DNA

沿用 P2 已確認的全墨方向：

- 炭灰至深墨藍的連續立體漸變，不設米白／肉色面罩；
- 清楚豆豆眼、克制腮紅、金色雲紋；
- 圓潤、略帶笨拙而可親的身體；
- 流動墨冠與獨立墨滴；
- 墨冠必須隨視線與姿勢彎曲、轉動、拉伸、壓縮或偏移，不可像固定帽子；
- 215×320 透明 artwork contract；
- 不增加毛筆、眼鏡、服裝、大書本或其他身份道具。

## 2. 姿勢與表情

優先方向：

- 穩定站姿或坐姿，能量低於 `encouraging`；
- 眼神稍向上／側方思考，但仍清醒、有注意力；
- 小手可接近下臉頰或胸口，但須保留清楚空隙；
- 墨冠可順着視線方向彎曲，成為主要 thinking silhouette；
- 嘴形平靜、略帶好奇，不皺眉、不苦笑；
- 不靠問號、動畫或顏色才讀得出 thinking。

## 3. 禁止訊號

- 螺旋眼、空洞眼神、閉眼打瞌睡；
- 皺眉、低頭、汗滴、焦慮、挫敗或不耐煩；
- 抓頭、聳肩或「我不知道」式無助；
- 老師／考官式嚴肅表情；
- 手遮住眼睛，或在 34–42px 變成鬍鬚／橫線；
- 把另一姿勢的墨冠原樣複製。

## 4. A–E Gate

### Gate A — Same character

與全墨 neutral QA anchor、production happy、production encouraging 並排仍是一眼可認的小墨靈。

### Gate B — Static thinking

遮掉文案與動畫後，姿勢、視線及墨冠輪廓仍讀成專注思考。

### Gate C — Curious, not confused

不可合理解讀為困惑、焦慮、沉悶、羞恥、無助或老師式審視。

### Gate D — Size QA

逐一檢查 34 / 42 / 48 / 64 / 96 / 160px。34 / 42px 特別檢查手與臉部的分離。

### Gate E — Hint context

放入提示、概念解釋及「再想一想」流程；角色不可遮擋內容，也不可像在直接揭示答案。

## 5. Lifecycle

`placeholder-treatment → candidate → production`

Independent v2 已通過 A–E，`thinking.artStatus` 已升為 `production`。Production verification 執行：

```bash
npm run mascot:thinking:p3
npm run mascot:check
npm test
```

Tracks #8 and #3. P2 precedent: #6 / PR #7.
