#!/usr/bin/env node
// 資料層硬性關卡：schema + 內容邏輯雙重檢查。任一錯誤 → exit 1。
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'data', 'chars.json'), 'utf8'));

const CATS = ['象形', '指事', '會意', '形聲', '轉注', '假借'];
const LEVELS = ['基礎', '進階', '挑戰'];
const SUBS = { '會意': ['同體會意', '異體會意'], '假借': ['有借有還', '有借不還'] };
const ZHUYIN_RE = /^[ㄅ-ㄩ]{1,3}[ˊˇˋ˙]?$|^˙[ㄅ-ㄩ]{1,3}$/;
// 常見簡體字黑名單（正體站不得殘留）
// 注意：不收「后」（夏后氏／皇后 為正體正確用字）
const SIMP_RE = /[们对说时会来学发这个门问长东车马鸟龙风见页贝语让还进远运过达迁边为乐书画岁体]/;

const errors = [];
const seen = new Set();
const ids = new Set();

data.forEach((e, i) => {
  const tag = `#${i}(${e.char || '?'})`;
  for (const k of ['id', 'char', 'zhuyin', 'category', 'level', 'explain']) {
    if (!e[k]) errors.push(`${tag} 缺必填欄位 ${k}`);
  }
  if (e.char && [...e.char].length !== 1) errors.push(`${tag} char 不是單一字`);
  if (seen.has(e.char)) errors.push(`${tag} 重複字`);
  seen.add(e.char);
  if (ids.has(e.id)) errors.push(`${tag} 重複 id`);
  ids.add(e.id);
  if (!CATS.includes(e.category)) errors.push(`${tag} 非法 category: ${e.category}`);
  if (!LEVELS.includes(e.level)) errors.push(`${tag} 非法 level: ${e.level}`);
  if (e.zhuyin && !ZHUYIN_RE.test(e.zhuyin)) errors.push(`${tag} 注音格式異常: ${e.zhuyin}`);
  if (e.sub != null) {
    const ok = SUBS[e.category] && SUBS[e.category].includes(e.sub);
    if (!ok) errors.push(`${tag} sub「${e.sub}」不合法（category=${e.category}）`);
  }
  if (e.explain && ([...e.explain].length < 40 || [...e.explain].length > 220))
    errors.push(`${tag} explain 長度 ${[...e.explain].length} 超出 40-220`);
  if (e.disputed && !e.dispute_note) errors.push(`${tag} disputed 卻無 dispute_note`);
  if (e.disputed && e.level !== '挑戰') errors.push(`${tag} disputed 字 level 必須為挑戰`);
  const textAll = (e.explain || '') + (e.dispute_note || '') + (e.shuowen || '');
  if (SIMP_RE.test(textAll)) errors.push(`${tag} 疑似簡體字殘留: ${textAll.match(SIMP_RE)[0]}`);
  // 內容邏輯：形聲字解說必須提及形符/聲符概念
  if (e.category === '形聲' && !/[形聲]符|表[音義聲意]/.test(e.explain || ''))
    errors.push(`${tag} 形聲字解說未點出形符/聲符`);
});

// 總量與分佈區間
const byCat = {};
for (const e of data) byCat[e.category] = (byCat[e.category] || 0) + 1;
if (data.length < 170 || data.length > 240) errors.push(`總筆數 ${data.length} 不在 170-240 區間`);
for (const c of CATS) if (!byCat[c] || byCat[c] < 5) errors.push(`${c} 只有 ${byCat[c] || 0} 筆，低於下限 5`);
const byLevel = {};
for (const e of data) byLevel[e.level] = (byLevel[e.level] || 0) + 1;
for (const l of LEVELS) if (!byLevel[l] || byLevel[l] < 10) errors.push(`level ${l} 只有 ${byLevel[l] || 0} 筆，低於下限 10（會影響同級誘答池）`);

if (errors.length) {
  console.error(`❌ validate 失敗，共 ${errors.length} 個問題：`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
console.log(`✅ validate 通過：${data.length} 字`, byCat, byLevel);
