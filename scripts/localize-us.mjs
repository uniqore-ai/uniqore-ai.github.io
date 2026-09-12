import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const htmlFiles = [
  'index.html',
  'mission/index.html',
  'download/index.html',
  'speech-analytics/index.html',
  '404.html',
  'crm/index.html',
  'automations/index.html',
  ...fs.readdirSync(path.join(root, 'automations'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `automations/${entry.name}/index.html`),
];

const sharedReplacements = [
  ['<html lang="ru">', '<html lang="en-US">'],
  ['https://uniqore.kz', 'https://uniqore.ai'],
  ['og-home-1200x630-ru-v1.0.1.png', 'og-home-1200x630-en-v1.0.1.png'],
  ['og-crm-1200x630-ru-v1.0.1.png', 'og-crm-1200x630-en-v1.0.1.png'],
  ['UNIQORE — на главную', 'UNIQORE — home'],
  ['Миссия', 'Mission'],
  ['Автоматизации', 'Automations'],
  ['Речевая аналитика продаж', 'Sales conversation intelligence'],
  ['Скачать', 'Download'],
  ['Написать нам', 'Talk to us'],
  ['Uniqore — ИИ-Партнёр для предпринимателя', 'Uniqore — AI business partner for small business owners'],
  ['alt="Юни"', 'alt="Uni"'],
  ['Готовая автоматизация — Uniqore', 'Ready-to-run automation — Uniqore'],
  ['Готовая автоматизация Uniqore: понятный результат на данных вашего бизнеса без промптов и долгого внедрения.', 'A ready-to-run Uniqore automation that turns your business data into a clear decision and next step.'],
  ['Один дорогой вопрос бизнеса — одна готовая автоматизация Uniqore.', 'One expensive business question. One ready-to-run Uniqore automation.'],
  ['← Все автоматизации', '← All automations'],
  ['Получаете ответ, а не ещё один инструмент.', 'Get an answer — not another tool to manage.'],
  ['Uniqore собирает нужные данные, показывает вывод понятным языком и предлагает следующий шаг.', 'Uniqore brings together the minimum useful data, explains the finding in plain English, and recommends the next move.'],
  ['Причина на ваших данных', 'The cause, in your data'],
  ['Не общий совет из интернета, а вывод, который можно проверить по исходным цифрам, сделкам или файлам.', 'Not generic advice. A finding you can trace back to the underlying numbers, deals, conversations, or files.'],
  ['Что делать дальше', 'A clear next move'],
  ['Конкретное действие с приоритетом и объяснением, почему именно оно повлияет на результат.', 'A prioritized action with the evidence and reasoning behind its expected business impact.'],
  ['Юни объяснит каждый шаг', 'Uni explains every step'],
  ['Можно переспросить, попросить пример или разобрать непонятный вывод столько раз, сколько нужно.', 'Ask for another explanation, a concrete example, or a deeper breakdown as many times as you need.'],
  ['Как запускается автоматизация', 'How an automation gets started'],
  ['Выбираете задачу', 'Choose the business question'],
  ['Открываете автоматизацию, которая отвечает на ваш текущий дорогой вопрос.', 'Open the automation built for the expensive question in front of you right now.'],
  ['Подключаете данные', 'Connect the minimum useful data'],
  ['Только то, что нужно для анализа: CRM, разговоры, выписки или рабочие файлы.', 'Only what the analysis needs: HubSpot, customer conversations, bank transactions, or operating files.'],
  ['Получаете результат', 'Get the answer and next step'],
  ['Вывод, доказательства и понятный план действий остаются внутри Uniqore.', 'The finding, supporting evidence, and practical action plan stay together inside Uniqore.'],
  ['Не знаете, с чего начать?', 'Not sure where to start?'],
  ['Откройте весь каталог или напишите нам — поможем выбрать первую автоматизацию под вашу задачу.', 'Browse the catalog or talk to us. We will help you choose the best first automation for your business.'],
  ['Все автоматизации →', 'All automations →'],
  ['Частые вопросы', 'Frequently asked questions'],
  // Футер P163: документы, реквизиты, регион. Меню региона (`region-menu`) —
  // общее для обоих доменов и НЕ вырезается регэкспом ниже (он про `language-menu`).
  ['href="/legal/offer/">Оферта', 'href="/legal/offer/">Terms'],
  ['href="/legal/privacy/">Политика конфиденциальности', 'href="/legal/privacy/">Privacy'],
  ['ТОО «Uniqore» · БИН 260840038553 · Республика Казахстан, 010000, г. Астана, район Сарайшык, пр. Рақымжан Қошқарбаев, 10/1, н.п. 18', 'Uniqore LLC · BIN 260840038553 · Republic of Kazakhstan, 010000, Astana, Saraishyk district, 10/1 Rakymzhan Koshkarbayev Avenue, premises 18'],
  ['aria-label="Выбрать регион"', 'aria-label="Choose your region"'],
  ['<span class="region-current">Регион</span>', '<span class="region-current">Region</span>'],
  ['data-region="us">Соединённые Штаты<', 'data-region="us">United States<'],
  ['data-region="eu">Европа<', 'data-region="eu">Europe<'],
  ['data-region="au">Австралия и Океания<', 'data-region="au">Australia &amp; Oceania<'],
  ['data-region="asia">Азия<', 'data-region="asia">Asia<'],
  ['data-region="other">Другие регионы<', 'data-region="other">Other regions<'],
];

function localizedAlternates(canonical) {
  const url = new URL(canonical);
  const kzBase = `https://uniqore.kz${url.pathname}`;
  return [
    `<link rel="alternate" hreflang="en" href="${canonical}"/>`,
    `<link rel="alternate" hreflang="ru" href="${kzBase}"/>`,
    `<link rel="alternate" hreflang="kk" href="${kzBase}?lang=kk"/>`,
    `<link rel="alternate" hreflang="x-default" href="${canonical}"/>`,
  ].join('\n');
}

for (const relative of htmlFiles) {
  const filename = path.join(root, relative);
  if (!fs.existsSync(filename)) continue;
  let source = fs.readFileSync(filename, 'utf8');

  for (const [from, to] of sharedReplacements) source = source.split(from).join(to);

  source = source.replace(
    /<script>\s*\(function\(\)\{[\s\S]*?uniqore-language[\s\S]*?\}\)\(\);\s*<\/script>\s*/,
    '<script>document.documentElement.lang="en-US";document.documentElement.dataset.language="en";document.documentElement.classList.add("i18n-ready");</script>\n'
  );
  source = source.replace(/<link rel="stylesheet" href="\/assets\/language\.css\?v=\d+"\/>\s*/g, '');
  source = source.replace(/<script src="\/assets\/i18n\.js\?v=\d+"><\/script>\s*/g, '');
  source = source.replace(
    /\s*<details class="language-menu">[\s\S]*?<\/details>/g,
    // Ссылки RU / KZ на витрине нет намеренно (владелец, 2026-09-12): переход в
    // казахстанскую версию — только через неброское меню региона в футере.
    ''
  );
  source = source.replace(/\n?\s*<a href="https:\/\/uniqore\.kz\/" hreflang="ru" rel="alternate">RU \/ KZ ↗<\/a>/g, '');

  const canonicalMatch = source.match(/<link rel="canonical" href="([^"]+)"\/>/);
  if (canonicalMatch) {
    source = source.replace(/\n?<link rel="alternate" hreflang="[^"]+" href="[^"]+"\/>/g, '');
    source = source.replace(canonicalMatch[0], `${canonicalMatch[0]}\n${localizedAlternates(canonicalMatch[1])}`);
  }

  fs.writeFileSync(filename, source);
}

for (const relative of ['assets/automations.js', 'robots.txt', 'sitemap.xml']) {
  const filename = path.join(root, relative);
  if (!fs.existsSync(filename)) continue;
  let source = fs.readFileSync(filename, 'utf8');
  for (const [from, to] of sharedReplacements) source = source.split(from).join(to);
  fs.writeFileSync(filename, source);
}
