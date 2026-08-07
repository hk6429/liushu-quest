# 第二輪文字學與引用層次審查（P01–P10）

審查基準：`c0b136f`。本輪不重複 `gamification-audit-40.md` 的 C01–C10；焦點是「來源能支持哪一層主張」、「引文核對狀態是否說實話」與「術語是古典定義、現代通說或本庫教學標籤」。

## 正式與學術來源

1. 教育部《異體字字典》[字典簡介](https://dict.variants.moe.edu.tw/page.jsp?ID=317)：說明本典是以正字統領異體、彙整古今字書文獻的字形彙典，可作正字條目與文獻形體入口，不是每個現代古文字學判斷的唯一論據。
2. 教育部《異體字字典》[操作說明](https://dict.variants.moe.edu.tw/page.jsp?ID=5)：正文內容頁區分正字、異體字、文獻形體資料，並明言「說文釋形」僅見於部分正字。
3. 教育部《重編國語辭典修訂本》[假借](https://dict.revised.moe.edu.tw/dictView.jsp?ID=89728&la=0&powerMode=0)、[轉注](https://dict.revised.moe.edu.tw/dictView.jsp?ID=119368&la=0&powerMode=0)：保存「本無其字，依聲託事」與「建類一首，同意相受」的許慎定義。
4. 中央研究院歷史語言研究所學術論文[〈六書條例中的幾個問題〉](https://www11.ihp.sinica.edu.tw/storage/w2_file/3831tuGvHGv.pdf)：指出前四類已可處理構形，轉注、假借屬文字形成後的次級發展，支持本庫必須明示分類層次。
5. 由臺大中文系、中研院史語所與資訊所等單位共建的[小學堂](https://xiaoxue.iis.sinica.edu.tw/) 提供甲骨文、金文、小篆等字形演變查核入口。本輪沒有完成 220 字的逐字古文字形引證，因此不把正字字典連結擴張成「所有 explain 都已學術驗證」。

## 十項新問題與修正

| ID | 問題與證據 | 修正策略 | 可驗收條件 |
|---|---|---|---|
| P01 | 220 筆 `sources.url` 原全為 `search.jsp?...WORD=...` 搜尋結果，不是單一正字條目。教育部操作說明也區分「檢索結果頁」與「正文內容頁」。 | 逐字解析正字條目 ID，220 筆改用 `dictView.jsp?ID=...` 直接連結。 | `validate` 與 `philology.test` 拒絕搜尋頁；220 個 URL 均符合單筆條目格式。 |
| P02 | 原來只寫「教育部《異體字字典》」，沒有版本；但線上條目明示為「臺灣學術網路十四版（正式七版）2024」。 | 每筆來源新增 `edition`，統一記錄當次核對版本。 | 220 筆來源均有非空 `edition`，文字學測試鎖定本輪版本字串。 |
| P03 | 原欄位 `verified_at` 實際只記網頁日期，卻在語意上宣稱「已驗證」，導致存取日與學術核對混為一談。 | 改為 `accessed_at`，另立 `verification_status`與詞條層的 `shuowen_status`。 | 任一 source 出現 `verified_at` 即失敗；日期與核對狀態必須各自通過 enum 與格式檢查。 |
| P04 | shard 原本 0/220 有 `sources`、`formation_category`、`usage_relations`；這些學術欄位全由 merge 後補，使編輯原稿無法審查。 | 把分類、關係與來源全部回寫 shard；merge 只保留 ID 套用與排序。 | 220 筆 shard 均明填三類欄位；比對 shard/output 必須逐欄相等；merge 不得再有 hard-coded override/generator。 |
| P05 | 原驗證器只檢查 `source.quote === shuowen`，這是資料自我相等，不能證明網頁真有此文。逐條對照教育部正字頁後，179 筆可直接比對、31 筆受異體、字圖缺字或頁面錯誤影響無法保守確認、10 筆本就未附。 | 建立 `已核對／待核／未附` 三態；無法直接比對者不猜、不改寫個別條文，標成待核。 | 文字學測試精確核對 `179/31/10`；「待核」不得使用 `直接引文`層級。 |
| P06 | `basis` 原統一稱「《說文解字》釋形原文」，但 `shuowen` 實為條文節錄，且教育部說明「說文釋形」只存於部分正字；「原文」也沒有指明大徐本或段注本。 | 將欄位定義改為「《說文》條文節錄」；只有已核引文才用 `basis: 正字條目「說文釋形」`，其餘只稱正字條目。 | `直接引文` 必須同時滿足已核對、非空條文、quote 逐字相同；未滿足不得升級。 |
| P07 | `category` 在前四類表構形，在轉注、假借卻表用字關係，即使已有雙軸，欄位本身仍沒有明說「此次分類的對象」。中研院學術論文亦區分前四類構形與後兩類次級發展。 | 新增 `classification_scope`，前四類為 `構形`，轉注、假借為 `用字關係`。 | 220 筆均必填，且值必須由 category 可決定；任一「轉注／假借＋構形」即失敗。 |
| P08 | `FORMATION_OVERRIDES`、`RELATED` 與 generator 隱在 `merge.mjs`；「老＝象形」、「考＝形聲」、關聯字等方法無法在詞條原稿上逐筆審批。 | 移除所有學術推斷函式，`formation_category` 與 `usage_relations` 都改為 shard 顯式資料。 | 測試掃描 merge 不得出現原 override/generator；合併前後兩欄必須完全不變。 |
| P09 | `同體會意／異體會意`與 `有借有還／有借不還` 共用 `sub`，但一組是部件組合教學分組，另一組是後續用字結果的講授標籤；後者不是許慎定義原詞。 | 新增 `sub_scope`，明示標記「會意部件教學分組」或「假借後續用字結果教學分組」。 | 有 `sub` 必有唯一對應 `sub_scope`；無 `sub` 時固定為 `null`。 |
| P10 | 原轉注 relation 用「互訓關係」直述，未說明這是本庫採用的轉注解釋。許慎只給「建類一首，同意相受，考老是也」，後世解釋歷來有異，不應把「互訓」與「轉注」不加層次地畫等號。 | relation 新增 `relation_basis`、`relation_status`；轉注明標 `互訓說／教學採說`，note 必須告知「歷來有異說，非唯一定論」。假借則以許慎「依聲託事」標示理據。 | 所有轉注 relation 均需同時通過 basis/status/note 三項斷言；不得再用無限定的通用 note。 |

## 驗收方法

```bash
node scripts/merge.mjs
node scripts/validate.mjs
node scripts/content.test.mjs
node scripts/philology.test.mjs
```

另外比對改前後 `data/id-map.json` SHA-256 與字→ID map；`id-map` 必須零變動，合併後仍精確 220 字。

## 未完成與不越界項

- 31 筆《說文》候選節錄因異體、字圖缺字、版本差異或條目頁錯誤，本輪只標 `待核`，不擅改個別字詞。
- 220 字 `explain` 中的甲骨、金文及構形觀點尚未逐字建立古文字形引證；現有教育部正字條目只作條文與正字資料來源，不擴張為全文解說的證明。
- 前端目前不顯示 `shuowen_status`、`classification_scope` 與引用層次；本任務明禁修改 JS UI，因此僅完成資料契約與測試防線，不越界更動介面。
