// 概念導讀：文字起源 → 形音義 → 六書總覽（內容依大乃老師講述整理）
const LSConcept = (() => {
  const Y = '<span class="fyimark has">✔</span>';
  const N = '<span class="fyimark hasnot">✘</span>';

  const html = `
<div class="card">
  <h2>文字誕生之前：三種不完整的表達</h2>
  <p>古人一開始沒有文字，只能用別的方式記錄與溝通。但這些方式都各缺一角：</p>
  <div class="origin-grid">
    <div class="origin-cell"><b>結繩記事</b>形 ${N}　音 ${N}　義 ${Y}<p class="muted">打個結代表一件事——有「意思」，但沒有形體可辨、也念不出聲音。</p></div>
    <div class="origin-cell"><b>壁畫</b>形 ${Y}　音 ${N}　義 ${Y}<p class="muted">畫出來的東西有「形」也有「意思」，但仍然沒有「音」。</p></div>
    <div class="origin-cell"><b>語言</b>形 ${N}　音 ${Y}　義 ${Y}<p class="muted">說出口的話有「聲音」有「意思」，可是一說完就消失，留不下「形」。</p></div>
  </div>
  <p><b>文字的偉大，就在於同時結合了「形、音、義」三要素</b>——看得見、念得出、有意義。而漢字的造字與用字法則，歸納起來就是「六書」。</p>
</div>

<div class="card">
  <h2>六書總覽</h2>
  <p class="concept-toc">
    <span class="pill cat-象形">象形</span><span class="pill cat-指事">指事</span><span class="pill cat-會意">會意</span><span class="pill cat-形聲">形聲</span>＝造字之法（真正造出新字）；
    <span class="pill cat-轉注">轉注</span><span class="pill cat-假借">假借</span>＝用字之法（運用既有的字）。
  </p>
</div>

<div class="card">
  <h2><span class="pill cat-象形">一</span> 象形：畫成其物，隨體詰詘</h2>
  <p>照著東西的樣子畫下來，線條隨物體的形狀彎曲。是漢字最原始的一批「獨體」字。</p>
  <p class="example-chars">日 月 山 水 木 火</p>
  <p class="muted">「日」畫太陽、「月」畫彎月、「山」畫三座峰巒——看古文字形，一眼就認得出畫的是什麼。</p>
</div>

<div class="card">
  <h2><span class="pill cat-指事">二</span> 指事：視而可識，察而見意</h2>
  <p>抽象概念畫不出來，就用<b>符號</b>表示，或在象形字上<b>加記號</b>指出重點——「符號＋符號」或「象形＋符號」。</p>
  <p class="example-chars">上 下 本 末 刃</p>
  <p class="muted">「上／下」用橫線加指示符號表方位；「本」在木的根部加一橫指出樹根、「末」在樹梢加一橫指出末端；「刃」在刀口加一點，指出鋒利之處。</p>
</div>

<div class="card">
  <h2><span class="pill cat-會意">三</span> 會意：比類合誼，以見指撝</h2>
  <p><b>文字加文字</b>，把兩個以上的字（部件）組起來，會合出新的意思。</p>
  <p class="example-chars">休 步 明 森 淼 鑫</p>
  <h3>（甲）同體會意</h3>
  <p class="muted">同一個部件重複：三木為「森」、三水為「淼」、三金為「鑫」、二木為「林」。</p>
  <h3>（乙）異體會意</h3>
  <p class="muted">不同部件相合：人靠在樹旁是「休」；上下兩個腳掌一前一後是「步」；日月相合是「明」。</p>
  <p class="muted">⚡ 補充：「北」畫兩人背對背，是「背」的本字，後多假借表方位——多數字書把它歸<b>會意</b>，部分教材因「二人相背如符號相對」列為指事，屬於歸類有分歧的字，考題遇到要看選項判斷。</p>
</div>

<div class="card">
  <h2><span class="pill cat-形聲">四</span> 形聲：以事為名，取譬相成</h2>
  <p>一半<b>形符</b>表達意義類別，一半<b>聲符</b>提示讀音。這是漢字最能量產的造字法，<b>中文裡九成左右的字都是形聲字</b>。</p>
  <p class="example-chars">江 河 晴 想 園 聞</p>
  <p class="muted">結構有六種部位：左形右聲（江）、右形左聲（鴿）、上形下聲（草）、下形上聲（想）、外形內聲（園）、內形外聲（聞）。</p>
</div>

<div class="card">
  <h2><span class="pill cat-轉注">五</span> 轉注：建類一首，同意相受</h2>
  <p>隨著<b>時間與地域</b>的改變，原本同義的字分化、互相注釋。最經典的一對：</p>
  <p class="example-chars">考 ⇄ 老</p>
  <p class="muted">「考」「老」本義相同（年長），因時地差異分成兩個字，彼此可互相解釋——《說文》：「老，考也」「考，老也」。</p>
</div>

<div class="card">
  <h2><span class="pill cat-假借">六</span> 假借：本無其字，依聲託事</h2>
  <p>想表達的概念<b>本來沒有字</b>，就借一個<b>同音、近音</b>的現成字來用。借了之後有兩種結局：</p>
  <h3>（甲）有借有還</h3>
  <p class="muted">本義、借義並存，於是一個字身兼多義。</p>
  <h3>（乙）有借不還</h3>
  <p class="muted">借義鳩佔鵲巢，原義反而消失；為了區別，只好在原字加上形符或聲符另造新字——這正是<b>形聲字大量誕生</b>的原因之一。例：「其」本義是畚箕，被借去當虛詞不還，只好加竹字頭另造「箕」。</p>
</div>

<div class="card">
  <h2>開始練功</h2>
  <p>讀完概念後，建議路線：<b>字例總覽</b>逛一圈 → <b>閃卡複習</b>建立記憶 → <b>自測闖關</b>檢驗 → 挑戰<b>大師對戰</b>。答錯的字會自動掉回閃卡第一盒，優先複習。</p>
  <div class="btnrow">
    <button class="btn" onclick="LSApp.go('browse')">逛字例總覽</button>
    <button class="btn ghost" onclick="LSApp.go('quiz')">直接自測</button>
  </div>
</div>`;

  function render(el) { el.innerHTML = html; }
  return { render };
})();
