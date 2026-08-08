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
      quiz: { answered: 0, right: 0, byCat: {}, byMode: {}, recent: [] },
      battle: { beaten: {}, losses: {}, best: {} },
      days: {},
      activity: { days: {} },
      onboarding: { step: 0, completedAt: null, skipped: false },
      badges: {},
      sessions: { quiz: 0, flash: 0, battle: 0, lastQuiz: null },
      dailyChallenges: {},
      skillEvidence: {},
      recovery: {},
      journey: { chapter: 0, completed: {}, pendingChapter: null, lastVisit: null, weeklyGoal: 3 },
      classroom: { sessions: [], evidenceWall: {} },
      eventIds: [],
      schemaVersion: 3,
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
    s.quiz.byMode = s.quiz.byMode && typeof s.quiz.byMode === 'object' ? s.quiz.byMode : {};
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
    s.skillEvidence = s.skillEvidence && typeof s.skillEvidence === 'object' ? s.skillEvidence : {};
    s.recovery = s.recovery && typeof s.recovery === 'object' ? s.recovery : {};
    s.journey = s.journey && typeof s.journey === 'object' ? s.journey : {};
    s.classroom = s.classroom && typeof s.classroom === 'object' ? s.classroom : {};
    s.eventIds = Array.isArray(s.eventIds) ? s.eventIds.filter(id => typeof id === 'string').slice(-500) : [];
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
  function today() {
    const p = progress();
    return p?.learningDayNumber ? p.learningDayNumber(new Date()) : Math.floor(Date.now() / 86400000);
  }

  function claimEvent(eventId) {
    if (!eventId) return true;
    const id = String(eventId).slice(0, 160);
    if (save.eventIds.includes(id)) return false;
    save.eventIds.push(id);
    const p = progress();
    save.eventIds = p?.boundedEventIds ? p.boundedEventIds(save.eventIds) : save.eventIds.slice(-500);
    return true;
  }

  function card(id) {
    save = normalize(save);
    if (!id || id === '_concept') return null;
    if (!save.cards[id]) save.cards[id] = { box: 1, due: today(), seen: 0, right: 0, wrong: 0, streak: 0 };
    return save.cards[id];
  }

  function noteActivity(mode, effective = 0) {
    const p = progress();
    if (p) p.recordActivity(save, mode, 1, new Date(), effective);
  }

  // 閃卡評分：again(0) / hard(1) / good(2)
  function gradeCard(id, grade, eventId = null) {
    save = normalize(save);
    if (!claimEvent(eventId)) return false;
    const c = card(id);
    if (!c) return false;
    c.seen++;
    if (grade === 0) { c.box = 1; c.streak = 0; c.wrong++; }
    // 「模糊」代表尚未穩定回憶：留在原盒、隔天再見，不灌入答對／連勝證據。
    else if (grade === 1) { c.box = Math.max(1, c.box); c.wrong++; c.streak = 0; }
    else { c.box = Math.min(MAX_BOX, c.box + 1); c.right++; c.streak++; }
    c.due = grade === 1 ? today() + 1 : today() + BOX_INTERVALS[c.box];
    noteActivity('flash');
    if (progress()) progress().advanceOnboarding(save, 'flash');
    persist();
    return true;
  }

  // 自測／對戰皆記總統計；概念題傳入 null，不建立假字卡。
  function recordAnswer(id, cat, ok, mode = 'quiz', eventId = null, meta = {}) {
    save = normalize(save);
    if (!claimEvent(eventId)) return false;
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
    const safeMode = ['quiz', 'daily', 'battle'].includes(mode) ? mode : 'quiz';
    if (!save.quiz.byMode[safeMode]) save.quiz.byMode[safeMode] = { r: 0, w: 0 };
    save.quiz.byMode[safeMode][ok ? 'r' : 'w']++;
    save.quiz.recent.push({ ok: !!ok, cat, mode: safeMode });
    save.quiz.recent = save.quiz.recent.slice(-20);
    if (c && progress()) progress().recordSkillEvidence(save, id, cat, ok, meta);
    noteActivity(safeMode === 'battle' ? 'battle' : 'quiz', ok && c ? 1 : 0);
    if (progress() && safeMode !== 'battle') progress().advanceOnboarding(save, 'quiz');
    persist();
    return true;
  }

  function validIds() {
    if (typeof LSData !== 'undefined' && Array.isArray(LSData.all)) return LSData.all.map(c => c.id);
    return Object.keys(save.cards).filter(id => id !== '_concept' && !id.startsWith('_'));
  }

  function isMastered(id) {
    save = normalize(save);
    if (!progress()) return false;
    const char = typeof LSData !== 'undefined' ? LSData.byId?.[id] : null;
    return progress().validatedCharMastered(save, id, char);
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

  function recordBattleResult(masterId, { win = false, score = 0, total = 0, eventId = null } = {}) {
    save = normalize(save);
    const p = progress();
    const recorded = p ? p.recordSession(save, 'battle', { score, total, eventId }) : claimEvent(eventId);
    if (!recorded) return { recorded: false, earned: [], best: boundedInt(save.battle.best[masterId], 1000) };
    const bucket = win ? save.battle.beaten : save.battle.losses;
    bucket[masterId] = (boundedInt(bucket[masterId]) || 0) + 1;
    save.battle.best[masterId] = Math.max(boundedInt(save.battle.best[masterId], 1000), boundedInt(score, 1000));
    let earned = [];
    if (p && typeof LSData !== 'undefined') {
      const masters = typeof LSBattle !== 'undefined' ? LSBattle.MASTERS : [];
      earned = p.evaluateBadges(save, { chars: LSData.all, masters });
    }
    persist();
    return { recorded: true, earned, best: save.battle.best[masterId] };
  }

  function completeSession(kind, summary = {}) {
    save = normalize(save);
    const p = progress();
    const recorded = p ? p.recordSession(save, kind, summary) : claimEvent(summary.eventId);
    if (!recorded) return [];
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
    if (!Number.isInteger(version) || version < 1 || version > 3) throw new Error('不支援的存檔版本');
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
    const allowedModes = new Set(['quiz', 'daily', 'battle']);
    if (isRecord(value.quiz.byMode)) {
      for (const [mode, score] of Object.entries(value.quiz.byMode)) {
        if (!allowedModes.has(mode) || !isRecord(score)) continue;
        out.quiz.byMode[mode] = { r: boundedInt(score.r), w: boundedInt(score.w) };
      }
    }
    out.quiz.recent = Array.isArray(value.quiz.recent) ? value.quiz.recent.slice(-20).flatMap(item => {
      if (!isRecord(item) || !allowedCats.has(item.cat)) return [];
      return [{ ok: !!item.ok, cat: item.cat, mode: allowedModes.has(item.mode) ? item.mode : 'quiz' }];
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
          total: boundedInt(day.total, 30000), effective: boundedInt(day.effective, 30000), complete: !!day.complete
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
    if (Array.isArray(value.eventIds)) {
      const eventIds = [...new Set(value.eventIds.filter(id => typeof id === 'string' && id.length <= 160))];
      const p = progress();
      out.eventIds = p?.boundedEventIds ? p.boundedEventIds(eventIds) : eventIds.slice(-500);
    }
    if (isRecord(value.skillEvidence)) {
      const axes = ['formation', 'usage'];
      for (const [id, entry] of Object.entries(value.skillEvidence).slice(0, 1000)) {
        if (!safeKey(id) || (knownIds && !knownIds.has(id)) || !isRecord(entry)) continue;
        out.skillEvidence[id] = {};
        for (const axis of axes) {
          const skill = isRecord(entry[axis]) ? entry[axis] : {};
          out.skillEvidence[id][axis] = {
            objectiveRight: boundedInt(skill.objectiveRight), objectiveWrong: boundedInt(skill.objectiveWrong),
            distinctDays: Array.isArray(skill.distinctDays) ? [...new Set(skill.distinctDays.filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day)))].slice(-30) : [],
            delayedPasses: boundedInt(skill.delayedPasses), rationalePasses: boundedInt(skill.rationalePasses), transferPasses: boundedInt(skill.transferPasses),
            lastCorrectAt: typeof skill.lastCorrectAt === 'string' ? skill.lastCorrectAt.slice(0, 40) : null,
            dueAt: typeof skill.dueAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(skill.dueAt) ? skill.dueAt : null,
            masteredAt: typeof skill.masteredAt === 'string' ? skill.masteredAt.slice(0, 40) : null
          };
        }
      }
    }
    if (isRecord(value.recovery)) {
      for (const item of Object.values(value.recovery).slice(0, 1000)) {
        if (!isRecord(item) || !safeKey(item.id) || !['formation', 'usage'].includes(item.axis)) continue;
        if (knownIds && !knownIds.has(item.id)) continue;
        const key = `${item.id}:${item.axis}`;
        out.recovery[key] = {
          id: item.id, axis: item.axis, misconception: typeof item.misconception === 'string' ? item.misconception.slice(0, 80) : '待釐清',
          assignedAt: typeof item.assignedAt === 'string' ? item.assignedAt.slice(0, 40) : null,
          immediateRepairPassed: !!item.immediateRepairPassed,
          delayedDueAt: typeof item.delayedDueAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.delayedDueAt) ? item.delayedDueAt : null,
          delayedRepairPassed: !!item.delayedRepairPassed
        };
      }
    }
    if (isRecord(value.journey)) {
      out.journey = {
        chapter: Math.min(7, boundedInt(value.journey.chapter, 7)),
        completed: {}, pendingChapter: Number.isInteger(value.journey.pendingChapter) ? Math.min(7, Math.max(0, value.journey.pendingChapter)) : null,
        lastVisit: typeof value.journey.lastVisit === 'string' ? value.journey.lastVisit.slice(0, 40) : null,
        weeklyGoal: Math.min(7, Math.max(1, boundedInt(value.journey.weeklyGoal, 7) || 3))
      };
      if (isRecord(value.journey.completed)) {
        for (const [chapter, completedAt] of Object.entries(value.journey.completed)) {
          if (/^[0-7]$/.test(chapter) && typeof completedAt === 'string') out.journey.completed[chapter] = completedAt.slice(0, 40);
        }
      }
    }
    if (isRecord(value.classroom)) {
      out.classroom.evidenceWall = {};
      const evidenceLabels = new Set(['輪廓描畫', '指示記號', '部件會義', '讀音線索', '借音用字', '近義互訓']);
      if (isRecord(value.classroom.evidenceWall)) {
        for (const [label, count] of Object.entries(value.classroom.evidenceWall)) if (evidenceLabels.has(label)) out.classroom.evidenceWall[label] = boundedInt(count, 10000);
      }
      out.classroom.sessions = [];
    }
    out.schemaVersion = 3;
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
    recordBattleWin, recordBattleLoss, recordBattleResult, completeSession, recordDailyChallenge,
    exportSave, importSave, resetAll, persist,
    get lastError() { return lastStorageError; },
    get raw() { save = normalize(save); return save; }
  };
})();
