// 閃卡 Leitner SRS：到期優先、新字補位，一回合 20 張
const LSFlash = (() => {
  const ROUND = 20;
  let st = null;
  let pendingFocus = [];

  function sessionToken(prefix = 'flash') {
    return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
  }

  function buildDeck(level, focusIds = pendingFocus) {
    const ids = LSData.ofLevel(level).map(c => c.id);
    const allowed = new Set(ids);
    const focus = [...new Set(focusIds)].filter(id => allowed.has(id));
    const focusSet = new Set(focus);
    const weakOrder = LSStore.weakIds(ids);
    const weakSet = new Set(weakOrder);
    const due = LSStore.dueCards(ids).filter(id => !focusSet.has(id)).sort((a, b) => {
      const aw = weakSet.has(a) ? 1 : 0, bw = weakSet.has(b) ? 1 : 0;
      if (aw !== bw) return bw - aw;
      const ac = LSStore.raw.cards[a], bc = LSStore.raw.cards[b];
      return (ac?.due || 0) - (bc?.due || 0) || (bc?.wrong || 0) - (ac?.wrong || 0);
    });
    const fresh = LSStore.newCards(ids);
    // 一般複習固定保留最多 4 個新字，避免到期卡長期塞滿 20 格；玩家指定補強時尊重指定牌組。
    const freshQuota = focus.length ? 0 : Math.min(4, fresh.length);
    const reviewLimit = ROUND - freshQuota;
    // 弱點最多占一半，剩餘位置穿插其他到期卡與新卡。
    const focusedWeak = focus.filter(id => weakSet.has(id)).slice(0, ROUND / 2);
    const focusedOther = focus.filter(id => !weakSet.has(id));
    const dueWeak = due.filter(id => weakSet.has(id) && !focusedWeak.includes(id)).slice(0, Math.max(0, ROUND / 2 - focusedWeak.length));
    const dueOther = due.filter(id => !weakSet.has(id));
    const deck = [...focusedWeak, ...dueWeak, ...focusedOther, ...dueOther].slice(0, reviewLimit);
    for (const id of fresh) { if (deck.length >= ROUND) break; if (!deck.includes(id)) deck.push(id); }
    // 都複習完就隨機補舊卡
    if (!deck.length) {
      const rest = ids.slice();
      while (deck.length < Math.min(ROUND, rest.length)) {
        deck.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
      }
    }
    return deck;
  }

  function focus(ids) {
    pendingFocus = Array.isArray(ids) ? [...new Set(ids)] : [];
  }

  function render(el) {
    el.innerHTML = `
<div class="card">
  <h2>閃卡複習</h2>
  <p class="muted">Leitner 間隔複習：「熟」升盒、「模糊」留盒並隔天再見、「忘了」掉回第一盒。一般回合保留最多 4 個新字，弱點最多占一半，一回合最多 ${ROUND} 張。</p>
  <div class="filterbar">
    <label>範圍：<select id="flashLevel"><option value="">全部</option><option>基礎</option><option>進階</option><option>挑戰</option></select></label>
    <button class="btn" id="flashStart">開始複習</button>
  </div>
  ${pendingFocus.length ? `<p class="feedback" role="status">已鎖定 ${pendingFocus.length} 個弱點字，本輪會優先出現。</p>` : ''}
  <div id="flashArea"></div>
</div>`;
    el.querySelector('#flashStart').onclick = () => {
      const level = el.querySelector('#flashLevel').value || null;
      st = { deck: buildDeck(level), i: 0, flipped: false, completed: false, lastGrowth: '', sessionId: sessionToken() };
      pendingFocus = [];
      show(el.querySelector('#flashArea'));
    };
  }

  function show(area) {
    if (st.i >= st.deck.length) {
      const earned = st.completed ? [] : LSStore.completeSession('flash', { total: st.deck.length, eventId: `${st.sessionId}:complete` });
      st.completed = true;
      area.innerHTML = `<div class="feedback" role="status" aria-live="polite"><b>本回合完成！</b>共複習 ${st.deck.length} 張。明天再來，到期卡會自動排隊。${earned.length ? `<br>🏮 新印記 ×${earned.length}` : ''}</div>
      <div class="btnrow"><button class="btn" onclick="LSApp.go('quiz')">去自測驗收</button></div>`;
      return;
    }
    const c = LSData.byId[st.deck[st.i]];
    const box = LSStore.card(c.id).box;
    st.flipped = false;
    area.innerHTML = `
${st.lastGrowth ? `<div class="feedback" role="status" aria-live="polite">${st.lastGrowth}</div>` : ''}
<div class="flash-progress" role="status">第 ${st.i + 1}／${st.deck.length} 張　·　第 ${box} 盒</div>
<button type="button" class="card flashcard" id="fcard" aria-expanded="false">
  <div class="headchar">${c.char}</div>
  <p class="muted">${c.zhuyin}　·　點卡片翻面</p>
</button>
<div id="gradeRow"></div>`;
    st.lastGrowth = '';
    area.querySelector('#fcard').onclick = () => {
      if (st.flipped) return;
      st.flipped = true;
      area.querySelector('#fcard').setAttribute('aria-expanded', 'true');
      area.querySelector('#fcard').innerHTML = `
<div class="headchar" style="font-size:2.6rem">${c.char}</div>
<p><span class="pill cat-${c.category}">${c.category}${c.sub ? '・' + c.sub : ''}</span><span class="pill lv-${c.level}">${c.level}</span>${c.disputed ? '<span class="disputed-mark">⚡爭議</span>' : ''}</p>
<p style="text-align:left">${c.explain}</p>
${c.disputed && c.dispute_note ? `<p class="muted" style="text-align:left">⚡ ${c.dispute_note}</p>` : ''}
${typeof LSEvidence !== 'undefined' ? LSEvidence.render(c, { compact: true }) : ''}`;
      area.querySelector('#gradeRow').innerHTML = `
<div class="grade-row">
  <button class="btn again">忘了</button>
  <button class="btn hard">模糊</button>
  <button class="btn good">熟！</button>
</div>`;
      area.querySelector('.again').onclick = () => grade(area, c.id, 0);
      area.querySelector('.hard').onclick = () => grade(area, c.id, 1);
      area.querySelector('.good').onclick = () => grade(area, c.id, 2);
    };
  }
  function grade(area, id, g) {
    const p = typeof LSProgress !== 'undefined' ? LSProgress : null;
    const before = p ? p.masteryStage(LSStore.raw.cards[id]) : null;
    LSStore.gradeCard(id, g, `${st.sessionId}:${id}`);
    const after = p ? p.masteryStage(LSStore.raw.cards[id]) : null;
    if (before && after) st.lastGrowth = before.id === after.id ? `${after.label}：${after.next}` : `${before.label} → ${after.label}：${after.next}`;
    st.i++;
    show(area);
  }
  return { render, buildDeck, focus };
})();
