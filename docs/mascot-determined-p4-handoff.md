# 小墨靈 `determined` P4 Artwork Handoff

此文件定義 Mascot System v1 第四張 production pose：`determined`。角色出現在 streak、每日目標與準備繼續學習時，核心感受是：

**「穩穩地再走一步。」**

它要表達安定、韌性與準備感，不是憤怒、競爭、催促、戰鬥或「不可斷 streak」的壓力。

## 1. 角色 DNA

沿用已確認的全墨方向：

- 炭灰至深墨藍的連續立體漸變，不設米白／肉色面罩；
- 清楚豆豆眼、克制腮紅、金色雲紋；
- 圓潤、略帶笨拙而可親的身體；
- 流動墨冠與獨立墨滴；
- 墨冠必須隨姿勢彎曲、轉動、拉伸、壓縮或偏移，不可像固定帽子；
- 215×320 透明 artwork contract；
- 不增加毛筆、頭帶、披風、獎牌、獎盃或武器。

## 2. Candidate v2

`public/mascot/moling-determined.svg`

目前候選方向：

- 一腳明顯踏前、另一腳穩定支撐，身體輕微向行進方向傾斜；
- 取消 v1 容易與 encouraging 混淆的胸前小拳；
- 雙手保持低位、不對稱的自然步行擺動，與臉部保留負空間；
- 豆豆眼共同望向前上方，保持圓、開放，不壓眼、不加怒眉；
- 嘴形改為較短、較平穩的閉口微笑，腮紅稍減；
- 墨冠逆行進方向向後拉伸，獨立墨滴跟隨流動；
- 不使用火焰、閃電、上升箭嘴或勝負符號。

v1 的「寬站姿＋胸前小拳」因在 34 / 42px 與 encouraging 的胸前手勢過於相似而被淘汰；不可回退為只換手形的正面站姿。

Lifecycle：

`placeholder-treatment → candidate → production`

目前保持 `determined.artStatus = candidate`，完成 A–E 前不可升 production。

## 3. A–E Gate

### Gate A — Same character

與 all-ink neutral、production happy、production encouraging、production thinking 並排仍是一眼可認的小墨靈。重點比較全墨漸變、豆豆眼、金色雲紋、圓潤比例與流動墨冠，不以舊米白面罩作身份標準。

### Gate B — Static determined

遮掉文案、streak 數字與動畫後，前踏步、低位擺臂、向後流動墨冠、集中視線與平靜微笑仍要讀成「準備繼續」，不可只像 neutral。

### Gate C — Confident, not aggressive or coercive

不可合理解讀為：

- 生氣、戰鬥、挑釁、競爭或勝利姿勢；
- 嚴厲教練、催促學生、要求保住 streak；
- 學生若停下就會令角色失望；
- 焦慮、咬牙、緊繃或過度亢奮。

若步姿像奔跑／衝刺、雙手像握拳或表情帶壓迫感，直接 fail。

### Gate D — Size QA

逐一檢查 34 / 42 / 48 / 64 / 96 / 160px。34 / 42px 特別檢查：

- 圓眼仍清楚，不被深色表面吞掉；
- 低位雙手與臉部有負空間，不像鬍鬚或第二個嘴；
- 前後腳與不對稱擺臂仍可辨，但不似奔跑；
- 墨冠向後流動的輪廓不會退化成固定帽子。

### Gate E — Streak / daily-goal context

使用 `/mascot-determined-p4-qa.html` 放入 desktop 與 narrow-mobile 的 streak／每日目標卡。角色：

- 不可比進度資訊與 CTA 更搶眼；
- 不可像警告、催交或「今天一定要完成」；
- 不用紅色、倒數、火焰或恐嚇式文案建立動機；
- reduced-motion 下仍完整成立。

## 4. Candidate verification

```bash
npm run mascot:determined:p4
npm run mascot:check
npm test
```

Tracks #10 and #3. P3 precedent: #8 / PR #9.
