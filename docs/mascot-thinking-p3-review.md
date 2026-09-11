# 小墨靈 `thinking` P3 Review Record

## Current candidate

`thinking.artStatus = candidate`。

Candidate v2 使用真正透明 alpha 的 raster-backed SVG，沿用全墨炭灰至深墨藍漸變、豆豆眼、克制腮紅、金色雲紋、流動墨冠與獨立墨滴。墨冠順向上視線彎曲；思考手勢已下移，沒有遮眼或穿過嘴形。

## Current A–E position

- **Gate A — candidate-level pass**：與全墨 neutral QA anchor 仍清楚是同一小墨靈；palette、比例、眼睛、金紋與液態墨冠一致。
- **Gate B — candidate-level pass**：v2 降低腮紅，以兩眼共同向上側望、淡墨下緣及更平衡的小弧嘴提高思考辨識；34 / 42px 不再先讀成「害羞／賣萌」。
- **Gate C — candidate-level pass**：沒有焦慮、皺眉、汗滴、困惑、無助或老師式審視訊號。
- **Gate D — candidate-level pass**：34 / 42px 眼睛、嘴與向上視線仍清楚；手沒有變成橫線／鬍鬚，並與臉保持可辨識負空間。
- **Gate E — pending branch-preview review**：QA page 已有 desktop 42×62 與 narrow-mobile 34×50 hint layout，待部署頁確認資訊層級。

## v1 → v2 revision

1. 腮紅大幅降低，減少害羞／賣萌讀法。
2. 兩眼加入一致的向上側望與淡墨下緣，避免失焦。
3. 嘴形改成極小而平衡的閉合弧線，不向下、不苦笑。
4. 下巴手勢縮小並下移，與臉保留負空間。
5. 保留順視線彎曲的液態墨冠，未加入問號、書、毛筆或眼鏡。

目前決定：**v2 保留 Draft / candidate；Gate E branch-preview 與產品負責人確認前不升 production。**

Tracks #8, #3 and PR #9.
