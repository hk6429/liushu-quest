// 分頁路由 + 字例總覽 + 字卡詳情
const LSApp = (() => {
  const views = {
    concept: () => LSConcept.render(el('view-concept')),
    story: () => LSStory.render(el('view-story')),
    browse: renderBrowse,
    flash: () => LSFlash.render(el('view-flash')),
    quiz: () => LSQuiz.render(el('view-quiz')),
    battle: () => LSBattle.render(el('view-battle')),
    stats: () => LSStats.render(el('view-stats'))
  };
  function el(id) { return document.getElementById(id); }

  function go(name) {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
    views[name]();
    window.scrollTo({ top: 0 });
  }

  // ── 字例總覽 ──
  function renderBrowse() {
    const root = el('view-browse');
    root.innerHTML = `
<div class="card">
  <h2>字例總覽（共 ${LSData.all.length} 字）</h2>
  <div class="filterbar">
    <select id="fCat"><option value="">全部書類</option>${LSData.CATS.map(c => `<option>${c}</option>`).join('')}</select>
    <select id="fLv"><option value="">全部難度</option>${LSData.LEVELS.map(l => `<option>${l}</option>`).join('')}</select>
    <input id="fQ" type="search" placeholder="找字…" size="6">
    <span class="muted">綠框＝已精通</span>
  </div>
  <div class="char-grid" id="charGrid"></div>
</div>`;
    const refresh = () => {
      const cat = root.querySelector('#fCat').value;
      const lv = root.querySelector('#fLv').value;
      const q = root.querySelector('#fQ').value.trim();
      const list = LSData.all.filter(c =>
        (!cat || c.category === cat) && (!lv || c.level === lv) && (!q || c.char.includes(q)));
      root.querySelector('#charGrid').innerHTML = list.map(c =>
        `<div class="char-tile ${LSStore.isMastered(c.id) ? 'mastered' : ''}" data-id="${c.id}">
          <div class="big">${c.char}</div><div class="zy">${c.zhuyin}</div>
          <span class="pill cat-${c.category}" style="font-size:.68rem;padding:0 .35rem">${c.category}</span>
        </div>`).join('') || '<p class="muted">沒有符合的字。</p>';
      root.querySelectorAll('.char-tile').forEach(t => { t.onclick = () => showChar(t.dataset.id); });
    };
    ['fCat', 'fLv', 'fQ'].forEach(id => { root.querySelector('#' + id).oninput = refresh; });
    refresh();
  }

  function showChar(id) {
    const c = LSData.byId[id];
    if (!c) return;
    const ov = document.createElement('div');
    ov.className = 'char-detail-overlay';
    ov.innerHTML = `<div class="card char-detail">
      <div class="headchar">${c.char}</div>
      <p><span class="muted">${c.zhuyin}</span>　<span class="pill cat-${c.category}">${c.category}${c.sub ? '・' + c.sub : ''}</span><span class="pill lv-${c.level}">${c.level}</span>${c.disputed ? '<span class="disputed-mark">⚡歸類有爭議</span>' : ''}</p>
      <p>${c.explain}</p>
      ${c.disputed && c.dispute_note ? `<p class="muted">⚡ ${c.dispute_note}</p>` : ''}
      ${c.shuowen ? `<p class="muted">《說文》：${c.shuowen}</p>` : ''}
      <div class="btnrow"><button class="btn small ghost">關閉</button></div>
    </div>`;
    ov.onclick = e => { if (e.target === ov || e.target.closest('.btn')) ov.remove(); };
    document.body.appendChild(ov);
  }

  // ── 啟動 ──
  document.querySelectorAll('.tabs button').forEach(b => { b.onclick = () => go(b.dataset.view); });
  LSData.init().then(() => go('concept')).catch(err => {
    document.getElementById('main').innerHTML = `<div class="card"><h2>資料載入失敗</h2><p class="muted">${err}</p></div>`;
  });

  return { go, showChar };
})();
