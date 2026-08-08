// 出題引擎 + 自測闖關 UI。六書前四類問「構形方式」，轉注／假借問「用字關係」。
const LSQuiz = (() => {
  const CONCEPT_BANK = [
    { stem: '主要依物體輪廓描畫、線條跟著形體轉折，指的是哪一書？', opts: ['象形', '指事', '會意', '形聲'], ans: 0, exp: '照物體的樣子描畫、線條隨形體轉折，就是象形。' },
    { stem: '使用抽象符號，或加上記號指出位置與概念，是哪一書？', opts: ['會意', '指事', '象形', '轉注'], ans: 1, exp: '用符號指出抽象概念或特定部位，是指事。' },
    { stem: '兩個以上有意義的部件結合，從彼此關係產生新意，是哪一書？', opts: ['形聲', '假借', '會意', '指事'], ans: 2, exp: '有意義的部件組合後會合出新意，是會意。' },
    { stem: '一部分提示意義類別，另一部分提供讀音線索，是哪一書？', opts: ['形聲', '象形', '轉注', '會意'], ans: 0, exp: '形符提示意義、聲符提示讀音，是形聲。' },
    { stem: '同類近義字分化後，仍能彼此訓釋，是哪一書？', opts: ['假借', '會意', '指事', '轉注'], ans: 3, exp: '近義字彼此訓釋（如考、老），是轉注的常見教學例。' },
    { stem: '想記錄的語詞沒有專用字，便借用同音或近音的現成字，是哪一書？', opts: ['假借', '轉注', '形聲', '指事'], ans: 0, exp: '借用讀音相近的現成字記錄另一個語詞，是假借。' },
    { stem: '文字發明前，「結繩記事」最接近下列哪一項描述？', opts: ['有物理形狀與記事功能，但沒有固定字形逐一對應語詞，也不能提示讀音', '只有意義，完全沒有任何物理形狀', '已具備固定的字形、讀音與意義', '只有讀音，沒有形狀與記事功能'], ans: 0, exp: '繩結當然有物理形狀，也能協助記事；但它不是一套以固定字形逐一記錄語詞、並提示讀音的文字系統。' },
    { stem: '文字發明前，「壁畫」具備哪些要素？', opts: ['有形、有義，無音', '有義，無形、無音', '有音、有義，無形', '有形，無音、無義'], ans: 0, exp: '畫得出形、看得懂意思，但沒有聲音。' },
    { stem: '文字發明前，「語言」具備哪些要素？', opts: ['有形、有義，無音', '有形，無音、無義', '有音、有義，無形', '形音義俱全'], ans: 2, exp: '說出口有音有義，但留不下形。' },
    { stem: '六書中屬於「用字之法」（而非構形方式）的是？', opts: ['轉注、假借', '象形、指事', '會意、形聲', '形聲、假借'], ans: 0, exp: '象形、指事、會意、形聲說明構形；轉注、假借說明字與字、字與意義的使用關係。' },
    { stem: '中文形聲字特別多，較完整的解釋是哪一項？', opts: ['形符標示意義類別、聲符提示讀音，能有效擴充字量；假借後分化新字只是其中一種形成路徑', '形聲字都源自假借後加形符分化', '因為象形字的筆畫一定比較複雜', '因為轉注可以直接量產新字'], ans: 0, exp: '形聲能用形符與聲符的分工有效擴充字量；其→箕、莫→暮可說明部分分化路徑，但不能當成所有形聲字的唯一來源。' },
    { stem: '三「木」組成「森」，屬於哪一種構形方式？', opts: ['同體會意', '異體會意', '象形', '指事'], ans: 0, exp: '同一部件重複組合成新意，是同體會意。' },
    { stem: '「人」倚「木」旁組成「休」，屬於哪一種構形方式？', opts: ['同體會意', '異體會意', '形聲', '轉注'], ans: 1, exp: '不同部件相合會出新意，是異體會意。' },
    { stem: '「考」「老」意義相近，又能彼此訓釋，呈現哪種用字關係？', opts: ['假借', '會意', '轉注', '形聲'], ans: 2, exp: '近義字分化後仍可彼此訓釋，是轉注的常見教學例。' },
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
  const relationEntries = c => Array.isArray(c.usage_relations)
    ? c.usage_relations.map(rel => typeof rel === 'string' ? { type: rel, related_chars: [] } : rel).filter(rel => rel?.type)
    : [];
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

  function relationOf(c, cat) {
    return relationEntries(c).find(rel => rel.type === cat)
      || (isUsage(c.category) && c.category === cat ? { type: cat, related_chars: [] } : null);
  }

  function usageEvidence(c, cat) {
    const rel = relationOf(c, cat);
    if (cat === '轉注') {
      const partner = rel?.related_chars?.[0];
      return partner
        ? `「${c.char}」與「${partner}」同類近義，兩字能彼此訓釋。`
        : `「${c.char}」必須和另一個同類近義字成對互訓，才是在談轉注。`;
    }
    const compact = [...c.explain].length > 150 ? [...c.explain].slice(0, 150).join('') + '…' : c.explain;
    return `${compact}（本題要判斷的是原有字被借來記錄另一語詞的關係。）`;
  }

  function evidenceFor(c, cat) {
    return isUsage(cat) ? usageEvidence(c, cat) : c.explain;
  }

  function qCatOfChar(pool, rng, requestedCat) {
    const c = randPick(pool, rng);
    const cat = requestedCat || c.category;
    const wrong = LSData.pick(LSData.CATS.filter(x => x !== cat), 3, rng);
    const opts = shuffle([cat, ...wrong], rng);
    const relation = isUsage(cat);
    return {
      stemHtml: relation
        ? `${qualifier(c)}閱讀完整關係證據：<div class="feedback usage-context">${usageEvidence(c, cat)}</div>這段材料呈現哪一種<b>用字關係</b>？`
        : `${qualifier(c)}下面這個字呈現六書中的哪一種<b>構形方式</b>？<span class="stem-char">${c.char} <small style="font-size:.95rem;color:var(--ink-soft)">${c.zhuyin}</small></span>`,
      options: opts, answer: opts.indexOf(cat),
      explain: `【${c.char}】${cat}${c.sub ? '（' + c.sub + '）' : ''}——${c.explain}`,
      charId: c.id, cat, axis: isUsage(cat) ? 'usage' : 'formation',
      misconception: relation ? '混淆構形與用字關係' : `混淆${cat}的構形證據`,
      key: `cat:${cat}:${c.id}`
    };
  }

  function qCharOfCat(pool, rng, requestedCat) {
    const c = randPick(pool, rng);
    const cat = requestedCat || c.category;
    const sameLv = LSData.all.filter(x => x.level === c.level && !matchesCat(x, cat) && !x.disputed);
    const wrong = LSData.pick(sameLv, 3, rng);
    if (wrong.length < 3) return qCatOfChar(pool, rng, cat);
    const opts = shuffle([c, ...wrong], rng);
    const usage = isUsage(cat);
    return {
      stemHtml: `${qualifier(c)}下列哪一組材料呈現<b>「${cat}」${usage ? '用字關係' : '構形方式'}</b>？`,
      options: usage ? opts.map(x => x === c ? evidenceFor(x, cat) : evidenceFor(x, isUsage(x.category) ? x.category : formationCat(x))) : opts.map(x => x.char), answer: opts.indexOf(c),
      explain: `【${c.char}】${c.explain}` + wrong.map(w => `／【${w.char}】本題資料列為${w.category}`).join(''),
      charId: c.id, cat, axis: isUsage(cat) ? 'usage' : 'formation', transfer: true,
      misconception: `無法把${cat}判準遷移到新字`, key: `pick:${cat}:${c.id}`
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
    const masked = evidenceFor(c, cat).split(c.char).join('◯');
    const opts = shuffle([c, ...wrong], rng);
    return {
      stemHtml: `${qualifier(c)}下面的解說描述哪一個字？（◯＝該字）<div class="feedback">${masked}</div>`,
      options: opts.map(x => x.char), answer: opts.indexOf(c),
      explain: `正解【${c.char}】（本題資料列為${cat}${c.sub ? '・' + c.sub : ''}）`,
      charId: c.id, cat, axis: isUsage(cat) ? 'usage' : 'formation', rationale: true,
      misconception: '未能由文字證據反推字例', key: `explain:${cat}:${c.id}`
    };
  }

  function qSubOfChar(pool, rng, requestedCat) {
    const cands = pool.filter(c => c.sub);
    if (!cands.length) return qCatOfChar(pool, rng, requestedCat);
    const c = randPick(cands, rng);
    const opts = ['同體會意', '異體會意', '有借有還', '有借不還', '借義另造'];
    return {
      stemHtml: `${qualifier(c)}「<b>${c.char}</b>」在本題資料中列為${c.category}，更精確是哪一類？`,
      options: opts, answer: opts.indexOf(c.sub),
      explain: `【${c.char}】${c.sub}——${c.explain}`,
      charId: c.id, cat: requestedCat || c.category,
      axis: isUsage(requestedCat || c.category) ? 'usage' : 'formation', rationale: true,
      misconception: '混淆會意或假借的次分類', key: `sub:${c.id}`
    };
  }

  function qConcept(rng = Math.random, excludeKeys = new Set()) {
    const candidates = CONCEPT_BANK.map((q, i) => ({ q, i })).filter(x => !excludeKeys.has(`concept:${x.i}`));
    const chosen = randPick(candidates.length ? candidates : CONCEPT_BANK.map((q, i) => ({ q, i })), rng);
    const order = shuffle(chosen.q.opts.map((t, i) => ({ t, ok: i === chosen.q.ans })), rng);
    return {
      stemHtml: chosen.q.stem, options: order.map(o => o.t),
      answer: order.findIndex(o => o.ok), explain: chosen.q.exp,
      charId: null, cat: '概念', axis: null, rationale: true, key: `concept:${chosen.i}`
    };
  }

  function qAxis(pool, rng) {
    const dual = pool.filter(c => formationCat(c) && usageRelations(c).length);
    if (!dual.length) return qCatOfChar(pool, rng);
    const c = randPick(dual, rng);
    const relation = randPick(usageRelations(c), rng);
    const relationPrompt = relation === '轉注'
      ? `「${c.char}」與「${relationOf(c, relation)?.related_chars?.[0] || '另一近義字'}」彼此訓釋的用字關係`
      : `「${c.char}」由本義借來記錄另一個同音或近音語詞的用字關係`;
    const askUsage = rng() >= .5;
    const correct = askUsage ? relation : formationCat(c);
    const opts = shuffle([correct, ...LSData.CATS.filter(cat => cat !== correct).slice(0, 3)], rng);
    return {
      stemHtml: `「<b>${c.char}</b>」同時可以從兩條軸線分析。本題問的是<b>${askUsage ? relationPrompt : '字形本身如何構成'}</b>，應判為哪一類？`,
      options: opts, answer: opts.indexOf(correct),
      explain: `本題先辨認提問軸線：${askUsage ? `用字關係是${relation}` : `構形方式是${formationCat(c)}`}。同一字在不同題幹下，答案可以不同。`,
      charId: c.id, cat: correct, axis: askUsage ? 'usage' : 'formation', rationale: true,
      misconception: '未先辨認題目問構形還是用字關係', key: `axis:${askUsage ? 'usage' : 'formation'}:${c.id}`
    };
  }

  function qEvidence(pool, rng, requestedCat = null, requestedAxis = null) {
    const c = randPick(pool, rng);
    const cat = requestedCat
      || (requestedAxis === 'formation' ? formationCat(c) : requestedAxis === 'usage' ? usageRelations(c)[0] : null)
      || formationCat(c) || usageRelations(c)[0] || c.category;
    const labels = { 象形: '早期字形描摹物體輪廓', 指事: '記號指出位置或抽象概念', 會意: '有意義部件的關係會出新義', 形聲: '形符表義、聲符提示讀音', 假借: '借同音或近音字記錄另一語詞', 轉注: '同類近義字可以彼此訓釋' };
    const correct = labels[cat];
    const opts = shuffle([correct, ...Object.values(labels).filter(x => x !== correct).slice(0, 3)], rng);
    return {
      stemHtml: `${isUsage(cat) ? `<div class="feedback usage-context">${usageEvidence(c, cat)}</div>` : ''}若要支持${isUsage(cat) ? '上述字與字／字與詞的關係' : `「<b>${c.char}</b>」的構形`}應判為<b>${cat}</b>，下列哪一項是最關鍵的證據？`,
      options: opts, answer: opts.indexOf(correct), explain: `判斷不能只靠字形聯想；本題關鍵證據是：${correct}。${c.explain}`,
      charId: c.id, cat, axis: isUsage(cat) ? 'usage' : 'formation', rationale: true,
      misconception: `只記答案，沒有掌握${cat}的證據`, key: `evidence:${cat}:${c.id}`
    };
  }

  const CONTRASTS = [
    { ids: ['c0068', 'c0083'], stem: '「本」和「休」都看得到「木」，為什麼分類不同？', opts: ['本用短橫指出樹根，是指事；休由人與木會合新義，是會意', '兩字都是會意', '兩字都是指事', '本是形聲，休是假借'], ans: 0, exp: '部件是否有獨立字義、在字中負責什麼功能，才是分類關鍵。', id: 'c0068', cat: '指事', axis: 'formation' },
    { ids: ['c0116'], stem: '題目問「莫」的字形如何表示日暮，與問「莫」借作否定詞，答案應如何區分？', opts: ['前者會意，後者假借', '前者假借，後者會意', '兩者都是形聲', '兩者都是轉注'], ans: 0, exp: '日落草叢的字形是會意；借來記錄否定詞是用字關係的假借。', id: 'c0116', cat: '假借', axis: 'usage' },
    { ids: ['c0181', 'c0182'], stem: '「考、老」何時應答「轉注」？', opts: ['題目問兩字近義互訓的關係時', '只要單獨看到「老」字時', '題目問「考」的字形構成時', '只要兩字讀音完全相同時'], ans: 0, exp: '轉注看的是兩字互訓的關係；若問單字構形，「考」與「老」仍要分別分析。', id: 'c0182', cat: '轉注', axis: 'usage' }
  ];

  function qContrast(pool, rng) {
    const allowed = new Set(pool.map(c => c.id));
    const choices = CONTRASTS.filter(q => q.ids.some(id => allowed.has(id)));
    const q = randPick(choices.length ? choices : CONTRASTS, rng);
    const order = shuffle(q.opts.map((text, i) => ({ text, ok: i === q.ans })), rng);
    return {
      stemHtml: q.stem, options: order.map(o => o.text), answer: order.findIndex(o => o.ok), explain: q.exp,
      charId: q.id, cat: q.cat, axis: q.axis, rationale: true, transfer: true,
      misconception: '易混字只看共有部件，未比較判準', key: `contrast:${q.id}`
    };
  }

  // 相容 gen('基礎')；新版可傳 { level, cat, type, rng, excludeIds, excludeKeys, ids }。
  function gen(input = null) {
    const spec = typeof input === 'string' || input === null ? { level: input } : input;
    const rng = spec.rng || Math.random;
    const excludeIds = spec.excludeIds || new Set();
    const excludeKeys = spec.excludeKeys || new Set();
    if (spec.type === 'concept') return qConcept(rng, excludeKeys);
    const allowedIds = spec.ids ? new Set(spec.ids) : null;
    let pool = LSData.ofLevel(spec.level).filter(c => matchesCat(c, spec.cat) && (!allowedIds || allowedIds.has(c.id)));
    if (spec.level !== '挑戰') pool = pool.filter(c => !c.disputed);
    pool = pool.filter(c => !excludeIds.has(c.id));
    if (!pool.length) {
      pool = LSData.all.filter(c => matchesCat(c, spec.cat) && (!allowedIds || allowedIds.has(c.id)) && (spec.level === '挑戰' || !c.disputed) && !excludeIds.has(c.id));
    }
    if (!pool.length) return qConcept(rng, excludeKeys);
    if (spec.type === 'axis') return qAxis(pool, rng);
    if (spec.type === 'evidence') return qEvidence(pool, rng, spec.cat, spec.axis);
    if (spec.type === 'contrast') return qContrast(pool, rng);
    if (spec.type === 'transfer') {
      const q = qCharOfCat(pool, rng, spec.cat);
      q.transfer = true;
      q.rationale = true;
      q.misconception = '無法把判準遷移到新字';
      return q;
    }
    const r = rng();
    if (spec.cat) {
      if (r < 0.4) return qCatOfChar(pool, rng, spec.cat);
      if (r < 0.68) return qCharOfCat(pool, rng, spec.cat);
      if (r < 0.9) return qExplainToChar(pool, rng, spec.cat);
      return qSubOfChar(pool, rng, spec.cat);
    }
    if (r < 0.16) return qAxis(pool, rng);
    if (r < 0.32) return qEvidence(pool, rng);
    if (r < 0.48) return qContrast(pool, rng);
    if (r < 0.62) return qCatOfChar(pool, rng, spec.cat);
    if (r < 0.75) return qCharOfCat(pool, rng, spec.cat);
    if (r < 0.86) return qExplainToChar(pool, rng, spec.cat);
    if (r < 0.93) return qSubOfChar(pool, rng, spec.cat);
    return qConcept(rng, excludeKeys);
  }

  function buildSession({ level = 'auto', daily = false, quick = false } = {}) {
    const p = P();
    const adaptive = p ? p.adaptiveLevel(LSStore.raw) : '基礎';
    if (daily && p) {
      const challenge = p.dailyChallengeBlueprint(p.localDateKey(), `chars-${LSData.all.length}`);
      return { level: '進階', round: challenge.slots.length, blueprint: challenge.slots, rng: p.seededRandom(challenge.seed + '|questions'), dailyDate: challenge.date };
    }
    if (quick) {
      const blueprint = [
        { type: 'axis' }, { type: 'evidence' }, { type: 'contrast' },
        { type: 'transfer' }, { type: 'evidence', axis: 'formation' }
      ];
      return { level: '進階', round: 5, blueprint, rng: Math.random, dailyDate: null, quick: true };
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
    <button class="btn ghost" id="quizQuick">快速證據 5 題</button>
    ${P() ? '<button class="btn ghost" id="quizDaily">今日字陣</button>' : ''}
  </div>
  <div id="quizArea"></div>
</div>`;
    el.querySelector('#quizStart').onclick = () => start(el.querySelector('#quizArea'), { level: el.querySelector('#quizLevel').value });
    el.querySelector('#quizQuick').onclick = () => start(el.querySelector('#quizArea'), { quick: true });
    el.querySelector('#quizDaily')?.addEventListener('click', () => start(el.querySelector('#quizArea'), { daily: true }));
  }

  function start(area, options) {
    const session = buildSession(options);
    st = { ...session, n: 0, right: 0, usedIds: new Set(), usedKeys: new Set(), missedIds: new Set(), completed: false,
      mode: options.daily ? 'daily' : 'quiz', sessionId: sessionToken(options.daily ? 'daily' : options.quick ? 'quick' : 'quiz') };
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
        const weekly = P().weeklyRhythm(LSStore.raw);
        const text = P().challengeShareText({ date: st.dailyDate, score: st.right, total: st.round, weekly: weekly.completed, goal: weekly.goal });
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
      const q = gen({ level: st.level, cat: slot.cat, type: slot.type, axis: slot.axis, rng: st.rng, excludeIds: st.usedIds, excludeKeys: st.usedKeys });
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
        LSStore.recordAnswer(q.charId, q.cat, ok, st.mode, answerEventId, {
          axis: q.axis, rationale: !!q.rationale, transfer: !!q.transfer, misconception: q.misconception
        });
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
    start(area, st.dailyDate ? { daily: true } : st.quick ? { quick: true } : { level: st.level });
  }

  return { gen, render, _again, start, buildSession, CONCEPT_BANK };
})();
