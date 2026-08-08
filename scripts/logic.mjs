#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const progressionSource = await readFile(new URL('../js/progression.js', import.meta.url), 'utf8');
const storeSource = await readFile(new URL('../js/store.js', import.meta.url), 'utf8');
const quizSource = await readFile(new URL('../js/quiz.js', import.meta.url), 'utf8');
const journeySource = await readFile(new URL('../js/journey.js', import.meta.url), 'utf8');
const flashSource = await readFile(new URL('../js/flashcard.js', import.meta.url), 'utf8');
const chars = JSON.parse(await readFile(new URL('../data/chars.json', import.meta.url), 'utf8'));

const storage = new Map();
const context = vm.createContext({
  console, Date, Intl, Math, Set,
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value))
  }
});
vm.runInContext(`${progressionSource}\n;globalThis.__P = LSProgress;`, context);
vm.runInContext(`${storeSource}\n;globalThis.__Store = LSStore;`, context);
const P = context.__P;
const Store = context.__Store;

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    throw error;
  }
}

test('台灣本地日跨午夜正確切日', () => {
  assert.equal(P.localDateKey(new Date('2026-08-07T15:59:59Z')), '2026-08-07');
  assert.equal(P.localDateKey(new Date('2026-08-07T16:00:00Z')), '2026-08-08');
  assert.equal(P.learningDayNumber(new Date('2026-08-07T15:59:59Z')) + 1, P.learningDayNumber(new Date('2026-08-07T16:00:00Z')));
});

test('v1 數字 days 可遷移且保留既有欄位', () => {
  const save = P.migrateSave({ cards: {}, quiz: {}, battle: {}, days: { '2026-08-01': 7 }, custom: 'keep' });
  assert.equal(save.days['2026-08-01'].flash, 7);
  assert.equal(save.days['2026-08-01'].complete, true);
  assert.equal(save.custom, 'keep');
});

test('概念題不建立假字卡但會記答題統計', () => {
  Store.resetAll();
  for (let i = 0; i < 4; i++) Store.recordAnswer(null, '概念', true, 'quiz');
  assert.equal(Store.raw.cards._concept, undefined);
  assert.equal(Store.raw.quiz.answered, 4);
  assert.equal(Store.raw.quiz.byCat['概念'].r, 4);
  assert.equal(Store.masteredCount(chars.map(c => c.id)), 0);
});

test('同一作答事件只記一次，不污染卡片、統計與活動', () => {
  Store.resetAll();
  const id = chars[0].id;
  assert.equal(Store.recordAnswer(id, chars[0].category, true, 'quiz', 'answer:same'), true);
  assert.equal(Store.recordAnswer(id, chars[0].category, true, 'quiz', 'answer:same'), false);
  assert.equal(Store.raw.cards[id].seen, 1);
  assert.equal(Store.raw.quiz.answered, 1);
  assert.equal(Store.raw.quiz.byMode.quiz.r, 1);
  assert.equal(Object.values(Store.raw.days).reduce((sum, day) => sum + day.total, 0), 1);
});

test('每日字陣同日同題重玩可計分但不重複灌成長', () => {
  Store.resetAll();
  const id = chars[1].id;
  const eventId = 'daily:2026-08-07:cat:象形:001';
  Store.recordAnswer(id, chars[1].category, false, 'daily', eventId);
  Store.recordAnswer(id, chars[1].category, true, 'daily', eventId);
  assert.deepEqual([Store.raw.quiz.answered, Store.raw.cards[id].seen, Store.raw.cards[id].wrong, Store.raw.cards[id].right], [1, 1, 1, 0]);
  assert.deepEqual([Store.raw.quiz.byMode.daily.r, Store.raw.quiz.byMode.daily.w], [0, 1]);
});

test('閃卡模糊留在原盒且不算答對或連勝', () => {
  Store.resetAll();
  const id = chars[2].id;
  Object.assign(Store.card(id), { box: 3, seen: 4, right: 2, wrong: 0, streak: 1, due: 0 });
  Store.gradeCard(id, 1, 'flash:hard-once');
  const card = Store.raw.cards[id];
  assert.deepEqual([card.box, card.seen, card.right, card.wrong, card.streak], [3, 5, 2, 1, 0]);
});

