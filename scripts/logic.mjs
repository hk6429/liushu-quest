#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const progressionSource = await readFile(new URL('../js/progression.js', import.meta.url), 'utf8');
const storeSource = await readFile(new URL('../js/store.js', import.meta.url), 'utf8');
const quizSource = await readFile(new URL('../js/quiz.js', import.meta.url), 'utf8');
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

test('舊存檔的 _concept 不會污染精通數', () => {
  Store.importSave(JSON.stringify({
    cards: { _concept: { box: 5, right: 99, seen: 99 }, real: { box: 4, right: 2, seen: 2 } },
    quiz: { answered: 99, right: 99, byCat: {} }, battle: { beaten: {} }, days: {}
  }));
  assert.equal(Store.raw.cards._concept, undefined);
  assert.equal(Store.masteredCount(['real']), 1);
});

test('匯入拒絕未來版本並清除危險鍵', () => {
  assert.throws(() => Store.importSave(JSON.stringify({ schemaVersion: 99, cards: {}, quiz: {} })), /不支援的存檔版本/);
  Store.importSave('{"schemaVersion":2,"cards":{"constructor":{"box":5},"safe-card":{"box":4,"right":2,"seen":2}},"quiz":{"answered":2,"right":9,"byCat":{"象形":{"r":2,"w":0},"惡意":{"r":99,"w":0}}}}');
  assert.equal(Object.hasOwn(Store.raw.cards, 'constructor'), false);
  assert.equal(Store.raw.cards['safe-card'].box, 4);
  assert.equal(Store.raw.quiz.right, 2);
  assert.equal(Store.raw.quiz.byCat['惡意'], undefined);
});

test('三種有效活動都累計，五次才完成當日', () => {
  const save = P.migrateSave({});
  const now = new Date('2026-08-07T12:00:00+08:00');
  P.recordActivity(save, 'flash', 2, now);
  P.recordActivity(save, 'quiz', 2, now);
  let day = P.recordActivity(save, 'battle', 1, now);
  assert.deepEqual([day.flash, day.quiz, day.battle, day.total, day.complete], [2, 2, 1, 5, true]);
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

test('成長階段涵蓋未見到精通', () => {
  assert.equal(P.masteryStage(null).label, '未見');
  assert.equal(P.masteryStage({ seen: 1, box: 1, right: 0 }).label, '初識');
  assert.equal(P.masteryStage({ seen: 2, box: 2, right: 1 }).label, '熟悉');
  assert.equal(P.masteryStage({ seen: 3, box: 3, right: 2 }).label, '穩固');
  assert.equal(P.masteryStage({ seen: 4, box: 4, right: 2 }).label, '精通');
});

test('自適應難度依最近正確率升降', () => {
  const low = P.migrateSave({ quiz: { recent: Array.from({ length: 10 }, (_, i) => ({ ok: i < 4 })) } });
  const mid = P.migrateSave({ quiz: { recent: Array.from({ length: 10 }, (_, i) => ({ ok: i < 7 })) } });
  const high = P.migrateSave({ quiz: { recent: Array.from({ length: 20 }, (_, i) => ({ ok: i < 18 })) } });
  assert.equal(P.adaptiveLevel(low), '基礎');
  assert.equal(P.adaptiveLevel(mid), '進階');
  assert.equal(P.adaptiveLevel(high), '挑戰');
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

test('每日分享文字不含題目或答案', () => {
  const text = P.challengeShareText({ date: '2026-08-07', score: 9, total: 12, streak: 3 });
  assert.match(text, /9／12/);
  assert.match(text, /連續修行 3 天/);
  assert.doesNotMatch(text, /正解|題目|answer/i);
});

test('大師藍圖固定十回合且至少五題主題題', () => {
  const slots = P.battleBlueprint({ focusCats: ['轉注', '假借'] }, P.seededRandom('battle'));
  assert.equal(slots.length, 10);
  assert.equal(slots.filter(slot => slot.focus).length, 5);
  assert.ok(slots.filter(slot => slot.focus).every(slot => ['轉注', '假借'].includes(slot.cat)));
});

test('今日任務依弱點、到期、自測、對戰順序推進', () => {
  const save = P.migrateSave({});
  let mission = P.todayMission({ save, weakCount: 3, dueCount: 4, newCount: 10, mastered: 0, masters: [{ name: '李斯', unlock: 8 }] });
  assert.equal(mission.id, 'weak');
  P.recordActivity(save, 'flash', 5, new Date());
  mission = P.todayMission({ save, weakCount: 3, dueCount: 4, newCount: 10, mastered: 0, masters: [{ name: '李斯', unlock: 8 }] });
  assert.equal(mission.id, 'quiz');
  P.recordActivity(save, 'quiz', 5, new Date());
  mission = P.todayMission({ save, weakCount: 3, dueCount: 4, newCount: 10, mastered: 0, masters: [{ name: '李斯', unlock: 8 }] });
  assert.equal(mission.id, 'battle');
});

test('印記判定具冪等性', () => {
  const sample = chars.slice(0, 6);
  const save = P.migrateSave({ cards: {}, sessions: { quiz: 1, lastQuiz: { score: 10, total: 10 } } });
  for (const c of sample) save.cards[c.id] = { box: 4, right: 2, seen: 2 };
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
