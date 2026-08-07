// 閃卡 Leitner SRS：到期優先、新字補位，一回合 20 張
const LSFlash = (() => {
  const ROUND = 20;
  let st = null;

  function buildDeck(level) {
    const ids = LSData.ofLevel(level).map(c => c.id);
    const due = LSStore.dueCards(ids);
    const fresh = LSStore.newCards(ids);
    const deck = due.slice(0, ROUND);
    for (const id of fresh) { if (deck.length >= ROUND) break; deck.push(id); }
    // 都複習完就隨機補舊卡
    if (!deck.length) {
      const rest = ids.slice();
      while (deck.length < Math.min(ROUND, rest.length)) {
        deck.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
      }
    }
    return deck;
  }

  function render(el) {
    el.innerHTML = `
<div class="card">
  <h2>閃卡複習</h2>
  <p class="muted">Leitner 間隔複習：答「熟」升盒（隔更久再出現）、「忘了」掉回第一盒。到期卡優先、新卡補位，一回合最多 ${ROUND} 張。</p>
  <div class="filterbar">
    <label>範圍：<select id="flashLevel"><option value="">全部</option><option>基礎</option><option>進階</option><option>挑戰</option></select></label>
    <button class="btn" id="flashStart">開始複習</button>
  </div>
  <div id="flashArea"></div>
</div>`;
    el.querySelector('#flashStart').onclick = () => {
      const level = el.querySelector('#flashLevel').value || null;
      st = { deck: buildDeck(level), i: 0, flipped: false };
      show(el.querySelector('#flashArea'));
    };
  }

  function show(area) {
    if (st.i >= st.deck.length) {
      area.innerHTML = `<div class="feedback"><b>本回合完成！</b>共複習 ${st.deck.length} 張。明天再來，到期卡會自動排隊。</div>
      <div class="btnrow"><button class="btn" onclick="LSApp.go('quiz')">去自測驗收</button></div>`;
      return;
    }
    const c = LSData.byId[st.deck[st.i]];
    const box = LSStore.card(c.id).box;
    st.flipped = false;
    area.innerHTML = `
<div class="flash-progress">第 ${st.i + 1}／${st.deck.length} 張　·　第 ${box} 盒</div>
<div class="card flashcard" id="fcard">
  <div class="headchar">${c.char}</div>
  <p class="muted">${c.zhuyin}　·　點卡片翻面</p>
</div>
<div id="gradeRow"></div>`;
    area.querySelector('#fcard').onclick = () => {
      if (st.flipped) return;
      st.flipped = true;
      area.querySelector('#fcard').innerHTML = `
<div class="headchar" style="font-size:2.6rem">${c.char}</div>
<p><span class="pill cat-${c.category}">${c.category}${c.sub ? '・' + c.sub : ''}</span><span class="pill lv-${c.level}">${c.level}</span>${c.disputed ? '<span class="disputed-mark">⚡爭議</span>' : ''}</p>
<p style="text-align:left">${c.explain}</p>
${c.disputed && c.dispute_note ? `<p class="muted" style="text-align:left">⚡ ${c.dispute_note}</p>` : ''}
${c.shuowen ? `<p class="muted">《說文》：${c.shuowen}</p>` : ''}`;
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
    LSStore.gradeCard(id, g);
    st.i++;
    show(area);
  }
  return { render };
})();
