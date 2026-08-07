// localStorage 持久層：保留 liushu.save.v1，並向下相容舊版存檔。
const LSStore = (() => {
  const KEY = 'liushu.save.v1';
  const BOX_INTERVALS = [0, 1, 2, 4, 8, 16];
  const MAX_BOX = 5;

  let lastStorageError = null;
  let save = load();

  function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function safeKey(value) {
    return typeof value === 'string' && /^[\w\u3400-\u9fff-]{1,64}$/u.test(value)
      && !['__proto__', 'prototype', 'constructor'].includes(value);
  }

  function boundedInt(value, max = 1000000) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.min(max, Math.floor(n)) : 0;
  }

  function reportStorageError(action, error) {
    lastStorageError = { action, message: error?.message || '瀏覽器拒絕存取本機儲存空間。' };
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('liushu:storage-error', { detail: lastStorageError }));
    }
  }

  function progress() {
    return typeof LSProgress !== 'undefined' ? LSProgress : null;
  }

  function blank() {
    return {
      cards: {},
      quiz: { answered: 0, right: 0, byCat: {}, recent: [] },
      battle: { beaten: {}, losses: {}, best: {} },
      days: {},
      activity: { days: {} },
      onboarding: { step: 0, completedAt: null, skipped: false },
      badges: {},
      sessions: { quiz: 0, flash: 0, battle: 0, lastQuiz: null },
      dailyChallenges: {},
      schemaVersion: 2,
      created: Date.now()
    };
  }

  function legacyShape(value) {
    const s = value && typeof value === 'object' ? value : blank();
    s.cards = s.cards && typeof s.cards === 'object' ? s.cards : {};
    delete s.cards._concept;
    s.quiz = s.quiz && typeof s.quiz === 'object' ? s.quiz : { answered: 0, right: 0, byCat: {} };
    s.quiz.answered = Number.isFinite(+s.quiz.answered) ? +s.quiz.answered : 0;
    s.quiz.right = Number.isFinite(+s.quiz.right) ? +s.quiz.right : 0;
    s.quiz.byCat = s.quiz.byCat && typeof s.quiz.byCat === 'object' ? s.quiz.byCat : {};
    s.quiz.recent = Array.isArray(s.quiz.recent) ? s.quiz.recent.slice(-20) : [];
    s.battle = s.battle && typeof s.battle === 'object' ? s.battle : {};
    s.battle.beaten = s.battle.beaten && typeof s.battle.beaten === 'object' ? s.battle.beaten : {};
    s.battle.losses = s.battle.losses && typeof s.battle.losses === 'object' ? s.battle.losses : {};
    s.battle.best = s.battle.best && typeof s.battle.best === 'object' ? s.battle.best : {};
    s.days = s.days && typeof s.days === 'object' ? s.days : {};
    s.onboarding = s.onboarding && typeof s.onboarding === 'object' ? s.onboarding : { step: 0, completedAt: null, skipped: false };
    s.badges = s.badges && typeof s.badges === 'object' ? s.badges : {};
    s.sessions = s.sessions && typeof s.sessions === 'object' ? s.sessions : { quiz: 0, flash: 0, battle: 0 };
    s.dailyChallenges = s.dailyChallenges && typeof s.dailyChallenges === 'object' ? s.dailyChallenges : {};
    return s;
  }

  function normalize(value) {
    const shaped = legacyShape(value);
    return progress() ? progress().migrateSave(shaped) : shaped;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return legacyShape(JSON.parse(raw));
    } catch (e) { reportStorageError('讀取', e); }
    return blank();
  }

  function persist() {
    save = normalize(save);
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
      lastStorageError = null;
      return true;
    } catch (error) {
      reportStorageError('儲存', error);
      return false;
    }
  }
  function today() { return Math.floor(Date.now() / 86400000); }

  function card(id) {
    save = normalize(save);
    if (!id || id === '_concept') return null;
    if (!save.cards[id]) save.cards[id] = { box: 1, due: today(), seen: 0, right: 0, wrong: 0, streak: 0 };
    return save.cards[id];
  }

  function noteActivity(mode) {
    const p = progress();
    if (p) p.recordActivity(save, mode);
  }

  // 閃卡評分：again(0) / hard(1) / good(2)
  function gradeCard(id, grade) {
    const c = card(id);
    if (!c) return;
    c.seen++;
    if (grade === 0) { c.box = 1; c.streak = 0; c.wrong++; }
    else if (grade === 1) { c.box = Math.max(1, c.box); c.right++; c.streak++; }
    else { c.box = Math.min(MAX_BOX, c.box + 1); c.right++; c.streak++; }
    c.due = today() + BOX_INTERVALS[c.box];
    noteActivity('flash');
    if (progress()) progress().advanceOnboarding(save, 'flash');
    persist();
  }

  // 自測／對戰皆記總統計；概念題傳入 null，不建立假字卡。
  function recordAnswer(id, cat, ok, mode = 'quiz') {
    save = normalize(save);
    const c = id && id !== '_concept' ? card(id) : null;
    if (c) {
      c.seen++;
      if (ok) {
        c.right++; c.streak++;
        if (c.streak >= 2 && c.box < MAX_BOX) { c.box++; c.due = today() + BOX_INTERVALS[c.box]; }
      } else { c.wrong++; c.streak = 0; c.box = 1; c.due = today(); }
    }
    save.quiz.answered++;
    if (ok) save.quiz.right++;
    if (!save.quiz.byCat[cat]) save.quiz.byCat[cat] = { r: 0, w: 0 };
    save.quiz.byCat[cat][ok ? 'r' : 'w']++;
    save.quiz.recent.push({ ok: !!ok, cat, mode });
    save.quiz.recent = save.quiz.recent.slice(-20);
    noteActivity(mode === 'battle' ? 'battle' : 'quiz');
    if (progress() && mode !== 'battle') progress().advanceOnboarding(save, 'quiz');
    persist();
  }

  function validIds() {
    if (typeof LSData !== 'undefined' && Array.isArray(LSData.all)) return LSData.all.map(c => c.id);
    return Object.keys(save.cards).filter(id => id !== '_concept' && !id.startsWith('_'));
  }

  function isMastered(id) {
    save = normalize(save);
    const c = save.cards[id];
    return !!c && c.box >= 4 && c.right >= 2;
  }
  function masteredCount(ids = validIds()) {
    save = normalize(save);
    return progress() ? progress().masteredIds(save, ids).length : ids.filter(isMastered).length;
  }

  function dueCards(allIds) {
    save = normalize(save);
    const t = today();
    return allIds.filter(id => save.cards[id] && save.cards[id].due <= t && save.cards[id].seen > 0);
  }
  function newCards(allIds) {
    save = normalize(save);
    return allIds.filter(id => !save.cards[id] || save.cards[id].seen === 0);
  }
  function weakIds(allIds) {
    save = normalize(save);
    return allIds.map(id => ({ id, c: save.cards[id] }))
      .filter(x => x.c && x.c.wrong > 0 && (x.c.wrong / (x.c.right + x.c.wrong) >= 0.34 || x.c.box <= 2))
      .sort((a, b) => (b.c.wrong / (b.c.right + b.c.wrong)) - (a.c.wrong / (a.c.right + a.c.wrong)) || b.c.wrong - a.c.wrong)
      .map(x => x.id);
  }

  function recordBattleWin(masterId) {
    save = normalize(save);
    save.battle.beaten[masterId] = (save.battle.beaten[masterId] || 0) + 1;
    persist();
  }

  function recordBattleLoss(masterId) {
    save = normalize(save);
    save.battle.losses[masterId] = (save.battle.losses[masterId] || 0) + 1;
    persist();
  }

  function completeSession(kind, summary = {}) {
    save = normalize(save);
    const p = progress();
    if (p) p.recordSession(save, kind, summary);
    let earned = [];
    if (p && typeof LSData !== 'undefined') {
      const masters = typeof LSBattle !== 'undefined' ? LSBattle.MASTERS : [];
      earned = p.evaluateBadges(save, { chars: LSData.all, masters });
    }
    persist();
    return earned;
  }

  function recordDailyChallenge(date, score, total) {
    const result = progress() ? progress().recordDailyChallenge(save, date, score, total) : null;
    persist();
    return result;
  }

  function sanitizeImport(value) {
    if (!isRecord(value)) throw new Error('備份內容必須是 JSON 物件');
    const version = value.schemaVersion == null ? 1 : Number(value.schemaVersion);
    if (!Number.isInteger(version) || version < 1 || version > 2) throw new Error('不支援的存檔版本');
    const out = blank();
    out.created = Number.isFinite(Number(value.created)) ? Number(value.created) : out.created;

    if (!isRecord(value.cards) || !isRecord(value.quiz)) throw new Error('缺少字卡或答題紀錄');
    const knownIds = typeof LSData !== 'undefined' && Array.isArray(LSData.all)
      ? new Set(LSData.all.map(c => c.id)) : null;
    for (const [id, cardValue] of Object.entries(value.cards).slice(0, 1000)) {
      if (!safeKey(id) || id === '_concept' || (knownIds && !knownIds.has(id)) || !isRecord(cardValue)) continue;
      out.cards[id] = {
        box: Math.max(1, Math.min(MAX_BOX, boundedInt(cardValue.box, MAX_BOX) || 1)),
        due: boundedInt(cardValue.due, 1000000000),
        seen: boundedInt(cardValue.seen),
        right: boundedInt(cardValue.right),
        wrong: boundedInt(cardValue.wrong),
        streak: boundedInt(cardValue.streak)
      };
    }

    out.quiz.answered = boundedInt(value.quiz.answered);
    out.quiz.right = Math.min(out.quiz.answered, boundedInt(value.quiz.right));
    const allowedCats = new Set(['象形', '指事', '會意', '形聲', '轉注', '假借', '概念']);
    if (isRecord(value.quiz.byCat)) {
      for (const [cat, score] of Object.entries(value.quiz.byCat)) {
        if (!allowedCats.has(cat) || !isRecord(score)) continue;
        out.quiz.byCat[cat] = { r: boundedInt(score.r), w: boundedInt(score.w) };
      }
    }
    out.quiz.recent = Array.isArray(value.quiz.recent) ? value.quiz.recent.slice(-20).flatMap(item => {
      if (!isRecord(item) || !allowedCats.has(item.cat)) return [];
      return [{ ok: !!item.ok, cat: item.cat, mode: ['quiz', 'battle'].includes(item.mode) ? item.mode : 'quiz' }];
    }) : [];

    const copyCounts = source => {
      const target = {};
      if (!isRecord(source)) return target;
      for (const [id, count] of Object.entries(source).slice(0, 100)) if (safeKey(id)) target[id] = boundedInt(count);
      return target;
    };
    if (isRecord(value.battle)) {
      out.battle.beaten = copyCounts(value.battle.beaten);
      out.battle.losses = copyCounts(value.battle.losses);
      out.battle.best = copyCounts(value.battle.best);
    }

    const sourceDays = isRecord(value.activity?.days) ? value.activity.days : value.days;
    if (isRecord(sourceDays)) {
      for (const [date, day] of Object.entries(sourceDays).slice(-730)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        if (typeof day === 'number') out.days[date] = boundedInt(day, 10000);
        else if (isRecord(day)) out.days[date] = {
          flash: boundedInt(day.flash, 10000), quiz: boundedInt(day.quiz, 10000), battle: boundedInt(day.battle, 10000),
          sessions: boundedInt(day.sessions, 10000), flashSessions: boundedInt(day.flashSessions, 10000),
          quizSessions: boundedInt(day.quizSessions, 10000), battleSessions: boundedInt(day.battleSessions, 10000),
          total: boundedInt(day.total, 30000), complete: !!day.complete
        };
      }
    }

    if (isRecord(value.onboarding)) out.onboarding = {
      step: Math.min(3, boundedInt(value.onboarding.step, 3)),
      completedAt: typeof value.onboarding.completedAt === 'string' ? value.onboarding.completedAt.slice(0, 40) : null,
      skipped: !!value.onboarding.skipped
    };
    if (isRecord(value.badges)) {
      for (const [id, earnedAt] of Object.entries(value.badges).slice(0, 100)) {
        if (safeKey(id) && typeof earnedAt === 'string') out.badges[id] = earnedAt.slice(0, 40);
      }
    }
    if (isRecord(value.sessions)) {
      out.sessions.quiz = boundedInt(value.sessions.quiz);
      out.sessions.flash = boundedInt(value.sessions.flash);
      out.sessions.battle = boundedInt(value.sessions.battle);
      out.sessions.bestQuiz = boundedInt(value.sessions.bestQuiz);
      if (isRecord(value.sessions.lastQuiz)) out.sessions.lastQuiz = {
        score: boundedInt(value.sessions.lastQuiz.score, 1000), total: boundedInt(value.sessions.lastQuiz.total, 1000),
        at: typeof value.sessions.lastQuiz.at === 'string' ? value.sessions.lastQuiz.at.slice(0, 40) : null
      };
    }
    if (isRecord(value.dailyChallenges)) {
      for (const [date, result] of Object.entries(value.dailyChallenges).slice(-730)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isRecord(result)) continue;
        out.dailyChallenges[date] = {
          attempts: boundedInt(result.attempts, 10000),
          first: result.first == null ? null : boundedInt(result.first, 1000),
          best: boundedInt(result.best, 1000), total: boundedInt(result.total, 1000)
        };
      }
    }
    out.schemaVersion = 2;
    return normalize(out);
  }

  function exportSave() { save = normalize(save); return JSON.stringify(save); }
  function importSave(str) {
    if (typeof str !== 'string' || !str.trim() || str.length > 2_000_000) throw new Error('備份檔為空或超過 2 MB');
    const obj = JSON.parse(str);
    save = sanitizeImport(obj);
    if (!persist()) throw new Error(lastStorageError?.message || '無法寫入本機進度');
  }
  function resetAll() { save = blank(); persist(); }

  return {
    card, gradeCard, recordAnswer, isMastered, masteredCount, dueCards, newCards, weakIds,
    recordBattleWin, recordBattleLoss, completeSession, recordDailyChallenge,
    exportSave, importSave, resetAll, persist,
    get lastError() { return lastStorageError; },
    get raw() { save = normalize(save); return save; }
  };
})();