test('舊存檔的熟練盒序不會冒充有效精通', () => {
  Store.importSave(JSON.stringify({
    cards: { _concept: { box: 5, right: 99, seen: 99 }, real: { box: 4, right: 2, seen: 2 } },
    quiz: { answered: 99, right: 99, byCat: {} }, battle: { beaten: {} }, days: {}
  }));
  assert.equal(Store.raw.cards._concept, undefined);
  assert.equal(Store.masteredCount(['real']), 0);
});

test('匯入拒絕未來版本並清除危險鍵', () => {
  assert.throws(() => Store.importSave(JSON.stringify({ schemaVersion: 99, cards: {}, quiz: {} })), /不支援的存檔版本/);
  Store.importSave('{"schemaVersion":2,"cards":{"constructor":{"box":5},"safe-card":{"box":4,"right":2,"seen":2}},"quiz":{"answered":2,"right":9,"byCat":{"象形":{"r":2,"w":0},"惡意":{"r":99,"w":0}}}}');
  assert.equal(Object.hasOwn(Store.raw.cards, 'constructor'), false);
  assert.equal(Store.raw.cards['safe-card'].box, 4);
  assert.equal(Store.raw.quiz.right, 2);
  assert.equal(Store.raw.quiz.byCat['惡意'], undefined);
});

test('只有客觀答對才累計有效進度，五次才完成當日', () => {
  const save = P.migrateSave({});
  const now = new Date('2026-08-07T12:00:00+08:00');
  P.recordActivity(save, 'flash', 2, now);
  P.recordActivity(save, 'quiz', 2, now, 2);
  let day = P.recordActivity(save, 'battle', 1, now, 1);
  assert.deepEqual([day.flash, day.quiz, day.battle, day.total, day.effective, day.complete], [2, 2, 1, 5, 3, false]);
  day = P.recordActivity(save, 'quiz', 2, now, 2);
  assert.deepEqual([day.total, day.effective, day.complete], [7, 5, true]);
});

test('目前與最長連續天數依完成日計算', () => {
  const save = P.migrateSave({ days: {
    '2026-08-03': 5, '2026-08-04': 5, '2026-08-06': 5, '2026-08-07': 5
  }});
  assert.deepEqual(P.activityStreak(save, new Date('2026-08-07T12:00:00+08:00')).current, 2);
  assert.equal(P.activityStreak(save, new Date('2026-08-07T12:00:00+08:00')).longest, 2);
});

test('新手三步導引可完成、跳過與重設', () => {
  const save = P.migrateSave({});
  assert.equal(P.advanceOnboarding(save, 'intro').step, 1);
  assert.equal(P.advanceOnboarding(save, 'flash').step, 2);
  assert.equal(P.advanceOnboarding(save, 'quiz').complete, true);
  assert.equal(P.advanceOnboarding(save, 'reset').complete, false);
  assert.equal(P.advanceOnboarding(save, 'skip').skipped, true);
});

test('熟練盒序與有效精通分開命名', () => {
  assert.equal(P.masteryStage(null).label, '未見');
  assert.equal(P.masteryStage({ seen: 1, box: 1, right: 0 }).label, '初識');
  assert.equal(P.masteryStage({ seen: 2, box: 2, right: 1 }).label, '熟悉');
  assert.equal(P.masteryStage({ seen: 3, box: 3, right: 2 }).label, '穩固');
  assert.equal(P.masteryStage({ seen: 4, box: 4, right: 2 }).label, '熟練');
});

test('同一天重複答對不能形成有效精通', () => {
  const save = P.migrateSave({});
  for (let i = 0; i < 6; i++) P.recordSkillEvidence(save, 'same-day', '指事', true, { rationale: true }, new Date(`2026-08-07T0${i}:00:00+08:00`));
  assert.equal(P.isSkillMastered(save.skillEvidence['same-day'].formation), false);
  assert.deepEqual([...save.skillEvidence['same-day'].formation.distinctDays], ['2026-08-07']);
});

