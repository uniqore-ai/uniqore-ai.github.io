import { readFileSync } from 'node:fs';

const base = process.argv[2] || 'http://127.0.0.1:4174';
const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const paths = [...sitemap.matchAll(/<loc>https:\/\/uniqore\.ai([^<]*)<\/loc>/g)].map((match) => match[1] || '/');
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

if (failed) process.exit(1);
