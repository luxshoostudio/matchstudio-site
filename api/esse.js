const DEFAULT_ORIGINS = [
  'https://matchstudio.cn',
  'https://www.matchstudio.cn',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const SYSTEM_PROMPT = `You are Match Studio's AI concierge. Match Studio helps outbound Chinese brands with four capabilities: overseas field production and live, brand marketing, video production, and enterprise AI co-creation.

Answer only within this scope. Do not invent client names, project outcomes, pricing, availability, legal terms, or capabilities that are not provided. Keep claims evidence-bounded. If the visitor needs a specific quote, schedule, or project confirmation, say that the studio team will confirm it by email. Reply in the requested language, using precise, natural Chinese or English. Give one practical next step and ask no more than two clarifying questions. Keep replies concise and useful.`;

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function setCors(req, res) {
  const origin = req.headers.origin;
  const configured = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowed = configured.length ? configured : DEFAULT_ORIGINS;
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function text(value, limit) {
  return String(value == null ? '' : value).trim().slice(0, limit);
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return {};
}

function cleanBrief(value) {
  const brief = value && typeof value === 'object' ? value : {};
  return {
    business: text(brief.business, 80),
    market: text(brief.market, 80),
    content: text(brief.content, 120)
  };
}

function buildPrompt(payload) {
  const language = payload.language === 'en' ? 'en' : 'zh';
  const brief = cleanBrief(payload.brief);
  if (payload.type === 'brief') {
    return `The visitor selected this project brief:\n- Business: ${brief.business}\n- Market: ${brief.market}\n- Content need: ${brief.content}\n\nRespond in ${language === 'en' ? 'precise English' : 'Chinese'}. Summarize the likely next production conversation in 2-4 short sentences, then ask at most two useful follow-up questions.`;
  }
  return `The visitor wrote: ${text(payload.message, 1000)}\n\nTheir optional selections are:\n- Business: ${brief.business || 'not selected'}\n- Market: ${brief.market || 'not selected'}\n- Content need: ${brief.content || 'not selected'}\n\nRespond in ${language === 'en' ? 'precise English' : 'Chinese'}.`;
}

function extractReply(body) {
  if (typeof body.output_text === 'string' && body.output_text.trim()) return body.output_text.trim();
  const output = Array.isArray(body.output) ? body.output : [];
  const chunks = [];
  output.forEach((item) => {
    (Array.isArray(item.content) ? item.content : []).forEach((part) => {
      if (part && part.type === 'output_text' && typeof part.text === 'string') chunks.push(part.text);
    });
  });
  return chunks.join('\n').trim();
}

async function askAgent(payload) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('OPENAI_API_KEY is not configured');
    error.code = 'agent_not_configured';
    throw error;
  }
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5',
      input: [
        { role: 'system', content: [{ type: 'input_text', text: SYSTEM_PROMPT }] },
        { role: 'user', content: [{ type: 'input_text', text: buildPrompt(payload) }] }
      ]
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('OpenAI request failed');
    error.code = 'agent_unavailable';
    throw error;
  }
  const reply = extractReply(body);
  if (!reply) {
    const error = new Error('OpenAI returned no text');
    error.code = 'agent_unavailable';
    throw error;
  }
  return reply;
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

async function sendBriefEmail(payload, reply) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    const error = new Error('Resend is not configured');
    error.code = 'email_not_configured';
    throw error;
  }
  const brief = cleanBrief(payload.brief);
  const recipient = process.env.CONCIERGE_TO_EMAIL || 'Luxshoo.studio@gmail.com';
  const language = payload.language === 'en' ? 'en' : 'zh';
  const subject = `${language === 'en' ? 'Match Studio project brief' : 'Match Studio 项目简报'} · ${brief.business} · ${brief.market}`;
  const html = `<h2>${escapeHtml(subject)}</h2><p><strong>Business / 业务：</strong>${escapeHtml(brief.business)}</p><p><strong>Market / 市场：</strong>${escapeHtml(brief.market)}</p><p><strong>Content / 内容：</strong>${escapeHtml(brief.content)}</p><hr><p><strong>AI concierge / AI 礼宾：</strong></p><p>${escapeHtml(reply).replace(/\n/g, '<br>')}</p>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [recipient],
      subject,
      html
    })
  });
  if (!response.ok) {
    const error = new Error('Resend request failed');
    error.code = 'email_delivery_failed';
    throw error;
  }
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, code: 'method_not_allowed' });
    return;
  }
  try {
    const payload = readBody(req);
    if (!payload || !['chat', 'brief'].includes(payload.type)) {
      sendJson(res, 400, { ok: false, code: 'invalid_request' });
      return;
    }
    if (payload.type === 'chat' && !text(payload.message, 1000)) {
      sendJson(res, 400, { ok: false, code: 'message_required' });
      return;
    }
    const reply = await askAgent(payload);
    if (payload.type === 'brief') {
      await sendBriefEmail(payload, reply);
      sendJson(res, 200, { ok: true, reply, emailSent: true });
      return;
    }
    sendJson(res, 200, { ok: true, reply, emailSent: false });
  } catch (error) {
    const code = error.code || 'concierge_unavailable';
    const status = code === 'email_not_configured' ? 503 : code === 'email_delivery_failed' ? 502 : code === 'agent_not_configured' ? 503 : 500;
    sendJson(res, status, { ok: false, code });
  }
}
