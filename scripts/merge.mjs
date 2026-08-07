#!/usr/bin/env node
// 合併 data/shards/*.json → data/chars.json（冪等：每次全量重建、重新編號）
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shardDir = join(root, 'data', 'shards');
const CAT_ORDER = ['象形', '指事', '會意', '形聲', '轉注', '假借'];

const all = [];
const seen = new Map();
for (const f of readdirSync(shardDir).filter(f => f.endsWith('.json')).sort()) {
  const arr = JSON.parse(readFileSync(join(shardDir, f), 'utf8'));
  for (const e of arr) {
    if (seen.has(e.char)) {
      console.log(`重複字捨棄: ${e.char}（${f}，首見於 ${seen.get(e.char)}）`);
      continue;
    }
    seen.set(e.char, f);
    all.push(e);
  }
}
all.sort((a, b) => {
  const c = CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category);
  return c !== 0 ? c : a.char.localeCompare(b.char, 'zh-Hant');
});
all.forEach((e, i) => { e.id = 'c' + String(i + 1).padStart(4, '0'); });
writeFileSync(join(root, 'data', 'chars.json'), JSON.stringify(all, null, 1), 'utf8');
const byCat = {};
for (const e of all) byCat[e.category] = (byCat[e.category] || 0) + 1;
console.log(`合併完成：共 ${all.length} 字`, byCat);
