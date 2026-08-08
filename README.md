# 六書造字堂 liushu-quest

漢字六書（象形、指事、會意、形聲、轉注、假借）互動練功站。純前端靜態站、無框架、免帳號，進度存瀏覽器 localStorage（可匯出/匯入）。

## 功能

- **概念導讀與造字故事**：提供國中判讀、立即檢核、構形／用字一字兩問與離堂任務，並區分史料、教學編排與傳說
- **字例總覽**：220 字，依書類／難度篩選；每字各有一張 16:9「宣紙潑墨酒精暈染＋古代 Q 版人物」單字情境圖，字卡只顯示本站教學解說與分類層次
- **閃卡複習**：Leitner 5 盒間隔複習，弱點、到期卡優先，新字補位
- **自測闖關**：六書均衡與自適應題組、每日固定字陣；一般模式不以爭議字作無條件唯一答案
- **大師對戰**：8 位文字學大師各有專長題組，最多 10 回合；解鎖門檻＝真實精通字數
- **今日主線**：八卷故事旅程、短試煉、每日五題與不歸零的每週節奏
- **成長系統**：熟練度與有效精通分流；有效精通須跨日客觀作答並說出理由
- **課堂共學**：匿名小組先答、聽理由、再作答，呈現答案變化與證據牆，不設速度榜或排行榜
- **戰績與備份**：分類正確率、弱點字聚合、JSON 檔下載／選檔匯入，以及文字進度碼備援
- **共用學習工具**：家庭／課堂、學習紀錄、自學星圖與匿名到訪統計
- **家長陪學**：白話進度摘要、10 分鐘三步驟、陪問句、放大字級、家庭模式與休息計時

## 資料紀律

字例分類依《說文解字》與現行文字學通說整理，schema 見 `data/SCHEMA.md`；歸類有學界分歧的字標 `disputed` 並列為挑戰級。`category` 保留既有前端相容性，`formation_category` 與 `usage_relations` 分別保存字形構造、假借／轉注等用字關係。

每筆資料都在 shard 顯式保存 `formation_category`、`usage_relations[]` 與 `sources[]`，不由 merge 暗中推斷文字學結論。來源使用教育部《異體字字典》單一正字條目，分開記錄版本、存取日期、引用層級與核對狀態。《說文》節錄目前為已核對 179、待核 31、未附 10；待核內容不宣稱為已確認直接引文，也不猜測補寫。資料命令：

```bash
npm run build:data # 明確更新 id-map 並由 shards 重建 chars.json
npm run validate   # 純讀 schema／來源／雙軸分類／精確 220 字驗證
npm run content    # 24 字、雙軸契約與文案護欄測試
npm run philology  # 引用層級、《說文》三態與 shard/output 對齊測試
npm run teacher    # T01–T10 教學鷹架與文案護欄測試
npm run char-images # 220 張逐字配圖格式、比例、大小與 SHA-256 清冊
npm run copyright  # 權利聲明、246 圖來源與第三方授權護欄
npm run logic      # 成長、題組、存檔遷移與安全匯入規則測試
npm run smoke      # Playwright 端到端煙霧測試（需本機 Chrome）
npm test           # 上述全部純讀測試；不執行 merge、不造成 dirty
```

## 開發

無建置步驟。本機預覽：

```bash
python3 -m http.server 8080
```

改 `data/shards/*.json` 後先跑 `npm run build:data` 重建 `data/chars.json`，再跑 `npm test`。merge 遇到重複字會直接失敗；`data/id-map.json` 保留既有字的穩定 ID，新字只會從目前最大 ID 往後追加。

## 部署

Cloudflare Pages（liushu-quest.pages.dev）＋ Netlify（liushu-quest.netlify.app）鏡射。

## 權利與來源

原創教學文字、程式與人為編排的權利範圍，以及古籍核對資料、AI 生成配圖和第三方元件的界線，見 [`rights.html`](rights.html)、[`docs/text-provenance.md`](docs/text-provenance.md)、[`docs/asset-provenance.md`](docs/asset-provenance.md) 與 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。學生前台不展示外部原文或外部資料連結；台灣著作權風險審查紀錄見 [`docs/copyright-audit-2026-08-07.md`](docs/copyright-audit-2026-08-07.md)。
