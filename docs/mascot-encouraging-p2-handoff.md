# 小墨靈 `encouraging` P2 Artwork Handoff

此文件定義 Mascot System v1 第二張 production pose：`encouraging`。它出現在學生答錯、補救學習與弱點診斷時，因此設計成功與否不只看「狀態是否明顯」，更要看角色是否避免製造失望、責備或羞恥感。

## 1. 核心目標

學生答錯後看到小墨靈，第一個直覺應是：

**「它在陪我一起再看一步。」**

而不是：

- 「我令它失望了。」
- 「它在責怪我。」
- 「我答錯很丟臉。」

產品文案已固定使用：`一起看清這一步。`

Artwork 必須與這句話的情緒完全一致。

## 2. 目前狀態

P2 已有按產品負責人確認角色參考重製的立體 **production v4**：

`public/mascot/moling-encouraging.svg`

目前：

- `encouraging.artStatus = production`；
- 舊扁平 v2 已被產品負責人否決，不可升 production；
- v4 使用透明 raster-backed 3D artwork；取消米白／肉色面罩，以連續炭灰至深墨藍漸變、豆豆眼、腮紅、金色雲紋、墨冠與獨立墨滴建立身份；
- 已建立 `public/mascot/moling-neutral-all-ink-candidate.svg` 作 Gate A 全墨 identity anchor；它只供 QA，未替換正式 neutral；
- v4 使用清楚豆豆眼、微歪小笑容、笨拙圓潤開掌與穩定站姿；
- 已建立 P2 專用 validator、size QA 與 wrong-answer context QA page；
- Gate A–E 已完成，產品負責人已確認繼續 promotion；正式 neutral 仍保持不變，QA-only 全墨 neutral anchor 留作後續角色系統發展參考。

Artwork lifecycle：

`placeholder-treatment → candidate → production`

## 3. 必須保留的角色 DNA

以產品負責人確認的立體角色參考為唯一身份錨點：

- 深色立體墨質與圓潤身體；
- 全墨色連續表面，不設米白／肉色面罩；
- 眼周以較淺炭灰漸變襯托清楚豆豆眼及亮點；
- 兩側金色雲紋；
- 流動墨冠及獨立墨滴；墨冠是液態表演元素，須隨動作方向轉動、拉伸、壓縮或偏移，不可在所有姿勢固定如帽子；
- 215×320 透明畫布（內嵌透明 WebP）；
- 親切、聰明、有韌性，不變成老師、裁判或幼兒角色；
- 不增加大型道具、服裝或其他改變角色身份的元素。

## 4. 表情方向

優先：

- 眼睛仍看向學生／前方，視線穩定而有注意力；
- 眉眼柔和，不下垂、不皺眉；
- 嘴形使用小幅、平穩的支持式微笑，強度明顯低於 `happy`；
- 保持「我陪你再看一步」的專注感。

避免：

- 苦笑、尷尬笑；
- 低頭、眼神向下；
- 嘴角向下；
- 過度開心，導致學生答錯時像在慶祝錯誤；
- 任何可被看成失望的表情。

## 5. 姿勢方向

P2 v4 採用：

- 身體輕微向學生前傾，但重心仍穩；
- 一手／一臂在胸口高度向前伸出，像「我們再看這裏」；
- 另一手保持低位與靠近身體；
- 下身站穩，不跳、不倒、不後退。

v1 曾把手臂放得太靠近臉部，在 34 / 42px raster review 中容易像橫線／鬍鬚；v2 已把主要手勢下移到胸口高度，這個負面案例應保留作之後小尺寸設計的教訓。

與其他 state 的邊界：

- 比 neutral 更有互動意圖；
- 比 happy 更平穩、少成功感；
- 不像 thinking 那樣內向托下巴／偏頭沉思；
- 不像 determined 那樣挺身、握拳、向前衝；
- 不像 celebrate 那樣大幅張手或跳起。

## 6. 絕對禁止的錯誤情緒訊號

不得使用：

