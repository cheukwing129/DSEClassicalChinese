# 小墨靈 Production Artwork Brief

此文件把 Mascot System v1 的「狀態契約」轉成可直接交付插畫／設計的 production artwork 規格。目標不是重新發明角色，而是在保留現有小墨靈核心辨識度的前提下，讓不同學習狀態只看靜態姿勢也能分辨。

## 1. 不可改動的角色 DNA

所有新 artwork 必須保留：

- 墨滴／墨靈的圓潤主輪廓，上窄下寬。
- 現有頭身比例、臉部位置與大眼睛識別。
- 墨青／深墨色為主體；暖金只作局部點綴。
- 親切、聰明、有韌性；不可做成嚴肅老師、監考者或幼兒卡通。
- 角色即使沒有文字、星星、泡泡、火焰等外加符號，也要能靠表情／姿勢傳達狀態。

Production artwork 的第一目標是「同一角色、不同情緒」，不是「六個不同角色」。

## 2. 畫布與輸出契約

- 主 artwork：SVG，`viewBox="0 0 215 320"`。
- 背景透明，不加入固定底色卡片。
- 角色本體須保留足夠透明邊界，不可貼邊裁切。
- 48px 以上必須仍能讀到姿勢；32px 統一使用 `moling-head.svg` compact crop。
- 不在 SVG 內嵌文字。
- 不依賴 animation 才能看懂狀態。
- 所有狀態必須在 reduced-motion 環境下完整成立。

## 3. Production priority

### P1 — `happy`

**產品語境**：答對、完成小步驟。

**靜態表情**：眼神明顯變亮／微彎，嘴形或面部情緒比 neutral 更開心，但不可誇張到與 celebrate 混淆。

**姿勢**：身體微向上、雙手抬起或向前，像「抓到重點」的輕快反應。腳部或下身可有少量離地感，但不要大跳。

**禁止**：大量星星、彩帶、大幅張手；這些留給 celebrate。

**驗收關鍵**：64px 靜態畫面，遮掉所有外加符號後，仍應比 neutral 明顯更開心。

### P2 — `encouraging`

**產品語境**：答錯、補救學習、弱點診斷。

**靜態表情**：穩定、溫和、專注，絕不皺眉責備、哭泣或失望。

**姿勢**：微微前傾，單手向前或抬起，像陪學生一起再看一步；重心要穩，不做搖頭姿勢。

**禁止**：紅色叉號、汗滴、哭臉、低頭、倒地、聳肩、明顯失望表情。

**驗收關鍵**：學生答錯時看到角色，第一感受應是「陪我繼續」，而不是「我做錯令角色失望」。

### P3 — `thinking`

**產品語境**：提示、概念理解、重新教學。

**靜態表情**：眼睛向上或側看，眉眼／視線呈現專注思考，不做困惑或茫然。

**姿勢**：手托下巴、身體輕側或頭部微偏；可有非常克制的思考泡泡，但即使移除泡泡仍能辨認為 thinking。

**禁止**：問號堆疊、頭暈符號、過度疑惑臉。

**驗收關鍵**：與 encouraging 的差別主要來自「內向思考」vs「向學生伸出支持」。

### P4 — `determined`

**產品語境**：streak、每日目標、持續學習。

**靜態表情**：有精神、有決心，但不可兇或競技化。

**姿勢**：站穩、向前、輕握拳或挺身；重心比 neutral 更前進。可使用少量暖金／墨火元素，但角色本體仍是主角。

**禁止**：怒目、咬牙、戰鬥姿勢、過強火焰包圍。

**驗收關鍵**：在 48–64px streak UI 中仍能看出「準備繼續」而不是單純 neutral。

## 4. 其餘兩個狀態

### `neutral`
目前作為 approved baseline。Production pass 不應先改 neutral；它是其他狀態比對角色一致性的錨點。

### `celebrate`
目前屬 provisional treatment，可在 P1–P4 完成後再做第二輪。正式版本可有最大動勢、張手／跳起與少量暖金星點，但仍要保留角色輪廓，不可變成裝飾主導。

## 5. 一致性檢查

每張 artwork 完成後，在 `/mascot-sheet.html` 至少檢查：

- 48px：眼神與主要姿勢仍可讀。
- 64px：狀態差異已清楚。
- 96px：產品常用尺寸自然、不搶題目主體。
- 160px：細節完整，透明邊緣乾淨。
- 與 neutral 並排時，頭身比例、眼睛位置、主色與輪廓仍像同一角色。
- 與其他 states 並排時，不靠文字標籤亦能猜到大致情緒。

## 6. 替換流程

新 production artwork 不改 state id 與產品程式碼，只替換對應檔案內容：

- `public/mascot/moling-happy.svg`
- `public/mascot/moling-encouraging.svg`
- `public/mascot/moling-thinking.svg`
- `public/mascot/moling-determined.svg`

完成一張後：

1. 先替換對應 SVG，但暫時保持原 `artStatus`。
2. 執行 `npm run mascot:check`，確認畫布、資產路徑及狀態契約正常。
3. 在 `/mascot-sheet.html` 做 48 / 64 / 96 / 160px visual QA。
4. QA 通過後，才把 manifest 對應 `artStatus` 改為 `production`。
5. 再執行 `npm run mascot:check`；此時 validator 會拒絕仍直接引用 `mascot-moling.svg` baseline 的假 production artwork。
6. 執行完整 `npm test`。
7. 再進下一個 state，避免一次大改後無法知道是哪張破壞一致性。

`npm test` 已包含 mascot artwork preflight，所以 CI 亦會執行同一套規則。

## 7. 自動驗收防線

`scripts/validate_mascot_art.cjs` 會檢查：

- 六個 canonical states 與固定尺寸契約仍存在。
- `artStatus` 與 `productionPriority` 合法且不重複。
- 每個 SVG 存在，並保持 `viewBox="0 0 215 320"`。
- mascot SVG 不嵌入文字。
- 標為 `placeholder-treatment` 的狀態仍明確屬 baseline-derived treatment。
- 一旦標為 `production`，對應 SVG 不得再直接引用 legacy `mascot-moling.svg`。
- `neutral` 必須維持 baseline-approved / priority 0。
- production queue 必須依 priority 穩定排序。
- 32px compact asset 仍使用 `215 x 190` head crop 契約。

這層檢查不能取代人工視覺 QA，但可避免「只改 metadata 就假裝 artwork 已完成」以及資產格式漂移。

## 8. Definition of Done

一個 state 只有在以下條件全部成立後才可標為 `production`：

- 不再只是 baseline artwork 加外掛符號／overlay。
- 靜態表情與姿勢本身能傳達語意。
- 48 / 64 / 96 / 160px 均通過 visual QA。
- 與 neutral 保持角色一致性。
- 不依賴顏色單獨傳達狀態。
- 不引入責備式或高壓式學習情緒。
- `npm run mascot:check` 通過。
- runtime、manifest 與完整 regression tests 全部通過。

Related: #1, #3, PR #2
