# 小墨靈 `encouraging` P2 Review Record

本文件記錄 `encouraging` artwork 的人工 A–E review。P2 的首要原則不是「答錯反應要明顯」，而是 **支持必須明顯、責備必須為零**。

## Current candidate

`encouraging.artStatus = candidate`。

目前 artwork 已：

- 舊扁平 v2 已由產品負責人明確否決；
- candidate v4 已採用產品負責人選定的全墨呆萌方向；
- 取消米白／肉色面罩，改用連續炭灰至深墨藍漸變、豆豆眼、腮紅、金色雲紋、墨冠與獨立墨滴；
- 使用微歪小笑容、清楚豆豆眼與笨拙圓潤開掌，沒有指責式手指；
- 檔案使用真正透明 alpha，並以 raster-backed SVG 接入現有 runtime。

## Rejected v2 → candidate v4

第一版在 34 / 42px raster review 暴露一個小尺寸問題：兩條手臂位置太靠近臉部，縮小後容易像橫線／鬍鬚，反而干擾眼神與嘴形。

v2 已修正：

- 把主要伸手動作下移到胸口高度；
- 另一手保持低位與穩定，避免兩臂在臉部形成噪音；
- 保持輕微前傾，不增加跳躍或 celebrate 能量；
- 保留較小、平穩的支持式微笑，與 production `happy` 的大笑容拉開強度。

## Current A–E position

- **Gate A — candidate-level pass，待部署確認**：已建立 QA-only 全墨 neutral anchor；42px 本地 A/B 可讀成同一角色，neutral 置中穩定，encouraging 以前傾、開掌及偏轉墨冠增加支持意圖。
- **Gate B — candidate-level pass**：靜態 v4 以眼神、微歪小笑容、輕微前傾與開掌傳達陪伴。
- **Gate C — candidate-level pass**：沒有合理可讀成失望、責備、羞恥、悲傷或懲罰的訊號。
- **Gate D — candidate-level pass，待部署確認**：34 / 42px 本地 raster 檢查可辨認；仍需部署後逐一確認 34 / 42 / 48 / 64 / 96 / 160px。
- **Gate E — candidate-level live-layout pass，待產品負責人確認**：desktop 42×62 與 narrow-mobile 34×50 QA layout 保持解釋及 CTA 的資訊層級，角色沒有取代教學內容。

目前決定：**保留 candidate，不升 production。**

## Gate A — Same character

必須全部成立：

- 與 neutral / production happy 並排仍一眼是同一小墨靈；
- 眼睛、頭身比例、墨滴輪廓與 palette 不漂移；
- 沒有新增大型配件或改變角色身份的元素；
- QA-only anchor 使用 `public/mascot/moling-neutral-all-ink-candidate.svg`，不把候選 artwork 偷渡成正式 neutral；
- neutral 墨冠置中、encouraging 墨冠偏轉，但兩者都保留液態連續性。

## Gate B — Static encouraging

遮掉文字與動畫後：

- 眼神穩定、專注、朝向學生／前方；
- 身體稍向學生前傾，但重心穩；
- 至少一個開放手勢讀成「一起再看」；
- 嘴形是平穩支持，不是大笑或苦笑。

## Gate C — No blame / no disappointment

任何以下情況直接 fail：

- 嘴角向下、皺眉、低頭或下垂視線；
- 哭泣、汗滴、尷尬線、紅叉；
- 搖頭、倒地、聳肩、攤手無奈；
- 指責式手指、嚴肅老師臉；
- 任何「你令我失望」的角色人格化反應。

## Gate D — Size QA

必須逐一檢查：34 / 42 / 48 / 64 / 96 / 160px。

特別要求：34 / 42px 不應再出現 v1 的「手臂像鬍鬚／橫線」問題。

## Gate E — Product context

使用 `/mascot-encouraging-p2-qa.html` 檢查：

- `這題答錯了`
- 正確答案
- `一起看清這一步。`
- 解釋
- 下一步 CTA

角色必須是陪伴層，不可搶走教學內容的情緒焦點。

目前 live-layout 檢查未見遮擋、溢出或資訊層級反轉；最後人工確認要特別看 34px mobile 是否因眼睛與手勢擠在一起而顯得緊張，以及錯題紅／橙色訊號是否把腮紅誤讀成尷尬或羞恥。

## Promotion checklist

只有 A–E 全部通過後才可：

1. 將 manifest/runtime 的 `encouraging.artStatus` 改為 `production`。
2. 執行 `npm run mascot:encouraging:p2`。
3. 執行 `npm run mascot:check`。
4. 執行完整 `npm test`。
5. 將 PR #7 由 draft 轉為 ready for review。
6. 更新並完成 Issue #6。

Tracks #6, #3 and PR #7.