- 紅色叉號、警告符號或懲罰符號作角色的一部分；
- 眼淚、汗滴、尷尬線；
- 搖頭；
- 低頭、縮起、倒地、跪坐；
- 聳肩、雙手攤開表示「沒辦法」；
- 皺眉、怒目、嚴肅老師臉；
- 指責式手指；
- 任何「你令我失望」式人格化反應。

答錯的角色反應必須是 **directional support**，不是情緒懲罰。

## 7. 小尺寸設計要求

P2 必須用真實產品尺寸驗收，而不是只看大圖：

| 尺寸 | 使用／驗收重點 |
|---|---|
| 34px | narrow mobile feedback 實際 mascot 寬度；至少眼神與支持姿態仍不會讀成 sad |
| 42px | desktop feedback 實際 mascot 寬度；表情與伸手方向要能讀到 |
| 48px | 不應退化成 neutral 或 wrong-face icon |
| 64px | 不看標籤也能大致讀成「支持／一起再看」 |
| 96px | 姿勢自然，不搶答案解釋 |
| 160px | 手勢、輪廓、透明邊界乾淨 |

32px 仍使用共用 `moling-head.svg`，不作 P2 pose 驗收。

v4 與全墨 neutral anchor 已做 42px 本地 raster A/B：兩者可讀成同一角色，neutral 以置中墨冠與低位雙手保持平靜，encouraging 以前傾、開掌及偏轉墨冠增加支持意圖。部署 QA 已完成 34 / 42 / 48 / 64 / 96 / 160px 檢查；34 / 42px 以眼神與小笑容為主要訊號，手勢與墨冠方向作次要訊號。

## 8. Gate A–E

### Gate A — Same character

- 與 neutral / production happy 並排仍一眼是同一小墨靈；
- 輪廓、眼睛、色彩與頭身比例沒有身份漂移；
- QA 使用全墨 neutral candidate，比較結果不可依賴已否決的米白面部方向；
- neutral 墨冠平穩置中，encouraging 墨冠隨前傾與開掌略為偏轉，兩者都仍像液態身體而非固定帽子。

### Gate B — Static encouraging

- 關掉動畫、遮掉文字後，仍能讀到支持、陪伴、注意力；
- 不靠星點／泡泡／色彩才成立。

### Gate C — No blame

這是 P2 最重要的一關：

- 不可讀成失望、責備、悲傷、尷尬、無奈或懲罰；
- 若 review 者有合理可能把表情解讀為「你做錯令我不開心」，直接 fail。

### Gate D — Size QA

逐一檢查 34 / 42 / 48 / 64 / 96 / 160px。

### Gate E — Wrong-answer context

使用 `/mascot-encouraging-p2-qa.html` 放入：

- `這題答錯了`
- 正確答案
- `一起看清這一步。`
- 答案解釋
- 下一步 CTA

角色不可擠壓或取代教學資訊，也不可比錯題本身更有情緒重量。

## 9. Production verification

Production promotion 執行：

```bash
npm run mascot:encouraging:p2
npm run mascot:check
npm test
```

P2 專用 validator 會確認：

- fixed asset path / P2 priority；
- 215×320 viewBox、accessible title/desc、無 embedded text；
- candidate / production 均不得再依賴 legacy baseline；
- candidate / production 不得與 neutral 完全相同；
- artwork 是獨立、內嵌透明 WebP 的 raster-backed SVG；
- SVG 不含 punitive / shaming visual markup；
- description 明確保留 supportive intent。

A–E 通過後已把 `encouraging.artStatus` 由 `candidate` 改成 `production`；三條 automated gates 必須保持全綠。

## 10. Definition of Done

P2 只有在以下全部成立後才完成：

- independent SVG，不再引用 legacy baseline；
- 靜態表情／姿勢能傳達支持；
- Gate C 明確排除 blame / disappointment；
- 34 / 42 / 48 / 64 / 96 / 160px 全部通過；
- wrong-answer feedback context 通過；
- `encouraging.artStatus = production`；
- `npm run mascot:encouraging:p2`、`npm run mascot:check` 與完整 `npm test` 全綠。

Tracks #6 and #3. P1 precedent: #4 / PR #5.
