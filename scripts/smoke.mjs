#!/usr/bin/env node
// 端到端煙霧測試：手機寬度走完 概念→總覽→閃卡→自測→對戰→戰績匯出，零 console error、不橫向跑版
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const buf = await readFile(join(root, p));
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const errors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));

const fail = msg => { errors.push(msg); };
const step = async (name, fn) => {
  try { await fn(); console.log('  ✓ ' + name); }
  catch (e) { fail(`步驟「${name}」失敗: ${e.message.split('\n')[0]}`); console.log('  ✗ ' + name); }
};

await page.goto(`http://localhost:${port}/`);

await step('概念導讀載入', async () => {
  await page.waitForSelector('#view-concept .card h2', { timeout: 8000 });
});
await step('造字故事載入', async () => {
  await page.click('[data-view="story"]');
  await page.waitForSelector('#view-story .story-card h3');
  const n = await page.locator('#view-story h3').count();
  if (n < 7) throw new Error('故事章節只有 ' + n);
});
await step('字例總覽＋開字卡', async () => {
  await page.click('[data-view="browse"]');
  await page.waitForSelector('.char-tile');
  const n = await page.locator('.char-tile').count();
  if (n < 150) throw new Error('字例只有 ' + n);
  await page.selectOption('#fCat', '形聲');
  await page.locator('.char-tile').first().click();
  await page.waitForSelector('.char-detail');
  await page.click('.char-detail .btn');
});
await step('閃卡：翻面＋評分', async () => {
  await page.click('[data-view="flash"]');
  await page.click('#flashStart');
  await page.click('#fcard');
  await page.waitForSelector('.grade-row');
  await page.click('.grade-row .good');
  await page.waitForSelector('#fcard .headchar');
});
await step('自測：作答一題含回饋', async () => {
  await page.click('[data-view="quiz"]');
  await page.click('#quizStart');
  await page.waitForSelector('.opt');
  await page.locator('.opt').first().click();
  await page.waitForSelector('#qFb .feedback');
  await page.click('#qNext');
  await page.waitForSelector('.opt');
});
await step('對戰：挑戰第一位大師＋作答', async () => {
  await page.click('[data-view="battle"]');
  await page.waitForSelector('.master-card');
  await page.locator('.master-card .btn').first().click();
  await page.waitForSelector('#battleArea .opt');
  await page.locator('#battleArea .opt').first().click();
  await page.waitForSelector('#bFb .feedback');
  await page.click('#bNext');
  await page.waitForSelector('#battleArea .opt');
});
await step('戰績＋匯出', async () => {
  await page.click('[data-view="stats"]');
  await page.waitForSelector('.stat-cell');
  await page.click('#btnExport');
  const v = await page.inputValue('#ioBox');
  if (!v.includes('"cards"')) throw new Error('匯出內容異常');
});
await step('390px 不橫向跑版', async () => {
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  if (w > 395) throw new Error(`scrollWidth=${w}`); // 留 5px 容差防 headless 假溢出
});

await browser.close();
server.close();

if (errors.length) {
  console.error(`\n❌ smoke 失敗（${errors.length}）：`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
console.log('\n✅ smoke 全數通過');
