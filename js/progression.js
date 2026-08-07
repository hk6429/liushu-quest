// 遊戲化成長核心：新手導引、今日任務、成長階段、印記、連續學習與固定挑戰。
// 純前端、無帳號；所有狀態仍存於既有 liushu.save.v1。
const LSProgress = (() => {
  const CATS = ['象形', '指事', '會意', '形聲', '轉注', '假借'];
  const DAY_GOAL = 5;

  function int(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
  }

  function localDateKey(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now).reduce((out, part) => {
      if (part.type !== 'literal') out[part.type] = part.value;
      return out;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  // 閃卡排程也以台灣日界線計算，避免本機 UTC 日期與練功日不同步。
  function learningDayNumber(now = new Date()) {
    const [year, month, day] = localDateKey(now).split('-').map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  }

  function shiftDateKey(key, delta) {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + delta));
    return date.toISOString().slice(0, 10);
  }

  function normalizeDay(value) {
    if (typeof value === 'number') {
      const total = int(value);
      return { flash: total, quiz: 0, battle: 0, sessions: 0, flashSessions: 0, quizSessions: 0, battleSessions: 0, total, complete: total >= DAY_GOAL };
    }
    const day = value && typeof value === 'object' ? value : {};
    const flash = int(day.flash);
    const quiz = int(day.quiz);
    const battle = int(day.battle);
    const sessions = int(day.sessions);
    const flashSessions = int(day.flashSessions);
    const quizSessions = int(day.quizSessions);
    const battleSessions = int(day.battleSessions);
    const total = Math.max(int(day.total), flash + quiz + battle);
    return { flash, quiz, battle, sessions, flashSessions, quizSessions, battleSessions, total, complete: !!day.complete || total >= DAY_GOAL };
  }

  function boundedEventIds(values, now = new Date()) {
    const unique = [...new Set((Array.isArray(values) ? values : []).filter(id => typeof id === 'string'))];
    const dailyPrefix = `daily:${localDateKey(now)}:`;
    const todayDaily = unique.filter(id => id.startsWith(dailyPrefix)).slice(-20);
    const recentOther = unique.filter(id => !id.startsWith(dailyPrefix)).slice(-500);
    return [...recentOther, ...todayDaily];
  }

  function migrateSave(input) {
    const save = input && typeof input === 'object' ? input : {};
    save.cards = save.cards && typeof save.cards === 'object' ? save.cards : {};
    save.quiz = save.quiz && typeof save.quiz === 'object' ? save.quiz : {};
    save.quiz.answered = int(save.quiz.answered);
    save.quiz.right = int(save.quiz.right);
    save.quiz.byCat = save.quiz.byCat && typeof save.quiz.byCat === 'object' ? save.quiz.byCat : {};
    save.quiz.byMode = save.quiz.byMode && typeof save.quiz.byMode === 'object' ? save.quiz.byMode : {};
    save.quiz.recent = Array.isArray(save.quiz.recent) ? save.quiz.recent.slice(-20) : [];
    save.battle = save.battle && typeof save.battle === 'object' ? save.battle : {};
    save.battle.beaten = save.battle.beaten && typeof save.battle.beaten === 'object' ? save.battle.beaten : {};
    save.battle.losses = save.battle.losses && typeof save.battle.losses === 'object' ? save.battle.losses : {};
    save.battle.best = save.battle.best && typeof save.battle.best === 'object' ? save.battle.best : {};

    const oldDays = save.activity?.days || save.days || {};
    const days = {};
    for (const [key, value] of Object.entries(oldDays)) days[key] = normalizeDay(value);
    save.days = days;
    save.activity = { days };

    const oldOnboarding = save.onboarding && typeof save.onboarding === 'object' ? save.onboarding : {};
    save.onboarding = {
      step: Math.min(3, int(oldOnboarding.step)),
      completedAt: oldOnboarding.completedAt || null,
      skipped: !!oldOnboarding.skipped
    };
    save.badges = save.badges && typeof save.badges === 'object' ? save.badges : {};
    save.sessions = save.sessions && typeof save.sessions === 'object' ? save.sessions : {};
    save.sessions.quiz = int(save.sessions.quiz);
    save.sessions.flash = int(save.sessions.flash);
    save.sessions.battle = int(save.sessions.battle);
    save.sessions.lastQuiz = save.sessions.lastQuiz && typeof save.sessions.lastQuiz === 'object' ? save.sessions.lastQuiz : null;
    save.dailyChallenges = save.dailyChallenges && typeof save.dailyChallenges === 'object' ? save.dailyChallenges : {};
    save.eventIds = boundedEventIds(save.eventIds);
    save.created = Number.isFinite(Number(save.created)) ? Number(save.created) : Date.now();
    save.schemaVersion = Math.max(2, int(save.schemaVersion));
    return save;
  }

  function recordActivity(save, mode, amount = 1, now = new Date()) {
    migrateSave(save);
    if (!['flash', 'quiz', 'battle'].includes(mode)) return null;
    const key = localDateKey(now);
    const day = normalizeDay(save.days[key]);
    const add = Math.max(0, int(amount));
    day[mode] += add;
    day.total += add;
    day.complete = day.total >= DAY_GOAL;
    save.days[key] = day;
    return day;
  }

  function recordSession(save, kind, summary = {}, now = new Date()) {
    migrateSave(save);
    if (!['quiz', 'flash', 'battle'].includes(kind)) return false;
    if (summary.eventId) {
      const eventId = String(summary.eventId).slice(0, 160);
      if (save.eventIds.includes(eventId)) return false;
      save.eventIds.push(eventId);
      save.eventIds = boundedEventIds(save.eventIds, now);
    }
    save.sessions[kind]++;
    const key = localDateKey(now);
    const day = normalizeDay(save.days[key]);
    day.sessions++;
    day[`${kind}Sessions`]++;
    save.days[key] = day;
    if (kind === 'quiz') {
      const score = int(summary.score);
      const total = Math.max(1, int(summary.total, 10));
      save.sessions.lastQuiz = { score, total, at: now instanceof Date ? now.toISOString() : new Date(now).toISOString() };
      save.sessions.bestQuiz = Math.max(int(save.sessions.bestQuiz), score);
    }
    return true;
  }

  function activityStreak(save, now = new Date()) {
    migrateSave(save);
    const completed = Object.keys(save.days).filter(k => normalizeDay(save.days[k]).complete).sort();
    let longest = 0;
    let run = 0;
    let previous = null;
    for (const key of completed) {
      run = previous && shiftDateKey(previous, 1) === key ? run + 1 : 1;
      longest = Math.max(longest, run);
      previous = key;
    }
    const today = localDateKey(now);
    const end = normalizeDay(save.days[today]).complete ? today : shiftDateKey(today, -1);
    let current = 0;
    let cursor = end;
    while (normalizeDay(save.days[cursor]).complete) {
      current++;
      cursor = shiftDateKey(cursor, -1);
    }
    return { current, longest, today: normalizeDay(save.days[today]), goal: DAY_GOAL };
  }

  function onboardingState(save) {
    migrateSave(save);
    return { ...save.onboarding, complete: !!save.onboarding.completedAt };
  }

  function advanceOnboarding(save, event, now = new Date()) {
    migrateSave(save);
    if (event === 'reset') save.onboarding = { step: 0, completedAt: null, skipped: false };
    else if (event === 'skip') save.onboarding = { step: 3, completedAt: now.toISOString(), skipped: true };
    else if (event === 'intro') save.onboarding.step = Math.max(save.onboarding.step, 1);
    else if (event === 'flash') save.onboarding.step = Math.max(save.onboarding.step, 2);
    else if (event === 'quiz') {
      save.onboarding.step = 3;
      save.onboarding.completedAt ||= now.toISOString();
    }
    return onboardingState(save);
  }

  function masteryStage(card) {
    if (!card || int(card.seen) === 0) return { id: 'unseen', label: '未見', rank: 0, next: '先認識這個字' };
    const box = Math.max(1, int(card.box, 1));
    if (box >= 4 && int(card.right) >= 2) return { id: 'mastered', label: '精通', rank: 4, next: '保持間隔複習' };
    if (box >= 3) return { id: 'solid', label: '穩固', rank: 3, next: '再升 1 盒即可精通' };
    if (box >= 2) return { id: 'familiar', label: '熟悉', rank: 2, next: '再升 2 盒即可精通' };
    return { id: 'learning', label: '初識', rank: 1, next: '答熟可升到第 2 盒' };
  }

  function masteredIds(save, validIds) {
    migrateSave(save);
    const valid = new Set(validIds || []);
    return Object.keys(save.cards).filter(id => valid.has(id) && masteryStage(save.cards[id]).id === 'mastered');
  }

  function categoryMastery(save, chars) {
    const out = Object.fromEntries(CATS.map(cat => [cat, { mastered: 0, total: 0 }]));
    for (const char of chars || []) {
      const relations = Array.isArray(char.usage_relations)
        ? char.usage_relations.map(rel => typeof rel === 'string' ? rel : rel.type).filter(Boolean)
        : [];
      const categories = new Set([char.formation_category, char.category, ...relations].filter(cat => out[cat]));
      for (const cat of categories) {
        out[cat].total++;
        if (masteryStage(save.cards?.[char.id]).id === 'mastered') out[cat].mastered++;
      }
    }
    return out;
  }

  function recentAccuracy(save) {
    migrateSave(save);
    const recent = save.quiz.recent.filter(x => !x.mode || x.mode === 'quiz').slice(-20);
    if (!recent.length) return null;
    return recent.filter(x => !!x.ok).length / recent.length;
  }

  function adaptiveLevel(save) {
    migrateSave(save);
    // 對戰有大師難度／主題偏壓，每日字陣則可重玩；都不應改寫一般自測難度。
    const recent = save.quiz.recent.filter(x => !x.mode || x.mode === 'quiz').slice(-20);
    if (recent.length < 5) return '基礎';
    const accuracy = recent.filter(x => !!x.ok).length / recent.length;
    if (recent.length >= 10 && accuracy >= 0.85) return '挑戰';
    if (accuracy >= 0.6) return '進階';
    return '基礎';
  }

  function weakestCats(save, count = 2) {
    migrateSave(save);
    return CATS.map(cat => {
      const s = save.quiz.byCat[cat] || { r: 0, w: 0 };
      const total = int(s.r) + int(s.w);
      const rate = total ? int(s.r) / total : null;
      // 真實錯題優先，其次才探索未作答類別；全對類別排最後。
      const band = total && rate < 1 ? 0 : total === 0 ? 1 : 2;
      return { cat, total, rate, band };
    }).sort((a, b) => a.band - b.band
      || (a.rate ?? 1) - (b.rate ?? 1)
      || b.total - a.total
      || CATS.indexOf(a.cat) - CATS.indexOf(b.cat))
      .slice(0, count).map(x => x.cat);
  }

  function shuffleWith(arr, rng = Math.random) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function balancedBlueprint(save, round = 10, rng = Math.random) {
    const slots = CATS.map(cat => ({ cat }));
    weakestCats(save, Math.max(0, round - 8)).forEach(cat => slots.push({ cat, weak: true }));
    while (slots.length < round - 2) slots.push({ cat: CATS[slots.length % CATS.length] });
    while (slots.length < round) slots.push({ type: 'concept' });
    return shuffleWith(slots.slice(0, round), rng);
  }

  function hashSeed(text) {
    let hash = 2166136261;
    for (const ch of String(text)) {
      hash ^= ch.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededRandom(seed) {
    let state = typeof seed === 'number' ? seed >>> 0 : hashSeed(seed);
    return () => {
      state += 0x6D2B79F5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function dailyChallengeBlueprint(date = localDateKey(), version = 'chars-v1') {
    const rng = seededRandom(`${date}|${version}`);
    const slots = CATS.map(cat => ({ cat, daily: true }));
    for (let i = 0; i < 4; i++) slots.push({ cat: CATS[Math.floor(rng() * CATS.length)], daily: true });
    slots.push({ type: 'concept', daily: true }, { type: 'concept', daily: true });
    return { date, seed: `${date}|${version}`, slots: shuffleWith(slots, rng) };
  }

  function battleBlueprint(master, rng = Math.random) {
    const focus = master.focusCats?.length ? master.focusCats : CATS;
    const slots = [];
    for (let i = 0; i < 5; i++) slots.push({ cat: focus[i % focus.length], focus: true });
    for (let i = 0; i < 5; i++) slots.push({ cat: CATS[i % CATS.length] });
    return shuffleWith(slots, rng);
  }

  function recordDailyChallenge(save, date, score, total = 12) {
    migrateSave(save);
    const old = save.dailyChallenges[date] || { attempts: 0, first: null, best: 0, total };
    old.attempts++;
    if (old.first === null) old.first = int(score);
    old.best = Math.max(int(old.best), int(score));
    old.total = int(total, 12);
    save.dailyChallenges[date] = old;
    return old;
  }

  function nextMaster(mastered, masters) {
    return (masters || []).find(m => mastered < m.unlock) || null;
  }

  function recoveryIds(missedIds = [], weakIds = [], limit = 5) {
    return [...new Set([...(missedIds || []), ...(weakIds || [])])]
      .filter(id => typeof id === 'string' && id && id !== '_concept')
      .slice(0, Math.max(1, int(limit, 5)));
  }

  function todayMission({ save, dueCount = 0, weakCount = 0, newCount = 0, weakIds = [], mastered = 0, masters = [] }) {
    const streak = activityStreak(save);
    if ((dueCount || weakCount || newCount) && streak.today.flash < DAY_GOAL) {
      const target = Math.min(DAY_GOAL, Math.max(1, dueCount || weakCount || newCount));
      return {
        id: weakCount ? 'weak' : dueCount ? 'due' : 'new',
        label: weakCount ? `優先補強 ${target} 個弱點字` : dueCount ? `複習 ${target} 張到期卡` : `認識 ${target} 個新字`,
        mode: 'flash', progress: Math.min(streak.today.flash, target), target,
        focusIds: weakCount ? weakIds.slice(0, target) : []
      };
    }
    if (streak.today.quiz < DAY_GOAL) return { id: 'quiz', label: '完成 5 題均衡自測', mode: 'quiz', progress: Math.min(streak.today.quiz, DAY_GOAL), target: DAY_GOAL };
    const unbeaten = masters.find(m => mastered >= m.unlock && !int(save.battle?.beaten?.[m.id]));
    if (unbeaten && streak.today.battleSessions < 1) return { id: 'battle', label: `挑戰已解鎖的 ${unbeaten.name}`, mode: 'battle', progress: 0, target: 1 };
    const next = nextMaster(mastered, masters);
    if (next) return { id: 'unlock', label: `精通 ${next.unlock} 字解鎖${next.name}`, mode: 'flash', progress: mastered, target: next.unlock, focusIds: weakIds.slice(0, DAY_GOAL) };
    return { id: 'daily', label: '挑戰今日字陣', mode: 'quiz', progress: save.dailyChallenges?.[localDateKey()]?.attempts ? 1 : 0, target: 1 };
  }

  function badgeCatalog(masters = []) {
    return [
      { id: 'first-quiz', name: '初試啼聲', description: '完成第一次自測' },
      { id: 'perfect-ten', name: '十全十美', description: '十題自測全對' },
      ...CATS.map(cat => ({ id: `cat-${cat}`, name: `${cat}小篆`, description: `精通 5 個${cat}字` })),
      ...masters.map(m => ({ id: `master-${m.id}`, name: `${m.name}認可`, description: `首次擊敗${m.name}` })),
      { id: 'all-chars', name: '六書宗師', description: '精通全字庫' }
    ];
  }

  function evaluateBadges(save, { chars = [], masters = [] } = {}, now = new Date()) {
    migrateSave(save);
    const earned = [];
    const grant = id => {
      if (!save.badges[id]) {
        save.badges[id] = now.toISOString();
        earned.push(id);
      }
    };
    if (save.sessions.quiz > 0) grant('first-quiz');
    if (save.sessions.lastQuiz && save.sessions.lastQuiz.total === 10 && save.sessions.lastQuiz.score === 10) grant('perfect-ten');
    const categories = categoryMastery(save, chars);
    CATS.forEach(cat => { if (categories[cat].mastered >= 5) grant(`cat-${cat}`); });
    masters.forEach(m => { if (int(save.battle.beaten[m.id]) > 0) grant(`master-${m.id}`); });
    if (chars.length && masteredIds(save, chars.map(c => c.id)).length === chars.length) grant('all-chars');
    return earned;
  }

  function challengeShareText({ date, score, total = 12, streak = 0 }) {
    return `六書造字堂・每日字陣 ${date}\n答對 ${int(score)}／${int(total, 12)}｜連續修行 ${int(streak)} 天\n不暴雷，換你來破陣！`;
  }

  function renderDashboard(el) {
    if (!el || typeof LSStore === 'undefined' || typeof LSData === 'undefined') return;
    const save = migrateSave(LSStore.raw);
    const ids = LSData.all.map(c => c.id);
    const mastered = masteredIds(save, ids).length;
    const due = LSStore.dueCards(ids).length;
    const weakIds = LSStore.weakIds(ids);
    const weak = weakIds.length;
    const fresh = LSStore.newCards(ids).length;
    const masters = typeof LSBattle === 'undefined' ? [] : LSBattle.MASTERS;
    const mission = todayMission({ save, dueCount: due, weakCount: weak, newCount: fresh, weakIds, mastered, masters });
    const onboarding = onboardingState(save);
    const streak = activityStreak(save);
    const stepCopy = ['先看懂修行路線', '完成一張真實閃卡', '答一題自測完成入門'];
    el.innerHTML = `${onboarding.complete ? '' : `<div class="card" data-onboarding-step="${onboarding.step}"><h2>三步入門 ${onboarding.step + 1}/3</h2><p>${stepCopy[onboarding.step] || stepCopy[2]}</p><div class="btnrow"><button class="btn" data-onboarding-next>${onboarding.step === 0 ? '看懂了' : onboarding.step === 1 ? '去翻閃卡' : '去答一題'}</button><button class="btn ghost" data-onboarding-skip>先跳過</button></div></div>`}
      <div class="card"><h2>今日修行</h2><p><b>${mission.label}</b></p><p class="muted">${mission.progress}/${mission.target}　·　連續 ${streak.current} 天（最長 ${streak.longest} 天）</p><button class="btn" data-mission-mode="${mission.mode}">現在開始</button></div>`;
    el.querySelector('[data-onboarding-next]')?.addEventListener('click', () => {
      const state = onboardingState(save);
      if (state.step === 0) { advanceOnboarding(save, 'intro'); LSStore.persist(); renderDashboard(el); }
      else if (typeof LSApp !== 'undefined') LSApp.go(state.step === 1 ? 'flash' : 'quiz');
    });
    el.querySelector('[data-onboarding-skip]')?.addEventListener('click', () => { advanceOnboarding(save, 'skip'); LSStore.persist(); renderDashboard(el); });
    el.querySelector('[data-mission-mode]')?.addEventListener('click', e => {
      if (mission.focusIds?.length && typeof LSFlash !== 'undefined') LSFlash.focus(mission.focusIds);
      if (typeof LSApp !== 'undefined') LSApp.go(e.currentTarget.dataset.missionMode);
    });
  }

  return {
    CATS, DAY_GOAL, localDateKey, learningDayNumber, shiftDateKey, migrateSave, normalizeDay, boundedEventIds,
    recordActivity, recordSession, activityStreak, onboardingState, advanceOnboarding,
    masteryStage, masteredIds, categoryMastery, recentAccuracy, adaptiveLevel,
    weakestCats, balancedBlueprint, hashSeed, seededRandom, dailyChallengeBlueprint,
    battleBlueprint, recordDailyChallenge, recoveryIds, todayMission, badgeCatalog, evaluateBadges,
    challengeShareText, renderDashboard
  };
})();

globalThis.LSProgress = LSProgress;