test('跨日答對並說出理由後才形成有效精通', () => {
  const save = P.migrateSave({});
  P.recordSkillEvidence(save, 'delayed', '指事', true, { rationale: true }, new Date('2026-08-07T08:00:00+08:00'));
  P.recordSkillEvidence(save, 'delayed', '指事', true, {}, new Date('2026-08-07T09:00:00+08:00'));
  P.recordSkillEvidence(save, 'delayed', '指事', true, { transfer: true }, new Date('2026-08-08T08:00:00+08:00'));
  assert.equal(P.isSkillMastered(save.skillEvidence.delayed.formation), true);
});

test('雙軸字的構形與用字證據分開，不互相灌水', () => {
  const save = P.migrateSave({});
  for (const now of ['2026-08-07T08:00:00+08:00', '2026-08-07T09:00:00+08:00', '2026-08-08T08:00:00+08:00']) {
    P.recordSkillEvidence(save, 'c0116', '會意', true, { rationale: true, axis: 'formation' }, new Date(now));
  }
  assert.equal(P.validatedCharMastered(save, 'c0116', chars.find(c => c.id === 'c0116')), false);
  assert.equal(P.isSkillMastered(save.skillEvidence.c0116.formation), true);
  assert.equal(P.isSkillMastered(save.skillEvidence.c0116.usage), false);
});

test('大量自評熟悉不會完成今日有效任務或精通', () => {
  Store.resetAll();
  const id = chars[0].id;
  for (let i = 0; i < 30; i++) Store.gradeCard(id, 2, `flash:self:${i}`);
  const day = Object.values(Store.raw.days)[0];
  assert.equal(day.effective, 0);
  assert.equal(day.complete, false);
  assert.equal(Store.isMastered(id), false);
});

test('自適應難度依最近正確率升降', () => {
  const low = P.migrateSave({ quiz: { recent: Array.from({ length: 10 }, (_, i) => ({ ok: i < 4 })) } });
  const mid = P.migrateSave({ quiz: { recent: Array.from({ length: 10 }, (_, i) => ({ ok: i < 7 })) } });
  const high = P.migrateSave({ quiz: { recent: Array.from({ length: 20 }, (_, i) => ({ ok: i < 18 })) } });
  assert.equal(P.adaptiveLevel(low), '基礎');
  assert.equal(P.adaptiveLevel(mid), '進階');
  assert.equal(P.adaptiveLevel(high), '挑戰');
});

test('對戰與每日字陣表現不會污染一般自測難度', () => {
  const save = P.migrateSave({ quiz: { recent: [
    ...Array.from({ length: 5 }, () => ({ ok: false, mode: 'quiz' })),
    ...Array.from({ length: 15 }, () => ({ ok: true, mode: 'battle' }))
  ] } });
  assert.equal(P.adaptiveLevel(save), '基礎');
  assert.equal(P.recentAccuracy(save), 0);
});

test('首頁五題與章節試煉分開統計，不污染一般自測難度', () => {
  Store.resetAll();
  const id = chars[0].id;
  for (let i = 0; i < 8; i++) Store.recordAnswer(id, chars[0].category, true, i % 2 ? 'home_daily' : 'chapter_trial', `journey-mode:${i}`);
  assert.equal(Store.raw.quiz.byMode.home_daily.r, 4);
  assert.equal(Store.raw.quiz.byMode.chapter_trial.r, 4);
  assert.equal(P.recentAccuracy(Store.raw), null);
  assert.equal(P.adaptiveLevel(Store.raw), '基礎');
});

test('有效精通檢核逐軸列出四項可見條件', () => {
  const sample = chars.find(char => char.usage_relations.length);
  const checklist = P.masteryChecklist(P.migrateSave({}), sample.id, sample);
  assert.deepEqual([...checklist].map(axis => axis.axis), ['formation', 'usage']);
  assert.ok([...checklist].every(axis => axis.checks.length === 4));
  assert.ok([...checklist].every(axis => axis.checks.some(check => check.id === 'evidence')));
});

