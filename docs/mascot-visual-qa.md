# 小墨靈 Visual QA Checklist

本文件配合 `public/mascot-sheet.html` 使用，用來檢查 Mascot System v1 在實際 UI 尺寸下是否可用。

## 目前資產策略

六個核心狀態已建立固定檔名與用途契約：

- `neutral`：首頁／一般品牌存在
- `happy`：答對／小步完成
- `celebrate`：全對／解鎖／重大完成
- `encouraging`：答錯後支持／補救
- `thinking`：提示／概念理解／重教
- `determined`：streak／daily goal

目前六個狀態仍共用 `public/mascot-moling.svg` 作正式 baseline artwork，再以克制的 SVG 點綴區分狀態。這個做法適合先穩定 UI contract，但不應被視為最終 production pose set。

## 尺寸驗收

### 32px

- 使用 `public/mascot/moling-head.svg`，而不是把完整身體縮到 32px。
- 頭部輪廓和眼神必須清楚。
- 不要求六個情緒在 32px 單靠圖像完全可分；此尺寸主要服務品牌辨識。

### 48px

- 完整角色仍可辨認。
- 不依賴細小星點、泡泡或裝飾才能理解狀態。
- feedback row 不因 mascot 擠壓答案文字。

### 64px

- happy / encouraging / thinking / determined 應開始有明顯靜態差異。
- 手機寬度 360–430px 下不能壓縮主要 CTA。

### 96px

- 作為標準 UI 吉祥物尺寸，輪廓、表情、姿勢都應清楚。
- 適合完成卡、弱點頁與較大的學習提示。

### 160px

- 可檢查透明邊緣、裝飾比例與角色一致性。
- celebrate 可最有動勢，但裝飾不能蓋過角色主輪廓。

## UI 語意檢查

每次新增 mascot 出現位置時，先問「這個畫面現在需要哪一種學習情緒？」而不是「這裡可不可以放角色」。

- 一般品牌存在 → `neutral`
- 正確回饋 → `happy`
- 完成／解鎖 → `celebrate`
- 錯誤但可繼續 → `encouraging`
- 解釋／思考／重教 → `thinking`
- streak／持續努力 → `determined`

禁止把 `encouraging` 畫成失望、責備、哭泣或搖頭；禁止用 mascot 取代答案、下一步按鈕或學習資訊。

## Motion QA

- 所有動畫必須是一次性，不循環。
- feedback 動畫宜在約 150–500ms 內結束。
- `celebrate` 可以稍強，但仍不應反覆播放。
- `prefers-reduced-motion: reduce` 時必須完全可用，而且重要訊息不能只靠動效傳達。

## Asset failure QA

Mascot 是增強層，不是學習流程依賴。即使 SVG 載入失敗：

- 題目仍可閱讀及作答；
- feedback 文字仍完整；
- 下一題／完成按鈕仍可操作；
- session summary 仍顯示數據與下一步。

## v1 已知限制

1. 六個狀態現階段仍以同一 baseline artwork 為主，因此 48–64px 的情緒差異有限。
2. `happy`、`thinking`、`determined` 等狀態最終仍值得製作真正不同的眼神／手勢／姿勢，而不是只靠外加符號。
3. `moling-head.svg` 是 32px 用的裁切過渡資產；正式 illustration handoff 時可另畫更乾淨的頭像版本。

## 下一輪 production artwork 優先次序

1. `happy`：使用頻率最高，最值得先做真正姿勢差異。
2. `encouraging`：需要最精準控制情緒，避免誤傳責備。
3. `thinking`：教學頁高頻，應以眼神／托腮等姿勢表意。
4. `determined`：streak 場景需有精神但不可兇。
5. `celebrate`：已有較強裝飾，可以最後再精修大動作版本。
6. `neutral`：保持最穩定，作所有狀態的比例基準。

## 檢查入口

在本地或 preview deployment 開啟：

`/mascot-sheet.html`

角色狀態與尺寸資料來源：

`/mascot/manifest.json`
