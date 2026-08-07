# 圖像素材來源清冊

盤點日期：2026-08-07。

## 共通來源與界線

- 生成服務：OpenAI 圖像生成服務（由 Codex 生圖工具呼叫）；生成日為 2026-08-07。工具介面沒有回傳可留存的底層模型版本，故本清冊不猜填型號。
- 輸入來源：本站原創故事、六書概念、歷史人物姓名、字例白話解說，以及本站自訂的「暖米白宣紙＋潑墨酒精暈染＋古代 Q 版人物」美術規格。字例圖 v2 只使用本站既有圖與四張核准校準圖作內容／風格參考，未傳入第三方圖片；其後提供的遊戲畫面只用於大師對戰介面資訊層次討論，沒有存入或重製於本儲存庫。
- 人為投入：逐張撰寫情節與角色需求、選圖、核對教學主題、裁切、轉為 WebP、統一版面比例、命名及配置到相對應章節。早期 26 張圖未保存完整逐次原始提示詞；新增 220 張單字圖則以四份 lane 文件保存共通 prompt 摘要、逐字對照、原始檔與最終檔位置。
- Git 紀錄：`898342719c60c04847212b88168ccac590206dc1`（故事與前四張概念圖）及 `ed0c8bd919d9764d438c83f4a36105a8bc046993`（人物、大師與其餘概念圖）。
- 供應者條款盤點：OpenAI 現行條款在 OpenAI 與使用者間，於法律容許範圍內將輸出權利歸使用者，但也明示輸出未必唯一、使用者仍須確保輸入及輸出利用合法。本清冊不把該契約約定誤寫成「保證不侵權」。
- 儲存庫沒有收錄教育部字形圖、古籍掃描、歷史肖像或素材網站圖片；人工檢視也未見浮水印或商標。
- 現有儲存庫不足以反向證明模型訓練資料或輸出唯一性，因此不宣稱「保證與任何既有作品都不相似」。若收到具體權利通知，依 `rights.html` 的暫停／查核流程處理。
- AI 生成部分是否達到台灣著作權法的保護要件，仍取決於可證明的人類創意投入；本站只對可受保護的選擇、編排與後續編修主張權利。

## 檔案清單

### 字例總覽單字情境圖

- 共 220 張，逐字對應 `data/chars.json`，網站檔位於 `img/chars/{id}.webp`。
- 生成方式：四線並行，每字各自呼叫 Codex built-in image generation tool，不以一張多格圖裁切冒充獨立生成。
- 視覺規格：暖米白宣紙、手繪墨線與飛白、朱砂／茶褐／赭金／孔雀青酒精墨暈染、古代 Q 版人物與單一故事情節；16:9；圖內不放漢字、古文字、字母、數字、標籤、Logo 或浮水印，也不使用 pastel 資訊卡或現代 UI 模組。
- 原始 PNG：依 lane 保存在 `~/Downloads/liushu-picture3-v2-source/lane-1/` 至 `lane-4/`，不納入 Git，避免儲存庫膨脹；上一版原圖仍保留於 `~/Downloads/liushu-picture3-source/`。
- 完整逐檔 ID、字、路徑、SHA-256、生成日期及原始檔位置見 `docs/char-image-provenance.json`；v2 工作紀錄見 `docs/image-v2-lane-1.md` 至 `docs/image-v2-lane-4.md`，統一美術規格見 `docs/char-art-bible-v2.md`。
- 圖片只作字形、本義與用字關係的教學想像；不宣稱是古文字拓片、歷史圖像或字形證據。正確文字內容仍由網站 HTML 與資料欄位呈現。

### 教學人物

- `img/characters/aman.webp` — `2613e4770c375d40c26a7c8e49ef265b094967cdc130958534b80bbf43520c13`
- `img/characters/cangjie.webp` — `e706d506e4dda1918edae63c7f098b1d8233626b1f061db7d91ac784ea203736`
- `img/characters/huangdi.webp` — `79d9bd19fb6ce9bda232445d979a8653edbc268e6745cb173d1dde105c862876`

