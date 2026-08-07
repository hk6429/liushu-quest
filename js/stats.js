// 戰績：總覽統計、分類正確率、弱點清單、匯出/匯入
const LSStats = (() => {
  function render(el) {
    const s = LSStore.raw;
    const p = typeof LSProgress !== 'undefined' ? LSProgress : null;
    const acc = s.quiz.answered ? Math.round(s.quiz.right / s.quiz.answered * 100) : 0;
    const mastered = LSStore.masteredCount();
    const weak = LSStore.weakIds(LSData.all.map(c => c.id)).slice(0, 30);
    const beatenTotal = Object.values(s.battle.beaten).reduce((a, b) => a + b, 0);
    const days = Object.values(s.days).filter(day => p ? p.normalizeDay(day).total > 0 : Number(day) > 0).length;
    const streak = p ? p.activityStreak(s) : { current: 0, longest: 0, today: { total: 0 }, goal: 5 };
    const mastery = p ? p.categoryMastery(s, LSData.all) : null;
    const stages = p ? LSData.all.reduce((out, c) => {
      const label = p.masteryStage(s.cards[c.id]).label;
      out[label] = (out[label] || 0) + 1;
      return out;
    }, {}) : {};
    const newlyEarned = p ? p.evaluateBadges(s, { chars: LSData.all, masters: LSBattle.MASTERS }) : [];
    if (newlyEarned.length) LSStore.persist();
    const badgeCatalog = p ? p.badgeCatalog(LSBattle.MASTERS) : [];
    const cats = LSData.CATS.map(cat => {
      const bc = s.quiz.byCat[cat];
      if (!bc || !(bc.r + bc.w)) return `<span class="pill cat-${cat}">${cat} —</span>`;
      return `<span class="pill cat-${cat}">${cat} ${Math.round(bc.r / (bc.r + bc.w) * 100)}%（${bc.r + bc.w}題）</span>`;
    }).join('');
    const modeNames = { quiz: '均衡自測', daily: '每日字陣', battle: '大師對戰' };
    const modes = Object.entries(modeNames).map(([mode, name]) => {
      const score = s.quiz.byMode?.[mode] || { r: 0, w: 0 };
      const total = score.r + score.w;
      return `<span class="pill">${name} ${total ? `${Math.round(score.r / total * 100)}%（${total}題）` : '—'}</span>`;
    }).join(' ');

    el.innerHTML = `
<div id="progressDashboard"></div>
<div class="card">
  <h2>練功戰績</h2>
  <div class="stat-grid">
    <div class="stat-cell"><div class="num">${mastered}</div><div class="lbl">精通字數／${LSData.all.length}</div></div>
    <div class="stat-cell"><div class="num">${s.quiz.answered}</div><div class="lbl">累計答題</div></div>
    <div class="stat-cell"><div class="num">${acc}%</div><div class="lbl">總正確率</div></div>
    <div class="stat-cell"><div class="num">${beatenTotal}</div><div class="lbl">擊敗大師次數</div></div>
    <div class="stat-cell"><div class="num">${days}</div><div class="lbl">練功天數</div></div>
    <div class="stat-cell"><div class="num">${streak.current}</div><div class="lbl">目前連續／最長 ${streak.longest} 天</div></div>
  </div>
  <p class="muted">今日有效學習 ${streak.today.total}/${streak.goal}；達標才計入連續天數。</p>
  <h3>各模式正確率</h3>
  <p>${modes}</p>
  <h3>六書分類正確率</h3>
  <p>${cats}</p>
  ${mastery ? `<h3>成長階段</h3><p>${Object.entries(stages).map(([label, count]) => `<span class="pill">${label} ${count}</span>`).join(' ')}</p>
  <p>${LSData.CATS.map(cat => `<span class="pill cat-${cat}">${cat}精通 ${mastery[cat].mastered}/${mastery[cat].total}</span>`).join(' ')}</p>` : ''}
</div>
<div class="card">
  <h2>弱點字（優先複習）</h2>
  ${weak.length ? `<div class="weak-list">${weak.map(id => {
      const c = LSData.byId[id]; if (!c) return '';
      const cc = LSStore.card(id);
      return `<button type="button" class="weak-item" data-id="${id}" aria-label="查看弱點字${c.char}，答錯${cc.wrong}次"><b>${c.char}</b> <small class="muted">錯${cc.wrong}次</small></button>`;
    }).join('')}</div>
  <p class="muted" style="margin-top:.6rem">點字可看解說；這些字會優先排入閃卡，且最多占本輪一半。</p>
  <div class="btnrow"><button class="btn small" id="btnWeakReview">立即補強 ${weak.length} 字</button></div>`
        : `<p class="muted">目前沒有弱點字——去自測或對戰累積一些紀錄吧。</p>`}
</div>
${p ? `<div class="card"><h2>六書印譜</h2><p class="muted">所有印記都由真實學習成果取得，不靠重複點擊。</p><div class="weak-list">${badgeCatalog.map(b => `<span class="pill ${s.badges[b.id] ? 'beaten' : ''}" title="${b.description}">${s.badges[b.id] ? '🏮' : '○'} ${b.name}</span>`).join('')}</div>${newlyEarned.length ? `<p class="feedback" role="status" aria-live="polite">新取得 ${newlyEarned.length} 枚印記！</p>` : ''}</div>` : ''}
<div class="card">
  <h2>進度備份</h2>
  <p class="muted">進度存在本機瀏覽器。換裝置前可下載 JSON 備份檔，到新裝置選檔匯入；文字進度碼仍可當備援。</p>
  <p id="backupStatus" class="muted" role="status" aria-live="polite"></p>
  <textarea class="io" id="ioBox" placeholder="匯出的進度碼會出現在這裡；匯入時把進度碼貼進來"></textarea>
  <input id="backupFile" type="file" accept="application/json,.json" hidden>
  <div class="btnrow">
    <button class="btn small" id="btnDownload">下載 JSON 備份</button>
    <button class="btn small ghost" id="btnFileImport">選擇 JSON 匯入</button>
    <button class="btn small ghost" id="btnExport">顯示進度碼</button>
    <button class="btn small ghost" id="btnImport">匯入進度碼</button>
    ${p ? '<button class="btn small ghost" id="btnOnboardingReset">重看三步導引</button>' : ''}
    <button class="btn small ghost" id="btnReset" style="border-color:#9c3b2e;color:#9c3b2e">全部重置</button>
  </div>
</div>`;
    const backupStatus = el.querySelector('#backupStatus');
    const showBackupStatus = (message, error = false) => {
      backupStatus.textContent = message;
      backupStatus.classList.toggle('storage-warning', error);
    };
    el.querySelector('#btnDownload').onclick = () => {
      const blob = new Blob([LSStore.exportSave()], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `liushu-quest-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showBackupStatus('JSON 備份已下載。');
    };
    el.querySelector('#btnFileImport').onclick = () => el.querySelector('#backupFile').click();
    el.querySelector('#backupFile').onchange = async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        if (file.size > 2_000_000) throw new Error('檔案超過 2 MB');
        LSStore.importSave(await file.text());
        render(el);
        el.querySelector('#backupStatus').textContent = `已匯入 ${file.name}。`;
      } catch (error) {
        showBackupStatus(`匯入失敗：${error.message}`, true);
      } finally {
        event.target.value = '';
      }
    };
    el.querySelector('#btnExport').onclick = () => {
      el.querySelector('#ioBox').value = LSStore.exportSave();
      el.querySelector('#ioBox').select();
      showBackupStatus('進度碼已顯示，可複製保存。');
    };
    el.querySelector('#btnImport').onclick = () => {
      try {
        LSStore.importSave(el.querySelector('#ioBox').value.trim());
        render(el);
        el.querySelector('#backupStatus').textContent = '進度碼已安全匯入。';
      } catch (error) { showBackupStatus(`匯入失敗：${error.message}`, true); }
    };
    el.querySelector('#btnReset').onclick = () => {
      if (confirm('確定要清空所有進度？此動作無法復原。')) { LSStore.resetAll(); render(el); }
    };
    el.querySelector('#btnOnboardingReset')?.addEventListener('click', () => {
      p.advanceOnboarding(LSStore.raw, 'reset');
      LSStore.persist();
      render(el);
    });
    el.querySelectorAll('.weak-item').forEach(w => {
      w.onclick = () => LSApp.showChar(w.dataset.id);
    });
    el.querySelector('#btnWeakReview')?.addEventListener('click', () => {
      LSFlash.focus(weak);
      LSApp.go('flash');
    });
    if (p) p.renderDashboard(el.querySelector('#progressDashboard'));
  }
  return { render };
})();
