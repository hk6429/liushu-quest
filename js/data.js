// 資料載入層：data/chars.json → 全域索引
const LSData = (() => {
  const CATS = ['象形', '指事', '會意', '形聲', '轉注', '假借'];
  const LEVELS = ['基礎', '進階', '挑戰'];
  let chars = [];
  const byId = {};
  const byCat = {};
  const listeners = [];

  async function init() {
    const res = await fetch('data/chars.json');
    chars = await res.json();
    for (const c of chars) {
      byId[c.id] = c;
      (byCat[c.category] = byCat[c.category] || []).push(c);
    }
    listeners.forEach(fn => fn());
  }
  function onReady(fn) { chars.length ? fn() : listeners.push(fn); }

  function pick(arr, n, rng) {
    const pool = arr.slice();
    const out = [];
    while (out.length < n && pool.length) {
      out.push(pool.splice(Math.floor((rng ? rng() : Math.random()) * pool.length), 1)[0]);
    }
    return out;
  }

  return {
    init, onReady, pick, CATS, LEVELS,
    get all() { return chars; },
    get byId() { return byId; },
    get byCat() { return byCat; },
    ofLevel(lv) { return lv ? chars.filter(c => c.level === lv) : chars; }
  };
})();
