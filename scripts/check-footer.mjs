// Сторож футеров и цен (P163): у сайта нет сборки и CI, футер скопирован в
// каждую страницу руками — значит, «во всех ли» проверяет скрипт, а не глаз.
//
//   node scripts/check-footer.mjs
//
// Для каждой страницы из sitemap.xml: ссылки на оба документа, реквизиты
// юрлица, меню региона; и ни следа снятых тарифов.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const site = fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim();
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const paths = [...sitemap.matchAll(/<loc>https:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');

const MUST = ['href="/legal/offer/"', 'href="/legal/privacy/"', '260840038553', 'class="region-menu"', 'data-region="asia"', '+7 777 687 95 77'];
const MUST_NOT = [/\$20(?!\d)/, 'от $20', 'from $20', 'Сердитый минимум', 'Essentials', 'Мне посмотреть', 'Уверенный предприниматель', 'Матёрый бизнесмен', 'онбординг с основателями', 'Founder-led onboarding', 'Uniqore, United States', 'Лимит токенов на ИИ: X', 'токенов на ИИ: 5X', 'токенов на ИИ: 20X', '5× AI', '20× AI', 'Free to try'];

const requiredPaths = ['/', '/download/', '/mission/', '/skills/', '/skills/sales-funnel-analysis/', '/speech-analytics/', '/legal/', '/legal/offer/', '/legal/privacy/'];
let failed = false;
if (paths.length !== requiredPaths.length || new Set(paths).size !== requiredPaths.length || requiredPaths.some(p => !paths.includes(p))) {
  console.log('FAIL sitemap: обязательный состав девяти страниц изменён'); failed = true;
}
const attribute = (tag, name) => tag.match(new RegExp('\\b' + name + '="([^"]*)"'))?.[1];
for (const p of paths) {
  const file = path.join(root, p.endsWith('/') ? `${p}index.html` : p);
  if (!fs.existsSync(file)) { console.log(`FAIL ${p}: файла нет`); failed = true; continue; }
  const html = fs.readFileSync(file, 'utf8');
  const missing = MUST.filter((s) => !html.includes(s));
  const present = MUST_NOT.filter((s) => (s instanceof RegExp ? s.test(html) : html.includes(s)));
  const head = html.match(/<head>[\s\S]*?<\/head>/)?.[0] ?? '';
  const links = [...head.matchAll(/<link\b[^>]*>/g)].map(m => m[0]);
  const expectations = [
    ['canonical', null, `https://${site}${p}`],
    ['alternate', 'ru', `https://uniqore.kz${p}`],
    ['alternate', 'kk', `https://uniqore.kz${p}?lang=kk`],
    ['alternate', 'en', `https://uniqore.ai${p}`],
  ];
  for (const [rel, lang, href] of expectations) {
    const selected = links.filter(tag => attribute(tag,'rel') === rel && (!lang || attribute(tag,'hreflang') === lang));
    if (selected.length !== 1 || attribute(selected[0] ?? '', 'href') !== href) missing.push(`head ${rel}/${lang ?? ''} → ${href}`);
  }
  const lang = site.endsWith('.kz') ? 'ru' : 'en';
  if (/^\/legal\/(offer|privacy)\/$/.test(p) && !html.includes(`<article lang="${lang}" translate="no">`)) missing.push('защищённый текст юридической редакции');
  if (p === '/legal/') {
    for (const code of ['offer','privacy']) if (!html.includes(`<a class="t" href="/legal/${code}/" lang="${lang}" translate="no">`)) missing.push(`язык названия ${code}`);
    if ([...html.matchAll(new RegExp(`<time datetime="[0-9-]+" lang="${lang}" translate="no">`, 'g'))].length !== 4) missing.push('язык дат редакций');
  }
  const ok = missing.length === 0 && present.length === 0;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${p}${missing.length ? ` — нет: ${missing.join(', ')}` : ''}${present.length ? ` — лишнее: ${present.join(', ')}` : ''}`);
  if (!ok) failed = true;
}
for (const p of ['/legal/', '/legal/offer/', '/legal/privacy/']) {
  if (!paths.includes(p)) { console.log(`FAIL sitemap: нет ${p}`); failed = true; }
}
if (/legal\/[a-z]+\/[a-z]+\.md/.test(sitemap)) { console.log('FAIL sitemap: .md не публикуется в sitemap'); failed = true; }
console.log(failed ? `${site}: есть расхождения` : `${site}: футеры и цены на всех ${paths.length} страницах в порядке`);
if (failed) process.exit(1);

// Keep the actual translator regression in the existing shared check command.
if (site === 'uniqore.kz') {
  const env = {...process.env}; delete env.NODE_TEST_CONTEXT;
  const child = spawnSync(process.execPath, ['--test', path.join(root,'scripts/i18n.test.mjs')], {env,stdio:'inherit'});
  if (child.error) throw child.error;
  if (child.status !== 0) process.exit(child.status || 1);
}
