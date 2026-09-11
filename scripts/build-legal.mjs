// Сборка /legal/ из единственного источника текстов — `uniqore-docs/legal/`
// (P163, спека uniqore-docs/desktop-cto/specs/legal-acceptance.md).
//
//   node scripts/build-legal.mjs            — источник ../uniqore-docs/legal
//   UNIQORE_LEGAL_DIR=/путь node scripts/build-legal.mjs
//
// Пишет legal/index.html, legal/<code>/index.html и legal/<code>/<code>.md —
// байт-в-байт файл из manifest, чтобы sha256 сходился с manifest и сервером
// (POST /admin/legal/publish получает те же байты). Нав и футер берутся из
// index.html этого репозитория при сборке — второй копии хрома нет.
//
// Адреса без версии (/legal/offer/): новая редакция замещает текст на месте,
// у старого текста публичного адреса не остаётся. Старые редакции живут
// только в uniqore-docs/legal/*/Old/ и в снимках акцептов на сервере.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const site = fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim(); // uniqore.kz | uniqore.ai
const isKz = site.endsWith('.kz');
const lang = isKz ? 'ru' : 'en';
const legalDir = process.env.UNIQORE_LEGAL_DIR || path.join(root, '..', 'uniqore-docs', 'legal');
const manifest = JSON.parse(fs.readFileSync(path.join(legalDir, 'manifest.json'), 'utf8'));
const docs = manifest.documents.filter((d) => d.lang === lang);
if (docs.length === 0) throw new Error(`в manifest нет редакций на языке ${lang}`);

const T = isKz
  ? {
      title: 'Юридические документы — Uniqore',
      h1: 'Юридические документы',
      lead: 'Действующие условия использования Uniqore. Каждый документ — с версией, датой редакции и датой вступления в силу; прежние редакции не публикуются.',
      version: 'Версия',
      edition: 'Редакция от',
      effective: 'Вступает в силу',
      source: 'Исходный текст (Markdown)',
      back: '← Все документы',
      print: 'Распечатать',
      description: (d) => `${d.title}. Версия ${d.version}, вступает в силу ${human(d.effective_date)}.`,
    }
  : {
      title: 'Legal documents — Uniqore',
      h1: 'Legal documents',
      lead: 'The current Uniqore terms. Every document carries its version, edition date and effective date; previous editions are not published.',
      version: 'Version',
      edition: 'Edition of',
      effective: 'Effective from',
      source: 'Source text (Markdown)',
      back: '← All documents',
      print: 'Print',
      description: (d) => `${d.title}. Version ${d.version}, effective from ${human(d.effective_date)}.`,
    };

const MONTHS = isKz
  ? ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
  : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function human(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return isKz ? `${d} ${MONTHS[m - 1]} ${y} года` : `${d} ${MONTHS[m - 1]} ${y}`;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) =>
  esc(s)
    .replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1">$1</a>')
    .replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>');

/** Минимальный Markdown → HTML: заголовки, абзацы, списки, таблица, перенос
 *  двумя пробелами. Ровно то, что есть в документах; сторож — сама сборка. */
