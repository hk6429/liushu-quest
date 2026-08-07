// 出題引擎 + 自測闖關 UI。六書前四類問「構形方式」，轉注／假借問「用字關係」。
const LSQuiz = (() => {
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
    { stem: '六書中屬於「用字之法」（而非構形方式）的是？', opts: ['轉注、假借', '象形、指事', '會意、形聲', '形聲、假借'], ans: 0, exp: '象形、指事、會意、形聲說明構形；轉注、假借說明字與字、字與意義的使用關係。' },
    { stem: '中文形聲字特別多，與下列何者關係最密切？', opts: ['象形字筆畫太複雜', '「有借不還」的假借字須加形符分化新字', '轉注字大量增生', '指事符號不敷使用'], ans: 1, exp: '假借義鳩佔鵲巢後，原義只好加形符另造新字（其→箕），形聲字因此大量誕生。' },
    { stem: '三「木」組成「森」，屬於哪一種構形方式？', opts: ['同體會意', '異體會意', '象形', '指事'], ans: 0, exp: '同一部件重複組合成新意，是同體會意。' },
    { stem: '「人」倚「木」旁組成「休」，屬於哪一種構形方式？', opts: ['同體會意', '異體會意', '形聲', '轉注'], ans: 1, exp: '不同部件相合會出新意，是異體會意。' },
    { stem: '「考」「老」本義相同、可互相解釋（《說文》：老，考也），呈現哪種用字關係？', opts: ['假借', '會意', '轉注', '形聲'], ans: 2, exp: '同義字因時地分化又互訓，是轉注的經典例。' },
    { stem: '「其」本義為畚箕，被借為虛詞後只好加竹字頭另造「箕」，這種用字現象是？', opts: ['有借有還', '有借不還', '轉注', '同體會意'], ans: 1, exp: '借義佔據本字、本義被迫另造新字，是「有借不還」。' }
  ];
  const ROUND = 10;
  let st = null;

  function sessionToken(prefix = 'quiz') {
    return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
  }

  const P = () => typeof LSProgress !== 'undefined' ? LSProgress : null;
  const randPick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];
  const isUsage = cat => cat === '轉注' || cat === '假借';
  const formationCat = c => c.formation_category || (!isUsage(c.category) ? c.category : null);
  const usageRelations = c => Array.isArray(c.usage_relations) && c.usage_relations.length
    ? c.usage_relations.map(rel => typeof rel === 'string' ? rel : rel.type).filter(Boolean)
    : (isUsage(c.category) ? [c.category] : []);
  const matchesCat = (c, cat) => !cat || (isUsage(cat) ? usageRelations(c).includes(cat) : formationCat(c) === cat);

  function shuffle(arr, rng = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function qualifier(c) {
    return c.disputed ? '依本題資料採用的分類，' : '';
  }

  function qCatOfChar(pool, rng, requestedCat) {
    const c = randPick(pool, rng);
    const cat = requestedCat || c.category;
    const wrong = LSData.pick(LSData.CATS.filter(x => x !== cat), 3, rng);
    const opts = shuffle([cat, ...wrong], rng);
    const relation = isUsage(cat);
    return {
      stemHtml: `${qualifier(c)}下面這個字呈現六書中的哪一種<b>${relation ? '用字關係' : '構形方式'}</b>？<span class="stem-char">${c.char} <small style="font-size:.95rem;color:var(--ink-soft)">${c.zhuyin}</small></span>`,
      options: opts, answer: opts.indexOf(cat),
      explain: `【${c.char}】${cat}${c.sub ? '（' + c.sub + '）' : ''}——${c.explain}`,
      charId: c.id, cat, key: `cat:${cat}:${c.id}`
    };
  }

  function qCharOfCat(pool, rng, requestedCat) {
    const c = randPick(pool, rng);
    const cat = requestedCat || c.category;
    const sameLv = LSData.all.filter(x => x.level === c.level && !matchesCat(x, cat) && !x.disputed);
    const wrong = LSData.pick(sameLv, 3, rng);
    if (wrong.length < 3) return qCatOfChar(pool, rng, cat);
    const opts = shuffle([c, ...wrong], rng);
    return {
      stemHtml: `${qualifier(c)}下列哪一個字呈現<b>「${cat}」${isUsage(cat) ? '用字關係' : '構形方式'}</b>？`,
      options: opts.map(x => x.char), answer: opts.indexOf(c),
      explain: `【${c.char}】${c.explain}` + wrong.map(w => `／【${w.char}】本題資料列為${w.category}`).join(''),
      charId: c.id, cat, key: `pick:${cat}:${c.id}`
    };
  }

  function qExplainToChar(pool, rng, requestedCat) {
    const c = randPick(pool, rng);
    const cat = requestedCat || c.category;
    const siblings = LSData.all.filter(x => x.id !== c.id && matchesCat(x, cat) && !x.disputed);
    const wrong = LSData.pick(siblings.filter(x => x.level === c.level), 3, rng);
    for (const cand of shuffle(siblings, rng)) {
      if (wrong.length >= 3) break;
      if (!wrong.includes(cand)) wrong.push(cand);
    }
    if (wrong.length < 3) return qCatOfChar(pool, rng, cat);
    const masked = c.explain.split(c.char).join('◯');
    const opts = shuffle([c, ...wrong], rng);
    return {
      stemHtml: `${qualifier(c)}下面的解說描述哪一個字？（◯＝該字）<div class="feedback">${masked}</div>`,
      options: opts.map(x => x.char), answer: opts.indexOf(c),
      explain: `正解【${c.char}】（本題資料列為${cat}${c.sub ? '・' + c.sub : ''}）`,
      charId: c.id, cat, key: `explain:${cat}:${c.id}`
    };
  }

  function qSubOfChar(pool, rng, requestedCat) {
    const cands = pool.filter(c => c.sub);
    if (!cands.length) return qCatOfChar(pool, rng, requestedCat);
    const c = randPick(cands, rng);
    const opts = ['同體會意', '異體會意', '有借有還', '有借不還'];
    return {
      stemHtml: `${qualifier(c)}「<b>${c.char}</b>」在本題資料中列為${c.category}，更精確是哪一類？`,
      options: opts, answer: opts.indexOf(c.sub),
      explain: `【${c.char}】${c.sub}——${c.explain}`,
      charId: c.id, cat: requestedCat || c.category, key: `sub:${c.id}`
    };
  }

  function qConcept(rng = Math.random, excludeKeys = new Set()) {
    const candidates = CONCEPT_BANK.map((q, i) => ({ q, i })).filter(x => !excludeKeys.has(`concept:${x.i}`));
    const chosen = randPick(candidates.length ? candidates : CONCEPT_BANK.map((q, i) => ({ q, i })), rng);
    const order = shuffle(chosen.q.opts.map((t, i) => ({ t, ok: i === chosen.q.ans })), rng);
    return {
      stemHtml: chosen.q.stem, options: order.map(o => o.t),
      answer: order.findIndex(o => o.ok), explain: chosen.q.exp,
      charId: null, cat: '概念', key: `concept:${chosen.i}`
    };
  }

  // 相容 gen('基礎')；新版可傳 { level, cat, type, rng, excludeIds, excludeKeys }。
  function gen(input = null) {
    const spec = typeof input === 'string' || input === null ? { level: input } : input;
    const rng = spec.rng || Math.random;
    const excludeIds = spec.excludeIds || new Set();
    const excludeKeys = spec.excludeKeys || new Set();
    if (spec.type === 'concept') return qConcept(rng, excludeKeys);
    let pool = LSData.ofLevel(spec.level).filter(c => matchesCat(c, spec.cat));
    if (spec.level !== '挑戰') pool = pool.filter(c => !c.disputed);
    pool = pool.filter(c => !excludeIds.has(c.id));
    if (!pool.length) {
      pool = LSData.all.filter(c => matchesCat(c, spec.cat) && (spec.level === '挑戰' || !c.disputed) && !excludeIds.has(c.id));
    }
    if (!pool.length) return qConcept(rng, excludeKeys);
    const r = rng();
    if (spec.cat) {
      if (r < 0.4) return qCatOfChar(pool, rng, spec.cat);
      if (r < 0.68) return qCharOfCat(pool, rng, spec.cat);
      if (r < 0.9) return qExplainToChar(pool, rng, spec.cat);
      return qSubOfChar(pool, rng, spec.cat);
    }
    if (r < 0.32) return qCatOfChar(pool, rng, spec.cat);
    if (r < 0.55) return qCharOfCat(pool, rng, spec.cat);
    if (r < 0.75) return qExplainToChar(pool, rng, spec.cat);
    if (r < 0.88) return qSubOfChar(pool, rng, spec.cat);
    return qConcept(rng, excludeKeys);
  }

  function buildSession({ level = 'auto', daily = false } = {}) {
    const p = P();
    const adaptive = p ? p.adaptiveLevel(LSStore.raw) : '基礎';
    if (daily && p) {
      const challenge = p.dailyChallengeBlueprint(p.localDateKey(), `chars-${LSData.all.length}`);
      return { level: '進階', round: challenge.slots.length, blueprint: challenge.slots, rng: p.seededRandom(challenge.seed + '|questions'), dailyDate: challenge.date };
    }
    const actual = level === 'auto' ? adaptive : (level || null);
    const blueprint = p ? p.balancedBlueprint(LSStore.raw, ROUND) : Array.from({ length: ROUND }, () => ({}));
    return { level: actual, round: ROUND, blueprint, rng: Math.random, dailyDate: null };
  }

  function render(el) {
    const adaptive = P() ? P().adaptiveLevel(LSStore.raw) : '基礎';
    el.innerHTML = `
<div class="card">
  <h2>自測闖關</h2>
  <p class="muted">一回合 ${ROUND} 題，至少覆蓋六書各一題，並補強目前弱項；普通模式不以爭議字當唯一答案。</p>
  <div class="filterbar">
    <label>難度：<select id="quizLevel"><option value="auto">自動調整（目前${adaptive}）</option><option value="">全級混合</option><option>基礎</option><option>進階</option><option>挑戰</option></select></label>
    <button class="btn" id="quizStart">開始均衡自測</button>
    ${P() ? '<button class="btn ghost" id="quizDaily">今日字陣</button>' : ''}
  </div>
  <div id="quizArea"></div>
</div>`;
    el.querySelector('#quizStart').onclick = () => start(el.querySelector('#quizArea'), { level: el.querySelector('#quizLevel').value });
    el.querySelector('#quizDaily')?.addEventListener('click', () => start(el.querySelector('#quizArea'), { daily: true }));
  }

  function start(area, options) {
    const session = buildSession(options);
    st = { ...session, n: 0, right: 0, usedIds: new Set(), usedKeys: new Set(), missedIds: new Set(), completed: false,
      mode: options.daily ? 'daily' : 'quiz', sessionId: sessionToken(options.daily ? 'daily' : 'quiz') };
    next(area);
  }

  function next(area) {
    if (st.n >= st.round) {
      const completionId = st.dailyDate ? `daily:${st.dailyDate}:complete` : `${st.sessionId}:complete`;
      const earned = st.completed ? [] : LSStore.completeSession('quiz', { score: st.right, total: st.round, eventId: completionId });
      let daily = null;
      if (!st.completed && st.dailyDate) daily = LSStore.recordDailyChallenge(st.dailyDate, st.right, st.round);
      st.completed = true;
      const recovery = P()?.recoveryIds([...st.missedIds], LSStore.weakIds(LSData.all.map(c => c.id)), 5) || [...st.missedIds].slice(0, 5);
      const verdict = st.right >= Math.ceil(st.round * .8) ? '大師風範！去「大師對戰」踢館吧。' : st.right >= Math.ceil(st.round * .5) ? '不錯，弱點字已排進閃卡，複習一輪再來。' : '基礎需要打底——先回「概念導讀」與「閃卡複習」蹲馬步。';
      area.innerHTML = `<div class="feedback" role="status" aria-live="polite"><b>${st.dailyDate ? '今日字陣' : '回合'}結束！</b>答對 ${st.right}／${st.round}。${verdict}${daily ? `<br>首次 ${daily.first} 分／最佳 ${daily.best} 分；重玩仍可刷新最佳，但同日同題不重複累計成長。` : ''}${earned.length ? `<br>🏮 新印記 ×${earned.length}` : ''}</div>
      <div class="btnrow"><button class="btn" onclick="LSQuiz._again()">再來一回合</button>${recovery.length ? '<button class="btn ghost" id="qReview">先補強最多 5 個錯字</button>' : ''}${daily ? '<button class="btn ghost" id="qShare">複製戰果</button>' : ''}<button class="btn ghost" onclick="LSApp.go('battle')">去對戰</button></div><p id="qShareStatus" role="status" aria-live="polite"></p>`;
      area.querySelector('#qReview')?.addEventListener('click', () => {
        LSFlash.focus(recovery);
        LSApp.go('flash');
      });
      area.querySelector('#qShare')?.addEventListener('click', async () => {
        const streak = P().activityStreak(LSStore.raw).current;
        const text = P().challengeShareText({ date: st.dailyDate, score: st.right, total: st.round, streak });
        try {
          await navigator.clipboard.writeText(text);
          area.querySelector('#qShareStatus').textContent = '已複製不含答案的戰果文字。';
        } catch {
          area.querySelector('#qShareStatus').textContent = text;
        }
      });
      area.querySelector('.btn')?.focus();
      return;
    }
    const slot = st.blueprint[st.n] || {};
    const q = gen({ level: st.level, cat: slot.cat, type: slot.type, rng: st.rng, excludeIds: st.usedIds, excludeKeys: st.usedKeys });
    st.q = q;
    st.n++;
    if (q.charId) st.usedIds.add(q.charId);
    st.usedKeys.add(q.key);
    area.innerHTML = `
<div class="q-meta"><span>第 ${st.n}／${st.round} 題</span><span>已答對 ${st.right}</span></div>
<div class="q-stem">${q.stemHtml}</div>
<div class="opt-list">${q.options.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div>
<div id="qFb" role="status" aria-live="polite"></div>`;
    area.querySelectorAll('.opt').forEach(btn => {
      btn.onclick = () => {
        const i = +btn.dataset.i, ok = i === q.answer;
        area.querySelectorAll('.opt').forEach(b => { b.disabled = true; });
        area.querySelector(`[data-i="${q.answer}"]`).classList.add('correct');
        if (!ok) btn.classList.add('wrong');
        if (ok) st.right++;
        else if (q.charId) st.missedIds.add(q.charId);
        const before = q.charId && P() ? P().masteryStage(LSStore.raw.cards[q.charId]) : null;
        const answerEventId = st.dailyDate ? `daily:${st.dailyDate}:${q.key}` : `${st.sessionId}:${q.key}`;
        LSStore.recordAnswer(q.charId, q.cat, ok, st.mode, answerEventId);
        const after = q.charId && P() ? P().masteryStage(LSStore.raw.cards[q.charId]) : null;
        const growth = before && after ? `<br>${before.id === after.id ? after.label : `${before.label} → ${after.label}`}：${after.next}` : '';
        area.querySelector('#qFb').innerHTML = `<div class="feedback">${ok ? '⭕ 答對！' : '❌ 答錯。'}${q.explain}${growth}</div>
        <div class="btnrow"><button class="btn" id="qNext">下一題</button></div>`;
        area.querySelector('#qNext').onclick = () => next(area);
        area.querySelector('#qNext').focus();
      };
    });
  }

  function _again() {
    const area = document.querySelector('#quizArea');
    start(area, st.dailyDate ? { daily: true } : { level: st.level });
  }

  return { gen, render, _again, start, buildSession, CONCEPT_BANK };
})();
