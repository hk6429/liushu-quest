// 出題引擎 + 自測闖關 UI。對戰模組只呼叫 LSQuiz.gen()，不自己出題。
const LSQuiz = (() => {
  // ── 固定概念題庫（依概念導讀內容）──
  const CONCEPT_BANK = [
    { stem: '《說文解字》所謂「畫成其物，隨體詰詘」，指的是哪一書？', opts: ['象形', '指事', '會意', '形聲'], ans: 0, exp: '照物體的樣子畫下來、線條隨形體彎曲，就是象形。' },
    { stem: '「視而可識，察而見意」指的是哪一書？', opts: ['會意', '指事', '象形', '轉注'], ans: 1, exp: '一看能認出、細察能見意——用符號指出抽象概念，是指事。' },
    { stem: '「比類合誼，以見指撝」指的是哪一書？', opts: ['形聲', '假借', '會意', '指事'], ans: 2, exp: '把字與字（部件）組合起來會合出新意，是會意。' },
    { stem: '「以事為名，取譬相成」指的是哪一書？', opts: ['形聲', '象形', '轉注', '會意'], ans: 0, exp: '一半形符表義、一半聲符表音，是形聲。' },
    { stem: '「建類一首，同意相受」指的是哪一書？', opts: ['假借', '會意', '指事', '轉注'], ans: 3, exp: '同義的字互相注釋（如考、老互訓），是轉注。' },
    { stem: '「本無其字，依聲託事」指的是哪一書？', opts: ['假借', '轉注', '形聲', '指事'], ans: 0, exp: '本來沒有這個字，借同音字來用，是假借。' },
    { stem: '文字發明前，「結繩記事」具備哪些要素？', opts: ['有形、有義，無音', '有義，無形、無音', '有音、有義，無形', '形音義俱全'], ans: 1, exp: '繩結承載意思，但沒有可辨的形體、也念不出音。' },
    { stem: '文字發明前，「壁畫」具備哪些要素？', opts: ['有形、有義，無音', '有義，無形、無音', '有音、有義，無形', '有形，無音、無義'], ans: 0, exp: '畫得出形、看得懂意思，但沒有聲音。' },
    { stem: '文字發明前，「語言」具備哪些要素？', opts: ['有形、有義，無音', '有形，無音、無義', '有音、有義，無形', '形音義俱全'], ans: 2, exp: '說出口有音有義，但留不下形。' },
    { stem: '六書中屬於「用字之法」（而非造字之法）的是？', opts: ['轉注、假借', '象形、指事', '會意、形聲', '形聲、假借'], ans: 0, exp: '象形、指事、會意、形聲造出新字；轉注、假借是運用既有字的方法。' },
    { stem: '中文形聲字特別多，與下列何者關係最密切？', opts: ['象形字筆畫太複雜', '「有借不還」的假借字須加形符分化新字', '轉注字大量增生', '指事符號不敷使用'], ans: 1, exp: '假借義鳩佔鵲巢後，原義只好加形符另造新字（其→箕），形聲字因此大量誕生。' },
    { stem: '三「木」組成「森」，屬於哪一類？', opts: ['同體會意', '異體會意', '象形', '指事'], ans: 0, exp: '同一部件重複組合成新意，是同體會意。' },
    { stem: '「人」倚「木」旁組成「休」，屬於哪一類？', opts: ['同體會意', '異體會意', '形聲', '轉注'], ans: 1, exp: '不同部件相合會出新意，是異體會意。' },
    { stem: '「考」「老」本義相同、可互相解釋（《說文》：老，考也），屬於？', opts: ['假借', '會意', '轉注', '形聲'], ans: 2, exp: '同義字因時地分化又互訓，是轉注的經典例。' },
    { stem: '「其」本義為畚箕，被借為虛詞後只好加竹字頭另造「箕」，這種現象是？', opts: ['有借有還', '有借不還', '轉注', '同體會意'], ans: 1, exp: '借義佔據本字、本義被迫另造新字，是「有借不還」。' }
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── 動態題型 ──
  // type 1: 這個字屬六書何者
  function qCatOfChar(pool) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    const wrong = LSData.pick(LSData.CATS.filter(x => x !== c.category), 3);
    const opts = shuffle([c.category, ...wrong]);
    return {
      stemHtml: `下面這個字，依造字法屬於六書中的哪一書？<span class="stem-char">${c.char} <small style="font-size:.95rem;color:var(--ink-soft)">${c.zhuyin}</small></span>`,
      options: opts, answer: opts.indexOf(c.category),
      explain: `【${c.char}】${c.category}${c.sub ? '（' + c.sub + '）' : ''}——${c.explain}`,
      charId: c.id, cat: c.category
    };
  }
  // type 2: 哪個字屬於某書
  function qCharOfCat(pool) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    const sameLv = LSData.all.filter(x => x.level === c.level && x.category !== c.category && !x.disputed);
    const wrong = LSData.pick(sameLv, 3);
    if (wrong.length < 3) return qCatOfChar(pool);
    const opts = shuffle([c, ...wrong]);
    return {
      stemHtml: `下列哪一個字屬於<b>「${c.category}」</b>？`,
      options: opts.map(x => x.char), answer: opts.indexOf(c),
      explain: `【${c.char}】${c.explain}` + wrong.map(w => `／【${w.char}】屬${w.category}`).join(''),
      charId: c.id, cat: c.category
    };
  }
  // type 3: 依字形解說選字
  function qExplainToChar(pool) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    const siblings = (LSData.byCat[c.category] || []).filter(x => x.id !== c.id);
    const wrong = LSData.pick(siblings.filter(x => x.level === c.level), 3);
    while (wrong.length < 3 && siblings.length >= 3) {
      const cand = siblings[Math.floor(Math.random() * siblings.length)];
      if (!wrong.includes(cand)) wrong.push(cand);
    }
    if (wrong.length < 3) return qCatOfChar(pool);
    const masked = c.explain.split(c.char).join('◯');
    const opts = shuffle([c, ...wrong]);
    return {
      stemHtml: `下面的字形解說，描述的是哪一個字？（◯＝該字）<div class="feedback">${masked}</div>`,
      options: opts.map(x => x.char), answer: opts.indexOf(c),
      explain: `正解【${c.char}】（${c.category}${c.sub ? '・' + c.sub : ''}）`,
      charId: c.id, cat: c.category
    };
  }
  // type 4: 細類判斷（會意/假借才有 sub）
  function qSubOfChar(pool) {
    const cands = pool.filter(c => c.sub);
    if (!cands.length) return qCatOfChar(pool);
    const c = cands[Math.floor(Math.random() * cands.length)];
    const opts = ['同體會意', '異體會意', '有借有還', '有借不還'];
    return {
      stemHtml: `「<b>${c.char}</b>」屬於${c.category}，更精確地說是哪一類？`,
      options: opts, answer: opts.indexOf(c.sub),
      explain: `【${c.char}】${c.sub}——${c.explain}`,
      charId: c.id, cat: c.category
    };
  }
  // type 5: 概念題
  function qConcept() {
    const q = CONCEPT_BANK[Math.floor(Math.random() * CONCEPT_BANK.length)];
    const order = shuffle(q.opts.map((t, i) => ({ t, ok: i === q.ans })));
    return {
      stemHtml: q.stem, options: order.map(o => o.t),
      answer: order.findIndex(o => o.ok), explain: q.exp, charId: null, cat: '概念'
    };
  }

  // 對外統一入口：level=null 全庫；weights 可調題型比例
  function gen(level) {
    let pool = LSData.ofLevel(level).filter(c => !c.disputed);
    if (level === '挑戰') pool = LSData.ofLevel(level); // 挑戰級才出爭議字
    if (!pool.length) pool = LSData.all;
    const r = Math.random();
    if (r < 0.32) return qCatOfChar(pool);
    if (r < 0.55) return qCharOfCat(pool);
    if (r < 0.75) return qExplainToChar(pool);
    if (r < 0.88) return qSubOfChar(pool);
    return qConcept();
  }

  // ── 自測 UI ──
  const ROUND = 10;
  let st = null;
  function render(el) {
    el.innerHTML = `
<div class="card">
  <h2>自測闖關</h2>
  <p class="muted">一回合 ${ROUND} 題，混出五種題型：判斷書類、依書類選字、依解說認字、細類判斷、概念題。答錯的字會掉回閃卡第一盒。</p>
  <div class="filterbar">
    <label>範圍：<select id="quizLevel"><option value="">全部</option><option>基礎</option><option>進階</option><option>挑戰</option></select></label>
    <button class="btn" id="quizStart">開始</button>
  </div>
  <div id="quizArea"></div>
</div>`;
    el.querySelector('#quizStart').onclick = () => {
      st = { n: 0, right: 0, level: el.querySelector('#quizLevel').value || null };
      next(el.querySelector('#quizArea'));
    };
  }
  function next(area) {
    if (st.n >= ROUND) {
      area.innerHTML = `<div class="feedback"><b>回合結束！</b>答對 ${st.right}／${ROUND}。${st.right >= 8 ? '大師風範！去「大師對戰」踢館吧。' : st.right >= 5 ? '不錯，弱點字已排進閃卡，複習一輪再來。' : '基礎需要打底——先回「概念導讀」與「閃卡複習」蹲馬步。'}</div>
      <div class="btnrow"><button class="btn" onclick="LSQuiz._again()">再來一回合</button><button class="btn ghost" onclick="LSApp.go('battle')">去對戰</button></div>`;
      return;
    }
    const q = gen(st.level);
    st.q = q; st.n++;
    area.innerHTML = `
<div class="q-meta"><span>第 ${st.n}／${ROUND} 題</span><span>已答對 ${st.right}</span></div>
<div class="q-stem">${q.stemHtml}</div>
<div class="opt-list">${q.options.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div>
<div id="qFb"></div>`;
    area.querySelectorAll('.opt').forEach(btn => {
      btn.onclick = () => {
        const i = +btn.dataset.i, ok = i === q.answer;
        area.querySelectorAll('.opt').forEach(b => { b.disabled = true; });
        area.querySelector(`[data-i="${q.answer}"]`).classList.add('correct');
        if (!ok) btn.classList.add('wrong');
        if (ok) st.right++;
        if (q.charId) LSStore.recordAnswer(q.charId, q.cat, ok);
        else LSStore.recordAnswer('_concept', '概念', ok);
        area.querySelector('#qFb').innerHTML = `<div class="feedback">${ok ? '⭕ 答對！' : '❌ 答錯。'}${q.explain}</div>
        <div class="btnrow"><button class="btn" id="qNext">下一題</button></div>`;
        area.querySelector('#qNext').onclick = () => next(area);
      };
    });
  }
  function _again() {
    const area = document.querySelector('#quizArea');
    st = { n: 0, right: 0, level: st.level };
    next(area);
  }

  return { gen, render, _again, CONCEPT_BANK };
})();
