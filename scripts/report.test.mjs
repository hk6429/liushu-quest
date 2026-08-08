#!/usr/bin/env node
import assert from 'node:assert/strict';
import { formatMessage, handleReportRequest, resetRateLimitForTests } from '../functions/api/report.js';

const ORIGIN = 'https://liushu-quest.pages.dev';
const body = {
  issueType: 'question', note: '轉注題目缺少成對字例', website: '', reportId: 'liushu-test-001',
  context: { view: 'quiz', path: '/#quiz', question: '考與老如何互訓？', options: ['形聲', '轉注'], char: '', story: '', viewport: '390x844', userAgent: 'Test Browser' }
};
const request = (payload = body, init = {}) => new Request('https://liushu-quest.pages.dev/api/report', {
  method: init.method || 'POST',
  headers: { Origin: init.origin || ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': init.ip || '203.0.113.10' },
  body: (init.method || 'POST') === 'POST' ? JSON.stringify(payload) : undefined
});

let passed = 0;
async function test(name, fn) {
  resetRateLimitForTests();
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (error) { console.error(`  ✗ ${name}`); throw error; }
}

await test('Telegram 訊息保存題目、選項、定位與裝置情境', async () => {
  const message = formatMessage(body);
  assert.match(message, /六書造字堂・問題回報/);
  assert.match(message, /考與老如何互訓/);
  assert.match(message, /形聲｜轉注/);
  assert.match(message, /quiz｜\/#quiz/);
  assert.match(message, /390x844/);
});

await test('OPTIONS 回應正確 CORS，未知來源被拒絕', async () => {
  const options = await handleReportRequest(request(null, { method: 'OPTIONS', origin: 'https://liushu-quest.netlify.app' }), {});
  assert.equal(options.status, 204);
  assert.equal(options.headers.get('Access-Control-Allow-Origin'), 'https://liushu-quest.netlify.app');
  const denied = await handleReportRequest(request(body, { origin: 'https://evil.example' }), {});
  assert.equal(denied.status, 403);
});

await test('拒絕錯誤方法、未知類型與過短說明', async () => {
  assert.equal((await handleReportRequest(request(null, { method: 'GET' }), {})).status, 405);
  assert.equal((await handleReportRequest(request({ ...body, issueType: 'unknown' }), {})).status, 400);
  assert.equal((await handleReportRequest(request({ ...body, note: '太短' }), {})).status, 400);
});

await test('蜜罐命中時靜默成功且不呼叫 Telegram', async () => {
  let called = false;
  const response = await handleReportRequest(request({ ...body, website: 'spam.example' }), {}, async () => { called = true; });
  assert.equal(response.status, 200);
  assert.equal(called, false);
});

await test('缺少伺服器密鑰時明確回 503', async () => {
  const response = await handleReportRequest(request(), {});
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /尚未完成設定/);
});

await test('有效回報只由伺服器使用密鑰送往 Telegram', async () => {
  let telegram;
  const response = await handleReportRequest(request(), { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: '123456' }, async (url, init) => {
    telegram = { url, body: JSON.parse(init.body) };
    return new Response(JSON.stringify({ ok: true, result: { message_id: 321 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, deliveryId: 321 });
  assert.match(telegram.url, /api\.telegram\.org\/bottest-token\/sendMessage/);
  assert.equal(telegram.body.chat_id, '123456');
  assert.match(telegram.body.text, /轉注題目缺少成對字例/);
});

await test('Telegram 拒絕時不假裝成功', async () => {
  const response = await handleReportRequest(request(), { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: '123456' }, async () =>
    new Response(JSON.stringify({ ok: false, description: 'Bad Request' }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
  assert.equal(response.status, 502);
  assert.equal((await response.json()).ok, false);
});

await test('Telegram 網路中斷時回報失敗，不讓例外逸出', async () => {
  const response = await handleReportRequest(request(), { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: '123456' }, async () => {
    throw new Error('network unavailable');
  });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).ok, false);
});

await test('每個來源 IP 十分鐘最多六次', async () => {
  const env = { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: '123456' };
  const fetchImpl = async () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  for (let i = 0; i < 6; i++) assert.equal((await handleReportRequest(request({ ...body, reportId: `report-${i}` }), env, fetchImpl)).status, 200);
  assert.equal((await handleReportRequest(request({ ...body, reportId: 'report-7' }), env, fetchImpl)).status, 429);
});

console.log(`\n✅ report ${passed}/${passed} 通過`);