### 概念導圖

- `img/concept/00-origin.webp` — `c66539727ae634252c3bd0e0a4fc3332aa3b6d995352b3f56fde684ce84d3eae`
- `img/concept/01-overview.webp` — `17adcfff6ead8be77fc68f0d76e96d147c10dcedf97b5755df90070815da84f8`
- `img/concept/02-pictograph.webp` — `c070caac5dc01361dc46641d95f7fd923a9b8d1079db0a63cf3f9db805c8797d`
- `img/concept/03-indicative.webp` — `9fa0da9118acd0547a368296f886586c261fd3228d429f3fceb46c3e8b9ea12f`
- `img/concept/04-compound.webp` — `a1a3f770f1c8b08d20359900ac844e1db1cc52d55f3237ea8e9984a0df24a534`
- `img/concept/05-loan.webp` — `7b5d6db2bd78ef72a1a2474ca1dd15a769e10aa74ca4cb5a7db6804428576113`
- `img/concept/06-phonetic.webp` — `954467fbdc8896909cfe337fb613ea212827932dda6b7599d21a753ce785a6ee`
- `img/concept/07-transfer.webp` — `4d8043691c4af10c85f4281ee2baea6df01eb45a004d356bfc3b768f43e9615a`

### 大師角色

- `img/masters/duanyucai.webp` — `431217e4cbcfa3a59a0946d95ab036b84853a48627522b388b206cc44002c1ae`
- `img/masters/guifu.webp` — `f18839d7a961857deb5bb2303789aa68ff70dd1e918637aa94ad4b7bc0315929`
- `img/masters/lisi.webp` — `97a3672b0eb5556e35f8ce3ff811662e097bf896400beb0599381a91f03ad4dc`
- `img/masters/wangjun.webp` — `0419c17845d290fcfb3118a5eaffd734ecaee2c92ef914cfd4d43e54a81bbf95`
- `img/masters/wangyirong.webp` — `80fc6f28fcded474712aaed1fab3bf38311642e8f64ae2d82252e794b014bcba`
- `img/masters/xushen.webp` — `312f4bec5d4ebc3c1986904f42d491c3c70b3bd0bf66c98fca13506cacf0cb9b`
- `img/masters/zhujunsheng.webp` — `f93fe887d56ef63ac3b0f8998838143866d38092b5043fbff5a1c43112cd80bc`

### 造字故事

- `img/story/00-prologue.webp` — `16a84494f6d136dca20d6cf6e7348b51d9fd88d7f232d6dce0c90cc14de654c5`
- `img/story/01-pictograph.webp` — `011044ba64a7cfa431fe1efca0b9a1cd57a62383f1fb669bce2e144bb79a532d`
- `img/story/02-indicative.webp` — `b7154ffbaf0fc252719cd8e2e9001e6ae792224175a0d0915112cfc14f53a715`
- `img/story/03-compound.webp` — `d9a8bfe1454ce4fd804b026f352511b8765475799c1387e2f4dd62afd126e554`
- `img/story/04-loan.webp` — `534138305875d68d31302582f386999b48358b2856ca2d4ab0b6f5e118380421`
- `img/story/05-phonetic.webp` — `24c4a7e1814c32215893c3bf72f2ae810ecec2f77b20e4fc7c3ef784ca52705a`
- `img/story/06-transfer.webp` — `a4e8031c1223818dd307aef020919cd30eaef04158a891ed391ce0b2e0c30f24`
- `img/story/07-epilogue.webp` — `1678986279df12c680b468e2392fc6889bcd6bfdf00c37ac8af8413a19db2447`

## 條款與官方說明

- OpenAI Terms of Use（2026-01-01）：https://openai.com/policies/terms-of-use/
- OpenAI Service Terms（2026-06-12）：https://openai.com/policies/service-terms/
- 經濟部智慧財產局 AI 生成圖畫著作權說明：https://www.tipo.gov.tw/tw/copyright/692-34252.html
