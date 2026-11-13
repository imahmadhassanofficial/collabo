import type { APIRoute } from 'astro';

export const prerender = false;

// Sends a lead to the team by email through Resend.
// Needs env vars: RESEND_API_KEY, LEAD_TO_EMAIL (e.g. info@collaboLLC.com), LEAD_FROM_EMAIL (a verified sender on Resend).

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  const env = (k: string) => import.meta.env[k] ?? process.env[k];
  const apiKey = env('RESEND_API_KEY');
  const to = env('LEAD_TO_EMAIL');
  const from = env('LEAD_FROM_EMAIL');
  if (!apiKey || !to || !from) return json({ error: 'Lead form is not configured yet.' }, 503);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Honeypot: real visitors leave this empty.
  if (clean(body?.website, 100)) return json({ ok: true });

  const name = clean(body?.name, 100);
  const email = clean(body?.email, 200);
  const note = clean(body?.note, 2000);
  const transcript = clean(body?.transcript, 4000);

  if (!name || !EMAIL.test(email)) return json({ error: 'Please add your name and a valid email.' }, 400);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `New website lead: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nProject note:\n${note || '(none)'}\n\nChat transcript:\n${transcript || '(none)'}`,
    }),
  });

  if (!res.ok) {
    console.error('lead send failed', res.status, await res.text());
    return json({ error: 'We could not send your details. Please try the contact form.' }, 502);
  }
  return json({ ok: true });
};
