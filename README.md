# 六書造字堂 liushu-quest

漢字六書（象形、指事、會意、形聲、轉注、假借）互動練功站。純前端靜態站、無框架、免帳號，進度存瀏覽器 localStorage（可匯出/匯入）。

## 功能

- **概念導讀**：文字起源（結繩／壁畫／語言的形音義缺角）→ 六書各書定義與例字
- **字例總覽**：196 字，依書類／難度（基礎・進階・挑戰）篩選，每字附字形演變解說、《說文》節錄、爭議標記
- **閃卡複習**：Leitner 5 盒間隔複習，到期優先、新卡補位
- **自測闖關**：五種題型（判斷書類／依書類選字／依解說認字／細類判斷／概念題），答錯自動掉回閃卡第一盒
- **大師對戰**：8 位文字學大師 PvE（王懿榮→倉頡），答對造成傷害＋連擊加成；解鎖門檻＝精通字數（掛真實學習量）
- **戰績**：分類正確率、弱點字聚合、進度匯出/匯入

## 資料紀律

字例分類依《說文解字》與現行文字學通說整理，schema 見 `data/SCHEMA.md`；歸類有學界分歧的字標 `disputed` 並列為挑戰級。資料驗證：

```bash
npm run validate   # merge shards + schema/內容雙重驗證
npm run smoke      # Playwright 端到端煙霧測試（需本機 Chrome）
```

## 開發

無建置步驟。本機預覽：

```bash
python3 -m http.server 8080
```

改 `data/shards/*.json` 後跑 `npm run validate` 重建 `data/chars.json`。

## 部署

Cloudflare Pages（liushu-quest.pages.dev）＋ Netlify（liushu-quest.netlify.app）鏡射。
