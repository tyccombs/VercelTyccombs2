// Generates the static site into portfolio-site/. Run: node site-src/build.mjs
// To add a project: add an entry to projects.json and a thumbnail at
// portfolio-site/assets/thumbs/<slug>.jpg, then run this and commit the output.
// To give a record a clip: put a short silent MP4 in assets/clips/ and set `clip`.
// gear.html is not touched here: its gear list comes from the Obsidian "Gear List" note via site-src/build-gear.mjs.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'portfolio-site');
const projects = JSON.parse(readFileSync(join(here, 'projects.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (i) => String(i + 1).padStart(2, '0');
const label = (p) => (p.artist ? `${p.artist} '${p.title}'` : p.title);

// Filters group the types.
const GROUPS = { 'Music Video': 'Music Videos', 'Lyric Video': 'Music Videos', Live: 'Live', Documentary: 'Documentary', Commercial: 'Commercial' };
const FILTERS = ['All', 'Music Videos', 'Live', 'Documentary', 'Commercial'];

const page = ({ title, description, body, root = '', bodyClass = '', head = '', script = '' }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="stylesheet" href="${root}assets/site.css">${head}
</head>
<body class="${bodyClass}">
<header class="site-head">
  <a href="${root}index.html" class="site-logo" aria-label="Ouch Pictures, home"><img src="${root}Ouchpictures_white.png" alt="Ouch!"></a>
  <nav>
    <a href="${root}index.html#work">Work</a>
    <a href="${root}about.html">About</a>
    <a href="${root}contact.html">Contact</a>
  </nav>
</header>
${body}
<footer class="site-foot">
  <a href="${root}index.html" class="foot-mark" aria-label="Ouch Pictures, home"><img src="${root}Ouchpictures_white.png" alt="Ouch!"></a>
  <div class="foot-row">
    <span>Ouch Pictures</span>
    <a href="https://instagram.com/tyccombs" target="_blank" rel="noopener">Instagram</a>
    <a href="https://www.youtube.com/@tyccombs" target="_blank" rel="noopener">YouTube</a>
    <a href="${root}contact.html">Contact</a>
    <span>&copy; ${new Date().getFullYear()}</span>
  </div>
</footer>
<script src="${root}assets/site.js"></script>${script}
</body>
</html>
`;

// Fixed line breaks for spine titles, so growing text never re-wraps as it animates.
const lines = (text, max) => text.split(' ').reduce((out, word) => {
  const last = out[out.length - 1];
  if (last && (last + ' ' + word).length <= max) out[out.length - 1] = last + ' ' + word;
  else out.push(word);
  return out;
}, []);

const home = page({
  title: 'Ouch Pictures | Films by Ty Combs',
  description: 'Ouch Pictures: music videos, short films, documentaries and commercials by Ty Combs.',
  bodyClass: 'home',
  head: '\n<link rel="stylesheet" href="assets/jukebox.css">',
  script: '\n<script src="assets/jukebox.js"></script>',
  body: `<main>
<section class="jb-scroll" data-jukebox data-count="${String(projects.length).padStart(2, '0')}">
<span class="jb-anchor" id="work"></span>
<div class="jb">
  <div class="jb-reel">
    <div class="jb-face jb-front">
      <video src="assets/clips/reel.mp4" poster="assets/thumbs/reel-poster.jpg" autoplay muted loop playsinline aria-hidden="true"></video>
    </div>
    <div class="jb-face jb-back"></div>
  </div>
  <h1 class="hero-mark"><img src="Ouchpictures_white.png" alt="Ouch!"></h1>
  <span class="mark tl"><i></i>Ouch Pictures</span>
  <span class="mark tr"><i></i>Films by Ty Combs</span>
  <span class="mark bl"><i></i>(${String(projects.length).padStart(2, '0')}) Projects</span>
  <span class="mark br"><i></i>Scroll</span>
  <div class="jb-body">
    <div class="jb-stage">
${projects.map((p) => `      <a class="jb-card" href="work/${p.slug}.html" data-title="${esc(p.title)}" data-artist="${esc(p.artist ?? '')}" data-type="${esc(p.type)}"${p.clip ? ` data-clip="assets/clips/${p.clip}"` : ''} aria-label="Open ${esc(label(p))}" tabindex="-1">
        <div class="jb-face jb-front">
          <img src="assets/thumbs/${p.slug}.jpg" alt="" decoding="async">
          <div class="jb-info">
            ${p.credits.length ? `<dl>${p.credits.slice(0, 3).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : '<span></span>'}
            <span class="jb-open">View project</span>
          </div>
        </div>
        <div class="jb-face jb-back"></div>
      </a>`).join('\n')}
    </div>
    <div class="jb-row" role="group" aria-label="Projects">
${projects.map((p, i) => `      <button type="button" class="jb-spine" aria-label="${esc(label(p))}">
        <span class="jb-plate">
          <img src="assets/thumbs/${p.slug}.jpg" alt="" decoding="async">
          <b>${num(i)}</b>
          <span class="jb-text">${p.artist ? lines(p.artist, 18).map((l) => `<i>${esc(l)}</i>`).join('') : ''}${lines(p.title, 18).map((l) => `<strong>${esc(l)}</strong>`).join('')}</span>
        </span>
      </button>`).join('\n')}
    </div>
  </div>
  <div class="jb-now" aria-live="polite">
    <span class="tiny jb-meta"></span>
    <h2 class="jb-title"></h2>
  </div>
</div>
</section>

<section class="index">
  <h2 class="tiny">Index</h2>
  <div class="filters" role="group" aria-label="Filter projects">
${FILTERS.map((f, i) => `    <button type="button" data-filter="${esc(f)}"${i === 0 ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"'}>${esc(f)}</button>`).join('\n')}
  </div>
  <ol>
${projects.map((p, i) => `    <li class="reveal" data-group="${esc(GROUPS[p.type] ?? '')}"><a href="work/${p.slug}.html"><span>(${num(i)})</span><strong>${esc(p.artist ? `${p.artist}, ${p.title}` : p.title)}</strong><em>${esc(p.type)}</em></a></li>`).join('\n')}
  </ol>
</section>
</main>`,
});

const project = (p, i) => {
  const next = projects[(i + 1) % projects.length];
  const credits = p.credits.length
    ? `<dl class="credits reveal">${p.credits.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`
    : '';
  const out_ = p.link ? `<a class="ext" href="${esc(p.link[1])}" target="_blank" rel="noopener">${esc(p.link[0])}</a>` : '';
  const note = p.note || out_ ? `<div class="note reveal">${p.note ? `<p>${esc(p.note)}</p>` : ''}${out_}</div>` : '';
  const stills = (p.stills ?? []).length
    ? `<section class="stills">${p.stills.map((f, n) => `<img class="reveal" style="--span:${[7, 5, 5, 7, 12, 6][n % 6]}" src="../assets/stills/${f}" alt="Still from ${esc(p.title)}" loading="lazy">`).join('')}</section>`
    : '';
  return page({
    title: `${label(p)} | Ouch Pictures`,
    description: `${label(p)}, ${p.type.toLowerCase()} by Ouch Pictures.`,
    root: '../',
    bodyClass: 'project',
    body: `<main>
<section class="p-head">
  <span class="tiny"><b>${num(i)}</b> ${esc(p.type)}${p.artist ? ` / ${esc(p.artist)}` : ''}</span>
  <h1>${esc(p.title)}</h1>
</section>
<section class="p-film" data-grow>
  ${p.noEmbed ? `<a class="player" href="https://www.youtube.com/watch?v=${p.youtube}" target="_blank" rel="noopener" aria-label="Watch ${esc(label(p))} on YouTube">
    <img src="../assets/thumbs/${p.slug}.jpg" alt="">
    <span class="play">Watch</span>
  </a>` : p.youtube ? `<button type="button" class="player" data-yt="${p.youtube}" aria-label="Play ${esc(label(p))}">
    <img src="../assets/thumbs/${p.slug}.jpg" alt="">
    <span class="play">Play</span>
  </button>` : `<div class="player"><img src="../assets/thumbs/${p.slug}.jpg" alt="${esc(label(p))}"></div>`}
</section>
<section class="p-info">
  ${note}
  ${credits}
</section>
${stills}
<a class="p-next" href="${next.slug}.html">
  <span class="tiny">Next</span>
  <strong>${esc(next.title)}</strong>
</a>
</main>`,
  });
};

const about = page({
  title: 'About | Ouch Pictures',
  description: 'About Ouch Pictures and Ty Combs.',
  bodyClass: 'plain',
  body: `<main class="plain-main">
  <h1>About</h1>
  <div class="split">
    <span class="tiny">Ouch Pictures</span>
    <p class="lead">Ouch Pictures is the work of Ty Combs, an editor, director and DP. I make music videos, short films, documentaries and commercials.</p>
  </div>
</main>`,
});

const contact = page({
  title: 'Contact | Ouch Pictures',
  description: 'Get in touch with Ouch Pictures.',
  bodyClass: 'plain',
  body: `<main class="plain-main">
  <h1>Contact</h1>
  <ol class="links">
${[['Work with me', 'hire-me.html'], ['Instagram', 'https://instagram.com/tyccombs'], ['YouTube', 'https://www.youtube.com/@tyccombs'], ['TikTok', 'https://www.tiktok.com/@tyccombs.mp4']]
  .map(([t, u], i) => `    <li><a href="${u}"${u.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}><span>(${num(i)})</span><strong>${t}</strong></a></li>`).join('\n')}
  </ol>
</main>`,
});

// Hire-me form, rebuilt from tyccombs.com/hire-me. Posts to /api/hire, which emails Ty.
// Field names must match portfolio-site/api/hire.js.
const HIRE_TYPES = ['Music Video', 'Social Media Campaign', 'Commercial/Ad Campaign', 'Documentary/Narrative'];
const HIRE_FIELDS = [
  { name: 'name', label: 'Your name', hint: 'What should I call you?', required: true, html: `<div class="hf-pair"><input name="first" autocomplete="given-name" placeholder="First" required aria-label="First name"><input name="last" autocomplete="family-name" placeholder="Last" required aria-label="Last name"></div>` },
  { name: 'company', label: 'Artist / company name', html: `<input id="f-company" name="company" autocomplete="organization">` },
  { name: 'email', label: 'Email', required: true, html: `<input id="f-email" name="email" type="email" autocomplete="email" required>` },
  { name: 'project', label: "What's the project called?", hint: 'Song name or company name works too.', html: `<input id="f-project" name="project">` },
  { name: 'types', label: 'What type of video or film are we making?', group: true, html: `<div class="hf-checks">${HIRE_TYPES.map((t) => `<label><input type="checkbox" name="types" value="${esc(t)}"><span>${esc(t)}</span></label>`).join('')}</div>` },
  { name: 'link', label: 'Link your song, script, treatment or any other important documents', hint: "Don't worry, I won't share this anywhere. If you have multiple links, leave them in the last answer.", html: `<input id="f-link" name="link" type="url" inputmode="url" placeholder="https://">` },
  { name: 'due', label: 'When is the due date for this?', html: `<input id="f-due" name="due" type="date">` },
  { name: 'goal', label: 'What is your goal for this project?', hint: 'Tonally, aesthetically, content-wise, etc.', html: `<textarea id="f-goal" name="goal" rows="3"></textarea>` },
  { name: 'budget', label: 'What is your budget for this?', html: `<div class="hf-money"><span>$</span><input id="f-budget" name="budget" inputmode="decimal"></div>` },
  { name: 'references', label: 'Any references for this project?', hint: 'Feel free to leave links, and be as specific as possible.', html: `<textarea id="f-references" name="references" rows="3"></textarea>` },
  { name: 'other', label: 'Anything else you want to share?', hint: 'Project back story? Homework for me?', html: `<textarea id="f-other" name="other" rows="3"></textarea>` },
];

const hire = page({
  title: 'Hire Me | Ouch Pictures',
  description: 'Tell Ty Combs about yourself and your project.',
  bodyClass: 'plain',
  script: '\n<script src="assets/hire.js"></script>',
  body: `<main class="plain-main">
  <h1>Let's work together</h1>
  <div class="split">
    <span class="tiny">Hire me</span>
    <p class="lead">I'm so glad you want me to be a part of your project! First things first: tell me about yourself, and your project. Spare no detail.</p>
  </div>
  <form class="hire" action="/api/hire" method="post" novalidate>
    <ol>
${HIRE_FIELDS.map((f, i) => `      <li class="hf"${f.group ? ' role="group" aria-labelledby="l-' + f.name + '"' : ''}>
        <span class="hf-n">(${num(i)})</span>
        <div class="hf-q">
          ${f.group || f.name === 'name' ? `<span class="hf-label" id="l-${f.name}">` : `<label class="hf-label" for="f-${f.name}">`}${esc(f.label)}${f.required ? ' <em>*</em>' : ''}${f.group || f.name === 'name' ? '</span>' : '</label>'}
          ${f.hint ? `<span class="hf-hint">${esc(f.hint)}</span>` : ''}
        </div>
        <div class="hf-a">${f.html}</div>
      </li>`).join('\n')}
    </ol>
    <div class="hf-trap" aria-hidden="true"><label>Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label></div>
    <input type="hidden" name="t" value="">
    <div class="hf-send">
      <p class="hf-status" role="status" aria-live="polite"></p>
      <button type="submit">Submit</button>
    </div>
  </form>
  <div class="hire-done" hidden tabindex="-1">
    <p class="lead">Thank you for taking the time to fill that out! I'll email you back soon with next steps.</p>
  </div>
</main>`,
});

const write = (rel, html) => {
  const f = join(out, rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, html);
};

rmSync(join(out, 'work'), { recursive: true, force: true });
write('index.html', home);
write('about.html', about);
write('contact.html', contact);
write('hire-me.html', hire);
projects.forEach((p, i) => write(`work/${p.slug}.html`, project(p, i)));

// Old project URLs keep working.
const redirects = projects
  .filter((p) => p.oldPage)
  .map((p) => ({ source: `/${p.oldPage}`, destination: `/work/${p.slug}`, permanent: true }));
redirects.push({ source: '/sessions', destination: '/', permanent: true });
redirects.push({ source: '/project-phoenix', destination: '/', permanent: true });
writeFileSync(join(out, 'vercel.json'), JSON.stringify({ cleanUrls: true, trailingSlash: false, redirects }, null, 2) + '\n');

const missing = projects.filter((p) => !existsSync(join(out, 'assets/thumbs', `${p.slug}.jpg`)));
if (missing.length) throw new Error('Missing thumbnails: ' + missing.map((p) => p.slug).join(', '));
console.log(`Built ${projects.length} project pages.`);