test('弱項排序先補真實錯題，再探索未作答類別', () => {
  const save = P.migrateSave({ quiz: { byCat: {
    象形: { r: 9, w: 1 }, 指事: { r: 2, w: 3 }, 會意: { r: 5, w: 0 }
  } } });
  assert.deepEqual([...P.weakestCats(save, 3)], ['指事', '象形', '形聲']);
});

test('均衡題組覆蓋六書並保留兩題概念題', () => {
  const save = P.migrateSave({});
  const slots = P.balancedBlueprint(save, 10, P.seededRandom('balanced'));
  for (const cat of P.CATS) assert.ok(slots.some(slot => slot.cat === cat), `缺少${cat}`);
  assert.equal(slots.filter(slot => slot.type === 'concept').length, 2);
});

test('每日字陣同日同版固定、隔日不同', () => {
  const a = P.dailyChallengeBlueprint('2026-08-07', 'v1');
  const b = P.dailyChallengeBlueprint('2026-08-07', 'v1');
  const c = P.dailyChallengeBlueprint('2026-08-08', 'v1');
  assert.deepEqual(a.slots, b.slots);
  assert.notDeepEqual(a.slots, c.slots);
  assert.equal(a.slots.length, 12);
  for (const cat of P.CATS) assert.ok(a.slots.some(slot => slot.cat === cat));
});

test('每日成績保留首次與最佳，不被低分覆蓋', () => {
  const save = P.migrateSave({});
  P.recordDailyChallenge(save, '2026-08-07', 8, 12);
  const result = P.recordDailyChallenge(save, '2026-08-07', 6, 12);
  assert.deepEqual([result.first, result.best, result.attempts], [8, 8, 2]);
});

test('每日分享文字採溫和週節奏且不含題目或答案', () => {
  const text = P.challengeShareText({ date: '2026-08-07', score: 9, total: 12, weekly: 2, goal: 3 });
  assert.match(text, /9／12/);
  assert.match(text, /本週完成 2／3 次/);
  assert.doesNotMatch(text, /連續/);
  assert.doesNotMatch(text, /正解|題目|answer/i);
});

test('大師藍圖固定十回合且至少五題主題題', () => {
  const slots = P.battleBlueprint({ focusCats: ['轉注', '假借'] }, P.seededRandom('battle'));
  assert.equal(slots.length, 10);
  assert.equal(slots.filter(slot => slot.focus).length, 5);
  assert.ok(slots.filter(slot => slot.focus).every(slot => ['轉注', '假借'].includes(slot.cat)));
});

test('今日任務鎖定真實弱點，且不把未解鎖大師當可挑戰', () => {
  const save = P.migrateSave({});
  let mission = P.todayMission({ save, weakCount: 3, dueCount: 4, newCount: 10, weakIds: ['a', 'b', 'c'], mastered: 0, masters: [{ id: 'lisi', name: '李斯', unlock: 8 }] });
  assert.equal(mission.id, 'weak');
  assert.deepEqual([...mission.focusIds], ['a', 'b', 'c']);
  P.recordActivity(save, 'quiz', 5, new Date(), 5);
  mission = P.todayMission({ save, weakCount: 3, dueCount: 4, newCount: 10, mastered: 0, masters: [{ id: 'lisi', name: '李斯', unlock: 8 }] });
  assert.equal(mission.id, 'unlock');
  mission = P.todayMission({ save, mastered: 0, masters: [{ id: 'wang', name: '王懿榮', unlock: 0 }] });
  assert.equal(mission.id, 'battle');
});

test('失敗恢復先排本輪錯字、去重且限制五字', () => {
  assert.deepEqual([...P.recoveryIds(['a', 'b', 'a'], ['c', 'd', 'e', 'f'], 5)], ['a', 'b', 'c', 'd', 'e']);
});

test('完成事件具冪等性，不會重複增加回合數', () => {
  Store.resetAll();
  Store.completeSession('quiz', { score: 7, total: 10, eventId: 'quiz:one:complete' });
  Store.completeSession('quiz', { score: 9, total: 10, eventId: 'quiz:one:complete' });
  assert.equal(Store.raw.sessions.quiz, 1);
  assert.equal(Store.raw.sessions.lastQuiz.score, 7);
});

