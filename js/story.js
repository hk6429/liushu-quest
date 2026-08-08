// 造字故事：穿越小說筆法，以本站教學次序串起記憶情節；故事不是漢字發展史
const LSStory = (() => {
  const html = `
<div class="card story-card">
  <h2>重生之我在上古看造字</h2>
  <p class="muted"><b>閱讀界線：</b>「國中生穿越到上古」與倉頡、黃帝的對話全是教學創作，不是造字史實；六章採本站的現代教學編排（象形、指事、會意、假借、形聲、轉注），不是《說文解字．敘》的原序，也不是六種方法先後發明的時間表。《說文解字．敘》原列指事、象形、形聲、會意、轉注、假借。每個字的「小故事」只幫你記住線索，判斷字例仍要查古文字形、讀音與可靠釋形。</p>
  <p><b>帶著任務讀：</b>每讀完一章，先闔上文字回答「這一類看什麼證據？」再展開「停看聽」核對。</p>
  <details class="story-character-guide"><summary>先認識故事人物（可選）</summary><div class="story-characters" aria-label="故事人物">
    <figure><img src="img/characters/aman.webp" alt="虛構人物阿滿的教學插圖：從現代穿越的國中生" width="800" height="1000" loading="eager"><figcaption><b>阿滿</b><span>穿越的國中生・你的視角</span></figcaption></figure>
    <figure><img src="img/characters/cangjie.webp" alt="傳說人物倉頡的教學插圖：四目、手持毛筆與竹簡" width="800" height="1000" loading="lazy"><figcaption><b>倉頡</b><span>傳說人物・造字的師父</span></figcaption></figure>
    <figure><img src="img/characters/huangdi.webp" alt="傳說人物黃帝手持竹簡的教學插圖" width="800" height="1000" loading="lazy"><figcaption><b>黃帝</b><span>傳說人物・出難題的老闆</span></figcaption></figure>
  </div></details>

  <h3>楔子：段考前一晚，我睡死在六書講義上</h3>
  <figure class="story-fig"><img src="img/story/00-prologue.webp" alt="教學故事場景：倉頡在掛滿繩結的庫房裡翻找，黃帝拿著竹簡出現在門口" loading="lazy"></figure>
  <p>我叫阿滿，國中二年級。段考前一晚，我盯著講義上「象形、指事、會意、形聲、轉注、假借」十二個字，背了三遍還是像在背咒語。我趴在桌上想：「這些到底是誰發明的啊……發明的人出來面對！」</p>
  <p>然後我就睡著了。</p>
  <p>再睜開眼，我躺在一間昏暗的庫房裡，天花板垂下幾百條繩子，每條繩子上打滿大大小小的結，像一片壯觀的麵條瀑布。一個高高瘦瘦的老人正在繩堆裡翻找，翻得滿頭大汗。他一轉頭——我差點叫出來。他有<b>四隻眼睛</b>。</p>
  <p>「小孩，別發呆，幫我找『去年秋天東邊部落送來的牛』！」老人吼道。</p>
  <p>我這才搞清楚狀況：這裡是傳說裡的上古時代，四隻眼睛的老人就是黃帝的史官<b>倉頡</b>。這個時代<b>還沒有字</b>。人們靠<b>繩結</b>輔助記事：大事打大結，小事打小結。可是門口的黃帝一句「去年秋天東邊部落送來幾頭牛？」就讓倉頡冷汗直流——這個結……是牛？還是羊？還是隔壁老王欠的三袋米？</p>
  <p>我看著那片繩結瀑布，忽然懂了講義上沒寫的事：<b>繩結有形狀、能記事，卻未必以固定字形逐一對應語詞，也不能提示讀音</b>，全靠人腦硬記約定。難怪倉頡快抓狂。</p>
  <p>「不行！」倉頡一拍大腿，「我需要一套能穩定記錄語詞的符號！」他四隻眼睛齊刷刷看向我：「小孩，你剛剛喃喃自語什麼『象形指事』的，聽起來像個懂行的。跟我走。」</p>
  <p>就這樣，我成了倉頡的小徒弟。我心想：反正段考也是要背六書，不如親眼看它們一個一個被「發明」出來。</p>
  <p class="muted">接下來的故事裡，我們會從<b>字形、讀音、意義</b>三個面向觀察漢字。這三個面向不是一對一：同一個字可能有多個讀音或意思，要放回詞語與語境判讀。</p>

  <h3>第一章　象形：照著東西的輪廓，畫下第一批字</h3>
  <figure class="story-fig"><img src="img/story/01-pictograph.webp" alt="教學故事場景：倉頡在河邊沙地畫出日月山水的象形符號" loading="lazy"></figure>
  <p>第二天清晨，倉頡帶我到河邊想事情。他蹲在沙地上發呆，我蹲在旁邊打哈欠。</p>
  <p>抬頭一看，天上掛著一顆圓滾滾的太陽。</p>
  <p>「有了！」倉頡撿起樹枝，在沙地上畫了一個圓圈，中間加上一點：「就照著它的樣子畫。我們約定，這個圖形記錄『<b>日</b>』。」</p>
  <p>我湊過去看。那個圓圈裡的一點，據說是要跟「隨便畫的圓圈」區分開來——這是「日」的第一個小故事：<b>太陽天天掛在天上，是全部落的人都認得的東西，照著輪廓畫，誰看了都能猜到</b>。</p>
  <p>「那晚上那個呢？」我指指天空。倉頡笑了：「月亮跟太陽不一樣。你有沒有發現，月亮<b>大部分的日子都是缺的</b>？滿月一個月才幾天。」所以他畫「<b>月</b>」不畫圓形，畫一彎月牙——用「常常缺一角」的樣子，跟圓滾滾的「日」分開。我心裡默默筆記：以後看到彎彎的字形，先想想月亮。</p>
  <p>接著倉頡越畫越起勁。遠方的山稜線起起伏伏，他挑了最有代表性的樣子：<b>三座相連的山峰</b>，畫成「<b>山</b>」。腳邊的河水抓不住、畫不圓，他就畫<b>彎彎曲曲的水流線條</b>，中間一條主流、旁邊幾點水花，成了「<b>水</b>」。</p>
  <p>「師父，樹呢？樹那麼複雜，葉子要畫幾片？」我故意刁難他。</p>
  <p>「笨徒弟，畫輪廓不是畫寫生。」倉頡在沙地上畫了一豎，上面分出枝枒、下面伸出根鬚：「上面是枝、下面是根，這就是『<b>木</b>』。葉子會掉，枝幹不會。<b>抓住形體最關鍵的骨架，捨掉細節</b>，這才是畫字。」</p>
  <p>那天晚上，部落生火煮飯。火焰往上竄動、尖尖的舌頭跳來跳去，倉頡就著火光畫下一團往上冒的火苗，成了「<b>火</b>」。他看著沙地上這一排字，四隻眼睛都在發亮。</p>
  <p>我幫他總結（其實是抄我自己的講義）：<b>依物體輪廓描畫，線條跟著形體轉折</b>，這一類叫<b>象形</b>。</p>
  <p class="muted">✏️ 本章字例：日、月、山、水、木、火。字例分類須看<b>古文字形</b>；不是現代楷書「看起來像」就算象形。</p>
  <details><summary>停看聽 1：象形最重要的證據是什麼？</summary><p>早期字形是否以描摹物體輪廓為主，而不是只靠現代字形聯想。</p></details>

  <h3>第二章　指事：畫不出來的，就用記號「指」給你看</h3>
  <figure class="story-fig"><img src="img/story/02-indicative.webp" alt="教學故事場景：阿滿指著木字上下的記號，分辨本末等指事字" loading="lazy"></figure>
  <p>象形字用了一陣子，我先踢到鐵板的。那天黃帝要記「把糧倉<b>上面</b>那批米搬到<b>下面</b>」，我拿著樹枝在沙地上愣住——「上面」長什麼樣子？它又不是一個東西，沒有輪廓可以畫啊！</p>
  <p>倉頡看我卡關，慢悠悠走過來：「畫不出完整物體的，可以<b>用記號指給你看</b>。」他先畫一條長長的橫線當基準：「這條線是地面、是桌面、是任何一個『基準』。」然後在線的<b>上方</b>加一短畫——「這就是『<b>上</b>』。」再畫一條基準線，在<b>下方</b>加一短畫——「這就是『<b>下</b>』。」</p>
  <p>我盯著那兩個符號看了半天，忽然起雞皮疙瘩。它們<b>不是任何東西的畫像</b>，純粹是抽象記號，可是意思一目瞭然。原來字還可以這樣造！</p>
  <p>過幾天輪到我大顯身手。部落裡有人吵架：一個說砍樹要留樹根明年才會再長，一個說樹梢的果子歸他。兩邊都指著同一棵樹，講不清楚。我靈機一動，畫了一個「木」，在<b>下方根部的位置加一短橫</b>：「這個記號指的是樹根，念作『<b>本</b>』！」又畫一個「木」，在<b>上方樹梢的位置加一短橫</b>：「這個指樹梢，念作『<b>末</b>』！」</p>
  <p>吵架的兩人看懂了，各自滿意離開。倉頡在旁邊摸著鬍子點頭：「不錯。所以後來的人說『根本』『本來』，都是從樹根那個位置的意思長出來的；『末梢』『期末』，就是從樹梢延伸的。<b>一個記號，指出重點部位，意思就定了。</b>」</p>
  <p>還有一次，獵人拿刀來問：刀那麼長，最鋒利、最要小心的是哪裡？倉頡在「刀」的<b>刀口處加上一點</b>：「這一點指的就是刀口，念作『<b>刃</b>』。」獵人看了一眼就懂，滿意地走了。天亮的時候，倉頡又指著地平線上剛剛升起的太陽，畫了「日」出現在一條橫線之上——「太陽離開地平線的那一刻，就是『<b>旦</b>』，元旦的旦。」</p>
  <p>我幫這一類做筆記：<b>用抽象符號表達概念，或在既有字形上加記號指出重點</b>，叫<b>指事</b>。</p>
  <p>「等等，」我忽然想到講義上的陷阱題，「『本』是木加一橫，那算不算兩個字相加？」倉頡搖頭：「那一短橫<b>只是指位置的記號</b>，它不是『一二三』的『一』，沒有自己的意思。記號不是字，所以『本』不算字加字。」我默默把這句話畫了三顆星。</p>
  <p class="muted">✏️ 本章字例：上、下、本、末、刃、旦。短橫或點若只指出部位，不是另一個有獨立意義的部件。</p>
  <details><summary>停看聽 2：「本」為何不是「木加一」的會意？</summary><p>下方短橫的功能是指出樹根部位，不是用「一」的字義和「木」會合新義，因此歸指事。</p></details>

  <h3>第三章　會意：字不夠用了，開始玩「文加文」的加法</h3>
  <figure class="story-fig"><img src="img/story/03-compound.webp" alt="教學故事場景：阿滿靠在大樹旁休息，以人木關係理解休字" loading="lazy"></figure>
  <p>造字造了一陣子，我發現一個大問題：有些意思，<b>既畫不出輪廓，也沒有部位可以指</b>。比如「休息」——休息長什麼樣子？要指哪裡？我急得直跳腳：「師父，字不夠用了怎麼辦！」</p>
  <p>倉頡不慌不忙：「別急。我們手上已經有一批字了，對吧？把<b>兩個已經有意義的字合起來，讓它們的關係湊出一個新意思</b>——這是另一種加法。」</p>
  <p>那天下午我搬米搬到快斷氣，跑到大樹底下，背靠著樹幹癱下去乘涼。倉頡遠遠看見，突然大笑三聲，衝過來畫下：一個「人」，靠在一個「木」旁邊。</p>
  <p>「你看你現在的樣子——<b>人靠在樹旁，就是『休』</b>！」</p>
  <p>我又好氣又好笑：我偷懶的樣子居然被做成一個字，還要被用幾千年。但不得不承認好記：「人」有人的意思，「木」有樹的意思，兩個意思<b>合作</b>，生出「休息」這個新意思。這種用<b>不同部件</b>合出新意的，倉頡叫它<b>異體會意</b>。</p>
  <p>「還有另一種玩法。」倉頡把兩個「木」並排寫在一起：「一棵樹是木，樹多起來呢？」我脫口而出：「樹林的『<b>林</b>』！」他再疊上第三個「木」：「更多、更密呢?」「森林的『<b>森</b>』！」這種<b>相同部件重複</b>的合法，叫<b>同體會意</b>。</p>
  <p>我自己也發現了一個：部落的人走過泥地，留下一左一右、一前一後的腳印。兩個方向相反的足形合在一起，就是走路的「<b>步</b>」——左腳一步、右腳一步，字形自己就在走路。</p>
  <p>筆記時間：<b>兩個以上有意義的部件組合，從彼此關係產生新意</b>，叫<b>會意</b>，又分「同體會意」與「異體會意」。</p>
  <p class="muted">✏️ 本章字例：休、步、林、森。重複部件不保證一律表示「更多」；入門圖像只是線索，個別字仍須核對古文字資料。</p>
  <details><summary>停看聽 3：兩個部件合在一起，為何不一定是會意？</summary><p>還要看部件功能。若一部分表義、另一部分主要提示讀音，應判為形聲。</p></details>

  <h3>第四章　假借：造字趕不上說話，先「借」一個現成的來用</h3>
  <figure class="story-fig"><img src="img/story/04-loan.webp" alt="假借教學場景：其字借作代詞後，本義另以箕字表示" loading="lazy"></figure>
  <p>「文加文」的會意字造了一批之後，我又碰壁了，而且這次撞得最痛。</p>
  <p>黃帝派人來記一段話，裡面有個代詞——類似今天說「<b>其</b>中」「<b>其</b>實」的那個「其」。我拿著樹枝想了半天：這個詞<b>沒有形狀</b>、<b>沒有部位</b>、連拿兩個字來湊意思都湊不出來。它就是一個純粹的、飄在語言裡的虛詞。</p>
  <p>「師父……有些話想記下來，可是連湊都湊不出合適的字！」</p>
  <p>倉頡難得沉默了一會，然後說出一個聽起來很像作弊的辦法：「造字趕不上說話。這樣吧——<b>本來沒有這個字，只要讀音相同或相近，就把現成的字借過來用。</b>」</p>
  <p>他指著牆角一個簸米用的<b>畚箕</b>。原來早就有一個字，字形照著畚箕的輪廓畫，讀音恰好跟那個代詞相同或相近。「就借它！」從此，那個畫著畚箕的字形「<b>其</b>」，被拿去記代詞了。</p>
  <p>「借了以後呢？要還嗎？」我追問。倉頡說，接下來會走向兩種結局：</p>
  <p><b>有借有還</b>——借來的字繼續身兼兩份工作，本義、借義並存（故事暫用這個名稱），於是同一個字有不只一個意思。這是「一字多義」的<b>可能來源之一</b>，不是所有多義字的唯一成因。<b>有借不還</b>——新用法太強勢，把字整個占住了，原本的意思反而沒字可用，只好<b>另造新字</b>。</p>
  <p>「其」就是有借不還的苦主：代詞用法越來越常見，畚箕本人反而失業了。後來只好在「其」上加個竹字頭，另造「<b>箕</b>」，讓畚箕重新有字可寫——因為畚箕多用竹子編。</p>
  <p>還有一個更慘的。有個字的構形是<b>太陽沉進草叢裡</b>，表示天色將暗的傍晚——就是「<b>莫</b>」。畫面多美：夕陽落進草原，一天結束了。結果它被借去記否定用法，「莫要」「莫非」的莫，從此天天忙著說「不」。傍晚的意思沒字可用，只好再補一個「日」上去，另造「<b>暮</b>」。我每次看到「暮」都想笑：它字形裡其實有<b>兩個太陽</b>——下面那個是後來補的，因為原本那個被「借走了」。</p>
  <p>「有借有還／有借不還」只是故事中幫助記憶本義、借義是否並存的譬喻，不是真的借東西。另有「烏→嗚、舍→捨」這類<b>替借義另造字</b>的分化現象，本站另標「借義另造」，不硬塞進前述二分。有些本義另造字的例子能幫助理解部分形聲字的形成，<b>但不是所有形聲字的唯一來源，也不是固定的歷史先後</b>。</p>
  <p class="muted">✏️ 本章字例：其→箕、莫→暮。假借談<b>用字關係</b>；「其」本身的構形仍可另答象形，「莫」本身的構形仍可另答會意。</p>
  <details><summary>停看聽 4：「莫」該答會意還是假借？</summary><p>問字形構成時答會意；問借作否定詞的用字關係時答假借。先讀懂題幹再選答案。</p></details>

  <h3>第五章　形聲：換一種加法——「文加聲音」，量產時代來了</h3>
  <figure class="story-fig"><img src="img/story/05-phonetic.webp" alt="形聲教學場景：水旁配上工與可，組成江河等字" loading="lazy"></figure>
  <p>穿越以來最大的危機，發生在黃帝要繪製水域圖的那天。</p>
  <p>天下的大川小河幾十條，每一條都要有名字、要能記錄。我畫了一個「水」——好，然後呢？每條河都是水，難道全畫一樣的水紋？畫圖分不出來，「文加文」也湊不出幾十條河的意思。我和倉頡對著地圖發呆到半夜。</p>
  <p>後來是倉頡先開口的：「阿滿，你記不記得假借那批『有借不還』的字？原本的意思沒字可用，我們是怎麼救的？」</p>
  <p>我想起「莫」加「日」變「暮」。「補一個表示意思的部件上去……」</p>
  <p>「反過來也行啊！」倉頡四隻眼睛全亮了，「這次不玩『文加文』，改玩『<b>文加聲音</b>』——一個部件管意思，一個部件管讀音！」</p>
  <p>他當場示範。長江那條大河，當地人喊它的名字，讀音恰好和「工」相近（注意：是<b>當時</b>的讀音）。那就：<b>水字旁</b>表示「這是一條河」，旁邊放一個「<b>工</b>」提示怎麼念——「<b>江</b>」，造好了。黃河呢？當地人喊的音近「可」，那就水旁加「可」——「<b>河</b>」，收工。</p>
  <p>我看傻了。這根本是<b>造字的模具</b>：管意思的那半叫<b>形符</b>，提示讀音的那半叫<b>聲符</b>。天氣好、太陽露臉，日字旁配一個「青」提示讀音，就是「<b>晴</b>」。想造多少字就造多少字。</p>
  <p>那天之後，造字的速度快得嚇人。我後來偷偷告訴倉頡一個「未來的情報」：以《說文解字》收錄的<b>九千三百五十三個小篆</b>來看，形聲字約占九成。至於「有邊讀邊，沒邊讀中間」，只是我們常開的玩笑，<b>不是可靠的讀音規則</b>。部分形聲字確實可由「有借不還」後替本義另造字來理解，<b>但這只是其中一種形成路徑，不是所有形聲字的唯一來源，也不是固定的歷史先後。</b></p>
  <p>不過倉頡提醒了我兩件事，我原封不動抄給你：</p>
  <p>第一，<b>形符和聲符的位置不固定</b>——可以左形右聲、上形下聲、外形內聲，什麼組合都有，兩部分也<b>不一定各占字形的一半</b>。不能看到左邊有偏旁就直接說它是形符，要看<b>部件的功能</b>。第二，<b>古今語音會變</b>。「江」和「工」在今天的國語裡讀音已經不同了。<b>聲符是線索，不是現代讀音的保證</b>；反過來說，現代讀音不同，也不能直接否定形聲分析。</p>
  <p class="muted">✏️ 本章字例：江、河、晴、鴿、草、想、園、聞。判斷時依序問：哪裡表義？哪裡提示讀音？有什麼文字資料支持？</p>
  <details><summary>停看聽 5：為什麼不能看到左偏旁就直接判形符？</summary><p>形符與聲符可在左、右、上、下、內、外等位置。位置只能協助觀察，部件功能才是判斷重點。</p></details>

  <h3>第六章　轉注：最後才懂的一課——不同地方的字，互相注釋</h3>
  <figure class="story-fig"><img src="img/story/06-transfer.webp" alt="考與老兩個近義字彼此訓釋的教學示意" loading="lazy"></figure>
  <p>我在上古待了很久，久到以為六書我已經全懂了。直到有一天，東邊部落和西邊部落的使者同時來訪，兩邊都帶來他們記錄「年老」的字。</p>
  <p>東邊的使者寫下一個字：長髮駝背的老人拄著杖——他們念「<b>老</b>」。西邊的使者寫下另一個字，也表示年老——他們念「<b>考</b>」。兩個部落隔著山，各記各的，誰也沒抄誰。<b>這段部落情節是教學想像，不是歷史考證。</b></p>
  <p>兩位使者當場尷尬：那……到底哪個才「對」？要廢掉一個嗎？</p>
  <p>倉頡看了很久，緩緩說：「都不廢。這些意思相近的字，以後可以<b>互相注釋</b>——查到『考』，就用『老』解釋它；查到『老』，就用『考』解釋它。」故事用時間、地域差異幫助想像，<b>但兩者不是判定轉注的必要條件</b>。</p>
  <p>我愣了一下：「師父，這跟前面的方法不一樣啊。前面都在講<b>一個字形怎麼造出來</b>，這個是在講<b>兩個字之間的關係</b>？」</p>
  <p>「正是。」倉頡點頭，「這次看的不是一個字形怎麼拼，而是<b>兩個字如何互相訓釋</b>。」</p>
  <p>這就是本站採用的<b>互訓說</b>教學理解：同類的近義字能彼此訓釋。你現在還看得到它的痕跡——「壽考」的考就是長壽、年老的意思，「如喪考妣」的「考」指過世的父親。早期材料只留下簡短說明與考、老二例，後世對精確條件仍有不同解釋，所以考題多半只考這一組，別自己亂配對。</p>
  <p class="muted">✏️ 本章字例：考 ⇄ 老。轉注是<b>用字關係</b>；就本站採用的雙軸分析，「考」本身的構形是形聲，「老」本身的構形是象形。</p>
  <details><summary>停看聽 6：題目只給「考」一字，能直接答轉注嗎？</summary><p>不能。要看題目是否在問它和「老」互訓的關係；若問「考」的字形構成，答案是形聲。</p></details>

  <h3>尾聲：天雨粟，鬼夜哭，然後我醒了</h3>
  <figure class="story-fig"><img src="img/story/07-epilogue.webp" alt="傳說情節插圖：倉頡造字後天雨粟、鬼夜哭" loading="lazy"></figure>
  <p>古籍傳說中，倉頡造字完成的那天，「<b>天雨粟，鬼夜哭</b>」——天上落下小米，鬼怪在夜裡哭泣。有人說，那是因為文字讓人類從此能留住知識，天地都為之震動。這段超自然情節屬於傳說，不是可當作造字史實的證據——但站在倉頡身邊（故事裡的）我，看著滿地竹簡上的字，確實起了一身雞皮疙瘩。</p>
  <p>倉頡拍拍我的肩：「阿滿，該回去了。回去考你的試吧。」</p>
  <p>我猛地驚醒，趴在講義上，口水把「六書」兩個字都泡糊了。可是奇怪，我再看那十二個字，全都活了過來：</p>
  <p>依物描畫（<b>象形</b>）、記號指出（<b>指事</b>）、部件會義（<b>會意</b>）、借字記詞（<b>假借</b>）、形符聲符（<b>形聲</b>）、近義互訓（<b>轉注</b>）。</p>
  <p>每個字背後都有一個現場：河邊的太陽、樹根的短橫、樹下偷懶的我、失業的畚箕、水旁的模具、兩個部落的使者。<b>但故事只是幫你記住線索——進考場前，把故事留在故事裡，把證據帶去答題。</b></p>
  <p><b>離堂任務：</b>任選「本、休、江、莫」一字，用「題目問的是＿＿，我判斷為＿＿，證據是＿＿」說完整一句。若同學答案不同，先比較題幹問的是構形還是用字關係。</p>
  <p class="muted"><b>內容說明：</b>穿越設定、人物對話、造字順序、課堂情節與各段教學解說皆為本站重新撰寫的教學創作；分類事實由編輯端另行查核，學生前台不展示外部原文或資料連結。</p>
  <div class="btnrow">
    <button class="btn" onclick="LSApp.go('concept')">回概念頁核對理由</button>
    <button class="btn ghost" onclick="LSApp.go('quiz')">用自測驗證</button>
  </div>
</div>`;

  let requestedChapter = null;

  function openChapter(index) { requestedChapter = Math.max(0, Math.min(7, Number(index) || 0)); }

  function render(el) {
    el.innerHTML = html;
    if (!el.querySelectorAll) return;
    const card = el.querySelector('.story-card');
    const headings = [...card.querySelectorAll('h3')];
    if (!headings.length) return;
    headings.forEach((heading, index) => {
      const section = document.createElement('section');
      section.className = 'story-chapter';
      section.dataset.chapter = index;
      heading.before(section);
      let node = heading;
      while (node && !(node !== heading && node.tagName === 'H3')) {
        const next = node.nextSibling;
        section.appendChild(node);
        node = next;
      }
      heading.tabIndex = -1;
      const warning = document.createElement('p');
      warning.className = 'story-order-warning muted';
      warning.innerHTML = '<b>閱讀提醒：</b>這是本站的教學關卡次序，不是六書依年代先後發明的歷史順序。';
      heading.after(warning);

      const contentNodes = [...section.children].filter(child => child !== heading && child !== warning);
      const sceneCount = contentNodes.length >= 8 ? 3 : 2;
      const sceneSize = Math.ceil(contentNodes.length / sceneCount);
      for (let sceneIndex = 0; sceneIndex < sceneCount; sceneIndex++) {
        const scene = document.createElement('div');
        scene.className = 'story-scene';
        scene.dataset.scene = sceneIndex;
        scene.setAttribute('role', 'group');
        scene.setAttribute('aria-label', `${heading.textContent.trim()}，第 ${sceneIndex + 1} 幕，共 ${sceneCount} 幕`);
        contentNodes.slice(sceneIndex * sceneSize, (sceneIndex + 1) * sceneSize).forEach(child => scene.appendChild(child));
        section.appendChild(scene);
      }
    });
    const save = LSStore.raw;
    const selected = requestedChapter ?? save.journey.pendingChapter ?? save.journey.chapter;
    requestedChapter = null;
    const nav = document.createElement('nav');
    nav.className = 'story-chapter-nav';
    nav.setAttribute('aria-label', '故事分卷');
    nav.innerHTML = headings.map((heading, index) => {
      const available = index <= save.journey.chapter || !!save.journey.completed[index];
      return `<button type="button" data-story-chapter="${index}" aria-label="第 ${index + 1} 卷：${heading.textContent.trim()}" ${available ? '' : 'disabled'}>${index + 1}</button>`;
    }).join('');
    card.insertBefore(nav, card.querySelector('.story-chapter'));
    const show = (index, requestedScene = 0) => {
      save.journey.read[index] ||= new Date().toISOString();
      LSStore.persist();
      card.querySelectorAll('.story-chapter').forEach((section, i) => { section.hidden = i !== index; });
      nav.querySelectorAll('button').forEach((button, i) => {
        button.classList.toggle('active', i === index);
        if (i === index) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      const chapter = card.querySelector(`.story-chapter[data-chapter="${index}"]`);
      const scenes = [...chapter.querySelectorAll('.story-scene')];
      const sceneIndex = Math.max(0, Math.min(scenes.length - 1, requestedScene));
      scenes.forEach((scene, i) => { scene.hidden = i !== sceneIndex; });
      let controls = card.querySelector('.story-controls');
      if (controls) controls.remove();
      controls = document.createElement('div');
      controls.className = 'story-controls btnrow';
      controls.innerHTML = `<span class="story-scene-status" role="status">第 ${sceneIndex + 1}/${scenes.length} 幕</span>${sceneIndex > 0 ? '<button class="btn ghost" data-scene-prev>上一幕</button>' : ''}${sceneIndex < scenes.length - 1 ? '<button class="btn" data-scene-next>下一幕</button>' : '<button class="btn" data-story-trial>完成本卷，進入短試煉</button>'}`;
      chapter.appendChild(controls);
      controls.querySelector('[data-scene-prev]')?.addEventListener('click', () => show(index, sceneIndex - 1));
      controls.querySelector('[data-scene-next]')?.addEventListener('click', () => show(index, sceneIndex + 1));
      controls.querySelector('[data-story-trial]')?.addEventListener('click', () => {
          LSApp.go('home');
          LSJourney.startTrial(document.querySelector('#journeyPlay'), index);
        });
      chapter.querySelector('h3')?.focus({ preventScroll: true });
    };
    nav.querySelectorAll('button:not(:disabled)').forEach(button => { button.onclick = () => show(Number(button.dataset.storyChapter), 0); });
    show(Math.max(0, Math.min(headings.length - 1, selected)));
  }
  return { render, openChapter };
})();
