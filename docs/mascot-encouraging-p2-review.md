# 小墨靈 `encouraging` P2 Review Record

本文件記錄 `encouraging` artwork 的人工 A–E review。P2 的首要原則不是「答錯反應要明顯」，而是 **支持必須明顯、責備必須為零**。

## Current candidate

`encouraging.artStatus = candidate`。

目前 artwork 已：

- 不再引用 legacy `mascot-moling.svg`；
- 保持 215×320 viewBox、透明背景、accessible title/desc；
- 使用與 production `happy` 相同的墨青／深墨 vector 語言；
- 以輕微前傾、平穩小笑容及開放伸手表達「一起看清這一步」；
- 沒有紅叉、眼淚、汗滴、搖頭、皺眉、倒地、聳肩或其他責備／失望訊號。

## Candidate v1 → v2

第一版在 34 / 42px raster review 暴露一個小尺寸問題：兩條手臂位置太靠近臉部，縮小後容易像橫線／鬍鬚，反而干擾眼神與嘴形。

v2 已修正：

- 把主要伸手動作下移到胸口高度；
- 另一手保持低位與穩定，避免兩臂在臉部形成噪音；
- 保持輕微前傾，不增加跳躍或 celebrate 能量；
- 保留較小、平穩的支持式微笑，與 production `happy` 的大笑容拉開強度。

## Current A–E position

- **Gate A — same character: candidate-level pass**：主輪廓、眼睛比例、墨青 palette 與 production `happy` 保持一致的 vector family；最終仍需與 approved neutral A/B 再看一次。
- **Gate B — static encouraging: candidate-level pass**：不靠符號或動畫，v2 已有前傾＋伸手＋平穩微笑三個支持訊號。
- **Gate C — no blame: candidate-level pass**：目前沒有可合理讀成失望、責備、羞恥、悲傷或懲罰的視覺元素；這一關在 production promotion 前仍需再次人工確認。
- **Gate D — size QA: candidate-level pass**：34 / 42 / 48 / 64 / 96 / 160px raster review 中，v2 已移除臉部手臂干擾；34 / 42px 主要依靠眼神＋平穩嘴形，手勢作次要訊號。
- **Gate E — wrong-answer context: provisional pass**：`/mascot-encouraging-p2-qa.html` 已建立 desktop 42×62 與 narrow-mobile 34×50 context preview；仍需最後 live layout review 後才可 production。

目前決定：**保留 candidate，不升 production。**

## Gate A — Same character

必須全部成立：

- 與 neutral / production happy 並排仍一眼是同一小墨靈；
- 眼睛、頭身比例、墨滴輪廓與 palette 不漂移；
- 沒有新增大型配件或改變角色身份的元素。

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

## Promotion checklist

只有 A–E 全部通過後才可：

1. 將 manifest/runtime 的 `encouraging.artStatus` 改為 `production`。
2. 執行 `npm run mascot:encouraging:p2`。
3. 執行 `npm run mascot:check`。
4. 執行完整 `npm test`。
5. 將 PR #7 由 draft 轉為 ready for review。
6. 更新並完成 Issue #6。

Tracks #6, #3 and PR #7.