test('印記判定具冪等性', () => {
  const sample = chars.slice(0, 6);
  const save = P.migrateSave({ cards: {}, sessions: { quiz: 1, lastQuiz: { score: 10, total: 10 } } });
  for (const c of sample) {
    save.skillEvidence[c.id] = {
      formation: { objectiveRight: 3, objectiveWrong: 0, distinctDays: ['2026-08-06', '2026-08-07'], delayedPasses: 1, rationalePasses: 1 },
      usage: { objectiveRight: 3, objectiveWrong: 0, distinctDays: ['2026-08-06', '2026-08-07'], delayedPasses: 1, rationalePasses: 1 }
    };
  }
  const first = P.evaluateBadges(save, { chars: sample, masters: [] }, new Date('2026-08-07T00:00:00Z'));
  const second = P.evaluateBadges(save, { chars: sample, masters: [] }, new Date('2026-08-07T00:00:01Z'));
  assert.ok(first.includes('first-quiz'));
  assert.ok(first.includes('perfect-ten'));
  assert.equal(second.length, 0);
});

// 以真實資料驗證 blueprint 接上出題器後仍無重複 charId，且六類槽位都有對應題。
context.__data = {
  CATS: P.CATS,
  LEVELS: ['基礎', '進階', '挑戰'],
  all: chars,
  byCat: Object.groupBy ? Object.groupBy(chars, c => c.category) : chars.reduce((out, c) => ((out[c.category] ||= []).push(c), out), {}),
  ofLevel(level) { return level ? chars.filter(c => c.level === level) : chars; },
  pick(arr, n, rng = Math.random) {
    const pool = arr.slice(), out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    return out;
  }
};
vm.runInContext('const LSData = globalThis.__data;', context);
vm.runInContext(`${quizSource}\n;globalThis.__Quiz = LSQuiz;`, context);
vm.runInContext(`${flashSource}\n;globalThis.__Flash = LSFlash;`, context);
vm.runInContext(`${journeySource}\n;globalThis.__Journey = LSJourney;`, context);

test('章節試煉必須至少答對三題中的兩題', () => {
  const failed = P.migrateSave({});
  assert.equal(context.__Journey.applyChapterResult(failed, 0, 0, 3, new Date('2026-08-08T00:00:00Z')), false);
  assert.equal(failed.journey.completed[0], undefined);
  assert.equal(failed.journey.chapter, 0);
  assert.equal(failed.journey.pendingChapter, 0);
  const passed = P.migrateSave({});
  assert.equal(context.__Journey.applyChapterResult(passed, 0, 2, 3, new Date('2026-08-08T00:00:00Z')), true);
  assert.equal(typeof passed.journey.completed[0], 'string');
  assert.equal(passed.journey.chapter, 1);
  assert.equal(passed.journey.pendingChapter, null);
});

test('快速證據模式固定五題且涵蓋軸線、證據、對比與遷移', () => {
  const session = context.__Quiz.buildSession({ quick: true });
  assert.equal(session.round, 5);
  assert.deepEqual([...session.blueprint].map(slot => slot.type), ['axis', 'evidence', 'contrast', 'transfer', 'evidence']);
});

test('轉注自動題一定呈現成對互訓脈絡，不以單字直接判類', () => {
  const questions = vm.runInContext(`Array.from({ length: 12 }, (_, i) => LSQuiz.gen({ cat: '轉注', type: i % 2 ? 'transfer' : 'evidence', rng: LSProgress.seededRandom('transfer-' + i) }))`, context);
  for (const question of questions) {
    const text = `${question.stemHtml} ${question.options.join(' ')}`;
    assert.match(text, /彼此訓釋|互相訓釋|同類近義/);
    assert.doesNotMatch(text, /下面這個字呈現六書中的哪一種/);
  }
});

test('假借自動題呈現本義與借義關係，不只顯示單一字形', () => {
  const question = vm.runInContext(`LSQuiz.gen({ cat: '假借', type: 'evidence', rng: LSProgress.seededRandom('loan-context') })`, context);
  const text = `${question.stemHtml} ${question.explain}`;
  assert.match(text, /本義|原本/);
  assert.match(text, /借|借義/);
});

