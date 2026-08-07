# 六書造字堂詞條 schema（v3）

`data/shards/*.json` 是唯一編輯來源；`npm run build:data` 只排序、套用 `data/id-map.json` 與產生 `data/chars.json`，不得在 merge 階段推斷文字學分類、用字關係或引用層次。前端相容欄位 `category`、`sub` 保留，但其學術語義由下列欄位限定。

## Shard 必要欄位

```json
{
  "id": "TEMP",
  "char": "日",
  "zhuyin": "ㄖˋ",
  "category": "象形",
  "classification_scope": "構形",
  "sub": null,
  "sub_scope": null,
  "level": "基礎",
  "explain": "……",
  "shuowen": "實也。太陽之精不虧。",
  "shuowen_status": "已核對",
  "disputed": false,
  "dispute_note": "",
  "formation_category": "象形",
  "usage_relations": [],
  "sources": [
    {
      "provider": "教育部《異體字字典》",
      "edition": "臺灣學術網路十四版（正式七版）2024",
      "basis": "正字條目「說文釋形」",
      "url": "https://dict.variants.moe.edu.tw/dictView.jsp?ID=19589",
      "quote": "實也。太陽之精不虧。",
      "citation_level": "直接引文",
      "verification_status": "已核對",
      "accessed_at": "2026-08-07"
    }
  ]
}
```

- `id`：shard 固定填 `TEMP`；輸出 ID 只由 `id-map.json` 決定。新字只能往現有最大 ID 後追加。
- `char`：單一正體漢字；所有 shard 間不得重複。
- `zhuyin`：教學詞條所用之教育部審訂國語音；多音字不代表已收齊所有讀音。
- `category`：前端教學主類，只能為 `象形`、`指事`、`會意`、`形聲`、`轉注`、`假借`。
- `classification_scope`：前四類固定為 `構形`；`轉注`、`假借` 固定為 `用字關係`。這是資料層次聲明，不把六類都寫成同一種「造字法」。
- `sub`：會意可填 `同體會意`／`異體會意`；假借可填 `有借有還`／`有借不還`；其餘為 `null`。
- `sub_scope`：與 `sub` 成對。會意填 `會意部件教學分組`；假借填 `假借後續用字結果教學分組`；無 `sub` 時為 `null`。「有借有還／不還」是本專案的教學整理標籤，不是許慎《說文解字》敘中的原始術語。
- `level`：`基礎`、`進階`、`挑戰`；`disputed:true` 必須為 `挑戰`。
- `explain`：40–220 個 Unicode code point。形聲字須明說形符與聲符；會意字須說明部件；假借字須分開本義與借義。
- `shuowen`：《說文解字》條文節錄；不是「整段都為釋形說明」的聲明。無可靠引文填空字串。
- `shuowen_status`：`已核對`、`待核`、`未附`。只有與所引正字條目可逐字核對者可標 `已核對`；「待核」不可裝作已核引文。
- `disputed` / `dispute_note`：有分類或釋形異說時填 `true` 並說明觀點邊界；非爭議字的 `dispute_note` 為空字串。
- `formation_category`：必須在 shard 中明填 `象形`、`指事`、`會意`、`形聲` 之一；merge 不推斷。

## 用字關係

`usage_relations` 元素必含：

```json
{
  "type": "轉注",
  "sub": null,
  "related_chars": ["老"],
  "relation_basis": "互訓說",
  "relation_status": "教學採說",
  "note": "本條採互訓說作教學整理；轉注定義歷來有異說，不視為唯一定論。"
}
```

- `type` 只能是 `假借` 或 `轉注`。
- 假借關係的 `relation_basis` 為 `依聲託事`；轉注關係的本庫採說為 `互訓說`。
- `relation_status` 目前固定為 `教學採說`，避免把個別字例或轉注解釋寫成無爭議定論。

## 引用層次

`sources` 至少一筆，每筆必含 `provider`、`edition`、`basis`、`url`、`quote`、`citation_level`、`verification_status`、`accessed_at`。

- `url` 必須是可回到單一正字資料的 `https://dict.variants.moe.edu.tw/dictView.jsp?ID=...`，不接受搜尋結果頁當成直接引據。
- `accessed_at` 只是存取日期，不等於學術主張已驗證；不再使用語意混淆的 `verified_at`。
- `citation_level: 直接引文` 時，`verification_status` 必須為 `已核對`，`quote` 必須與 `shuowen` 逐字相同。
- `shuowen_status: 待核` 時，只能使用 `citation_level: 檢索入口`，`quote` 固定為 `待逐字核對《說文》條文`。
- `shuowen_status: 未附` 時，`shuowen` 必須為空字串，`quote` 固定為 `未附《說文》原文`。
- 字頭頁可支持條文節錄與正字資料，不會自動支持 `explain` 中每一個古文字構形或學說判斷。

## 正式來源邊界

- 教育部《異體字字典》[ 操作說明](https://dict.variants.moe.edu.tw/page.jsp?ID=5) 明言「說文釋形」只見於部分正字，並區分正文內容與文獻形體影像。
- 教育部《重編國語辭典修訂本》[轉注](https://dict.revised.moe.edu.tw/dictView.jsp?ID=119368&la=0&powerMode=0)、[假借](https://dict.revised.moe.edu.tw/dictView.jsp?ID=89728&la=0&powerMode=0) 條保存許慎定義，用來界定本庫術語層次。
- 中央研究院等單位共建的[小學堂](https://xiaoxue.iis.sinica.edu.tw/) 是古文字形演變的學術查核入口；本輪未完成 220 字逐字古文字形引證，不假裝已完成。

## 資料命令

```bash
npm run build:data
npm run validate
npm run content
node scripts/philology.test.mjs
```

`npm run build:data` 是寫入操作；只能在確認 `data/chars.json` 是可安全重建的產物後執行。`validate`、`content` 與 `philology.test.mjs` 均為純讀。發布仍精確要求 220 字、ID 不漂移。
