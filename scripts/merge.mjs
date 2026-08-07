#!/usr/bin/env node
// 合併 data/shards/*.json → data/chars.json。
// 既有 ID 由 data/id-map.json 鎖定；只有 --update-id-map 會為新字追加 ID。
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shardDir = join(root, 'data', 'shards');
const outFile = join(root, 'data', 'chars.json');
const idMapFile = join(root, 'data', 'id-map.json');
const args = new Set(process.argv.slice(2));
const bootstrap = args.has('--bootstrap-id-map');
const updateIds = bootstrap || args.has('--update-id-map');
const CAT_ORDER = ['象形', '指事', '會意', '形聲', '轉注', '假借'];

let idMap = {};
if (existsSync(idMapFile)) {
  idMap = JSON.parse(readFileSync(idMapFile, 'utf8'));
} else if (bootstrap && existsSync(outFile)) {
  const current = JSON.parse(readFileSync(outFile, 'utf8'));
  idMap = Object.fromEntries(current.map(e => [e.char, e.id]));
} else {
  console.error('缺少 data/id-map.json；首次遷移請執行 node scripts/merge.mjs --bootstrap-id-map');
  process.exit(1);
}

const all = [];
const seen = new Map();
const duplicates = [];
for (const f of readdirSync(shardDir).filter(f => f.endsWith('.json')).sort()) {
  const arr = JSON.parse(readFileSync(join(shardDir, f), 'utf8'));
  for (const e of arr) {
    if (seen.has(e.char)) {
      duplicates.push(`${e.char}（${f}，首見於 ${seen.get(e.char)}）`);
      continue;
    }
    seen.set(e.char, f);
    all.push(e);
  }
}
if (duplicates.length) {
  console.error('重複字不可靜默捨棄：\n  - ' + duplicates.join('\n  - '));
  process.exit(1);
}

all.sort((a, b) => {
  const c = CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category);
  return c !== 0 ? c : a.char.localeCompare(b.char, 'zh-Hant');
});

const usedIds = new Set(Object.values(idMap));
let nextId = Math.max(0, ...[...usedIds].map(id => Number(String(id).slice(1)) || 0)) + 1;
const missing = all.filter(e => !idMap[e.char]);
if (missing.length && !updateIds) {
  console.error(`id-map 缺少 ${missing.length} 字：${missing.map(e => e.char).join('、')}；請明確使用 --update-id-map`);
  process.exit(1);
}
for (const e of missing) {
  let id;
  do id = 'c' + String(nextId++).padStart(4, '0'); while (usedIds.has(id));
  idMap[e.char] = id;
  usedIds.add(id);
}

const output = all.map(e => ({
  ...e,
  id: idMap[e.char]
}));

if (updateIds) {
  const orderedMap = Object.fromEntries(Object.entries(idMap).sort((a, b) => a[1].localeCompare(b[1])));
  writeFileSync(idMapFile, JSON.stringify(orderedMap, null, 2) + '\n', 'utf8');
}
writeFileSync(outFile, JSON.stringify(output, null, 1) + '\n', 'utf8');

const byCat = {};
for (const e of output) byCat[e.category] = (byCat[e.category] || 0) + 1;
console.log(`合併完成：共 ${output.length} 字`, byCat, `新增 ID ${missing.length} 筆`);
