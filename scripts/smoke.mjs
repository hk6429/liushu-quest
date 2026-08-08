#!/usr/bin/env node
// 端到端煙霧測試：手機寬度走完今日主線、故事、共學與既有功能，零前端錯誤、不橫向跑版
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

await step('今日主線預設載入', async () => {
  await page.waitForSelector('#view-home .journey-hero h2', { timeout: 8000 });
  const active = await page.locator('.tabs [aria-current="page"]').getAttribute('data-view');
  if (active !== 'home') throw new Error(`預設分頁=${active}`);
  if (await page.locator('.chapter-map li').count() !== 8) throw new Error('故事旅程不是八卷');
  await page.click('[data-view="concept"]');
});

await step('概念導讀載入', async () => {
  await page.waitForSelector('#view-concept .card h2', { timeout: 8000 });
  const jumpLinks = await page.locator('.concept-jump a').count();
  if (jumpLinks !== 6) throw new Error(`六書頁內導覽數=${jumpLinks}`);
  if (!await page.locator('.tools-discovery-note').isVisible()) throw new Error('學習工具提示不可見');
  const defaultOpen = await page.locator('script[data-site="liushu-quest"]').getAttribute('data-default-open');
  if (defaultOpen !== 'true') throw new Error('浮動學習工具未預設展開');
  const safeBottom = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom));
  if (safeBottom < 80) throw new Error(`浮動工具安全區不足：${safeBottom}px`);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const animation = await page.locator('.view.active').evaluate(e => getComputedStyle(e).animationName);
  if (animation !== 'none') throw new Error(`減少動態模式仍有動畫：${animation}`);
  await page.locator('.concept-jump a').first().click();
  const anchorClear = await page.evaluate(() => {
    const heading = document.querySelector('#concept-象形').getBoundingClientRect();
    const header = document.querySelector('.topbar').getBoundingClientRect();
    return { headingTop: heading.top, headerBottom: header.bottom, focused: document.activeElement.id };
  });
  if (anchorClear.headingTop < anchorClear.headerBottom || anchorClear.focused !== 'concept-象形') {
    throw new Error(`頁內導覽遭頂欄遮擋或未聚焦：${JSON.stringify(anchorClear)}`);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});
