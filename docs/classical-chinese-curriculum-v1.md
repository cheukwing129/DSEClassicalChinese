# Manjingo Classical Chinese Curriculum v1

## 1. 定位

Manjingo 的核心不是「12 篇指定文言篇章溫習」，而是建立**可以遷移到陌生文言篇章的語言能力**。

學生完成一個技能後，應能在未讀過的句子或短篇中運用它，而不只是記得某篇課文的意思、主旨或標準答案。

核心原則：

1. **能力先於篇章**：knowledge point 以字詞、虛詞、句式、閱讀策略、翻譯策略為主。
2. **例句跨來源**：同一技能必須使用不同作者、篇章和語境。
3. **陌生語境驗證**：真正掌握，要能處理未見過的例句。
4. **指定篇章降為素材**：十二篇可提供高質例句，但不再決定 curriculum。
5. **內容理解分流**：主旨、人物、情節、思想、名句背誦移到 optional set-text / exam mode。
6. **語義層防重**：questionId 不同但原句相同，仍視為高度重複。

教育局的文言學與教建議亦把「掌握常見文言字詞和句式」列為理解文言篇章的基礎，並包括一詞多義、詞類活用和常見虛詞等；Manjingo v1 以此作校準，但不綁定單一課本。

## 2. 一般 Daily Learning 比例

每 10 題建議：

- **7–8 題**：語言能力（字詞／虛詞／句式／翻譯策略）
- **2–3 題**：陌生語境或短段綜合遷移
- **0 題**：純指定篇章內容記憶

學生主動進入「指定篇章／考試溫習模式」時，才大量出現主旨、人物、情節、名句等內容。

## 3. Curriculum strands

### A. Lexicon 詞彙與語義

- `lex.context-inference` 利用上下文推斷實詞義
- `lex.polysemy` 一詞多義
- `lex.ancient-modern` 古今異義
- `lex.word-class-shift` 詞類活用
- `lex.causative` 使動用法
- `lex.intentional` 意動用法
- `lex.tongjia` 通假／文字對應
- `lex.semantic-role` 依句法位置判斷詞性和語義功能

高頻實詞不應綁死在指定篇章。例如「去、窮、許、微、謝、顧、固、亡、間、故、安、卒、數、曾、徒、勝、鄙」等，應以跨語境 lexical entries 學習。

### B. Function Words 虛詞

第一期核心：

`之、而、以、於、其、為、者、所、則、乃、且、乎、焉、也`

對應 skill：

- `fw.zhi` `fw.er` `fw.yi` `fw.yu` `fw.qi`
- `fw.wei` `fw.zhe` `fw.suo` `fw.ze` `fw.nai`
- `fw.qie` `fw.hu` `fw.yan` `fw.ye`

每個虛詞下面再按功能拆分。例如 `以` 要分原因、工具／憑藉、目的、處置等，而不是只設一個「以」。

### C. Syntax 文言句法

- `syn.judgment` 判斷句
- `syn.passive` 被動句
- `syn.object-fronting` 賓語前置
- `syn.adverbial-postpose` 狀語／介詞結構後置
- `syn.attributive-postpose` 定語後置
- `syn.ellipsis-subject` 主語省略
- `syn.ellipsis-object` 賓語／介詞賓語省略
- `syn.negative-patterns` 否定結構
- `syn.interrogative-patterns` 疑問結構
- `syn.fixed-patterns` 常見固定格式

掌握標準是：辨認結構 → 找出變位／省略成分 → 還原語序 → 在陌生句重做。

### D. Reading Strategies 閱讀策略

- `read.sentence-core` 找句子主幹
- `read.referent-tracking` 代詞與省略主語追蹤
- `read.logical-relation` 因果／轉折／承接／假設／並列
- `read.parallel-inference` 利用對偶和平行結構推義
- `read.context-clues` 上下文語義線索
- `read.actor-tracking` 多人物敘事施事者追蹤
- `read.unknown-word-tolerance` 不逐字全懂仍掌握句意
- `read.argumentation` 較後期的論證方法與說理關係

### E. Translation 翻譯

- `trans.lexical-fidelity` 關鍵實詞落實
- `trans.function-word` 虛詞處理
- `trans.reorder` 倒裝還原
- `trans.supplement` 省略補足
- `trans.ancient-modern` 古今義轉換
- `trans.fluency` 準確而自然的現代漢語
- `trans.integrated` 綜合翻譯

### F. Transfer 陌生語境遷移

- `transfer.single-sentence` 單句陌生語境
- `transfer.sentence-pair` 兩句互證
- `transfer.micro-passage` 3–5 句小段
- `transfer.short-passage` 短篇陌生文言
- `transfer.mixed` 字詞＋句式＋翻譯混合任務

Transfer 不是另一個內容章節，而是檢驗前面技能是否真正可遷移。

## 4. 現有 59 knowledge points 遷移

所有現有 teachable knowledge points 必須有唯一主要去向。機器可讀版本在 `public/curriculum-v1.js`。

### 4.1 保留核心概念：15

- `kp_virtual_zhi`
- `kp_virtual_er`
- `kp_virtual_yi`
- `kp_virtual_yu`
- `kp_virtual_qi`
- `kp_virtual_ze`
- `gj_004`（卑鄙：古今異義）
- `gj_005`（感激：古今異義）
- `cy_006`（師：詞類活用）
- `sx_001` 判斷句
- `sx_003` 見字表被動
- `sx_004` 於字表被動
- `sx_005` 省略句
- `sx_006` 賓語前置
- `sx_008` 狀語後置

