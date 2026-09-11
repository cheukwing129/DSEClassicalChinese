# 小墨靈 `happy` P1 Artwork Handoff

此文件記錄 Mascot System v1 第一張真正 production pose：`happy`。P1 已完成 candidate → review → production 流程；後續只應在有明確回歸證據時再改動此 asset。

## 1. 目標

在沒有星星、彩帶、文字或動畫的情況下，單看角色靜態表情與姿勢，學生仍能判斷「小墨靈剛剛因為我答對而開心」。

情緒強度必須介乎：

`neutral < happy < celebrate`

`happy` 應是輕快的成功感，不是大型勝利慶典。

## 2. 必須保留的角色 DNA

- 同一墨滴／墨靈主輪廓，上窄下寬。
- 與 `neutral` 相同的頭身比例、臉部高度與眼睛識別。
- 墨青／深墨色仍為角色本體主色。
- 暖金只能少量使用，不應變成角色主色。
- 保持親切、聰明、略有書卷氣，但不要變幼兒卡通或老師角色。
- 215 × 320 的透明畫布契約不變。

## 3. Production artwork 特徵

P1 v2 最終採用：

- 明亮、朝前的大眼睛；
- 單一清楚笑容，沒有腹部第二條裝飾弧線；
- 雙手克制抬起，提供「很好／抓到重點」的輕快動勢；
- 暖金只以低透明度臉頰點綴出現；
- 不使用星星、彩帶、勾號、文字或大型勝利手勢作主要訊號。

第一版 candidate 曾因暖金腹部弧線在 48–64px 容易像第二張嘴而被修正；這個負面案例應保留作之後 state artwork 的小尺寸教訓。

## 4. 與其他 state 的邊界

- 不像 `encouraging` 那樣向學生前傾支援。
- 不像 `thinking` 那樣托下巴／偏頭思考。
- 不像 `determined` 那樣站穩、握拳、向前準備。
- 不像 `celebrate` 那樣大幅張手或跳起。

## 5. 檔案與 integration contract

Production asset：

`public/mascot/moling-happy.svg`

固定：

- `viewBox="0 0 215 320"`
- state id = `happy`
- runtime asset path 不變
- feedback UI integration 不變
- `happy.artStatus = production`
- `productionPriority = 1` 保留作歷史 priority，但 production queue 已不再包含 happy

Artwork lifecycle 已完成：

`placeholder-treatment → candidate → production`

## 6. QA contract

`docs/mascot-happy-p1-review.md` 是正式 review record。A–E 已全部通過：

1. 同一角色 DNA。
2. 靜態畫面本身已是 happy。
3. 情緒強度低於 celebrate。
4. 34 / 42px 實際 feedback 尺寸及 48 / 64 / 96 / 160px artwork 尺寸均可讀。
5. 放回答對 feedback 時自然、不遮擋學習內容。

`/mascot-sheet.html` 保留 neutral / production happy A/B panel，以及 desktop/mobile feedback context preview，供未來 regression review。

## 7. Automated gates

```bash
npm run mascot:happy:p1
npm run mascot:check
npm test
```

`mascot:happy:p1` 會確認：

- asset path 與 P1 priority 未漂移；
- 215×320 viewBox、accessible title/desc、無 embedded text；
- production artwork 不再引用 legacy `mascot-moling.svg`；
- production artwork 與 neutral 不完全相同；
- SVG 有足夠獨立 vector 結構。

Global validator 亦會拒絕任何 `artStatus=production` 但仍引用 baseline 的假 promotion。

## 8. Regression rule

除非有明確產品或品牌理由，後續不要在 P2/P3/P4 工作中順手重畫 `happy`。若必須修改：

1. 保持 `artStatus=production` 前先在獨立 branch 做 candidate review；
2. 重跑 neutral / happy A/B；
3. 重跑 34 / 42 / 48 / 64 / 96 / 160px；
4. 重跑 feedback context preview；
5. 再執行三條 automated gates。

## 9. 下一個 artwork state

P1 完成後，production queue 的下一項是：

**P2 — `encouraging`**

它比其他狀態更敏感，因為答錯情境不能讓學生讀成失望、責備或羞恥。下一個 production-art workstream 應優先建立真正的 supporting pose，而不是繼續深化 `happy`。

Tracks #4, #3 and PR #5.
