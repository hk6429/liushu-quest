#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');
const data = JSON.parse(read('data/chars.json'));
const idMap = JSON.parse(read('data/id-map.json'));
const mergeSource = read('scripts/merge.mjs');
const shardFiles = readdirSync(join(root, 'data', 'shards')).filter(f => f.endsWith('.json')).sort();
const shards = shardFiles.flatMap(file => JSON.parse(read(`data/shards/${file}`)).map(e => ({ file, ...e })));

assert.equal(data.length, 220, '必須精確 220 字');
assert.equal(shards.length, 220, 'shard 必須精確 220 字');
assert.equal(Object.keys(idMap).length, 220, 'id-map 必須精確 220 字');
assert.deepEqual(
  Object.fromEntries(data.map(e => [e.char, e.id])),
  idMap,
  'chars.json 字與 ID 必須完全等於 id-map'
);

assert.doesNotMatch(mergeSource, /FORMATION_OVERRIDES|function usageRelations|function sourcesFor/, 'merge 不得推斷文字學資料');

const byChar = new Map(data.map(e => [e.char, e]));
for (const shard of shards) {
  const tag = `${shard.file}:${shard.char}`;
  const output = byChar.get(shard.char);
  assert.ok(output, `${tag} 缺合併輸出`);
  for (const field of ['classification_scope', 'sub_scope', 'shuowen_status', 'formation_category', 'usage_relations', 'sources']) {
    assert.ok(Object.hasOwn(shard, field), `${tag} 缺編輯來源欄位 ${field}`);
    assert.deepEqual(output[field], shard[field], `${tag} 的 ${field} 被 merge 改寫`);
  }

  const expectedScope = ['轉注', '假借'].includes(shard.category) ? '用字關係' : '構形';
  assert.equal(shard.classification_scope, expectedScope, `${tag} 分類層次`);
  const expectedSubScope = shard.sub === null
    ? null
    : shard.category === '會意'
      ? '會意部件教學分組'
      : '假借後續用字結果教學分組';
  assert.equal(shard.sub_scope, expectedSubScope, `${tag} sub 術語層次`);

  for (const rel of shard.usage_relations) {
    assert.equal(rel.relation_status, '教學採說', `${tag} 用字關係不得寫成無爭議定論`);
    assert.equal(rel.relation_basis, rel.type === '假借' ? '依聲託事' : '互訓說', `${tag} 用字關係術語`);
    if (rel.type === '轉注') assert.match(rel.note, /異說|非唯一定論/, `${tag} 轉注應明示採說邊界`);
  }

  for (const source of shard.sources) {
    assert.equal(source.provider, '教育部《異體字字典》', `${tag} 來源機構`);
    assert.equal(source.edition, '臺灣學術網路十四版（正式七版）2024', `${tag} 來源版本`);
    assert.match(source.url, /^https:\/\/dict\.variants\.moe\.edu\.tw\/dictView\.jsp\?ID=\d+$/, `${tag} 不得以搜尋頁充當直接引據`);
    assert.match(source.accessed_at, /^\d{4}-\d{2}-\d{2}$/, `${tag} accessed_at`);
    assert.ok(!Object.hasOwn(source, 'verified_at'), `${tag} 不得混同存取日與核對狀態`);
  }

  if (shard.shuowen_status === '已核對') {
    assert.ok(shard.shuowen, `${tag} 已核對卻無條文`);
    assert.ok(shard.sources.some(s => s.citation_level === '直接引文' && s.verification_status === '已核對' && s.quote === shard.shuowen), `${tag} 缺可逐字比對的直接引文`);
  } else if (shard.shuowen_status === '待核') {
    assert.ok(shard.shuowen, `${tag} 待核卻無候選條文`);
    assert.ok(shard.sources.every(s => s.citation_level !== '直接引文' && s.verification_status === '待核'), `${tag} 待核不得假裝直接引文`);
  } else {
    assert.equal(shard.shuowen_status, '未附', `${tag} shuowen_status`);
    assert.equal(shard.shuowen, '', `${tag} 未附時 shuowen 必須為空`);
  }
}

const counts = Object.fromEntries(['已核對', '待核', '未附'].map(status => [status, shards.filter(e => e.shuowen_status === status).length]));
assert.deepEqual(counts, { '已核對': 179, '待核': 31, '未附': 10 }, '本輪引文核對盤點數量漂移');

let liveSummary = '';
if (process.argv.includes('--live')) {
  const decodeHtml = text => text
    .replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
  const normalizeQuote = text => decodeHtml(text).replace(/&nbsp;|[，。；：、（）「」『』\s]/g, '');
  const verifiedEntries = shards.filter(e => e.shuowen_status === '已核對');
  let checked = 0;
  for (let i = 0; i < verifiedEntries.length; i += 12) {
    await Promise.all(verifiedEntries.slice(i, i + 12).map(async e => {
      const source = e.sources.find(s => s.citation_level === '直接引文');
      const response = await fetch(source.url);
      const html = await response.text();
      const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
      const description = decodeHtml(html.match(/<meta name="Description" content="([\s\S]*?)" \/>/)?.[1] || '');
      assert.match(title, new RegExp(`(?:^|\\s)${e.char}(?:\\s|-)`), `${e.char} 來源 ID 不是對應正字條目`);
      assert.ok(normalizeQuote(description).includes(normalizeQuote(e.shuowen)), `${e.char} 已核引文無法在教育部正字條目比對`);
      checked += 1;
    }));
  }
  liveSummary = `；教育部即時回讀 ${checked}/${verifiedEntries.length}`;
}

console.log(`✅ philology tests 通過：220 字 ID 對齊；《說文》已核對 ${counts.已核對}、待核 ${counts.待核}、未附 ${counts.未附}；分類與引用層次通過${liveSummary}`);