function render(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const para = [];
  const flush = () => {
    if (para.length) {
      out.push(`<p>${para.map((l) => (l.endsWith('  ') ? inline(l.trimEnd()) + '<br/>' : inline(l))).join('\n')}</p>`);
      para.length = 0;
    }
  };
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { flush(); i++; continue; }
    if (line.startsWith('# ')) { flush(); out.push(`<h1>${inline(line.slice(2))}</h1>`); i++; continue; }
    if (line.startsWith('## ')) { flush(); out.push(`<h2>${inline(line.slice(3))}</h2>`); i++; continue; }
    if (line.startsWith('- ')) {
      flush();
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) items.push(`<li>${inline(lines[i].slice(2))}</li>`), i++;
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (line.startsWith('|')) {
      flush();
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i]), i++;
      const cells = (r) => r.split('|').slice(1, -1).map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      out.push(
        `<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table>`,
      );
      continue;
    }
    para.push(line);
    i++;
  }
  flush();
  return out.join('\n');
}

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const pick = (re, what) => {
  const m = index.match(re);
  if (!m) throw new Error(`в index.html не найден ${what}`);
  return m[0];
};
const nav = pick(/<nav>[\s\S]*?<\/nav>/, '<nav>');
const footer = pick(/<footer>[\s\S]*?<\/footer>/, '<footer>');
const fonts = pick(/<link rel="preconnect"[\s\S]*?family=Inter[^>]*>/, 'шрифты');
const icons = pick(/<link rel="icon" href="\/favicon\.ico[\s\S]*?<meta name="theme-color"[^>]*>/, 'иконки');
const langHead = isKz ? pick(/<script>\n\(function\(\)\{[\s\S]*?uniqore-language[\s\S]*?\}\)\(\);\n<\/script>/, 'язык') + '\n<link rel="stylesheet" href="/assets/language.css?v=2"/>' : '<script>document.documentElement.lang="en-US";document.documentElement.dataset.language="en";document.documentElement.classList.add("i18n-ready");</script>';
const siteCss = pick(/<link rel="stylesheet" href="\/assets\/site\.css[^>]*>/, 'site.css');
const scripts = index.match(/<script src="\/assets\/(contact|i18n|region)\.js[^>]*><\/script>/g) || [];

const STYLE = `<style>
/* ── страничное: /legal/ ── */
.legal{max-width:760px;margin:0 auto;padding:40px 24px 60px}
.legal h1{font-size:28px;letter-spacing:-.02em;line-height:1.2;margin:0 0 12px}
.legal h2{font-size:18px;letter-spacing:-.01em;margin:30px 0 10px}
.legal p,.legal li{font-size:15px;line-height:1.65;color:var(--ink-2)}
.legal p{margin:0 0 12px}
.legal ul{margin:0 0 12px;padding-left:22px}
.legal li{margin:4px 0}
.legal a{color:var(--violet);text-decoration:underline;text-underline-offset:2px}
.legal-meta{display:flex;flex-wrap:wrap;gap:8px 18px;margin:0 0 24px;padding:12px 16px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.6);font-size:13px;color:var(--ink-3);font-weight:600}
.legal-meta b{color:var(--ink)}
.legal-list{list-style:none;margin:24px 0 0;padding:0;display:grid;gap:14px}
.legal-list li{border:1px solid var(--line);border-radius:14px;padding:16px 18px;background:rgba(255,255,255,.6)}
.legal-list a.t{font-size:17px;font-weight:800;color:var(--ink);text-decoration:none}
.legal-list a.t:hover{color:var(--violet)}
.legal-list .m{margin-top:6px;font-size:13px;color:var(--ink-3);font-weight:600}
.legal-actions{display:flex;gap:14px;flex-wrap:wrap;margin:28px 0 0;font-size:13px;font-weight:700}
.legal table{width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:13.5px;line-height:1.45}
.legal th,.legal td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top;color:var(--ink-2)}
.legal th{background:rgba(255,255,255,.7);color:var(--ink);font-weight:700}
.legal .tbl{overflow-x:auto}
@media print{nav,footer,.legal-actions{display:none}.legal{padding:0;max-width:none}.legal p,.legal li{color:#000}}
</style>`;

function head({ title, description, pathname }) {
  const canonical = `https://${site}${pathname}`;
  const kz = `https://uniqore.kz${pathname}`;
  const ai = `https://uniqore.ai${pathname}`;
  return `<!doctype html>
<html lang="${isKz ? 'ru' : 'en-US'}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
${langHead}
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
${fonts}
${siteCss}
<link rel="canonical" href="${canonical}"/>
<link rel="alternate" hreflang="ru" href="${kz}"/>
<link rel="alternate" hreflang="kk" href="${kz}?lang=kk"/>
<link rel="alternate" hreflang="en" href="${ai}"/>
<link rel="alternate" hreflang="x-default" href="${isKz ? kz : ai}"/>
${icons}
<meta property="og:url" content="${canonical}"/>
<meta property="og:type" content="article"/>
${STYLE}
</head>
<body>
<script>document.documentElement.classList.add('js');</script>

${nav}
`;
}
const tail = `
${footer}

${scripts.join('\n')}
</body>
</html>
`;

const outDir = path.join(root, 'legal');
fs.mkdirSync(outDir, { recursive: true });

const listItems = docs
  .map(
    (d) => `      <li>
        <a class="t" href="/legal/${d.code}/">${esc(d.title)}</a>
        <div class="m">${T.version} ${d.version} · ${T.edition} ${human(d.edition_date)} · ${T.effective} ${human(d.effective_date)}</div>
      </li>`,
  )
  .join('\n');
fs.writeFileSync(
  path.join(outDir, 'index.html'),
  head({ title: T.title, description: T.lead, pathname: '/legal/' }) +
    `<main class="legal">
  <h1>${T.h1}</h1>
  <p>${T.lead}</p>
  <ul class="legal-list">
${listItems}
  </ul>
</main>
` +
    tail,
);

for (const d of docs) {
  const src = fs.readFileSync(path.join(legalDir, d.file));
  const sha = createHash('sha256').update(src).digest('hex');
  if (sha !== d.sha256) throw new Error(`${d.file}: sha256 ${sha} ≠ manifest ${d.sha256} — сначала legal-check.mjs --write`);
  const md = src.toString('utf8');
  const expectedHead = `# ${d.title}\n`;
  if (!md.startsWith(expectedHead)) throw new Error(`${d.file}: заголовок не совпадает с manifest`);
  // Шапка (версия/даты) уже в блоке .legal-meta — из текста её не дублируем.
  const body = md.split('\n').slice(1).join('\n').replace(/^\n+/, '').replace(/^.*\n.*\n.*\n/, '');
  const dir = path.join(outDir, d.code);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${d.code}.md`), src);
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    head({ title: `${d.title} — Uniqore`, description: T.description(d), pathname: `/legal/${d.code}/` }) +
      `<main class="legal">
  <h1>${esc(d.title)}</h1>
  <div class="legal-meta"><span>${T.version} <b>${d.version}</b></span><span>${T.edition} <b>${human(d.edition_date)}</b></span><span>${T.effective} <b>${human(d.effective_date)}</b></span></div>
  <div class="tbl">
${render(body)}
  </div>
  <div class="legal-actions"><a href="/legal/">${T.back}</a><a href="/legal/${d.code}/${d.code}.md">${T.source}</a><a href="#" onclick="window.print();return false;">${T.print}</a></div>
</main>
` +
      tail,
  );
  console.log(`legal/${d.code}/ ← ${d.file} (${d.version}, sha ${sha.slice(0, 12)}…)`);
}
console.log(`legal/index.html: ${docs.length} документов, ${site}`);
