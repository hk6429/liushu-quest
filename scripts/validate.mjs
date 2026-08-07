#!/usr/bin/env node
// 純讀資料關卡：不執行 merge、不改檔。schema、來源、雙軸分類與精確數量任一失敗即 exit 1。
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'data', 'chars.json'), 'utf8'));
const idMap = JSON.parse(readFileSync(join(root, 'data', 'id-map.json'), 'utf8'));

const CATS = ['象形', '指事', '會意', '形聲', '轉注', '假借'];
const FORMATION_CATS = ['象形', '指事', '會意', '形聲'];
const LEVELS = ['基礎', '進階', '挑戰'];
const SUBS = { 會意: ['同體會意', '異體會意'], 假借: ['有借有還', '有借不還'] };
const REQUIRED = ['id', 'char', 'zhuyin', 'category', 'sub', 'level', 'explain', 'shuowen', 'disputed', 'dispute_note', 'formation_category', 'usage_relations', 'sources'];
const ZHUYIN_RE = /^[ㄅ-ㄩ]{1,3}[ˊˇˋ˙]?$|^˙[ㄅ-ㄩ]{1,3}$/;
const ID_RE = /^c\d{4}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// 常見簡體字黑名單（不收「后」，因夏后氏／皇后為正體正確用字）
const SIMP_RE = /[们对说时会来学发这个门问长东车马鸟龙风见页贝语让还进远运过达迁边为乐书画岁体]/;

const errors = [];
const seen = new Set();
const ids = new Set();
const isPlainObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);

