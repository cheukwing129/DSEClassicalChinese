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

### P1 — `happy` ✅ production

**產品語境**：答對、完成小步驟。

P1 已完成 A–E Visual QA 並升級為 production。正式 artwork 使用清楚笑容、明亮眼神與克制抬手；已移除第一版 candidate 中容易在小尺寸被看成第二張嘴的暖金腹部弧線。

**回歸驗收**：34 / 42px 實際 feedback 尺寸，以及 48 / 64 / 96 / 160px artwork 尺寸；`/mascot-sheet.html` 保留 neutral / production A/B 與 feedback context preview。

### P2 — `encouraging` ← next

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
目前屬 provisional treatment，可在 P2–P4 完成後再做第二輪。正式版本可有最大動勢、張手／跳起與少量暖金星點，但仍要保留角色輪廓，不可變成裝飾主導。

## 5. 一致性檢查

每張 artwork 完成後，在 `/mascot-sheet.html` 至少檢查：

- 48px：眼神與主要姿勢仍可讀。
- 64px：狀態差異已清楚。
- 96px：產品常用尺寸自然、不搶題目主體。
- 160px：細節完整，透明邊緣乾淨。
- 與 neutral 並排時，頭身比例、眼睛位置、主色與輪廓仍像同一角色。
- 與其他 states 並排時，不靠文字標籤亦能猜到大致情緒。
- 若產品實際使用尺寸低於 48px，必須把該尺寸加入 state-specific review；P1 因 feedback UI 使用 34 / 42px，已把兩者納入正式回歸。

## 6. Artwork lifecycle 與替換流程

Artwork readiness 採用：

`placeholder-treatment → candidate → production`

- `placeholder-treatment`：仍直接引用 approved baseline，只是讓產品先有穩定 state contract。
- `candidate`：已是獨立 artwork，不再引用 baseline；結構檢查可以通過，但仍等待人工 Visual QA。
- `production`：人工 QA 已通過，角色一致性、情緒語意與尺寸可讀性均獲確認。
- `provisional`：可用但刻意排在較後的深化項目，例如目前的 `celebrate`。
- `baseline-approved`：只用於目前的 `neutral` 角色錨點。

完成一張的標準流程：

1. 替換對應 SVG，保持原 state id 與 asset path。
2. 當 artwork 已真正獨立於 baseline 時，將 manifest/runtime 的 `artStatus` 改為 `candidate`。
3. 執行 `npm run mascot:check`（如有 state-specific gate 亦一併執行）。
4. 在 `/mascot-sheet.html` 做尺寸 QA，並與 `neutral` 及相鄰情緒狀態並排判斷。
5. 若角色 DNA、情緒或小尺寸可讀性不合格，保持 `candidate` 並繼續修改 artwork。
6. 只有人工 QA 通過後，才把 manifest/runtime 對應 `artStatus` 改為 `production`。
7. 再執行 `npm run mascot:check`；validator 會拒絕仍直接引用 `mascot-moling.svg` baseline 的假 production artwork。
8. 執行完整 `npm test`。
9. 再進下一個 state，避免一次大改後無法知道是哪張破壞一致性。

`candidate` 不是「接近 production 就自動通過」的狀態；它的作用正是讓獨立新 artwork 可以進入人工 review，而不需要過早宣稱定稿。

## 7. 自動驗收防線

`scripts/validate_mascot_art.cjs` 會檢查：

- 六個 canonical states 與固定尺寸契約仍存在。
- `artStatus` 與 `productionPriority` 合法且不重複。
- 每個 SVG 存在，並保持 `viewBox="0 0 215 320"`。
- mascot SVG 不嵌入文字。
- 標為 `placeholder-treatment` 的狀態仍明確屬 baseline-derived treatment。
- 標為 `candidate` 的狀態已不再直接引用 legacy baseline。
- 一旦標為 `production`，對應 SVG 同樣不得再直接引用 legacy `mascot-moling.svg`。
- `neutral` 必須維持 baseline-approved / priority 0。
- production queue 必須依 priority 穩定排序。
- 32px compact asset 仍使用 `215 x 190` head crop 契約。

這層檢查不能取代人工視覺 QA，但可避免「只改 metadata 就假裝 artwork 已完成」以及資產格式漂移。

## 8. Definition of Done

一個 state 只有在以下條件全部成立後才可標為 `production`：

- 不再只是 baseline artwork 加外掛符號／overlay。
- 靜態表情與姿勢本身能傳達語意。
- 所有產品實際尺寸及 48 / 64 / 96 / 160px 通過 visual QA。
- 與 neutral 保持角色一致性。
- 不依賴顏色單獨傳達狀態。
- 不引入責備式或高壓式學習情緒。
- `npm run mascot:check` 通過。
- runtime、manifest 與完整 regression tests 全部通過。

Related: #1, #3, #4, PR #5