await step('家長陪學：摘要、字級與計時', async () => {
  await page.click('#parentGuideToggle');
  await page.waitForSelector('#parentGuidePanel:not([hidden])');
  const guideText = await page.locator('#parentGuidePanel').textContent();
  if (!guideText.includes('10 分鐘三步驟') || !guideText.includes('220')) throw new Error('陪學指南缺少短流程或進度邊界');
  await page.click('[data-reading-size="large"]');
  const reading = await page.evaluate(() => ({ size: document.documentElement.dataset.readingSize, px: parseFloat(getComputedStyle(document.documentElement).fontSize) }));
  if (reading.size !== 'large' || reading.px < 18) throw new Error(`放大閱讀未生效：${JSON.stringify(reading)}`);
  await page.click('[data-parent-timer]');
  if (!(await page.textContent('[data-parent-timer-status]')).includes('剩下')) throw new Error('10 分鐘計時沒有啟動');
  await page.click('[data-reading-size="normal"]');
  await page.click('[data-parent-next]');
  if (!await page.locator('#view-story').evaluate(e => e.classList.contains('active'))) throw new Error('家長建議未帶到下一步');
  await page.click('#parentGuideToggle');
});
await step('造字故事載入', async () => {
  await page.click('[data-view="story"]');
  await page.waitForSelector('#view-story .story-card h3');
  const n = await page.locator('#view-story h3').count();
  if (n < 7) throw new Error('故事章節只有 ' + n);
  if (await page.locator('.story-chapter:not([hidden])').count() !== 1) throw new Error('故事沒有一次只顯示一卷');
  const navState = await page.evaluate(() => ({
    current: document.querySelectorAll('.tabs [aria-current="page"]').length,
    view: document.querySelector('.tabs [aria-current="page"]')?.dataset.view,
    focus: document.activeElement.id,
    hintVisible: getComputedStyle(document.querySelector('.tab-scroll-hint')).display !== 'none'
  }));
  if (navState.current !== 1 || navState.view !== 'story' || navState.focus !== 'view-story-title' || !navState.hintVisible) {
    throw new Error(`分頁狀態或焦點異常：${JSON.stringify(navState)}`);
  }
});
await step('故事短試煉可進入並作答', async () => {
  await page.click('[data-story-trial]');
  await page.waitForSelector('#journeyPlay .journey-trial .opt');
  await page.locator('#journeyPlay .opt').first().click();
  await page.waitForSelector('#journeyFeedback .feedback');
});
await step('課堂共學：先答、理由、再答', async () => {
  await page.click('[data-view="classroom"]');
  await page.locator('[data-prompt]').first().click();
  await page.locator('input[name="initial"]').first().check();
  await page.locator('input[name="evidence"]').first().check();
  await page.locator('input[name="revised"]').nth(1).check();
  await page.click('#classroomForm button[type="submit"]');
  await page.waitForSelector('#classShowSummary');
  await page.click('#classShowSummary');
  const summary = await page.locator('.classroom-summary').innerText();
  if (!summary.includes('改變不是扣分')) throw new Error('共學彙整缺少修正導向');
});
await step('字例總覽＋開字卡', async () => {
  await page.click('[data-view="browse"]');
  await page.waitForSelector('.char-tile');
  const n = await page.locator('.char-tile').count();
  if (n < 150) throw new Error('字例只有 ' + n);
  const names = await page.locator('#fCat, #fLv, #fQ').evaluateAll(nodes => nodes.map(n => n.labels?.[0]?.textContent.trim() || ''));
  if (names.some(name => !name)) throw new Error(`篩選器缺少標籤：${names.join('/')}`);
  await page.selectOption('#fCat', '形聲');
  const filtered = await page.locator('.char-tile').count();
  const announced = await page.locator('#filterCount').textContent();
  if (!announced.includes(String(filtered))) throw new Error(`篩選結果未同步：${announced}/${filtered}`);
  const firstTile = page.locator('.char-tile').first();
  if (await firstTile.evaluate(e => e.tagName) !== 'BUTTON') throw new Error('字例不是原生按鈕');
  await firstTile.focus();
  const outline = await firstTile.evaluate(e => getComputedStyle(e).outlineWidth);
  if (parseFloat(outline) < 3) throw new Error(`鍵盤焦點環不足：${outline}`);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.char-detail[role="dialog"][aria-modal="true"]');
  const illustration = await page.locator('.char-detail .char-illustration img').evaluate(img => ({
    src: img.getAttribute('src'), alt: img.getAttribute('alt'), width: img.naturalWidth, height: img.naturalHeight
  }));
  if (!illustration.src?.startsWith('img/chars/') || !illustration.alt?.includes('教學情境圖')) throw new Error(`字卡配圖語意不完整：${JSON.stringify(illustration)}`);
  if (illustration.width * 9 !== illustration.height * 16) throw new Error(`字卡配圖不是 16:9：${illustration.width}x${illustration.height}`);
  const closeSize = await page.locator('.dialog-close-icon').evaluate(button => button.getBoundingClientRect().width);
  if (closeSize < 44) throw new Error(`字卡頂端關閉按鈕不足 44px：${closeSize}`);
  if (!await page.locator('.char-detail .evidence-block').count()) throw new Error('字卡沒有分類證據');
  if (await page.locator('.char-detail .evidence-source, .char-detail .evidence-quote').count()) throw new Error('學生字卡仍顯示外部原文或來源');
  if (!await page.locator('.dialog-close-icon').evaluate(e => e === document.activeElement)) throw new Error('dialog 開啟後未移入頂端關閉按鈕');
  await page.keyboard.press('Escape');
  if (await page.locator('.char-detail').count()) throw new Error('Escape 未關閉 dialog');
  if (!await firstTile.evaluate(e => e === document.activeElement)) throw new Error('dialog 關閉後未恢復焦點');
  await page.evaluate(() => LSApp.showChar('c0198'));
  if (await page.locator('.char-detail').innerText().then(text => text.includes('校核入口') || text.includes('條文節錄'))) throw new Error('待核字卡洩出內部校核資料');
  await page.keyboard.press('Escape');
});
await step('閃卡：翻面＋評分', async () => {
  await page.click('[data-view="flash"]');
  await page.click('#flashStart');
  await page.click('#fcard');
  await page.waitForSelector('.grade-row');
  const contrast = await page.locator('.grade-row .hard').evaluate(e => {
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = value => {
      const c = rgb(value).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
      return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
    };
    const style = getComputedStyle(e), a = lum(style.color), b = lum(style.backgroundColor);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  });
  if (contrast < 4.5) throw new Error(`「模糊」按鈕對比不足：${contrast.toFixed(2)}`);
  await page.click('.grade-row .good');
  await page.waitForSelector('#fcard .headchar');
});
await step('自測：作答一題含回饋', async () => {
  await page.click('[data-view="quiz"]');
  await page.click('#quizStart');
  await page.waitForSelector('#quizArea .opt');
  await page.locator('#quizArea .opt').first().click();
  await page.waitForSelector('#qFb .feedback');
  const nonColorCue = await page.locator('#quizArea .opt.correct').evaluate(e => getComputedStyle(e, '::after').content);
  if (!nonColorCue.includes('正確答案')) throw new Error(`正確選項缺少非顏色提示：${nonColorCue}`);
  await page.click('#qNext');
  await page.waitForSelector('#quizArea .opt');
});
await step('對戰：挑戰第一位大師＋作答', async () => {
  await page.click('[data-view="battle"]');
  await page.waitForSelector('.master-card');
  await page.locator('.master-card .btn').first().click();
  await page.waitForSelector('.battle-arena .fighter-player');
  const mobileSizing = await page.evaluate(() => ({
    exitHeight: document.querySelector('.arena-exit').getBoundingClientRect().height,
    detailFont: parseFloat(getComputedStyle(document.querySelector('.fighter-detail')).fontSize)
  }));
  if (mobileSizing.exitHeight < 44 || mobileSizing.detailFont < 12) throw new Error(`對戰手機尺寸不足：${JSON.stringify(mobileSizing)}`);
  const fighters = await page.locator('.battle-arena .fighter').count();
  if (fighters !== 2) throw new Error(`對戰角色數=${fighters}`);
  const [playerBox, enemyBox] = await Promise.all([
    page.locator('.fighter-player').boundingBox(),
    page.locator('.fighter-enemy').boundingBox()
  ]);
  if (!playerBox || !enemyBox || playerBox.x >= enemyBox.x) throw new Error('雙方角色未呈左右對峙');
  await page.waitForSelector('#battleArea .opt');
  await page.locator('#battleArea .opt').first().click();
  await page.waitForSelector('#bFb .feedback');
  const hpValues = await page.locator('.battle-arena [role="progressbar"]').evaluateAll(nodes => nodes.map(n => Number(n.getAttribute('aria-valuenow'))));
  if (!hpValues.some(v => v < 100)) throw new Error(`作答後氣力未更新：${hpValues.join('/')}`);
  await page.click('#bNext');
  await page.waitForSelector('#battleArea .opt');
});
await step('戰績＋安全備份匯入', async () => {
  await page.click('[data-view="stats"]');
  await page.waitForSelector('.stat-cell');
  await page.click('#btnExport');
  const v = await page.inputValue('#ioBox');
  if (!v.includes('"cards"')) throw new Error('匯出內容異常');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#btnDownload')
  ]);
  if (!download.suggestedFilename().endsWith('.json')) throw new Error('下載檔不是 JSON');
  await page.setInputFiles('#backupFile', {
    name: 'liushu-test.json', mimeType: 'application/json', buffer: Buffer.from(v)
  });
  await page.waitForSelector('#backupStatus');
  if (!(await page.textContent('#backupStatus')).includes('已匯入')) throw new Error('選檔匯入沒有成功回饋');
  await page.fill('#ioBox', '{"schemaVersion":99,"cards":{},"quiz":{}}');
  await page.click('#btnImport');
  if (!(await page.textContent('#backupStatus')).includes('不支援的存檔版本')) throw new Error('未拒絕未來版本存檔');
  const storageWarning = await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('測試用配額不足'); };
    LSStore.persist();
    Storage.prototype.setItem = original;
    const warning = document.querySelector('#storageWarning');
    return { hidden: warning.hidden, text: warning.textContent };
  });
  if (storageWarning.hidden || !storageWarning.text.includes('測試用配額不足')) throw new Error('儲存失敗沒有可見警示');
});
await step('390px 不橫向跑版', async () => {
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  if (w > 395) throw new Error(`scrollWidth=${w}`); // 留 5px 容差防 headless 假溢出
});
await step('桌機導覽與內容寬度', async () => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.click('[data-view="concept"]');
  const desktop = await page.evaluate(() => {
    const tabs = document.querySelector('.tabs');
    const main = document.querySelector('main').getBoundingClientRect();
    return {
      tabsOverflow: tabs.scrollWidth - tabs.clientWidth,
      mainWidth: main.width,
      jumpPosition: getComputedStyle(document.querySelector('.concept-jump')).position
    };
  });
  if (desktop.tabsOverflow > 1 || desktop.mainWidth > 880 || desktop.jumpPosition !== 'sticky') {
    throw new Error(`桌機版面異常：${JSON.stringify(desktop)}`);
  }
});

await browser.close();
server.close();

if (errors.length) {
  console.error(`\n❌ smoke 失敗（${errors.length}）：`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
console.log('\n✅ smoke 全數通過');