test('今日五題的四類深度題都綁定真實字例', () => {
  const result = vm.runInContext(`(() => {
    const types = ['axis', 'evidence', 'contrast', 'transfer', 'evidence'];
    const ids = new Set(), keys = new Set();
    return types.map(type => {
      const q = LSQuiz.gen({ type, excludeIds: ids, excludeKeys: keys });
      if (q.charId) ids.add(q.charId);
      keys.add(q.key);
      return { type, charId: q.charId, cat: q.cat };
    });
  })()`, context);
  assert.equal(result.length, 5);
  assert.ok(result.every(question => question.charId && question.cat !== '概念'), JSON.stringify(result));
});

test('指定弱點即使位於資料尾端仍排在牌組最前', () => {
  const result = vm.runInContext(`(() => {
    LSStore.resetAll();
    const ids = LSData.all.map(c => c.id);
    for (const id of ids.slice(0, 25)) Object.assign(LSStore.card(id), { seen: 3, right: 2, wrong: 1, due: 0 });
    const target = ids.at(-1);
    Object.assign(LSStore.card(target), { seen: 4, right: 1, wrong: 3, due: 0 });
    return { target, deck: LSFlash.buildDeck(null, [target]) };
  })()`, context);
  assert.equal(result.deck[0], result.target);
  assert.equal(new Set(result.deck).size, result.deck.length);
  assert.ok(result.deck.length <= 20);
});

test('一般閃卡回合在大量到期卡中仍保留四個新字', () => {
  const result = vm.runInContext(`(() => {
    LSStore.resetAll();
    const ids = LSData.all.map(c => c.id);
    for (const id of ids.slice(0, 30)) Object.assign(LSStore.card(id), { seen: 2, right: 1, wrong: 0, due: 0 });
    const fresh = new Set(LSStore.newCards(ids));
    const deck = LSFlash.buildDeck(null, []);
    return { length: deck.length, fresh: deck.filter(id => fresh.has(id)).length };
  })()`, context);
  assert.deepEqual([result.length, result.fresh], [20, 4]);
});

test('對戰結算原子化且重入不重複勝場，並保存最佳', () => {
  const result = vm.runInContext(`(() => {
    LSStore.resetAll();
    const first = LSStore.recordBattleResult('wangyirong', { win: true, score: 7, total: 10, eventId: 'battle:one:complete' });
    const duplicate = LSStore.recordBattleResult('wangyirong', { win: true, score: 10, total: 10, eventId: 'battle:one:complete' });
    return { first, duplicate, wins: LSStore.raw.battle.beaten.wangyirong, sessions: LSStore.raw.sessions.battle, best: LSStore.raw.battle.best.wangyirong };
  })()`, context);
  assert.equal(result.first.recorded, true);
  assert.equal(result.duplicate.recorded, false);
  assert.deepEqual([result.wins, result.sessions, result.best], [1, 1, 7]);
});

test('真實 10 題均衡題組無重複 charId 且涵蓋六書', () => {
  const result = vm.runInContext(`(() => {
    LSStore.resetAll();
    const slots = LSProgress.balancedBlueprint(LSStore.raw, 10, LSProgress.seededRandom('real-quiz'));
    const rng = LSProgress.seededRandom('real-questions');
    const ids = new Set(), cats = new Set(), keys = new Set();
    for (const slot of slots) {
      const q = LSQuiz.gen({ level: null, cat: slot.cat, type: slot.type, rng, excludeIds: ids, excludeKeys: keys });
      if (q.charId) ids.add(q.charId);
      keys.add(q.key);
      if (slot.cat) cats.add(q.cat);
    }
    return { slots: slots.length, ids: [...ids], cats: [...cats], concept: [...keys].filter(k => k.startsWith('concept:')).length };
  })()`, context);
  assert.equal(result.slots, 10);
  assert.equal(new Set(result.ids).size, result.ids.length);
  for (const cat of P.CATS) assert.ok(result.cats.includes(cat), `出題缺少${cat}`);
  assert.equal(result.concept, 2);
});

console.log(`\n✅ logic ${passed}/${passed} 通過`);
