// 今日主線：短章節、短試煉、跨日回訪與溫和的每週節奏。
const LSJourney = (() => {
  const TRIAL_PASS_RATE = 2 / 3;
  const CHAPTERS = [
    { title: '楔子・結繩記事', hook: '阿滿一覺醒來，站在繩結堆成的上古倉庫。', chars: [], types: ['concept', 'concept', 'evidence'] },
    { title: '第一章・象形', hook: '眼睛看得到的輪廓，能不能直接變成字？', chars: ['日', '月', '山', '水', '木', '火'], types: ['evidence', 'transfer', 'contrast'] },
    { title: '第二章・指事', hook: '畫不出的方向與部位，要怎麼「指」給人看？', chars: ['上', '下', '本', '末', '刃', '旦'], types: ['evidence', 'contrast', 'transfer'] },
    { title: '第三章・會意', hook: '字不夠用，倉頡開始玩「文加文」的加法。', chars: ['休', '步', '林', '森'], types: ['contrast', 'evidence', 'transfer'] },
    { title: '第四章・假借', hook: '造字追不上說話，先借一個聲音相近的字。', chars: ['其', '箕', '莫', '暮'], types: ['axis', 'contrast', 'evidence'] },
    { title: '第五章・形聲', hook: '一邊管意思、一邊提示聲音，造字開始加速。', chars: ['江', '河', '晴', '鴿', '草', '想', '園', '聞'], types: ['evidence', 'transfer', 'contrast'] },
    { title: '第六章・轉注', hook: '隔著時間與地域，近義字仍能互相注釋。', chars: ['考', '老'], types: ['axis', 'contrast', 'evidence'] },
    { title: '尾聲・把證據帶去答題', hook: '故事可以幫你記，真正的判斷要靠證據。', chars: ['本', '休', '江', '莫', '考', '老'], types: ['axis', 'evidence', 'transfer'] }
  ];
  let run = null;

  const chapterIds = chapter => {
    const wanted = new Set(CHAPTERS[chapter]?.chars || []);
    return LSData.all.filter(c => wanted.has(c.char)).map(c => c.id);
  };

  function passedTrial(score, total = 3) {
    return Number(score) >= Math.ceil(Number(total) * TRIAL_PASS_RATE);
  }

  function applyChapterResult(save, chapter, score, total = 3, now = new Date()) {
    const passed = passedTrial(score, total);
    if (passed) {
      save.journey.completed[chapter] = now.toISOString();
      save.journey.chapter = Math.min(CHAPTERS.length - 1, Math.max(save.journey.chapter, chapter + 1));
      save.journey.pendingChapter = null;
    } else {
      if (!save.journey.completed[chapter]) save.journey.pendingChapter = chapter;
    }
    return passed;
  }

  function missionState() {
    const save = LSStore.raw;
    const day = LSProgress.activityStreak(save).today;
    const weekly = LSProgress.weeklyRhythm(save);
    return { day, weekly, remaining: Math.max(0, LSProgress.DAY_GOAL - day.effective) };
  }

  function render(el) {
    const save = LSStore.raw;
    const journey = save.journey;
    const current = Math.min(CHAPTERS.length - 1, journey.pendingChapter ?? journey.chapter);
    const chapter = CHAPTERS[current];
    const { day, weekly, remaining } = missionState();
    const returning = !!journey.lastVisit;
    journey.lastVisit = new Date().toISOString();
    LSStore.persist();
    el.innerHTML = `
<section class="card journey-hero">
  <p class="eyebrow">${returning ? '歡迎回來，阿滿' : '第一次進入六書造字堂'}</p>
  <h2>${returning ? '接著上次的線索，往下一章走' : '從一個故事開始，不必先背六個定義'}</h2>
  <p>${chapter.hook}</p>
  <div class="journey-meter" aria-label="故事進度">
    <span style="width:${Math.round((Object.keys(journey.completed).length / CHAPTERS.length) * 100)}%"></span>
  </div>
  <p class="muted">故事 ${Object.keys(journey.completed).length}/${CHAPTERS.length} 卷　·　今日有效任務 ${day.effective}/${LSProgress.DAY_GOAL}　·　本週完成 ${weekly.completed}/${weekly.goal} 次</p>
  <div class="btnrow">
    <button class="btn" id="journeyContinue">${journey.pendingChapter !== null ? '繼續未完試煉' : journey.completed[current] ? '回看這一卷' : `閱讀「${chapter.title}」`}</button>
    ${remaining ? '<button class="btn ghost" id="journeyDaily">做今日 5 題</button>' : '<button class="btn ghost" id="journeyDaily">今日已完成，再練一輪</button>'}
  </div>
</section>
<section class="card">
  <h2>八卷旅程</h2>
  <ol class="chapter-map">${CHAPTERS.map((item, index) => {
    const done = !!journey.completed[index];
    const available = index <= journey.chapter || done;
    return `<li class="${done ? 'is-done' : index === current ? 'is-current' : ''}"><button type="button" data-chapter="${index}" ${available ? '' : 'disabled'}><span>${done ? '✓' : index + 1}</span><b>${item.title}</b><small>${done ? '已通過' : index === current ? '現在位置' : '完成前卷後開啟'}</small></button></li>`;
  }).join('')}</ol>
</section>
<section class="card gentle-rhythm">
  <h2>這週的節奏</h2>
  <p><b>${weekly.completed}/${weekly.goal} 次</b>就很不錯。漏一天不會歸零，下次回來仍從原本的位置繼續。</p>
  <div class="week-dots" aria-label="本週完成情形">${weekly.days.map((dayKey, index) => { const done = LSProgress.normalizeDay(save.days[dayKey]).complete; const weekday = ['一', '二', '三', '四', '五', '六', '日'][index]; return `<span class="${done ? 'done' : ''}" title="星期${weekday}・${dayKey}・${done ? '已完成' : '未完成'}" aria-label="星期${weekday}，${done ? '已完成' : '未完成'}"><small>${weekday}</small></span>`; }).join('')}</div>
</section>
<div id="journeyPlay" aria-live="polite"></div>`;
    el.querySelector('#journeyContinue').onclick = () => openChapter(current);
    el.querySelector('#journeyDaily').onclick = () => startDaily(el.querySelector('#journeyPlay'));
    el.querySelectorAll('[data-chapter]').forEach(button => {
      button.onclick = () => openChapter(Number(button.dataset.chapter));
    });
    if (journey.pendingChapter !== null) startTrial(el.querySelector('#journeyPlay'), journey.pendingChapter);
  }

  function openChapter(chapter) {
    LSStory.openChapter(chapter);
    LSApp.go('story');
  }

  function startTrial(area, chapter) {
    const save = LSStore.raw;
    save.journey.pendingChapter = chapter;
    LSStore.persist();
    run = { kind: 'chapter', chapter, n: 0, right: 0, questions: 3, usedIds: new Set(), usedKeys: new Set(), token: `journey:${chapter}:${Date.now()}` };
    ask(area);
  }

  function startDaily(area) {
    run = { kind: 'daily', chapter: LSStore.raw.journey.chapter, n: 0, right: 0, questions: 5, usedIds: new Set(), usedKeys: new Set(), token: `home:${Date.now()}` };
    ask(area);
  }

  function questionForRun() {
    const chapter = CHAPTERS[run.chapter] || CHAPTERS[0];
    const type = run.kind === 'daily' ? ['axis', 'evidence', 'contrast', 'transfer', 'evidence'][run.n % 5] : chapter.types[run.n % chapter.types.length];
    return LSQuiz.gen({
      type, ids: run.kind === 'chapter' ? chapterIds(run.chapter) : null,
      excludeIds: run.usedIds, excludeKeys: run.usedKeys
    });
  }

  function ask(area) {
    if (run.n >= run.questions) return finish(area);
    const q = questionForRun();
    run.n++;
    if (q.charId) run.usedIds.add(q.charId);
    run.usedKeys.add(q.key);
    area.innerHTML = `<section class="card journey-trial"><p class="eyebrow">${run.kind === 'chapter' ? `${CHAPTERS[run.chapter].title}・短試煉` : '今日五題・有效任務'}</p><h2>第 ${run.n}/${run.questions} 題</h2><div class="q-stem">${q.stemHtml}</div><div class="opt-list">${q.options.map((option, i) => `<button class="opt" data-i="${i}">${option}</button>`).join('')}</div><div id="journeyFeedback"></div></section>`;
    area.querySelectorAll('.opt').forEach(button => {
      button.onclick = () => {
        const ok = Number(button.dataset.i) === q.answer;
        area.querySelectorAll('.opt').forEach(option => { option.disabled = true; });
        area.querySelector(`[data-i="${q.answer}"]`).classList.add('correct');
        if (!ok) button.classList.add('wrong');
        if (ok) run.right++;
        const answerMode = run.kind === 'chapter' ? 'chapter_trial' : 'home_daily';
        LSStore.recordAnswer(q.charId, q.cat, ok, answerMode, `${run.token}:${q.key}`, {
          axis: q.axis, rationale: !!q.rationale, transfer: !!q.transfer, misconception: q.misconception
        });
        area.querySelector('#journeyFeedback').innerHTML = `<div class="feedback">${ok ? '答對了。' : '先看完證據，下一題再試。'} ${q.explain}</div><div class="btnrow"><button class="btn" id="journeyNext">${run.n >= run.questions ? '看學習摘要' : '下一題'}</button></div>`;
        area.querySelector('#journeyNext').onclick = () => ask(area);
        area.querySelector('#journeyNext').focus();
      };
    });
  }

  function finish(area) {
    const save = LSStore.raw;
    const passed = run.kind !== 'chapter' || applyChapterResult(save, run.chapter, run.right, run.questions);
    LSStore.completeSession(run.kind === 'chapter' ? 'chapter_trial' : 'home_daily', { score: run.right, total: run.questions, eventId: `${run.token}:complete` });
    LSStore.persist();
    const next = CHAPTERS[Math.min(CHAPTERS.length - 1, run.chapter + 1)];
    area.innerHTML = `<section class="card journey-summary"><p class="eyebrow">本輪完成</p><h2>${run.right}/${run.questions} 題答對</h2><p>${run.kind === 'chapter' ? passed ? `達到 2/3 通關標準，已留下「${CHAPTERS[run.chapter].title}」的通關印記。` : '尚未達到 2/3 通關標準；本卷不會標成完成，也不會開啟下一卷。先看證據，再重試一次。' : '今日有效進度已更新；錯誤會保留成下次可修復的線索。'}</p>${run.kind === 'chapter' && passed && run.chapter < CHAPTERS.length - 1 ? `<p class="next-hook"><b>下一卷：</b>${next.hook}</p>` : ''}<div class="btnrow">${run.kind === 'chapter' && !passed ? '<button class="btn" id="journeyRetry">重試本卷 3 題</button>' : '<button class="btn" id="journeyHome">回到今日主線</button>'}<button class="btn ghost" onclick="LSApp.go('flash')">複習需要補強的字</button></div></section>`;
    area.querySelector('#journeyRetry')?.addEventListener('click', () => startTrial(area, run.chapter));
    area.querySelector('#journeyHome')?.addEventListener('click', () => LSApp.go('home'));
  }

  return { CHAPTERS, TRIAL_PASS_RATE, passedTrial, applyChapterResult, render, startTrial };
})();
