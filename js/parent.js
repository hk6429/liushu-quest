// 家長陪學入口：把進度翻成低壓力、可立即採用的 10 分鐘陪學流程。
const LSParent = (() => {
  const READING_KEY = 'liushu.parent.reading-size';
  const panel = document.getElementById('parentGuidePanel');
  const toggle = document.getElementById('parentGuideToggle');
  let timerId = null;
  let timerEnd = 0;

  function safeStorage(action, fallback = null) {
    try { return action(); } catch { return fallback; }
  }

  function progressSummary() {
    if (typeof LSData === 'undefined' || !Array.isArray(LSData.all) || !LSData.all.length) {
      return { text: '字庫正在準備中。', next: 'story', label: '先共讀一段故事' };
    }
    const ids = LSData.all.map(c => c.id);
    const save = LSStore.raw;
    const seen = ids.filter(id => Number(save.cards[id]?.seen) > 0).length;
    const mastered = LSStore.masteredCount(ids);
    const weak = LSStore.weakIds(ids).length;
    const passedChapters = Object.keys(save.journey.completed || {}).length;
    const readChapters = Object.keys(save.journey.read || {}).length;
    if (!seen && readChapters) return { text: `已閱讀 ${readChapters}/8 卷、通過 ${passedChapters}/8 卷；目前還沒有累積字卡練習，這不等於沒有學習。`, next: 'story', label: '接著共讀下一幕' };
    if (!seen) return { text: `尚未開始；全站共有 ${ids.length} 字，不需要一次學完。`, next: 'story', label: '先共讀一段故事' };
    if (weak) return { text: `已接觸 ${seen} 字、有效精通 ${mastered} 字；有 ${weak} 字適合再看一次。`, next: 'flash', label: `陪孩子複習 ${Math.min(5, weak)} 個字` };
    if (save.quiz.answered < 5) return { text: `已接觸 ${seen} 字、有效精通 ${mastered} 字；可以用短測驗聽聽孩子怎麼想。`, next: 'quiz', label: '一起完成 5 題自測' };
    return { text: `已接觸 ${seen} 字、有效精通 ${mastered} 字；今天維持短時間練習即可。`, next: 'flash', label: '複習幾張到期閃卡' };
  }

  function render() {
    if (!panel) return;
    const summary = progressSummary();
    panel.innerHTML = `
      <div class="parent-summary" role="status" aria-live="polite">
        <h2>今天怎麼陪？</h2>
        <p>${summary.text}</p>
        <button type="button" class="btn small" data-parent-next="${summary.next}">${summary.label}</button>
      </div>
      <div class="parent-guide-grid">
        <section><h3>10 分鐘三步驟</h3><ol><li>共讀一小段，不急著講答案。</li><li>請孩子挑 3–5 個字，說出「怎麼看出來」。</li><li>最後只問：「哪個地方想明天再試一次？」</li></ol></section>
        <section><h3>可以這樣問</h3><ul><li>你先看到了哪個部件？</li><li>這是字形構造，還是後來的用字關係？</li><li>如果分類有爭議，兩種說法各根據什麼？</li></ul></section>
        <section><h3>低壓力回饋</h3><p>先描述策略：「你有找到聲符線索。」再談答案。本站不做公開排名；答錯只用來安排下次複習。</p></section>
        <section><h3>資料與多位孩子</h3><p>進度預設只存在這台瀏覽器；只有主動使用「學習紀錄」才會加密同步。共用裝置請先切換孩子，避免紀錄混在一起。</p><button type="button" class="btn small ghost" data-open-family>切換孩子／家庭模式</button></section>
      </div>
      <div class="parent-controls" aria-label="閱讀與休息工具">
        <span><b>閱讀字級</b></span>
        <button type="button" class="btn small ghost" data-reading-size="normal">標準</button>
        <button type="button" class="btn small ghost" data-reading-size="large">放大</button>
        <button type="button" class="btn small ghost" data-parent-timer>開始 10 分鐘陪學</button>
        <span data-parent-timer-status role="status" aria-live="polite">尚未計時</span>
      </div>`;

    panel.querySelector('[data-parent-next]').onclick = event => LSApp.go(event.currentTarget.dataset.parentNext);
    panel.querySelector('[data-open-family]').onclick = event => {
      const family = document.getElementById('danai-family-classroom');
      const launcher = family?.shadowRoot?.querySelector('.launcher');
      if (launcher) launcher.click();
      else event.currentTarget.insertAdjacentHTML('afterend', '<span class="muted" role="status">家庭工具仍在載入，請稍後再試。</span>');
    };
    panel.querySelectorAll('[data-reading-size]').forEach(button => {
      button.onclick = () => setReadingSize(button.dataset.readingSize);
    });
    panel.querySelector('[data-parent-timer]').onclick = startTimer;
  }

  function setReadingSize(size) {
    const next = size === 'large' ? 'large' : 'normal';
    document.documentElement.dataset.readingSize = next;
    safeStorage(() => localStorage.setItem(READING_KEY, next));
    panel?.querySelectorAll('[data-reading-size]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.readingSize === next));
    });
  }

  function updateTimer() {
    const status = panel?.querySelector('[data-parent-timer-status]');
    const button = panel?.querySelector('[data-parent-timer]');
    if (!status || !button) return;
    const seconds = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
    if (!seconds) {
      clearInterval(timerId);
      timerId = null;
      status.textContent = '10 分鐘到了：看看遠方、喝口水，今天學到這裡也很好。';
      button.textContent = '重新計時';
      return;
    }
    const minutes = Math.floor(seconds / 60);
    status.textContent = `剩下 ${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function startTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    timerEnd = Date.now() + 10 * 60 * 1000;
    const button = panel.querySelector('[data-parent-timer]');
    button.textContent = '重新計時';
    updateTimer();
    timerId = setInterval(updateTimer, 1000);
  }

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '收起陪學指南' : '打開陪學指南';
    panel.hidden = !open;
    if (open) {
      render();
      panel.querySelector('h2')?.setAttribute('tabindex', '-1');
      panel.querySelector('h2')?.focus({ preventScroll: true });
    }
  }

  const savedSize = safeStorage(() => localStorage.getItem(READING_KEY), 'normal');
  setReadingSize(savedSize);
  toggle?.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

  return { render, setOpen, progressSummary, setReadingSize };
})();
