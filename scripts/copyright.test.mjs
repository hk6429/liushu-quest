#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(join(root, path), 'utf8');
const fail = message => { throw new Error(message); };

const [index, rights, evidence, concept, story, quiz, app, flashcard, battle, notices, provenance, charProvenance, charsText, css] = await Promise.all([
  read('index.html'), read('rights.html'), read('js/evidence.js'), read('js/concept.js'),
  read('js/story.js'), read('js/quiz.js'), read('js/app.js'), read('js/flashcard.js'), read('js/battle.js'),
  read('THIRD_PARTY_NOTICES.md'), read('docs/asset-provenance.md'), read('docs/char-image-provenance.json'), read('data/chars.json'), read('css/style.css')
]);

if (!index.includes('href="rights.html"')) fail('頁尾缺權利與來源入口');
if (!index.includes('公版、AI 生成及第三方素材依各自權利狀態')) fail('頁尾 © 未限縮權利範圍');
if (!rights.includes('學生前台只呈現本站重新撰寫的教學解說') || !rights.includes('不提供外部資料連結')) fail('權利頁未說明前台原創文字與無外連界線');
if (!rights.includes('AI 生成配圖') || !rights.includes('不對純 AI 自動生成元素作超出法律範圍的獨占聲明')) fail('權利頁缺 AI 權利界線');
if (!rights.includes('權利疑義與下架處理') || !rights.includes('GitHub Issues')) fail('權利頁缺通知與下架流程');
if (/<a\b[^>]*href=["']https?:\/\//i.test(rights)) fail('權利頁不得提供外部可點連結');
if (/shuowen|source\?\.|sourceLine|evidence-quote|evidence-source/i.test(evidence)) fail('學生字卡仍渲染外部原文或來源');
if (/c\.shuowen/.test(app) || /c\.shuowen/.test(flashcard)) fail('字卡 fallback 仍可能顯示外部原文');
if (!app.includes('img/chars/${c.id}.webp') || !app.includes('AI 生成教學想像')) fail('字卡缺逐字配圖或 AI 教學想像揭露');
for (const [name, text] of [['概念頁', concept], ['故事頁', story]]) {
  if (/https?:\/\//.test(text)) fail(`${name}仍有外部資料連結`);
  if (/畫成其物|視而可識|比類合誼|以事為名|建類一首|本無其字|老，考也|考，老也/.test(text)) fail(`${name}仍展示《說文》逐字引文`);
}
if (/畫成其物|老，考也|考，老也/.test(quiz)) fail('題目仍直接展示古籍原句');
for (const char of JSON.parse(charsText)) {
  const studentText = `${char.explain || ''} ${char.dispute_note || ''}`;
  if (/畫成其物|視而可識|建類一首|老，考也|考，老也|空，竅也|竅，空也|頂，顛也|顛，頂也|鼻也。象鼻形|止戈為武|子亦聲|从亦聲|豭省聲/.test(studentText)) {
    fail(`${char.id}(${char.char}) 的學生字卡仍含古籍逐字原句`);
  }
}
if (!battle.includes('不是歷史肖像復原') || !battle.includes('不是史料原句')) fail('大師圖像與台詞缺創作聲明');
if (!provenance.includes('共 220 張') || JSON.parse(charProvenance).length !== 220) fail('字例配圖來源清冊不完整');
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

console.log(`✅ copyright tests 通過：學生前台無外部原文與資料連結；${imagePaths.length} 張既有圖＋220 張單字圖的來源、AI、第三方與下架護欄成立`);
