// localStorage 持久層：閃卡盒序、答題統計、對戰進度、匯出/匯入
const LSStore = (() => {
  const KEY = 'liushu.save.v1';
  const BOX_INTERVALS = [0, 1, 2, 4, 8, 16]; // Leitner 盒 1-5 的複習間隔（天），index 0 未用
  const MAX_BOX = 5;

  let save = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 壞檔重置 */ }
    return blank();
  }
  function blank() {
    return {
      cards: {},        // id -> {box, due(epoch day), seen, right, wrong, streak}
      quiz: { answered: 0, right: 0, byCat: {} }, // byCat: {象形:{r,w},...}
      battle: { beaten: {} },  // masterId -> wins
      days: {},         // 'YYYY-MM-DD' -> reviews count
      created: Date.now()
    };
  }
  function persist() { localStorage.setItem(KEY, JSON.stringify(save)); }
  function today() { return Math.floor(Date.now() / 86400000); }
  function dateKey() { return new Date().toISOString().slice(0, 10); }

  function card(id) {
    if (!save.cards[id]) save.cards[id] = { box: 1, due: today(), seen: 0, right: 0, wrong: 0, streak: 0 };
    return save.cards[id];
  }

  // 閃卡評分：again(0) / hard(1) / good(2)
  function gradeCard(id, grade) {
    const c = card(id);
    c.seen++;
    if (grade === 0) { c.box = 1; c.streak = 0; c.wrong++; }
    else if (grade === 1) { c.box = Math.max(1, c.box); c.right++; c.streak++; }
    else { c.box = Math.min(MAX_BOX, c.box + 1); c.right++; c.streak++; }
    c.due = today() + BOX_INTERVALS[c.box];
    save.days[dateKey()] = (save.days[dateKey()] || 0) + 1;
    persist();
  }

  // 自測/對戰答題回寫（也影響盒序：錯 → 掉回第 1 盒優先複習）
  function recordAnswer(id, cat, ok) {
    const c = card(id);
    c.seen++;
    if (ok) { c.right++; c.streak++; if (c.streak >= 2 && c.box < MAX_BOX) { c.box++; c.due = today() + BOX_INTERVALS[c.box]; } }
    else { c.wrong++; c.streak = 0; c.box = 1; c.due = today(); }
    save.quiz.answered++;
    if (ok) save.quiz.right++;
    if (!save.quiz.byCat[cat]) save.quiz.byCat[cat] = { r: 0, w: 0 };
    save.quiz.byCat[cat][ok ? 'r' : 'w']++;
    persist();
  }

  // 精通定義（養成鐵律：掛真實學習量）：盒序 ≥ 4 且累計答對 ≥ 2
  function isMastered(id) {
    const c = save.cards[id];
    return !!c && c.box >= 4 && c.right >= 2;
  }
  function masteredCount() {
    return Object.keys(save.cards).filter(isMastered).length;
  }

  function dueCards(allIds) {
    const t = today();
    return allIds.filter(id => save.cards[id] && save.cards[id].due <= t && save.cards[id].seen > 0);
  }
  function newCards(allIds) {
    return allIds.filter(id => !save.cards[id] || save.cards[id].seen === 0);
  }

  // 弱點：答錯過且 錯誤率高 或 仍在低盒
  function weakIds(allIds) {
    return allIds
      .map(id => ({ id, c: save.cards[id] }))
      .filter(x => x.c && x.c.wrong > 0 && (x.c.wrong / (x.c.right + x.c.wrong) >= 0.34 || x.c.box <= 2))
      .sort((a, b) => (b.c.wrong / (b.c.right + b.c.wrong)) - (a.c.wrong / (a.c.right + a.c.wrong)))
      .map(x => x.id);
  }

  function recordBattleWin(masterId) {
    save.battle.beaten[masterId] = (save.battle.beaten[masterId] || 0) + 1;
    persist();
  }

  function exportSave() { return JSON.stringify(save); }
  function importSave(str) {
    const obj = JSON.parse(str);
    if (!obj.cards || !obj.quiz) throw new Error('格式不符');
    save = obj; persist();
  }
  function resetAll() { save = blank(); persist(); }

  return { card, gradeCard, recordAnswer, isMastered, masteredCount, dueCards, newCards, weakIds, recordBattleWin, exportSave, importSave, resetAll, get raw() { return save; } };
})();
