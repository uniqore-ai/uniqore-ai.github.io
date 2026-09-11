import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const base = process.argv[2] || 'http://127.0.0.1:4174';
const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const paths = [...sitemap.matchAll(/<loc>https:\/\/[^/]+([^<]*)<\/loc>/g)].map((match) => match[1] || '/');
paths.push('/404.html', '/crm/');

let failed = false;
for (const path of paths) {
  const response = await fetch(new URL(path, base), { redirect: 'manual' });
  const body = await response.text();
  const title = body.match(/<title>([^<]+)<\/title>/)?.[1] || '(no title)';
  const expected = response.status === 200;
  console.log(`${expected ? 'OK' : 'FAIL'} ${response.status} ${path} — ${title}`);
  if (!expected) failed = true;
}

for (const path of [
  '/outputs/speech-landing/uniqore-speech-analysis-demo-report.xlsx',
  '/output/pdf/uniqore-speech-analysis-demo-report.pdf',
]) {
  const response = await fetch(new URL(path, base));
  const bytes = new Uint8Array(await response.arrayBuffer());
  const magic = Array.from(bytes.slice(0, 4), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const expectedMagic = path.endsWith('.xlsx') ? '504b0304' : '25504446';
  const expected = response.status === 200 && magic === expectedMagic && bytes.length > 5000;
  console.log(`${expected ? 'OK' : 'FAIL'} ${response.status} ${path} — ${bytes.length} bytes, magic ${magic}`);
  if (!expected) failed = true;
}

// /legal/*: опубликованный .md байт-в-байт равен источнику из uniqore-docs/legal
// (P163) — та же величина, что уходит на сервер в POST /admin/legal/publish.
const legalDir = process.env.UNIQORE_LEGAL_DIR || path.resolve(import.meta.dirname, '..', '..', 'uniqore-docs', 'legal');
const manifestPath = path.join(legalDir, 'manifest.json');
if (existsSync(manifestPath)) {
  const site = readFileSync(new URL('../CNAME', import.meta.url), 'utf8').trim();
  const lang = site.endsWith('.kz') ? 'ru' : 'en';
  for (const doc of JSON.parse(readFileSync(manifestPath, 'utf8')).documents.filter((d) => d.lang === lang)) {
    const response = await fetch(new URL(`/legal/${doc.code}/${doc.code}.md`, base));
    const bytes = new Uint8Array(await response.arrayBuffer());
    const sha = createHash('sha256').update(bytes).digest('hex');
    const expected = response.status === 200 && sha === doc.sha256;
    console.log(`${expected ? 'OK' : 'FAIL'} ${response.status} /legal/${doc.code}/${doc.code}.md — sha ${sha.slice(0, 12)}… ${expected ? '= manifest' : `≠ manifest ${doc.sha256.slice(0, 12)}…`}`);
    if (!expected) failed = true;
  }
} else {
  console.log(`SKIP legal sha: нет ${manifestPath} (UNIQORE_LEGAL_DIR)`);
}

if (failed) process.exit(1);
