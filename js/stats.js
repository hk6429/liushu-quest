// 戰績：總覽統計、分類正確率、弱點清單、匯出/匯入
const LSStats = (() => {
  function render(el) {
    const s = LSStore.raw;
    const acc = s.quiz.answered ? Math.round(s.quiz.right / s.quiz.answered * 100) : 0;
    const mastered = LSStore.masteredCount();
    const weak = LSStore.weakIds(LSData.all.map(c => c.id)).slice(0, 30);
    const beatenTotal = Object.values(s.battle.beaten).reduce((a, b) => a + b, 0);
    const days = Object.keys(s.days).length;
    const cats = LSData.CATS.map(cat => {
      const bc = s.quiz.byCat[cat];
      if (!bc || !(bc.r + bc.w)) return `<span class="pill cat-${cat}">${cat} —</span>`;
      return `<span class="pill cat-${cat}">${cat} ${Math.round(bc.r / (bc.r + bc.w) * 100)}%（${bc.r + bc.w}題）</span>`;
    }).join('');

    el.innerHTML = `
<div class="card">
  <h2>練功戰績</h2>
  <div class="stat-grid">
    <div class="stat-cell"><div class="num">${mastered}</div><div class="lbl">精通字數／${LSData.all.length}</div></div>
    <div class="stat-cell"><div class="num">${s.quiz.answered}</div><div class="lbl">累計答題</div></div>
    <div class="stat-cell"><div class="num">${acc}%</div><div class="lbl">總正確率</div></div>
    <div class="stat-cell"><div class="num">${beatenTotal}</div><div class="lbl">擊敗大師次數</div></div>
    <div class="stat-cell"><div class="num">${days}</div><div class="lbl">練功天數</div></div>
  </div>
  <h3>六書分類正確率</h3>
  <p>${cats}</p>
</div>
<div class="card">
  <h2>弱點字（優先複習）</h2>
  ${weak.length ? `<div class="weak-list">${weak.map(id => {
      const c = LSData.byId[id]; if (!c) return '';
      const cc = LSStore.card(id);
      return `<span class="weak-item" data-id="${id}"><b>${c.char}</b> <small class="muted">錯${cc.wrong}次</small></span>`;
    }).join('')}</div>
  <p class="muted" style="margin-top:.6rem">點字可看解說；這些字已排在閃卡佇列最前面。</p>`
        : `<p class="muted">目前沒有弱點字——去自測或對戰累積一些紀錄吧。</p>`}
</div>
<div class="card">
  <h2>進度備份</h2>
  <p class="muted">進度存在本機瀏覽器。換裝置前先「匯出」存起來，到新裝置「匯入」即可接關。</p>
  <textarea class="io" id="ioBox" placeholder="匯出的進度碼會出現在這裡；匯入時把進度碼貼進來"></textarea>
  <div class="btnrow">
    <button class="btn small" id="btnExport">匯出</button>
    <button class="btn small ghost" id="btnImport">匯入</button>
    <button class="btn small ghost" id="btnReset" style="border-color:#9c3b2e;color:#9c3b2e">全部重置</button>
  </div>
</div>`;
    el.querySelector('#btnExport').onclick = () => {
      el.querySelector('#ioBox').value = LSStore.exportSave();
      el.querySelector('#ioBox').select();
    };
    el.querySelector('#btnImport').onclick = () => {
      try { LSStore.importSave(el.querySelector('#ioBox').value.trim()); render(el); }
      catch (e) { alert('匯入失敗：' + e.message); }
    };
    el.querySelector('#btnReset').onclick = () => {
      if (confirm('確定要清空所有進度？此動作無法復原。')) { LSStore.resetAll(); render(el); }
    };
    el.querySelectorAll('.weak-item').forEach(w => {
      w.onclick = () => LSApp.showChar(w.dataset.id);
    });
  }
  return { render };
})();
