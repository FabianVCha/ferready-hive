// Deterministic cutout of a reference photograph, not AI-generated product imagery.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire(resolve(import.meta.dirname, '../apps/storefront/package.json'));
const sharp = require('sharp');
const folder = resolve(import.meta.dirname, '../apps/storefront/public/ferready');
const { data, info } = await sharp(resolve(folder, 'products/484299.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const seen = new Uint8Array(width * height);
const queue = [];
for (let x = 0; x < width; x++) queue.push(x, (height - 1) * width + x);
for (let y = 0; y < height; y++) queue.push(y * width, y * width + width - 1);
for (let head = 0; head < queue.length; head++) {
  const pixel = queue[head];
  if (seen[pixel]) continue;
  seen[pixel] = 1;
  const i = pixel * 4;
  if (Math.min(data[i], data[i + 1], data[i + 2]) < 224) continue;
  data[i + 3] = 0;
  const x = pixel % width, y = Math.floor(pixel / width);
  if (x > 0) queue.push(pixel - 1);
  if (x < width - 1) queue.push(pixel + 1);
  if (y > 0) queue.push(pixel - width);
  if (y < height - 1) queue.push(pixel + width);
}
await sharp(data, { raw: { width, height, channels: 4 } }).trim().png().toFile(resolve(folder, 'hero.png'));
console.log('Created transparent reference-photo cutout; original photograph and product markings preserved.');
