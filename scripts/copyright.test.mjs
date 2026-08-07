#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(join(root, path), 'utf8');
const fail = message => { throw new Error(message); };

const [index, rights, evidence, battle, notices, provenance, css] = await Promise.all([
  read('index.html'), read('rights.html'), read('js/evidence.js'), read('js/battle.js'),
  read('THIRD_PARTY_NOTICES.md'), read('docs/asset-provenance.md'), read('css/style.css')
]);

if (!index.includes('href="rights.html"')) fail('頁尾缺權利與來源入口');
if (!index.includes('公版、AI 生成及第三方素材依各自權利狀態')) fail('頁尾 © 未限縮權利範圍');
if (!rights.includes('許慎《說文解字》') || !rights.includes('教育部《異體字字典》只作逐字校核入口')) fail('權利頁未區分公版原典與教育部校核入口');
if (!rights.includes('AI 生成配圖') || !rights.includes('不對純 AI 自動生成元素作超出法律範圍的獨占聲明')) fail('權利頁缺 AI 權利界線');
if (!rights.includes('權利疑義與下架處理') || !rights.includes('issues/new')) fail('權利頁缺通知與下架流程');
if (!evidence.includes('許慎《說文解字》條文節錄') || !evidence.includes('<b>校核入口：</b>')) fail('字卡未明示作者或仍把教育部當成原典作者');
if (!battle.includes('不是歷史肖像復原') || !battle.includes('不是史料原句')) fail('大師圖像與台詞缺創作聲明');
if (!notices.includes('GoatCounter') || !notices.includes('ISC License') || !notices.includes('Playwright Core 1.62.1') || !notices.includes('Apache License 2.0')) fail('第三方聲明不完整');
if (css.includes('@font-face')) fail('新增字型檔前必須先補授權紀錄');

const imagePaths = [];
for (const folder of ['characters', 'concept', 'masters', 'story']) {
  for (const name of await readdir(join(root, 'img', folder))) {
    if (name.endsWith('.webp')) imagePaths.push(`img/${folder}/${name}`);
  }
}
imagePaths.sort();
if (imagePaths.length !== 26) fail(`圖片數量改變：${imagePaths.length}；請同步更新來源清冊`);
for (const path of imagePaths) {
  const digest = createHash('sha256').update(await readFile(join(root, path))).digest('hex');
  if (!provenance.includes(`\`${path}\` — \`${digest}\``)) fail(`來源清冊缺少 ${path} 或 SHA-256 已失效`);
}
const shaCount = provenance.match(/`[a-f0-9]{64}`/g)?.length || 0;
if (shaCount !== imagePaths.length) fail(`來源清冊 SHA-256 數量 ${shaCount}，應為 ${imagePaths.length}`);

console.log(`✅ copyright tests 通過：${imagePaths.length} 張圖均有來源與 SHA-256；引用、AI、第三方與下架護欄成立`);
