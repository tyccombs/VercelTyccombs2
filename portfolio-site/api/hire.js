// Vercel serverless function: emails Ty the hire-me answers through Resend.
// Env (Vercel project settings): RESEND_API_KEY (required), HIRE_TO (Ty's address, required),
// HIRE_FROM (optional, a sender on a domain verified in Resend; defaults to Resend's test sender).
const TYPES = ['Music Video', 'Social Media Campaign', 'Commercial/Ad Campaign', 'Documentary/Narrative'];
const LIMITS = { first: 80, last: 80, company: 160, email: 200, project: 300, link: 1000, due: 20, goal: 5000, budget: 40, references: 5000, other: 5000 };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed.' }); }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Bad request.' });

  // Spam guards: a hidden field people never see, and bots that submit instantly.
  const started = Number(body.t);
  if (clean(body.website, 200) || (started && Date.now() - started < 3000)) return res.status(200).json({ ok: true });

  const f = {};
  for (const [k, max] of Object.entries(LIMITS)) f[k] = clean(body[k], max);
  const types = (Array.isArray(body.types) ? body.types : []).filter((t) => TYPES.includes(t));

  if (!f.first || !f.last) return res.status(400).json({ error: 'Please add your first and last name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return res.status(400).json({ error: 'Please add a valid email.' });
  if (f.link && !/^https?:\/\//i.test(f.link)) f.link = 'https://' + f.link;

  const { RESEND_API_KEY, HIRE_TO, HIRE_FROM } = process.env;
  if (!RESEND_API_KEY || !HIRE_TO) { console.error('hire: RESEND_API_KEY or HIRE_TO not set'); return res.status(500).json({ error: 'The form isn’t set up yet.' }); }

  const name = `${f.first} ${f.last}`;
  const due = f.due && /^\d{4}-\d{2}-\d{2}$/.test(f.due)
    ? new Date(f.due + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : f.due;
  const rows = [
    ['Your name', name],
    ['Artist / company name', f.company],
    ['Email', f.email],
    ["What's the project called?", f.project],
    ['What type of video or film are we making?', types.join(', ')],
    ['Song, script, treatment or documents', f.link],
    ['Due date', due],
    ['Goal for this project', f.goal],
    ['Budget', f.budget ? '$' + f.budget.replace(/^\$\s*/, '') : ''],
    ['References', f.references],
    ['Anything else', f.other],
  ];

  const linkify = (s) => esc(s).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}">${u}</a>`);
  const html = `<div style="font:15px/1.5 Helvetica,Arial,sans-serif;color:#111;max-width:640px">
<h2 style="margin:0 0 4px;font-size:20px">New hire-me request: ${esc(name)}</h2>
<p style="margin:0 0 20px;color:#666">From ouchpictures.com/hire-me. Reply to this email to answer ${esc(f.first)} directly.</p>
${rows.map(([q, a]) => `<p style="margin:0 0 16px"><b style="display:block;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#666">${esc(q)}</b>${a ? linkify(a).replace(/\n/g, '<br>') : '<span style="color:#aaa">(blank)</span>'}</p>`).join('\n')}
</div>`;
  const text = rows.map(([q, a]) => `${q}\n${a || '(blank)'}\n`).join('\n');

  const subject = `Hire me: ${name}${f.project ? ' / ' + f.project : f.company ? ' / ' + f.company : ''}`.replace(/[\r\n]+/g, ' ').slice(0, 180);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: HIRE_FROM || 'Ouch Pictures <onboarding@resend.dev>',
      to: HIRE_TO.split(',').map((s) => s.trim()).filter(Boolean),
      reply_to: `${name.replace(/[<>"\r\n]/g, '')} <${f.email}>`,
      subject,
      html,
      text,
    }),
  });
  if (!r.ok) { console.error('hire: resend', r.status, await r.text()); return res.status(502).json({ error: 'That didn’t send.' }); }
  return res.status(200).json({ ok: true });
};
