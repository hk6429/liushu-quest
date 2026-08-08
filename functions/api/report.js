const DEFAULT_ORIGINS = new Set([
  'https://liushu-quest.pages.dev',
  'https://liushu-quest.netlify.app'
]);
const ISSUE_LABELS = {
  classification: '字例分類或文字學內容', pronunciation: '注音或讀音', question: '題目、選項或答案',
  story: '故事或教學說明', interface: '介面或功能異常', accessibility: '閱讀或無障礙問題', other: '其他問題'
};
const attempts = new Map();

export function clean(value, max = 800) {
  return String(value == null ? '' : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

function cleanList(value, count = 8, max = 180) {
  return Array.isArray(value) ? value.slice(0, count).map(item => clean(item, max)).filter(Boolean) : [];
}

export function formatMessage(input) {
  const p = input || {};
  const c = p.context && typeof p.context === 'object' ? p.context : {};
  const options = cleanList(c.options);
  return [
    '🚩 六書造字堂・問題回報', '',
    `類型：${ISSUE_LABELS[p.issueType] || ISSUE_LABELS.other}`,
    `說明：${clean(p.note, 800) || '未提供'}`,
    clean(c.char, 120) ? `字例：${clean(c.char, 120)}` : '',
    clean(c.question, 800) ? `題目：${clean(c.question, 800)}` : '',
    options.length ? `選項：${options.join('｜')}` : '',
    clean(c.story, 200) ? `故事：${clean(c.story, 200)}` : '',
    `頁面：${clean(c.view, 40) || '未知'}｜${clean(c.path, 300)}`,
    `裝置：${clean(c.viewport, 30)}｜${clean(c.userAgent, 300)}`,
    `回報編號：${clean(p.reportId, 80) || '未提供'}`
  ].filter(Boolean).join('\n').slice(0, 3900);
}

function allowedOrigins(env) {
  const extras = clean(env.REPORT_ALLOWED_ORIGINS || '', 1000).split(',').map(value => value.trim()).filter(Boolean);
  return new Set([...DEFAULT_ORIGINS, ...extras]);
}

function isLocalOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function responseHeaders(request, env) {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  const origin = clean(request.headers.get('Origin'), 300);
  if (allowedOrigins(env).has(origin) || isLocalOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  return headers;
}

function json(request, env, status, payload) {
  return new Response(JSON.stringify(payload), { status, headers: responseHeaders(request, env) });
}

function rateLimited(request) {
  const now = Date.now();
  const ip = clean(request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown', 80).split(',')[0];
  const recent = (attempts.get(ip) || []).filter(time => now - time < 10 * 60 * 1000);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > 6;
}

export async function handleReportRequest(request, env = {}, fetchImpl = fetch) {
  if (request.method === 'OPTIONS') {
    const headers = responseHeaders(request, env); headers.delete('Content-Type');
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== 'POST') return json(request, env, 405, { ok: false, error: '僅接受 POST' });
  const origin = clean(request.headers.get('Origin'), 300);
  if (origin && !allowedOrigins(env).has(origin) && !isLocalOrigin(origin)) return json(request, env, 403, { ok: false, error: '不允許的來源' });
  if (Number(request.headers.get('Content-Length') || 0) > 20000) return json(request, env, 413, { ok: false, error: '回報內容過長' });
  if (rateLimited(request)) return json(request, env, 429, { ok: false, error: '回報太頻繁，請稍候再試' });

  let body;
  try { body = await request.json(); }
  catch { return json(request, env, 400, { ok: false, error: '回報資料格式錯誤' }); }
  if (clean(body.website, 120)) return json(request, env, 200, { ok: true });
  if (!ISSUE_LABELS[body.issueType] || clean(body.note, 800).length < 5) return json(request, env, 400, { ok: false, error: '請選擇問題類型，並至少說明 5 個字' });

  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return json(request, env, 503, { ok: false, error: '教師回報系統尚未完成設定' });
  let telegramResponse;
  try {
    telegramResponse = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: formatMessage(body), disable_web_page_preview: true })
    });
  } catch (error) {
    console.error('Telegram report delivery unavailable', error instanceof Error ? error.message : 'unknown');
    return json(request, env, 502, { ok: false, error: '回報暫時無法送出，請稍後再試' });
  }
  const result = await telegramResponse.json().catch(() => ({}));
  if (!telegramResponse.ok || !result.ok) {
    console.error('Telegram report delivery failed', telegramResponse.status, result.description || 'unknown');
    return json(request, env, 502, { ok: false, error: '回報暫時無法送出，請稍後再試' });
  }
  return json(request, env, 200, { ok: true, deliveryId: result.result?.message_id || null });
}

export function onRequest(context) {
  return handleReportRequest(context.request, context.env);
}

export function resetRateLimitForTests() { attempts.clear(); }
