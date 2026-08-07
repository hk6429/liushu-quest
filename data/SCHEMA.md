# 六書造字堂詞條 schema（v2）

`data/shards/*.json` 是編輯來源；`npm run build:data` 依 `data/id-map.json` 產生 `data/chars.json`。前端仍可讀取既有 `category`、`sub` 欄位；v2 另用 `formation_category`、`usage_relations` 拆開字形構造與用字關係。

## Shard 編輯格式

```json
{
  "id": "TEMP",
  "char": "日",
  "zhuyin": "ㄖˋ",
  "category": "象形",
  "sub": null,
  "level": "基礎",
  "explain": "甲骨文畫太陽的輪廓，中間一點表示日中有物（或作區別符號）。畫成其物、隨體詰詘的典型象形字。",
  "shuowen": "實也。太陽之精不虧。",
  "disputed": false,
  "dispute_note": ""
}
```

- `id`：shard 一律填 `TEMP`；輸出 ID 由 `id-map.json` 鎖定。新增字只追加 ID，既有 ID 不重編。
- `char`：單一正體漢字；所有 shard 間不得重複，重複即停止 merge。
- `zhuyin`：教育部審訂國語音；多音字取詞條教學所用主音。
- `category`：向下相容的教學主類，只能是 `象形`、`指事`、`會意`、`形聲`、`轉注`、`假借`。
- `sub`：會意填 `同體會意`／`異體會意`；假借填 `有借有還`／`有借不還`；其餘填 `null`。
- `level`：`基礎`、`進階`、`挑戰`。`disputed:true` 必須是 `挑戰`。
- `explain`：40–220 個 Unicode 字元。形聲字須明說形符與聲符；會意字須說明部件；假借字須說明本義與借義。
- `shuowen`：《說文解字》釋形原文節錄。無可靠原文填 `""`，不可補造；輸出來源會明示「未附《說文》原文」。
- `disputed`：boolean；有學說分歧填 `true`。
- `dispute_note`：string；爭議字必填，非爭議字固定為空字串。

## Merge 後新增欄位

```json
{
  "formation_category": "會意",
  "usage_relations": [
    {
      "type": "假借",
      "sub": "有借不還",
      "related_chars": ["暮"],
      "note": "本義與借義的關係見 explain。"
    }
  ],
  "sources": [
    {
      "provider": "教育部《異體字字典》",
      "basis": "《說文解字》釋形原文",
      "url": "https://dict.variants.moe.edu.tw/search.jsp?QTP=0&WORD=%E8%8E%AB",
      "quote": "日且冥也。从日在茻中。",
      "verified_at": "2026-08-07"
    }
  ]
}
```

- `formation_category`：字形本身的構造，只能是四種造字類 `象形`、`指事`、`會意`、`形聲`。
- `usage_relations`：用字關係陣列；元素 `type` 只能是 `假借` 或 `轉注`。同一字可同時保有構形與用字關係，例如「莫」是會意構形，另有假借關係。
- `sources`：至少一筆，必含 `provider`、`basis`、`url`、`quote`、`verified_at`。有 `shuowen` 時至少一筆 `quote` 必須逐字相同；沒有原文時 `quote` 固定為「未附《說文》原文」。

## 資料命令

```bash
npm run build:data  # 明確更新 id-map 並重建 chars.json
npm run validate    # 純讀驗證；精確要求 220 字
npm test            # validate + content tests + smoke；不執行 merge
```

分類與原文以《說文解字》及現行文字學通說為準，可交叉核對教育部《異體字字典》與小學堂。找不到可靠證據時留空或標爭議，不為配額猜測。
