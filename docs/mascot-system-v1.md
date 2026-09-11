# Manjingo Mascot System v1

## 1. 角色定位

**中文名：小墨靈**  
**英文工作名：Little Ink Spirit**

小墨靈是 Manjingo 的學習陪伴角色。核心意象來自「墨滴／墨靈」，角色氣質應兼具：

- 親切：像陪伴學習的同伴，而不是監考者或老師。
- 聰明：能提示、觀察、思考，但不顯得高高在上。
- 有文化感：帶少量書卷氣與中文學習氣息，但避免過度古風。
- 有韌性：面對答錯與弱點時，重點是鼓勵下一步，而非表現失望。
- 可辨識：即使縮小至 32–48px，仍能靠輪廓與眼神被辨認。

## 2. 視覺原則

### 2.1 輪廓

- 主體保持圓潤、墨滴感、上窄下寬。
- 不依賴大量細節或小配件建立辨識度。
- 頭部／眼睛／身體比例應固定，避免不同狀態像不同角色。
- 手腳可簡化，但姿勢要足以表達情緒。

### 2.2 色彩

沿用目前產品品牌色：

- Ink Teal: `#0f5a5a`
- Warm Gold: `#d4a85b`
- Interaction Green: `#58cc02`
- UI Ink: `#000437`
- Surface: `#ffffff`

原則：

- 角色本體以墨青／深墨色作識別基礎。
- 暖金只作局部點綴，避免角色整體偏黃。
- 綠色主要表達產品互動與正向學習狀態，不應取代吉祥物本身的核心色。
- 正確／錯誤不可只靠顏色區分，必須同時有表情、姿勢或文字提示。

## 3. 六個核心狀態

### `neutral`
用途：首頁、一般歡迎、空狀態、品牌展示。  
表情：自然微笑、眼神清醒。  
姿勢：穩定站立，不揮手過度。

### `happy`
用途：答對、完成小步驟。  
表情：明顯開心但不誇張。  
姿勢：微微跳起、雙手抬高或向前。

### `celebrate`
用途：全對、完成一課、重要 milestone。  
表情：最大幅度的快樂。  
姿勢：跳起／張手，可加入少量金色星點或墨花。

### `encouraging`
用途：答錯、補救學習、弱點診斷。  
表情：溫和、穩定，不皺眉責備。  
姿勢：微微前傾／舉手鼓勵。

### `thinking`
用途：提示、等待作答、概念思考。  
表情：專注、眼睛向上或側看。  
姿勢：手托下巴或身體輕側。

### `determined`
用途：連續學習、streak、每日目標。  
表情：有精神、帶決心，但不兇。  
姿勢：向前／握拳／站穩。

## 4. 尺寸規格

### 32px
- 使用 `moling-head.svg` 頭部／極簡輪廓版本，不把完整身體硬縮到 32px。
- 不顯示細小手勢、裝飾或文字。

### 48px
- 可顯示頭部＋簡化上半身或完整角色輪廓。
- 適合 toast、feedback、列表狀態。

### 64px
- 可使用完整姿勢，但避免複雜裝飾。
- 適合答題反饋與小型完成卡。

### 96px
- 標準 UI 吉祥物尺寸。
- 適合首頁、完成畫面、弱點頁。

### 160px+
- 可加入完整姿勢與情境配件。
- 適合 onboarding、里程碑、空狀態插圖。

## 5. 正式資產與 runtime 結構

```text
public/
  mascot-moling.svg          # approved baseline artwork
  mascot-runtime.js          # production state registry / asset resolver / semantic UI tagging
  mascot-sheet.html          # runtime-backed visual QA character sheet
  mascot/
    manifest.json            # machine-readable v1 state contract
    moling-neutral.svg
    moling-happy.svg
    moling-celebrate.svg
    moling-encouraging.svg
    moling-thinking.svg
    moling-determined.svg
    moling-head.svg           # compact 32px crop
```

`manifest.json` 是設計契約；`mascot-runtime.js` 是產品執行時使用的同步 registry。兩者由自動測試逐欄比對，避免 state id、用途、motion 或 asset path 漂移。

暫時保留 `public/mascot-moling.svg` 作 baseline artwork。主要 UI 不再應直接依賴這個 legacy/default 路徑，而是透過正式 state asset 或 mascot runtime 使用角色。

## 6. UI 使用規則

小墨靈的功能不是「每頁都出現」，而是在關鍵學習節點提供情緒回饋與方向感。

### 應出現

