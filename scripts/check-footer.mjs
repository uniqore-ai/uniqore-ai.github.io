// Сторож футеров и цен (P163): у сайта нет сборки и CI, футер скопирован в
// каждую страницу руками — значит, «во всех ли» проверяет скрипт, а не глаз.
//
//   node scripts/check-footer.mjs
//
// Для каждой страницы из sitemap.xml: ссылки на оба документа, реквизиты
// юрлица, меню региона; и ни следа снятых тарифов.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const site = fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim();
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const paths = [...sitemap.matchAll(/<loc>https:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');

const MUST = ['href="/legal/offer/"', 'href="/legal/privacy/"', '260840038553', 'class="region-menu"', 'data-region="asia"', '+7 777 687 95 77'];
const MUST_NOT = [/\$20(?!\d)/, 'от $20', 'from $20', 'Сердитый минимум', 'Essentials', 'Мне посмотреть', 'Уверенный предприниматель', 'Матёрый бизнесмен', 'онбординг с основателями', 'Founder-led onboarding', 'Uniqore, United States', 'Лимит токенов на ИИ: X', 'токенов на ИИ: 5X', 'токенов на ИИ: 20X', '5× AI', '20× AI', 'Free to try'];

let failed = false;
for (const p of paths) {
  const file = path.join(root, p.endsWith('/') ? `${p}index.html` : p);
  if (!fs.existsSync(file)) { console.log(`FAIL ${p}: файла нет`); failed = true; continue; }
  const html = fs.readFileSync(file, 'utf8');
  const missing = MUST.filter((s) => !html.includes(s));
  const present = MUST_NOT.filter((s) => (s instanceof RegExp ? s.test(html) : html.includes(s)));
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
