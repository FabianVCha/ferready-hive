// Retail photographs are local presentation references, not licensed launch assets.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const products = JSON.parse(await readFile(resolve(root, 'apps/storefront/data/prototype-products.json'), 'utf8'));
const publicRoot = resolve(root, 'apps/storefront/public');
await mkdir(resolve(publicRoot, 'ferready/products'), { recursive: true });
let existing = [];
try { existing = JSON.parse(await readFile(resolve(publicRoot, 'ferready/image-sources.json'), 'utf8')); } catch { /* First asset download. */ }
const outcomes = await Promise.all(products.map(async p => {
  try {
    const prior = existing.find(o => o.slug === p.slug && o.status === 'downloaded');
    if (prior) return prior;
    const response = await fetch(p.source, { signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error(`page HTTP ${response.status}`);
    const html = await response.text();
    let image;
    if (p.source.includes('homecenter')) {
      image = html.match(/https:\/\/media\.falabella\.com\/sodimacCO\/[^"\s<]+\/w=1036[^"\s<]+/)?.[0];
      if (!image) image = html.match(/https:\/\/media\.falabella\.com\/sodimacCO\/[^"\s<]+\/public/)?.[0];
    } else {
      image = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1]
        || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/)?.[1];
      if (!image) {
        const path = new URL(p.source).pathname;
        const api = await fetch(`https://www.easy.com.co/api/catalog_system/pub/products/search${path}`, { signal: AbortSignal.timeout(45000) });
        if (!api.ok) throw new Error(`product API HTTP ${api.status}`);
        const records = await api.json();
        image = records[0]?.items?.[0]?.images?.[0]?.imageUrl;
      }
    }
    if (!image) throw new Error('No product image in page metadata');
    image = image.replaceAll('&amp;', '&');
    const photo = await fetch(image, { signal: AbortSignal.timeout(45000) });
    if (!photo.ok || !photo.headers.get('content-type')?.startsWith('image/')) throw new Error(`image HTTP ${photo.status}`);
    await writeFile(resolve(publicRoot, p.image.slice(1)), Buffer.from(await photo.arrayBuffer()));
    return { slug: p.slug, source: p.source, imageSource: image, status: 'downloaded' };
  } catch (error) { return { slug: p.slug, source: p.source, status: 'failed', error: error.message }; }
}));
await writeFile(resolve(publicRoot, 'ferready/image-sources.json'), JSON.stringify(outcomes, null, 2));
console.log(JSON.stringify(outcomes.map(({ slug, status, error }) => ({ slug, status, error })), null, 2));
if (outcomes.some(o => o.status === 'failed')) process.exitCode = 1;