- 首頁品牌區：`neutral`
- 答對：`happy`
- 答錯但仍可繼續：`encouraging`
- 提示／思考：`thinking`
- 完成學習：依成績使用 `happy` / `celebrate`
- streak / daily goal：`determined`
- 解鎖新內容：`celebrate`

### 不宜出現

- 長篇閱讀材料正文旁持續固定顯示
- 每一題都做大型動畫
- 錯誤訊息、系統故障、權限錯誤等非學習情境
- 需要學生集中閱讀或作答時遮擋內容

### 語意 class 原則

Mascot 狀態不能靠「某個頁面所有 icon 一律套同一張圖」來決定。需要由 runtime 或明確 semantic class 標示，例如 `mascot-thinking`。這可避免日後新增其他 lesson icon 時被誤套成 `thinking`。

## 7. 動效原則

- 預設只使用 150–350ms 的簡短位移／縮放／淡入。
- `celebrate` 可以稍強，但避免循環播放。
- 答錯時不使用搖頭、哭泣、倒地等負面懲罰式動畫。
- `prefers-reduced-motion: reduce` 時，必須改成靜態切換。

## 8. 文案語氣

小墨靈說話應短、自然、具方向感。

推薦：

- 「答對了！」
- 「很穩，繼續！」
- 「這題再想一步。」
- 「錯題會變成下一步。」
- 「今天完成啦！」
- 「全對！太棒了！」

避免：

- 過度幼兒化語氣
- 責備或羞辱式語句
- 太多網絡潮語
- 每次互動都出現長句

## 9. v1 實作狀態

已完成：

1. 保留 `mascot-moling.svg` 作 baseline。
2. 建立 `neutral`、`happy`、`celebrate`、`encouraging`、`thinking`、`determined` 六個正式資產。
3. 接入首頁、答題 feedback、session completion、概念學習及 streak UI。
4. 建立 `manifest.json`，固定 state id、用途、資產路徑及尺寸契約。
5. 建立 `mascot-runtime.js`，集中處理 state normalization、asset resolution、32px compact asset 與 semantic lesson tagging。
6. 答題 feedback 與 session completion 已改為優先透過 shared runtime 解決 state asset，而不是各自維護一套映射。
7. `thinking` 不再透過廣泛 CSS selector 覆蓋所有 lesson icon，而由 `mascot-thinking` semantic class 控制。
8. 建立 32px 專用 `moling-head.svg`，避免完整角色在最小尺寸失去辨識度。
9. 建立 `/mascot-sheet.html`，直接以 production runtime 一次檢查六狀態 × 32 / 48 / 64 / 96 / 160px。
10. 補回歸測試，保護 manifest/runtime parity、legacy direct-reference audit、尺寸契約、reduced-motion 與主要 UI 引用。

仍待 production artwork 階段深化：

- 將目前「baseline + 克制點綴」逐步升級為真正有不同眼神／手勢／姿勢的 state illustrations。
- 優先處理 `happy`、`encouraging`、`thinking`、`determined` 的靜態辨識差異。

## 10. v1 驗收條件

- 32–48px 仍可辨認為小墨靈。
- 六個狀態看起來屬於同一角色。
- 手機 360–430px 下不遮擋題目或 CTA。
- 靜態狀態下已能清楚表達情緒，不依賴動畫。
- reduced motion 可完整使用。
- mascot asset 載入失敗時，學習流程仍正常。
- 主要 UI 不直接依賴單一 legacy 檔名。
- runtime 與 manifest 必須保持一致。
- lesson mascot 必須由語意狀態指定，不使用過度廣泛 selector。

## 11. Visual QA 流程

設計或程式修改 mascot 後，至少做以下檢查：

1. 在 preview deployment 開啟 `/mascot-sheet.html`；此頁使用與 production UI 相同的 `mascot-runtime.js`。
2. 逐一看六個 states 在 32 / 48 / 64 / 96 / 160px 的輪廓與透明邊緣。
3. 以 360–430px viewport 檢查 feedback、lesson、streak 不會擠壓文字或 CTA。
4. 開啟 reduced-motion 偏好，確認資訊仍完整。
5. 執行完整測試，確認 runtime／manifest、legacy reference audit 與資產契約沒有漂移。

詳細人工檢查表見 `docs/mascot-visual-qa.md`。

## 12. v2 候選

- Daily goal / streak 火焰或墨火版本
- 弱點補強專用情境插圖
- 徽章與成就圖案
- Onboarding 三幕插圖
- App icon / favicon / social avatar
- 節日限定造型（保持非常克制）

---

Related: #1
