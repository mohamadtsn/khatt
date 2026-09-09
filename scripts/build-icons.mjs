/* PWA icons are generated from icon.svg so there is one source of truth for the
   mark. The maskable variant keeps the glyph inside the safe zone, or the OS
   crops it. */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const base = readFileSync('icon.svg');
const maskable = readFileSync('public/icon-maskable.svg');

await sharp(base, { density: 512 }).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(base, { density: 512 }).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(maskable, { density: 512 })
  .resize(512, 512)
  .png()
  .toFile('public/icon-maskable-512.png');

console.log('icons written');
