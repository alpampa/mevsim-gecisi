/**
 * generateAudio.js
 * ----------------
 * public/bookData.json içindeki kitap adını ve her sayfa metnini
 * ElevenLabs API'sine gönderir, dönen .mp3 dosyalarını
 * public/audio/ klasörüne kaydeder ve bookData.json'daki
 * audioUrl alanlarını otomatik günceller.
 *
 * Kullanım:
 *   1) .env dosyasına ELEVENLABS_API_KEY ekle
 *   2) npm run audio   (veya: node generateAudio.js)
 *
 * Gereksinim: Node.js 18+ (global fetch kullanılır)
 */
import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

const BOOK_PATH = resolve('public/bookData.json');
const AUDIO_DIR = resolve('public/audio');

if (!API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY bulunamadı.');
  console.error('   .env dosyasını oluştur/duzenle ve anahtarını yapıştır:');
  console.error('   ELEVENLABS_API_KEY=xxxxxxxx');
  process.exit(1);
}

mkdirSync(AUDIO_DIR, { recursive: true });
const book = JSON.parse(readFileSync(BOOK_PATH, 'utf-8'));

const sleep = (ms) => new Promise((resolveFn) => setTimeout(resolveFn, ms));

/** ElevenLabs TTS isteği gönderir ve mp3'ü diske yazar. */
async function synthesize(text, outPath, label) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.55, // tutarlı, sakin okuma
        similarity_boost: 0.8,
        style: 0.2, // hikâye tonu
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`${label} üretilemedi (HTTP ${response.status}): ${errorBody}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  writeFileSync(outPath, bytes);
  console.log(`✅ ${label} → ${outPath} (${(bytes.length / 1024).toFixed(1)} KB)`);
}

const pad = (n) => String(n).padStart(2, '0');

// 1) Kitap adı (kapak sesi)
await synthesize(
  `${book.title}. ${book.subtitle || ''}`.trim(),
  resolve(AUDIO_DIR, '00-kapak.mp3'),
  'Kitap adı'
);
book.titleAudioUrl = '/audio/00-kapak.mp3';
await sleep(400); // rate limit nezaketi

// 2) Her sayfanın metni
for (const page of book.pages) {
  if (!page.text) {
    page.audioUrl = null;
    continue;
  }
  const fileName = `page-${pad(page.id)}.mp3`;
  await synthesize(page.text, resolve(AUDIO_DIR, fileName), `Sayfa ${page.number}`);
  page.audioUrl = `/audio/${fileName}`;
  await sleep(400);
}

// 3) Güncellenmiş kitap verisini yaz
writeFileSync(BOOK_PATH, JSON.stringify(book, null, 2), 'utf-8');
console.log('🎉 Tamamlandı! Sesler public/audio/ içinde, bookData.json güncellendi.');