data.forEach((e, i) => {
  const tag = `#${i}(${e?.char || '?'})`;
  if (!isPlainObject(e)) {
    errors.push(`${tag} 詞條不是 object`);
    return;
  }
  for (const k of REQUIRED) if (!(k in e)) errors.push(`${tag} 缺必要欄位 ${k}`);

  if (typeof e.id !== 'string' || !ID_RE.test(e.id)) errors.push(`${tag} id 格式異常: ${String(e.id)}`);
  if (typeof e.char !== 'string' || [...e.char].length !== 1) errors.push(`${tag} char 不是單一字`);
  if (typeof e.zhuyin !== 'string' || !ZHUYIN_RE.test(e.zhuyin)) errors.push(`${tag} 注音格式異常: ${String(e.zhuyin)}`);
  if (typeof e.category !== 'string' || !CATS.includes(e.category)) errors.push(`${tag} 非法 category: ${String(e.category)}`);
  if (typeof e.formation_category !== 'string' || !FORMATION_CATS.includes(e.formation_category))
    errors.push(`${tag} 非法 formation_category: ${String(e.formation_category)}`);
  if (typeof e.level !== 'string' || !LEVELS.includes(e.level)) errors.push(`${tag} 非法 level: ${String(e.level)}`);
  if (typeof e.explain !== 'string') errors.push(`${tag} explain 必須是 string`);
  if (typeof e.shuowen !== 'string') errors.push(`${tag} shuowen 必須是 string（未附原文用空字串）`);
  if (typeof e.disputed !== 'boolean') errors.push(`${tag} disputed 必須是 boolean`);
  if (typeof e.dispute_note !== 'string') errors.push(`${tag} dispute_note 必須是 string`);

  if (seen.has(e.char)) errors.push(`${tag} 重複字`);
  seen.add(e.char);
  if (ids.has(e.id)) errors.push(`${tag} 重複 id`);
  ids.add(e.id);
  if (idMap[e.char] !== e.id) errors.push(`${tag} id 與 id-map 不一致（map=${String(idMap[e.char])}）`);

  if (e.sub !== null) {
    const ok = typeof e.sub === 'string' && SUBS[e.category]?.includes(e.sub);
    if (!ok) errors.push(`${tag} sub「${String(e.sub)}」不合法（category=${e.category}）`);
  } else if (e.category === '會意' || e.category === '假借') {
    errors.push(`${tag} ${e.category} 必須填 sub`);
  }

  if (typeof e.explain === 'string' && ([...e.explain].length < 40 || [...e.explain].length > 220))
    errors.push(`${tag} explain 長度 ${[...e.explain].length} 超出 40-220`);
  if (e.disputed === true && !e.dispute_note) errors.push(`${tag} disputed 卻無 dispute_note`);
  if (e.disputed === false && e.dispute_note) errors.push(`${tag} 非爭議字不應填 dispute_note`);
  if (e.disputed === true && e.level !== '挑戰') errors.push(`${tag} disputed 字 level 必須為挑戰`);

  if (!Array.isArray(e.usage_relations)) {
    errors.push(`${tag} usage_relations 必須是 array`);
  } else {
    e.usage_relations.forEach((rel, j) => {
      const rtag = `${tag}.usage_relations[${j}]`;
      if (!isPlainObject(rel)) return errors.push(`${rtag} 必須是 object`);
      if (!['假借', '轉注'].includes(rel.type)) errors.push(`${rtag} 非法 type: ${String(rel.type)}`);
      if (rel.type === '假借' && !SUBS.假借.includes(rel.sub)) errors.push(`${rtag} 假借 sub 不合法`);
      if (rel.type === '轉注' && rel.sub !== null) errors.push(`${rtag} 轉注 sub 必須為 null`);
      if (!Array.isArray(rel.related_chars) || rel.related_chars.some(c => typeof c !== 'string' || [...c].length !== 1))
        errors.push(`${rtag} related_chars 必須是單字 string array`);
      if (typeof rel.note !== 'string' || !rel.note) errors.push(`${rtag} note 必須是非空 string`);
    });
  }
  if (e.category === '假借' && !e.usage_relations?.some(r => r.type === '假借')) errors.push(`${tag} 假借主類缺 usage relation`);
  if (e.category === '轉注' && !e.usage_relations?.some(r => r.type === '轉注')) errors.push(`${tag} 轉注主類缺 usage relation`);

  if (!Array.isArray(e.sources) || !e.sources.length) {
    errors.push(`${tag} sources 必須是非空 array`);
  } else {
    e.sources.forEach((s, j) => {
      const stag = `${tag}.sources[${j}]`;
      if (!isPlainObject(s)) return errors.push(`${stag} 必須是 object`);
      for (const k of ['provider', 'basis', 'url', 'quote', 'verified_at']) {
        if (typeof s[k] !== 'string' || !s[k]) errors.push(`${stag}.${k} 必須是非空 string`);
      }
      if (typeof s.url === 'string' && !/^https:\/\//.test(s.url)) errors.push(`${stag}.url 必須使用 https`);
      if (typeof s.verified_at === 'string' && !DATE_RE.test(s.verified_at)) errors.push(`${stag}.verified_at 必須是 YYYY-MM-DD`);
    });
    if (e.shuowen && !e.sources.some(s => s.quote === e.shuowen)) errors.push(`${tag} sources 未保存 shuowen 原文`);
    if (!e.shuowen && !e.sources.some(s => s.quote === '未附《說文》原文')) errors.push(`${tag} 空 shuowen 未明示「未附《說文》原文」`);
  }

  const textAll = `${e.explain || ''}${e.dispute_note || ''}${e.shuowen || ''}`;
  if (SIMP_RE.test(textAll)) errors.push(`${tag} 疑似簡體字殘留: ${textAll.match(SIMP_RE)[0]}`);
  if (e.category === '形聲' && !/[形聲]符|表[音義聲意]/.test(e.explain || '')) errors.push(`${tag} 形聲字解說未點出形符／聲符`);
});

if (data.length !== 220) errors.push(`總筆數必須精確為 220，目前 ${data.length}`);
if (Object.keys(idMap).length !== 220) errors.push(`id-map 必須精確為 220 筆，目前 ${Object.keys(idMap).length}`);
for (const char of Object.keys(idMap)) if (!seen.has(char)) errors.push(`id-map 有孤立字：${char}`);

const byCat = {};
for (const e of data) byCat[e.category] = (byCat[e.category] || 0) + 1;
for (const c of CATS) if (!byCat[c] || byCat[c] < 5) errors.push(`${c} 只有 ${byCat[c] || 0} 筆，低於下限 5`);
const byLevel = {};
for (const e of data) byLevel[e.level] = (byLevel[e.level] || 0) + 1;
for (const l of LEVELS) if (!byLevel[l] || byLevel[l] < 10) errors.push(`level ${l} 只有 ${byLevel[l] || 0} 筆，低於下限 10`);

if (errors.length) {
  console.error(`❌ validate 失敗，共 ${errors.length} 個問題：`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
console.log(`✅ validate 通過：${data.length} 字`, byCat, byLevel, `sources=${data.reduce((n, e) => n + e.sources.length, 0)}`);
