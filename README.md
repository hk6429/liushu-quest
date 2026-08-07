# 六書造字堂 liushu-quest

漢字六書（象形、指事、會意、形聲、轉注、假借）互動練功站。純前端靜態站、無框架、免帳號，進度存瀏覽器 localStorage（可匯出/匯入）。

## 功能

- **概念導讀**：以傳說情境帶入文字的形、音、義，再區分《說文》原文、文字學說明與教學口訣
- **字例總覽**：220 字，依書類／難度（基礎・進階・挑戰）篩選，每字附字形演變解說、《說文》節錄、爭議標記與來源資料
- **閃卡複習**：Leitner 5 盒間隔複習，弱點、到期卡優先，新字補位
- **自測闖關**：六書均衡與自適應題組、每日固定字陣；一般模式不以爭議字作無條件唯一答案
- **大師對戰**：8 位文字學大師各有專長題組，最多 10 回合；解鎖門檻＝真實精通字數
- **成長系統**：三步入門、今日修行、五階熟練度、連續學習與六書印譜
- **戰績與備份**：分類正確率、弱點字聚合、JSON 檔下載／選檔匯入，以及文字進度碼備援
- **共用學習工具**：家庭／課堂、學習紀錄、自學星圖與匿名到訪統計

## 資料紀律

字例分類依《說文解字》與現行文字學通說整理，schema 見 `data/SCHEMA.md`；歸類有學界分歧的字標 `disputed` 並列為挑戰級。`category` 保留既有前端相容性，`formation_category` 與 `usage_relations` 分別保存字形構造、假借／轉注等用字關係。

每筆輸出資料都有 `sources[]`，目前以教育部《異體字字典》的單字查詢網址為追溯入口；有可靠《說文》節錄時保存原文，未附原文則明確標記，不自行補造。資料命令：

```bash
npm run build:data # 明確更新 id-map 並由 shards 重建 chars.json
npm run validate   # 純讀 schema／來源／雙軸分類／精確 220 字驗證
npm run content    # 24 字、雙軸契約與文案護欄測試
npm run logic      # 成長、題組、存檔遷移與安全匯入規則測試
npm run smoke      # Playwright 端到端煙霧測試（需本機 Chrome）
npm test           # validate + content + logic + smoke；不執行 merge、不造成 dirty
```

## 開發

無建置步驟。本機預覽：

```bash
python3 -m http.server 8080
```

改 `data/shards/*.json` 後先跑 `npm run build:data` 重建 `data/chars.json`，再跑 `npm test`。merge 遇到重複字會直接失敗；`data/id-map.json` 保留既有字的穩定 ID，新字只會從目前最大 ID 往後追加。

## 部署

Cloudflare Pages（liushu-quest.pages.dev）＋ Netlify（liushu-quest.netlify.app）鏡射。
