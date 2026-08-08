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
const SUBS = { 會意: ['同體會意', '異體會意'], 假借: ['有借有還', '有借不還', '借義另造'] };
const SUB_SCOPES = { 會意: '會意部件教學分組', 假借: '假借後續用字結果教學分組' };
const SHUOWEN_STATUSES = ['已核對', '待核', '未附'];
const REQUIRED = ['id', 'char', 'zhuyin', 'category', 'classification_scope', 'sub', 'sub_scope', 'level', 'explain', 'shuowen', 'shuowen_status', 'disputed', 'dispute_note', 'formation_category', 'usage_relations', 'sources'];
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
  const expectedScope = ['轉注', '假借'].includes(e.category) ? '用字關係' : '構形';
  if (e.classification_scope !== expectedScope)
    errors.push(`${tag} classification_scope 應為 ${expectedScope}，實為 ${String(e.classification_scope)}`);
  if (typeof e.formation_category !== 'string' || !FORMATION_CATS.includes(e.formation_category))
    errors.push(`${tag} 非法 formation_category: ${String(e.formation_category)}`);
  if (typeof e.level !== 'string' || !LEVELS.includes(e.level)) errors.push(`${tag} 非法 level: ${String(e.level)}`);
  if (typeof e.explain !== 'string') errors.push(`${tag} explain 必須是 string`);
  if (typeof e.shuowen !== 'string') errors.push(`${tag} shuowen 必須是 string（未附原文用空字串）`);
  if (!SHUOWEN_STATUSES.includes(e.shuowen_status)) errors.push(`${tag} 非法 shuowen_status: ${String(e.shuowen_status)}`);
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
    if (e.sub_scope !== SUB_SCOPES[e.category]) errors.push(`${tag} sub_scope 與 ${e.category} sub 不一致`);
  } else if (e.category === '會意' || e.category === '假借') {
    errors.push(`${tag} ${e.category} 必須填 sub`);
  } else if (e.sub_scope !== null) {
    errors.push(`${tag} 無 sub 時 sub_scope 必須為 null`);
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
      const expectedBasis = rel.type === '假借' ? '依聲託事' : rel.type === '轉注' ? '互訓說' : null;
      if (rel.relation_basis !== expectedBasis) errors.push(`${rtag} relation_basis 應為 ${String(expectedBasis)}`);
      if (rel.relation_status !== '教學採說') errors.push(`${rtag} relation_status 必須為「教學採說」`);
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
      for (const k of ['provider', 'edition', 'basis', 'url', 'quote', 'citation_level', 'verification_status', 'accessed_at']) {
        if (typeof s[k] !== 'string' || !s[k]) errors.push(`${stag}.${k} 必須是非空 string`);
      }
      if (typeof s.url === 'string' && !/^https:\/\/dict\.variants\.moe\.edu\.tw\/dictView\.jsp\?ID=\d+$/.test(s.url))
        errors.push(`${stag}.url 必須是教育部單筆正字條目`);
      if (typeof s.accessed_at === 'string' && !DATE_RE.test(s.accessed_at)) errors.push(`${stag}.accessed_at 必須是 YYYY-MM-DD`);
      if ('verified_at' in s) errors.push(`${stag} 不得使用語意混淆的 verified_at`);
      if (!['直接引文', '檢索入口'].includes(s.citation_level)) errors.push(`${stag}.citation_level 不合法`);
      if (!SHUOWEN_STATUSES.includes(s.verification_status)) errors.push(`${stag}.verification_status 不合法`);
      if (s.citation_level === '直接引文' && (s.verification_status !== '已核對' || s.quote !== e.shuowen))
        errors.push(`${stag} 直接引文必須已核對且與 shuowen 逐字相同`);
    });
    if (e.shuowen_status === '已核對' && (!e.shuowen || !e.sources.some(s => s.citation_level === '直接引文' && s.verification_status === '已核對' && s.quote === e.shuowen)))
      errors.push(`${tag} 已核對 shuowen 缺直接引文`);
    if (e.shuowen_status === '待核' && (!e.shuowen || !e.sources.some(s => s.citation_level === '檢索入口' && s.verification_status === '待核' && s.quote === '待逐字核對《說文》條文')))
      errors.push(`${tag} 待核 shuowen 的引用層次不一致`);
    if (e.shuowen_status === '未附' && (e.shuowen !== '' || !e.sources.some(s => s.citation_level === '檢索入口' && s.verification_status === '未附' && s.quote === '未附《說文》原文')))
      errors.push(`${tag} 未附 shuowen 的引用層次不一致`);
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
const byShuowenStatus = Object.fromEntries(SHUOWEN_STATUSES.map(s => [s, data.filter(e => e.shuowen_status === s).length]));
console.log(`✅ validate 通過：${data.length} 字`, byCat, byLevel, byShuowenStatus, `sources=${data.reduce((n, e) => n + e.sources.length, 0)}`);
