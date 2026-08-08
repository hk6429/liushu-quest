// 全站問題回報：只擷取目前畫面與使用者主動填寫的內容，不讀取學習存檔。
const LSReport = (() => {
  const API_BASE = location.hostname.endsWith('pages.dev') || ['localhost', '127.0.0.1'].includes(location.hostname)
    ? '' : 'https://liushu-quest.pages.dev';
  const TYPES = {
    classification: '字例分類或文字學內容',
    pronunciation: '注音或讀音',
    question: '題目、選項或答案',
    story: '故事或教學說明',
    interface: '介面或功能異常',
    accessibility: '閱讀或無障礙問題',
    other: '其他問題'
  };
  let dialog = null;
  let returnFocus = null;

  const text = (selector, root = document) => String(root.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
  const texts = (selector, root = document) => [...root.querySelectorAll(selector)]
    .map(node => String(node.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 8);
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function captureContext() {
    const active = document.querySelector('.view.active');
    const charDialog = document.querySelector('.char-detail[role="dialog"]');
    const questionRoot = active?.querySelector('.journey-trial, #quizArea, #battleArea') || null;
    const currentStory = active?.querySelector('.story-chapter:not([hidden])');
    return {
      view: active?.id?.replace(/^view-/, '') || '',
      title: text('h2', active || document),
      char: charDialog ? `${text('.headchar', charDialog)} ${text('.muted', charDialog)}`.trim() : '',
      question: questionRoot ? text('.q-stem', questionRoot) : '',
      options: questionRoot ? texts('.opt', questionRoot) : [],
      story: currentStory ? `${text('h3', currentStory)}｜${text('.story-scene-status', currentStory)}` : '',
      path: `${location.pathname}${location.search}${location.hash}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent
    };
  }

  function buildPayload(issueType, note, website = '') {
    return {
      issueType: TYPES[issueType] ? issueType : 'other',
      note: String(note || '').trim(),
      website: String(website || ''),
      context: captureContext(),
      reportId: `liushu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    };
  }

  function close() {
    if (!dialog) return;
    dialog.remove();
    dialog = null;
    document.body.classList.remove('modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  function open(trigger = document.activeElement) {
    close();
    returnFocus = trigger instanceof HTMLElement ? trigger : null;
    const context = captureContext();
    dialog = document.createElement('div');
    dialog.className = 'report-overlay';
    dialog.innerHTML = `<section class="card report-dialog" role="dialog" aria-modal="true" aria-labelledby="reportTitle">
      <button type="button" class="dialog-close-icon" data-report-close aria-label="關閉問題回報">×</button>
      <p class="eyebrow">直接送給大乃老師</p>
      <h2 id="reportTitle">問題回報</h2>
      <p class="muted">系統會附上目前頁面、題目或字例，方便老師重現。請勿填寫姓名、班級或其他個人資料。</p>
      <form id="reportForm">
        <label for="reportType">問題類型<select id="reportType" name="issueType">${Object.entries(TYPES).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select></label>
        <label for="reportNote">發生什麼問題？<textarea id="reportNote" name="note" required minlength="5" maxlength="800" placeholder="例如：這題只顯示一個字，無法判斷是否為轉注。"></textarea></label>
        <label class="report-honeypot" aria-hidden="true">網站<input name="website" tabindex="-1" autocomplete="off"></label>
        <div class="report-context"><b>自動附帶：</b>${escapeHtml(context.char || context.question || context.story || context.title || '目前頁面')}</div>
        <p id="reportStatus" role="status" aria-live="polite"></p>
        <div class="btnrow"><button class="btn" type="submit">送出回報</button><button class="btn ghost" type="button" data-report-close>取消</button></div>
      </form>
    </section>`;
    dialog.onclick = event => { if (event.target === dialog || event.target.closest('[data-report-close]')) close(); };
    dialog.onkeydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll('button, select, textarea, input:not([tabindex="-1"])')].filter(node => !node.disabled);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dialog.querySelector('#reportForm').onsubmit = submit;
    document.body.classList.add('modal-open');
    document.body.appendChild(dialog);
    dialog.querySelector('#reportType').focus();
  }

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('#reportStatus');
    const data = new FormData(form);
    button.disabled = true;
    status.className = '';
    status.textContent = '送出中…';
    try {
      const response = await fetch(`${API_BASE}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(data.get('issueType'), data.get('note'), data.get('website')))
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || '回報暫時無法送出');
      status.className = 'report-success';
      status.textContent = '已送到老師的 Telegram，謝謝你幫忙改善！';
      form.querySelectorAll('select, textarea, input, button').forEach(control => { control.disabled = true; });
      setTimeout(close, 1600);
    } catch (error) {
      status.className = 'report-error';
      status.textContent = error.message || '網路異常，請稍後再試。';
      button.disabled = false;
    }
  }

  function init() {
    if (document.querySelector('[data-report-launcher]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'report-launcher';
    button.dataset.reportLauncher = '';
    button.textContent = '問題回報';
    button.setAttribute('aria-label', '回報目前頁面、題目或字例的問題');
    button.onclick = () => open(button);
    document.body.appendChild(button);
  }

  return { TYPES, captureContext, buildPayload, open, close, init };
})();

if (typeof window !== 'undefined') {
  window.LSReport = LSReport;
  LSReport.init();
}
