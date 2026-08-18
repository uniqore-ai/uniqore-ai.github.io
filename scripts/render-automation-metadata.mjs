import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/automations.js'), 'utf8');
const itemPattern = /slug:'([^']+)',\s*path:'([^']+)'[\s\S]*?title:'([^']+)',\s*summary:'([^']+)'/g;

for (const match of source.matchAll(itemPattern)) {
  const [, slug, itemPath, title, summary] = match;
  if (!itemPath.startsWith('/automations/')) continue;
  const file = path.join(root, 'automations', slug, 'index.html');
  if (!fs.existsSync(file)) continue;

  const canonical = `https://uniqore.ai${itemPath}`;
  const kz = `https://uniqore.kz${itemPath}`;
  let html = fs.readFileSync(file, 'utf8');
  html = html
    .replace(/<title>[^<]+<\/title>/, `<title>${title} — Uniqore</title>`)
    .replace(/<meta name="description" content="[^"]*"\/>/, `<meta name="description" content="${summary}"/>`)
    .replace(/<meta property="og:title" content="[^"]*"\/>/, `<meta property="og:title" content="${title} — Uniqore"/>`)
    .replace(/<meta property="og:description" content="[^"]*"\/>/, `<meta property="og:description" content="${summary}"/>`)
    .replace(/<meta property="og:image:alt" content="[^"]*"\/>/, `<meta property="og:image:alt" content="${title} — Uniqore"/>`);

  if (!html.includes('<link rel="canonical"')) {
    html = html.replace(
      '<link rel="preconnect" href="https://fonts.googleapis.com"/>',
      `<link rel="canonical" href="${canonical}"/>\n` +
      `<link rel="alternate" hreflang="en" href="${canonical}"/>\n` +
      `<link rel="alternate" hreflang="ru" href="${kz}"/>\n` +
      `<link rel="alternate" hreflang="kk" href="${kz}?lang=kk"/>\n` +
      `<link rel="alternate" hreflang="x-default" href="${canonical}"/>\n` +
      `<meta property="og:url" content="${canonical}"/>\n` +
      '<link rel="preconnect" href="https://fonts.googleapis.com"/>'
    );
  }

  html = html.replace(
    "  var canonical=document.createElement('link');canonical.rel='canonical';canonical.href='https://uniqore.ai'+current.path;document.head.appendChild(canonical);\n  var ogUrl=document.createElement('meta');ogUrl.setAttribute('property','og:url');ogUrl.setAttribute('content','https://uniqore.ai'+current.path);document.head.appendChild(ogUrl);",
    "  var canonical=document.querySelector('link[rel=\"canonical\"]');if(canonical)canonical.href='https://uniqore.ai'+current.path;\n  var ogUrl=document.querySelector('meta[property=\"og:url\"]');if(ogUrl)ogUrl.setAttribute('content','https://uniqore.ai'+current.path);"
  );

  fs.writeFileSync(file, html);
}
