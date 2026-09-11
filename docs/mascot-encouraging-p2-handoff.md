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

現有 `public/mascot/moling-encouraging.svg` 仍是 `placeholder-treatment`：

- 直接引用 approved `mascot-moling.svg` baseline；
- 以外加墨青弧線及暖金星點作暫代支持訊號；
- 尚未有真正獨立的眼神、姿勢或手勢。

P2 的任務是把它轉成真正 independent artwork，而不是再增加 overlay。

Artwork lifecycle：

`placeholder-treatment → candidate → production`

## 3. 必須保留的角色 DNA

與 neutral 及 production happy 一致：

- 墨滴／墨靈上窄下寬主輪廓；
- 大眼睛仍是第一視覺識別；
- 墨青／深墨色為角色本體主色；
- 215×320 透明畫布；
- 親切、聰明、有韌性，不變成老師、裁判或幼兒角色；
- 不增加大型道具、服裝或其他改變角色身份的元素。

## 4. 表情方向

優先：

- 眼睛仍看向學生／前方，視線穩定而有注意力；
- 眉眼柔和，不下垂、不皺眉；
- 嘴形可用小幅、平穩的支持式微笑，強度明顯低於 `happy`；
- 可以帶一點「我知道你還在想，我陪你」的專注感。

避免：

- 苦笑、尷尬笑；
- 低頭、眼神向下；
- 嘴角向下；
- 過度開心，導致學生答錯時像在慶祝錯誤；
- 任何可被看成失望的表情。

## 5. 姿勢方向

推薦姿勢：

- 身體輕微向學生前傾，但重心仍穩；
- 一手／一臂向前或微抬，像「我們再看這裏」；
- 另一手靠近身體，避免雙手完全張開變成 celebrate；
- 下身站穩，不跳、不倒、不後退。

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

## 8. Gate A–E

### Gate A — Same character

- 與 neutral / production happy 並排仍一眼是同一小墨靈；
- 輪廓、眼睛、色彩與頭身比例沒有身份漂移。

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

放入真實答錯 feedback 層級：

- `這題答錯了`
- 正確答案
- `一起看清這一步。`
- 答案解釋
- 下一步 CTA

角色不可擠壓或取代教學資訊，也不可比錯題本身更有情緒重量。

## 9. Candidate promotion流程

當真正獨立 artwork 準備好：

1. 替換 `public/mascot/moling-encouraging.svg`。
2. 將 manifest/runtime 的 `encouraging.artStatus` 改為 `candidate`。
3. 執行 `npm run mascot:check`。
4. 在 `/mascot-sheet.html` 加入 encouraging 專用 A/B 與 wrong-answer context review。
5. 完成 A–E review；若任何一關 fail，保持 candidate 並修改 artwork。
6. 全部通過後才升為 `production`。
7. 再跑 `npm run mascot:check` 與完整 `npm test`。

## 10. Definition of Done

P2 只有在以下全部成立後才完成：

- independent SVG，不再引用 legacy baseline；
- 靜態表情／姿勢能傳達支持；
- Gate C 明確排除 blame / disappointment；
- 34 / 42 / 48 / 64 / 96 / 160px 全部通過；
- wrong-answer feedback context 通過；
- `encouraging.artStatus = production`；
- mascot validator 與完整 regression tests 全綠。

Tracks #6 and #3. P1 precedent: #4 / PR #5.
