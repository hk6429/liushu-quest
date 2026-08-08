// 概念導讀：文字起源 → 形音義 → 六書總覽（教學解說均為本站重新撰寫）
const LSConcept = (() => {
  const Y = '<span class="fyimark has">✔</span>';
  const N = '<span class="fyimark hasnot">✘</span>';

  const html = `
<div class="card">
  <h2>這一課要學會什麼？</h2>
  <p>讀完後，你應該能完成三件事：</p>
  <ol>
    <li>先判斷題目問的是<b>字形怎麼構成</b>，還是<b>字後來怎麼被使用</b>。</li>
    <li>用古文字形、部件表義或表音等<b>證據</b>判斷，不只看楷書長得像什麼。</li>
    <li>說出答案的理由，也能指出容易混淆的另一類為何不合。</li>
  </ol>
  <p class="muted">課堂成功標準：看到一個字，能用「我判斷是＿＿，因為＿＿」完整說明，而不是只背類別名稱。</p>
</div>

<div class="card">
  <h2>文字誕生之前：三種不完整的表達</h2>
  <figure class="story-fig"><img src="img/concept/00-origin.webp" alt="結繩記事、壁畫、語言到文字的演進圖" loading="lazy"></figure>
  <p>在成熟文字系統形成以前，人們也會用繩結、圖畫與口語記事、溝通；若從「能否穩定記錄語詞」來看，這些方式各有限制：</p>
  <div class="origin-grid">
    <div class="origin-cell"><b>結繩記事</b>穩定字形 ${N}　固定讀音 ${N}　記事功能 ${Y}<p class="muted">繩結當然有物理形狀；限制在於它通常沒有固定字形逐一對應語詞，也不能直接提示讀音。</p></div>
    <div class="origin-cell"><b>壁畫</b>形 ${Y}　音 ${N}　義 ${Y}<p class="muted">圖畫能傳達畫面與意思，但未必固定記錄某一句話或某一個語詞。</p></div>
    <div class="origin-cell"><b>口語</b>形 ${N}　音 ${Y}　義 ${Y}<p class="muted">說話有聲音與意思；若沒有另外記錄，聲音說完就消失。</p></div>
  </div>
  <p><b>成熟漢字以約定字形記錄語詞，使字形、讀音與意義建立可傳承的聯繫。</b></p>
  <p class="muted">「形、音、義」是觀察漢字的三個面向，不表示每個字永遠只有一個讀音或一個意思；多音字與一字多義正提醒我們要放回詞語、語境判讀。</p>
  <p class="muted">💡 想用聽故事的方式學？去「<a href="#" onclick="LSApp.go('story');return false">造字故事</a>」分頁。故事幫助記憶，判斷仍要回到文字證據。</p>
</div>

<div class="card">
  <h2>六書總覽：先分清楚題目在問什麼</h2>
  <figure class="story-fig"><img src="img/concept/01-overview.webp" alt="六書總覽：四種造字法與兩種用字法" loading="lazy"></figure>
  <p class="concept-toc">
    <span class="pill cat-象形">象形</span><span class="pill cat-指事">指事</span><span class="pill cat-會意">會意</span><span class="pill cat-形聲">形聲</span>＝構形方式；
    <span class="pill cat-轉注">轉注</span><span class="pill cat-假借">假借</span>＝用字關係。
  </p>
  <p><b>第一問：這個字形怎麼構成？</b>再從象形、指事、會意、形聲判斷。<br><b>第二問：這個字和別的字義如何使用、轉移？</b>再看轉注、假借。</p>
  <p class="muted">「六書」一詞最早見於《周禮》，東漢許慎在《說文解字．敘》為六書一一下了定義並舉出例字。把前四書稱為構形方式、後兩書稱為用字關係，是後世常見的「四體二用」教學整理，並非許慎原文，學者也有不同解釋。本站採現代常見教學次序介紹：象形、指事、會意、假借、形聲、轉注；這是本站教學編排，不是《說文解字．敘》的原序，也不是漢字依序誕生的時間表。《說文解字．敘》原列次序為指事、象形、形聲、會意、轉注、假借。</p>
</div>

<div class="card">
  <h2><span class="pill cat-象形">一</span> 象形：依物體輪廓構成字形</h2>
  <figure class="story-fig"><img src="img/concept/02-pictograph.webp" alt="日月山水的甲骨文字形演變" loading="lazy"></figure>
  <p>依物體的樣子描畫，線條隨形體彎曲，是漢字早期常見的獨體構形方式。</p>
  <p class="example-chars">日 月 山 水 木 火</p>
  <h3>國中判讀：看古文字形，不猜現代字形</h3>
  <p class="muted"><b>① 先找所畫的物體</b>：如「日」的早期字形畫太陽輪廓，「山」畫相連山峰。<br>
  <b>② 再看整體是否以描摹為主</b>：楷書經過長期演變，今天「看起來很像」只能提供假設，不能單獨當證據。</p>
  <details><summary>立即檢核：為什麼「本」不歸象形？</summary><p>「木」提供物體輪廓，但下方短橫專門指出樹根部位；判斷重點是「加記號指出位置」，因此歸指事。</p></details>
</div>

<div class="card">
  <h2><span class="pill cat-指事">二</span> 指事：用符號指出抽象概念或部位</h2>
  <figure class="story-fig"><img src="img/concept/03-indicative.webp" alt="上下本末刃旦的指事記號示意" loading="lazy"></figure>
  <p>用<b>抽象符號</b>表示概念，或在既有字形上<b>加指示記號</b>標出重點。</p>
  <p class="example-chars">上 下 本 末 刃 旦</p>
  <h3>國中判讀：分清楚「部件」與「記號」</h3>
  <p class="muted"><b>① 純符號指事</b>：如「上、下」，以基準線和短畫表示方位。<br>
  <b>② 象形加記號</b>：如「本、末、刃」，短橫或點只負責指出部位，本身不是另一個有獨立意義的字形部件。</p>
  <details><summary>立即檢核：「本」和「休」都看得到「木」，如何區分？</summary><p>「本」在木下加指示記號，重點是指出樹根；「休」由人、木兩個有意義的部件會合出休息之意。前者指事，後者會意。</p></details>
</div>

<div class="card">
  <h2><span class="pill cat-會意">三</span> 會意：有意義的部件會合出新義</h2>
  <figure class="story-fig"><img src="img/concept/04-compound.webp" alt="人與樹、日與月，以及重複的樹木、水波與金錠組合出新意義" width="1200" height="676" loading="lazy"></figure>
  <p>兩個以上具有意義的部件組合，從部件關係會合出新意思。許慎舉「武、信」為例。</p>
  <p class="example-chars">休 步 明 林 森 淼 鑫</p>
  <h3>國中判讀：必須說出部件關係</h3>
  <p class="muted"><b>① 同體會意</b>：相同部件重複，如二木為「林」、三木為「森」。<br>
  <b>② 異體會意</b>：不同部件組合，如「休」以人、木構成休息的意象，「步」以兩個方向相反的足形表示行走。</p>
  <p class="muted">相同部件重複<b>不等於永遠只是「數量變多」</b>；這只是部分字例的構形方式。判斷個別字時，仍要查古文字形與可靠釋形。「明＝日＋月」等說法可作入門拆解，但不能把所有看圖聯想都當成造字證據。</p>
  <details><summary>立即檢核：兩個形體放在一起，就一定是會意嗎？</summary><p>不一定。若一個部件表意、另一個部件主要提示讀音，應判作形聲；必須說明各部件的功能。</p></details>
</div>

<div class="card">
  <h2><span class="pill cat-假借">四</span> 假借：借現成字記錄同音或近音語詞</h2>
  <figure class="story-fig"><img src="img/concept/05-loan.webp" alt="同音借用與為原義另造新字的情境流程" width="1200" height="676" loading="lazy"></figure>
  <p>想記錄的語詞原本沒有專用字，就借用一個讀音相同或相近的現成字。假借說的是<b>字與語詞意義的使用關係</b>，不是借來的字形如何構成。</p>
  <h3>國中判讀：先找本義，再看借義</h3>
  <p class="muted"><b>① 有借有還（故事暫稱）</b>：本義、借義並存，同一個字保留多種用法；這只是「一字多義」的可能來源之一。<br>
  <b>② 有借不還</b>：借義占用本字，本義另造字。例如「其」的字形本象畚箕，後借作代詞，本義另造「箕」；「莫」的構形會日暮之意，後借為否定用法，本義另造「暮」。</p>
  <p class="muted">上述名稱是便於入門的記憶說法，不是真的借物。另有「烏→嗚、舍→捨」這類替<b>借義另造</b>新字的分化現象，本站另列，不混入故事的二分。部分本義另造字的例子能幫助理解形聲字的形成，但不是所有形聲字的單一起源或固定時間順序。</p>
  <details><summary>立即檢核：「莫」究竟是會意還是假借？</summary><p>兩個答案可在不同問題下成立：問字形構成，答會意；問它被用作否定詞的關係，答假借。先看題幹問哪一軸。</p></details>
</div>

<div class="card">
  <h2><span class="pill cat-形聲">五</span> 形聲：一部分表義，一部分提示讀音</h2>
  <figure class="story-fig"><img src="img/concept/06-phonetic.webp" alt="形符與聲符以六種常見位置組合成完整字形" width="1200" height="676" loading="lazy"></figure>
  <p>一部分以<b>形符</b>提示意義類別，另一部分以<b>聲符</b>提示造字時或較早時期的讀音。兩部分不一定各占字形的一半，也不能只按左右位置猜。</p>
  <p class="example-chars">江 河 晴 想 園 聞</p>
  <h3>國中判讀：義、音、證據三步查</h3>
  <p class="muted"><b>① 義</b>：哪個部件提示意義類別？如「江、河」的水旁。<br>
  <b>② 音</b>：哪個部件提供讀音線索？如「江」的工、「河」的可。<br>
  <b>③ 證據</b>：古今語音會變，若現代國語讀音差很多，不能因此直接否定形聲，也不能因讀音恰好相同就直接認定。</p>
  <p class="muted">形符與聲符有左、右、上、下、內、外等常見位置，例如江、鴿、草、想、園、聞；<b>位置只協助觀察，不是分類答案</b>。聲符是線索，不是現代國語讀音的保證。</p>
  <details><summary>立即檢核：「江」和「工」今天讀音差很多，為何仍可判形聲？</summary><p>形聲分析看的不是只有現代國語。水旁提示水類，工是較早語音的線索；古今音變後，現代讀音可能已不相同。</p></details>
</div>

<div class="card">
  <h2><span class="pill cat-轉注">六</span> 轉注：同類近義字彼此訓釋</h2>
  <figure class="story-fig"><img src="img/concept/07-transfer.webp" alt="考與老兩個近義字彼此解釋的示意" width="1200" height="676" loading="lazy"></figure>
  <p>本站採常見的<b>互訓說</b>作教學解釋：同類、近義的字可以彼此訓釋。早期材料只留下簡短說明與「考、老」二例，後世對轉注的精確條件仍有不同解釋；時間或地域差異可幫助故事想像，但不是必要判準。</p>
  <p class="example-chars">考 ⇄ 老</p>
  <h3>國中判讀：轉注回答的是字際關係</h3>
  <p class="muted">早期字書以「考、老」示範近義字彼此訓釋。這不表示兩個字的字形都由「轉注法」造出；就本站採用的雙軸分析，「老」的構形為象形、「考」的構形為形聲，二字另有轉注關係。</p>
  <details><summary>立即檢核：「考」只能回答轉注嗎？</summary><p>不能脫離題幹。問「考、老如何互相解釋」可答轉注；問「考字本身如何構成」則要回答形聲。</p></details>
</div>

<div class="card">
  <h2>一字兩問：避免把六書硬塞成單一標籤</h2>
  <p><b>莫</b>：字形構成＝會意；借作否定詞＝假借關係。<br><b>考</b>：字形構成＝形聲；與「老」互訓＝轉注關係。</p>
  <p class="muted">答題句型：「題目問的是＿＿（構形／用字），所以我判斷為＿＿；證據是＿＿。」</p>
  <details><summary>離堂檢核：請用句型說明「其」</summary><p>題目若問構形，「其」本象畚箕，屬象形；若問借作代詞的用字關係，屬假借。本義後來另造「箕」字表示。</p></details>
</div>

<div class="card">
  <h2>內容說明</h2>
  <p class="muted">本頁的教學解說、判讀步驟與例句均為本站重新撰寫。分類事實由編輯端查核，學生前台不展示外部原文或外部資料連結；故事、圖像與口訣只服務記憶，不取代古文字證據。</p>
</div>

<div class="card">
  <h2>開始練功</h2>
  <p>讀完概念後，可依理解程度選路線：還說不清六書差異，先讀<b>造字故事</b>並完成每章停看聽；能說出判斷理由，再用<b>閃卡複習</b>與<b>自測闖關</b>檢驗。答錯的字會回到閃卡第一盒，供後續複習。</p>
  <div class="btnrow">
    <button class="btn" onclick="LSApp.go('story')">帶著問題讀故事</button>
    <button class="btn ghost" onclick="LSApp.go('quiz')">用自測驗證</button>
  </div>
</div>`;

  function render(el) { el.innerHTML = html; }
  return { render };
})();
