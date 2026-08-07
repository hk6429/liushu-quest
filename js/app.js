// 分頁路由 + 字例總覽 + 字卡詳情
const LSApp = (() => {
  const VIEW_LABELS = {
    concept: '概念導讀', story: '造字故事', browse: '字例總覽', flash: '閃卡複習',
    quiz: '自測闖關', battle: '大師對戰', stats: '戰績'
  };
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
  function reducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function showStorageWarning(detail = LSStore.lastError) {
    const warning = el('storageWarning');
    if (!warning || !detail) return;
    warning.hidden = false;
    warning.textContent = `進度${detail.action || '儲存'}失敗：${detail.message || '請下載備份，並檢查瀏覽器是否允許本機儲存。'}`;
  }

  function go(name, options = {}) {
    if (!views[name]) return;
    const shouldFocus = options.focus !== false;
    const currentDialogClose = document.querySelector('.char-detail-overlay [data-close-dialog]');
    if (currentDialogClose) currentDialogClose.click();
    const activeTab = document.querySelector(`.tabs button[data-view="${name}"]`);
    document.querySelectorAll('.tabs button').forEach(b => {
      const active = b.dataset.view === name;
      b.classList.toggle('active', active);
      if (active) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    document.querySelectorAll('.view').forEach(v => {
      const active = v.id === 'view-' + name;
      v.classList.toggle('active', active);
      v.setAttribute('aria-hidden', String(!active));
    });
    views[name]();
    enhanceView(name);
    document.title = `${VIEW_LABELS[name]}｜六書造字堂`;
    activeTab?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    const heading = el('view-' + name).querySelector('h2');
    if (shouldFocus && heading) heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  function enhanceView(name) {
    const root = el('view-' + name);
    const heading = root.querySelector('h2');
    if (heading) {
      heading.id = `view-${name}-title`;
      heading.tabIndex = -1;
      root.setAttribute('aria-labelledby', heading.id);
    }
    if (name === 'concept') enhanceConceptNavigation(root);
  }

  function enhanceConceptNavigation(root) {
    const labels = ['象形', '指事', '會意', '假借', '形聲', '轉注'];
    const headings = [...root.querySelectorAll('.card > h2')].filter(h => labels.some(label => h.textContent.includes(label)));
    if (headings.length !== labels.length) return;
    const links = headings.map(h => {
      const label = labels.find(item => h.textContent.includes(item));
      h.id = `concept-${label}`;
      h.tabIndex = -1;
      h.parentElement.setAttribute('role', 'region');
      h.parentElement.setAttribute('aria-labelledby', h.id);
      return `<a class="pill cat-${label}" href="#${h.id}">${label}</a>`;
    }).join('');
    const nav = document.createElement('nav');
    nav.className = 'concept-jump';
    nav.setAttribute('aria-label', '六書頁內導覽');
    nav.innerHTML = `<strong>快速跳到</strong><span class="concept-jump-links">${links}</span>`;
    root.prepend(nav);
    nav.querySelectorAll('a').forEach(link => {
      link.onclick = event => {
        event.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        target.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
        target.focus({ preventScroll: true });
        history.replaceState(null, '', link.getAttribute('href'));
      };
    });
  }

  // ── 字例總覽 ──
  function renderBrowse() {
    const root = el('view-browse');
    root.innerHTML = `
<div class="card">
  <h2>字例總覽（共 ${LSData.all.length} 字）</h2>
  <div class="filterbar" role="search" aria-label="篩選字例">
    <label for="fCat"><span>書類</span><select id="fCat"><option value="">全部書類</option>${LSData.CATS.map(c => `<option>${c}</option>`).join('')}</select></label>
    <label for="fLv"><span>難度</span><select id="fLv"><option value="">全部難度</option>${LSData.LEVELS.map(l => `<option>${l}</option>`).join('')}</select></label>
    <label for="fQ"><span>搜尋</span><input id="fQ" type="search" placeholder="輸入單字" size="6"></label>
  </div>
  <div class="filter-summary"><span class="muted" id="filterHelp">綠框＝已精通</span><span id="filterCount" role="status" aria-live="polite" aria-atomic="true"></span></div>
  <div class="char-grid" id="charGrid" aria-label="字例搜尋結果" aria-describedby="filterCount filterHelp"></div>
</div>`;
    const refresh = () => {
      const cat = root.querySelector('#fCat').value;
      const lv = root.querySelector('#fLv').value;
      const q = root.querySelector('#fQ').value.trim();
      const list = LSData.all.filter(c =>
        (!cat || c.category === cat) && (!lv || c.level === lv) && (!q || c.char.includes(q)));
      root.querySelector('#charGrid').innerHTML = list.map(c =>
        `<button type="button" class="char-tile ${LSStore.isMastered(c.id) ? 'mastered' : ''}" data-id="${c.id}" aria-label="${c.char}，${c.zhuyin}，${c.category}${LSStore.isMastered(c.id) ? '，已精通' : ''}，開啟解說">
          <span class="big">${c.char}</span><span class="zy">${c.zhuyin}</span>
          <span class="pill cat-${c.category}" style="font-size:.68rem;padding:0 .35rem">${c.category}</span>
        </button>`).join('') || '<p class="muted">沒有符合的字。</p>';
      root.querySelector('#filterCount').textContent = `找到 ${list.length} 字`;
      root.querySelectorAll('.char-tile').forEach(t => { t.onclick = () => showChar(t.dataset.id, t); });
    };
    ['fCat', 'fLv', 'fQ'].forEach(id => { root.querySelector('#' + id).oninput = refresh; });
    refresh();
  }

  function showChar(id, trigger = document.activeElement) {
    const c = LSData.byId[id];
    if (!c) return;
    const ov = document.createElement('div');
    ov.className = 'char-detail-overlay';
    ov.innerHTML = `<div class="card char-detail" role="dialog" aria-modal="true" aria-labelledby="charDetailTitle" tabindex="-1">
      <h2 class="headchar" id="charDetailTitle">${c.char}</h2>
      <p><span class="muted">${c.zhuyin}</span>　<span class="pill cat-${c.category}">${c.category}${c.sub ? '・' + c.sub : ''}</span><span class="pill lv-${c.level}">${c.level}</span>${c.disputed ? '<span class="disputed-mark">⚡歸類有爭議</span>' : ''}</p>
      <p>${c.explain}</p>
      ${c.disputed && c.dispute_note ? `<p class="muted">⚡ ${c.dispute_note}</p>` : ''}
      ${typeof LSEvidence !== 'undefined' ? LSEvidence.render(c) : ''}
      <div class="btnrow"><button type="button" class="btn small ghost" data-close-dialog>關閉</button></div>
    </div>`;
    const returnFocus = trigger instanceof HTMLElement ? trigger : null;
    const close = () => {
      ov.remove();
      document.body.classList.remove('modal-open');
      if (returnFocus?.isConnected) returnFocus.focus();
    };
    ov.onclick = e => { if (e.target === ov || e.target.closest('[data-close-dialog]')) close(); };
    ov.onkeydown = e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const focusable = [...ov.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first) { e.preventDefault(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.body.classList.add('modal-open');
    document.body.appendChild(ov);
    ov.querySelector('[data-close-dialog]').focus();
  }

  // ── 啟動 ──
  window.addEventListener('liushu:storage-error', event => showStorageWarning(event.detail));
  showStorageWarning();
  document.querySelectorAll('.tabs button').forEach(b => { b.onclick = () => go(b.dataset.view); });
  LSData.init().then(() => go('concept', { focus: false })).catch(err => {
    document.getElementById('main').innerHTML = `<div class="card"><h2>資料載入失敗</h2><p class="muted">${err}</p></div>`;
  });

  return { go, showChar };
})();
