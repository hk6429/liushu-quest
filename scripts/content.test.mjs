#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');
const data = JSON.parse(read('data/chars.json'));
const idMap = JSON.parse(read('data/id-map.json'));
const pkg = JSON.parse(read('package.json'));
const concept = read('js/concept.js');
const story = read('js/story.js');
const quiz = read('js/quiz.js');

assert.equal(data.length, 220, 'chars.json 必須精確 220 字');
assert.equal(Object.keys(idMap).length, 220, 'id-map 必須精確 220 字');

const added = ['子', '女', '犬', '豕', '兔', '衣', '孝', '友', '相', '困', '苗', '初', '解', '祭', '橋', '語', '請', '飯', '洋', '洗', '姑', '枝', '自', '萬'];
const byChar = Object.fromEntries(data.map(e => [e.char, e]));
for (const char of added) assert.ok(byChar[char], `缺少新增字 ${char}`);
assert.deepEqual(new Set(added.map(char => idMap[char])), new Set(Array.from({ length: 24 }, (_, i) => `c${String(197 + i).padStart(4, '0')}`)), '24 個新字必須只使用 c0197-c0220');

const relation = (char, formation, type, related) => {
  const e = byChar[char];
  assert.equal(e.formation_category, formation, `${char} formation_category`);
  const rel = e.usage_relations.find(r => r.type === type);
  assert.ok(rel, `${char} 缺 ${type} usage relation`);
  if (related) assert.ok(rel.related_chars.includes(related), `${char} 的 ${type} 關係缺 ${related}`);
};
relation('莫', '會意', '假借', '暮');
relation('其', '象形', '假借', '箕');
relation('自', '象形', '假借', '鼻');
relation('萬', '象形', '假借');
relation('考', '形聲', '轉注', '老');
relation('老', '象形', '轉注', '考');

for (const e of data) {
  assert.ok(e.sources.length > 0, `${e.char} 缺來源`);
  assert.ok(e.sources.every(s => s.provider && s.edition && s.basis && s.url && s.quote && s.citation_level && s.verification_status && s.accessed_at), `${e.char} 來源欄位不完整`);
  assert.ok(e.sources.every(s => /^https:\/\/dict\.variants\.moe\.edu\.tw\/dictView\.jsp\?ID=\d+$/.test(s.url)), `${e.char} 來源必須直指單筆正字條目`);
  assert.ok(!e.sources.some(s => 'verified_at' in s), `${e.char} 不得以 verified_at 混同存取與核對`);
}

const shardChars = [];
for (const f of readdirSync(join(root, 'data', 'shards')).filter(f => f.endsWith('.json'))) {
  const entries = JSON.parse(read(`data/shards/${f}`));
  shardChars.push(...entries.map(e => e.char));
  for (const e of entries) {
    assert.ok(Object.hasOwn(e, 'formation_category'), `${f}:${e.char} shard 缺 formation_category`);
    assert.ok(Object.hasOwn(e, 'usage_relations'), `${f}:${e.char} shard 缺 usage_relations`);
    assert.ok(Object.hasOwn(e, 'sources'), `${f}:${e.char} shard 缺 sources`);
    assert.ok(Object.hasOwn(e, 'classification_scope'), `${f}:${e.char} shard 缺 classification_scope`);
    assert.ok(Object.hasOwn(e, 'shuowen_status'), `${f}:${e.char} shard 缺 shuowen_status`);
  }
}
assert.equal(shardChars.length, new Set(shardChars).size, 'shard 不得有重複字');

for (const [file, text] of [['concept', concept], ['story', story], ['quiz', quiz]]) {
  assert.doesNotMatch(text, /九成左右的字|十之八九能矇對/, `${file} 不得承諾形聲字現代讀音命中率`);
  assert.doesNotMatch(text, /繩結有「意思」，卻沒有形狀|結繩記事<\/b>形 \$\{N\}/, `${file} 不得把繩結說成沒有物理形狀`);
  if (file !== 'quiz') {
    assert.match(text, /內容說明/, `${file} 必須有本站重新撰寫的內容說明`);
    assert.match(text, /重新撰寫/, `${file} 必須明示教學文字為本站重新撰寫`);
    assert.doesNotMatch(text, /https?:\/\//, `${file} 學生前台不得提供外部資料連結`);
    assert.match(text, /聲符.*線索.*保證|線索，不是保證/, `${file} 必須說明聲符只是線索`);
  }
}
assert.doesNotMatch(story, /為了『還債』，發明了一種新造法|才大量催生了下一類/, '故事不得把假借分化寫成形聲的單一線性起源');
assert.doesNotMatch(quiz, /繩結承載意思，但沒有可辨的形體|全部都是「有借不還」/, '題庫不得保留已修正的錯誤或單因敘述');
assert.match(quiz, /沒有固定字形逐一對應語詞/);
assert.match(quiz, /只是其中一種形成路徑/);

assert.ok(pkg.scripts['build:data']?.includes('merge.mjs'), 'build:data 必須明確承擔 merge');
assert.ok(pkg.scripts.test, '缺少 npm test');
assert.doesNotMatch(pkg.scripts.test, /merge|build:data/, 'npm test 不得執行會寫檔的 merge');
assert.doesNotMatch(pkg.scripts.validate, /merge|build:data/, 'validate 必須純讀');

console.log(`✅ content tests 通過：24 個新字、6 個雙軸契約、${data.length} 筆 shard 學術欄位與直接條目來源`);
