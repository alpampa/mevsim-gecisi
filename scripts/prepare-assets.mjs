/**
 * Tek seferlik varlık hazırlama scripti:
 * 1) public/images/*.jpeg -> public/images/*.webp (sayfa yükleme hızı için)
 * 2) Kitap adresi için QR kod PNG üretir (paylaşım için)
 *
 * Çalıştırma: node scripts/prepare-assets.mjs
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import QRCode from 'qrcode';

const imagesDir = path.resolve(import.meta.dirname, '../public/images');
const siteUrl = 'https://mevsim-gecisi-app.web.app';

// 1) JPEG -> WebP
const files = (await readdir(imagesDir)).filter((f) => f.toLowerCase().endsWith('.jpeg'));

for (const file of files) {
  const src = path.join(imagesDir, file);
  const out = path.join(imagesDir, file.replace(/\.jpeg$/i, '.webp'));
  await sharp(src).webp({ quality: 82 }).toFile(out);
  const kb = (await stat(out)).size / 1024;
  console.log(`OK ${file} -> ${path.basename(out)} (${kb.toFixed(0)} KB)`);
}

// 2) QR kod
await QRCode.toFile(path.join(imagesDir, 'qr-kitap.png'), siteUrl, {
  width: 512,
  margin: 2,
  errorCorrectionLevel: 'M',
  color: { dark: '#2B3A67', light: '#FFFFFF' },
});
console.log(`OK qr-kitap.png -> ${siteUrl}`);
console.log('Bitti.');
