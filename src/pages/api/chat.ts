import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { getCollection } from 'astro:content';
import { buildSystemPrompt } from '../../lib/chat-knowledge';

export const prerender = false;

const MAX_MESSAGES = 12;        // turns kept per request
const MAX_CHARS = 1000;         // per message
const WINDOW_MS = 10 * 60_000;  // rate-limit window
const MAX_REQUESTS = 20;        // per IP per window

// Simple per-instance limiter. Serverless instances do not share memory, so this is a
// first line of defence; add Vercel KV / Upstash later for a hard global limit.
const hits = new Map<string, number[]>();

// Published Work entries, so the bot can link real demos (/work#slug). Built once per instance.
let systemPrompt: string | null = null;
async function getSystemPrompt() {
  if (systemPrompt) return systemPrompt;
  let list = '';
  try {
    const work = await getCollection('work', ({ data }) => !data.draft);
    list = work
      .map(({ id, data }) => {
        const d: any = data;
        const bits = [d.device, ...(d.adType ?? []), ...(d.technology ?? []), ...(d.industry ?? [])].filter(Boolean).join(', ');
        return `- ${d.title}${d.client && d.client !== d.title ? ` (${d.client})` : ''}: /work#${id}${bits ? ` — ${bits}` : ''}`;
      })
      .join('\n');
  } catch (err) {
    console.error('work list failed', err);
  }
  systemPrompt = buildSystemPrompt(list);
  return systemPrompt;
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_REQUESTS;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: 'Chat is not configured yet.' }, 503);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || 'unknown';
  if (rateLimited(ip)) return json({ error: 'Too many messages. Please try again in a few minutes.' }, 429);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const incoming = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : null;
  if (!incoming || incoming.length === 0) return json({ error: 'Invalid request.' }, 400);

  const messages: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of incoming) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return json({ error: 'Invalid message format.' }, 400);
    }
    const content = m.content.trim().slice(0, MAX_CHARS);
    if (content) messages.push({ role: m.role, content });
  }
  // Conversation must start with a user message and end with one.
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return json({ error: 'Invalid request.' }, 400);
  }

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: import.meta.env.CLAUDE_MODEL ?? process.env.CLAUDE_MODEL ?? 'claude-haiku-5-5',
      max_tokens: 400,
      system: await getSystemPrompt(),
      messages,
    });
    const reply = res.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n')
      .trim();
    return json({ reply: reply || 'Sorry, I could not come up with an answer. Would you like to leave your details for our team?' });
  } catch (err) {
    console.error('chat error', err);
    return json({ error: 'The assistant is unavailable right now. Please try again shortly.' }, 502);
  }
};