### 4.2 重構：3

- `kp_yueyang_001`：「謫」由《岳陽樓記》專屬點改為 lexical / 語境詞義素材
- `cy_004`：「先／後」改入詞類活用／時間功能
- `kp_translation_001`：「微斯人，吾誰與歸」拆入翻譯、賓語前置和古義能力

### 4.3 合併重複核心節點：11

- `kp_p3_zhi` → `fw.zhi`
- `kp_p3_er` → `fw.er`
- `kp_p3_yi` → `fw.yi`
- `kp_p3_yu` → `fw.yu`
- `kp_p3_qi` → `fw.qi`
- `kp_p3_judgment` → `syn.judgment`
- `kp_p3_passive` → `syn.passive`
- `kp_p3_fronting` → `syn.object-fronting`
- `kp_p3_adverbial` → `syn.adverbial-postpose`
- `kp_p3_ellipsis` → ellipsis skills
- `kp_p3_translation` → Translation strand

### 4.4 移到 optional set-text：26

以下不再進一般 daily plan：

- `kp_yueyang_004`, `kp_theme_001`
- `kp_yueyang_context`, `kp_yueyang_scene`, `kp_yueyang_emotion`
- `kp_chushi_loyalty`, `kp_chushi_reward`, `kp_chushi_experience`
- `kp_fish_righteousness`, `kp_fish_shame`
- `kp_shengyou_adversity`, `kp_shengyou_country`
- `kp_caogui_trust`, `kp_caogui_strategy`
- `kp_zouji_selfknowledge`, `kp_zouji_remonstrance`
- `kp_taohua_discovery`, `kp_taohua_society`
- `kp_loushi_character`, `kp_loushi_allusion`
- `kp_ai_lotus_symbol`, `kp_ai_lotus_contrast`
- `kp_maqianli_talent`, `kp_maqianli_ignorance`
- `kp_xiaoshi_pool`, `kp_xiaoshi_mood`

**移出 knowledge point 不等於刪除所有題目。** 例如「緣、鮮美、窮」、「獄」、「何陋之有」等其實可測可遷移語言能力，應把題目重新掛到 lexical / syntax skills；只有純主旨、人物、思想、篇章細節才保留在 set-text mode。

### 4.5 進階閱讀：4

- `kp_argument_001`
- `kp_argument_002`
- `kp_argument_003`
- `kp_p3_argument`

它們最終歸入 `read.argumentation`，不應在初期壓過字詞、虛詞、句式和翻譯。

**總數：15 + 3 + 11 + 26 + 4 = 59。**

## 5. Question schema 新要求

active core question 逐步加入：

```js
{
  id,
  skillId,          // curriculum skill，例如 fw.yi
  kpId,             // 過渡期保留 legacy mastery mapping
  sourceTextId,     // 來源篇章，只作 metadata
  sourceSentenceId, // 同一句／近同句防重
  sourceKind,       // set-text | classical-canon | historical | constructed
  transferLevel,    // 0=直接辨識, 1=近遷移, 2=陌生語境, 3=短段綜合
  languageFocus,    // lexicon | function-word | syntax | reading | translation
  q, o, a, explanation
}
```

`sourceTextId` 不再等於 curriculum 分類。

## 6. 題庫品質門檻

核心 skill 進 production daily plan 前至少：

- 6 題可用題目
- 3 個不同 source texts
- 2 題為非十二篇來源或真正陌生語境
- 同一 source sentence 不超過該 skill 題庫 25%
- 不以單一篇章主旨知識作為答題前提

成熟 skill 理想為 10–20 題、5 個以上來源。

## 7. Planner 原則

1. 到期 skill
2. 弱項 skill
3. 新 skill
4. 選題時加入 source diversity
5. 同一 source text 一般每 10 題最多 2 題
6. 同一 source sentence 短期內最多 1 題
7. 答錯後先出「同技能、不同例句」驗證，再考慮回到原題

這保留 spaced repetition，但避免「某篇 knowledge points 多，所以整天都是那篇」。

## 8. 遷移階段

### Phase 1 — taxonomy foundation

- 機器可讀 curriculum taxonomy
- 59 個 legacy KP 全部有遷移決定
- 不改 production daily plan

### Phase 2 — question metadata migration

- 加 `skillId / sourceSentenceId / transferLevel`
- 把現有可遷移題搬到新 skills
- 純篇章內容標記 optional

### Phase 3 — transfer-first expansion

優先擴充：

- 之、而、以、於、其、為
- 判斷、被動、賓語前置、省略、狀語後置
- 一詞多義／古今異義／詞類活用
- 陌生語境詞義推斷
- 綜合翻譯

### Phase 4 — planner switch

- daily plan 改用 skill taxonomy
- source / sentence diversity 生效
- legacy mastery 做 alias migration

### Phase 5 — optional set-text mode

- 十二篇內容理解保留為獨立模式
- 不影響一般語言學習 mastery

## 9. Definition of Done

- 新學生連續學習數天，不會因 catalog 順序集中在《岳陽樓記》。
- 學生答錯「以＝原因」後，下一次優先看到另一語境，而不是同一原句換問法。
- mastery 能表述為「掌握某虛詞功能／句式」，而不是「掌握某篇文章」。
- 一般 daily learning 不要求學生預先讀過十二篇。
- 短篇陌生文言表現能由底層 skill mastery 解釋。
