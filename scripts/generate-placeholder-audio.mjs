/**
 * generate-placeholder-audio.mjs
 * --------------------------------
 * ElevenLabs anahtarı olmadan kitabın etkileşimli akışını çalıştırmak için
 * her sayfaya, metnin okunma süresine uyan yumuşak bir "ortam sesi" (hafif
 * rüzgar) WAV dosyası üretir ve bookData.json'daki audioUrl alanlarını
 * bunlara bağlar.
 *
 * Gerçek anlatım istendiğinde: .env'e ELEVENLABS_API_KEY ekleyip
 * `npm run audio` çalıştırın — bu scriptin ürettiği yer tutucular
 * gerçek mp3 anlatımlarla değiştirilir.
 *
 * Kullanım: node scripts/generate-placeholder-audio.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BOOK_PATH = resolve('public/bookData.json');
const AUDIO_DIR = resolve('public/audio');

const SAMPLE_RATE = 22050;
const CHARS_PER_SECOND = 14; // Türkçe anlatım okuma hızı tahmini

/** Metnin yaklaşık okunma süresi (saniye) */
function estimateDuration(text) {
  const seconds = text.length / CHARS_PER_SECOND + 1.5;
  return Math.min(24, Math.max(4, seconds));
}

/** Hafif rüzgar hissi veren yumuşak gürültü WAV'i üretir */
function buildBreezeWav(durationSeconds) {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSeconds);
  const fadeSamples = Math.floor(SAMPLE_RATE * 0.6);
  const data = Buffer.alloc(totalSamples * 2);
  const a = 0.045; // alçak geçiren filtre katsayısı (rüzgar yumuşatması)
  let prev = 0;

  for (let i = 0; i < totalSamples; i++) {
    const raw = Math.random() * 2 - 1;
    prev = prev + a * (raw - prev);
    // başlangıç/bitiş yumuşak geçiş + düşük genlik (rahatsız etmez)
    const fade =
      Math.min(1, i / fadeSamples, (totalSamples - i) / fadeSamples);
    const sample = Math.max(-1, Math.min(1, prev * 0.5)) * fade * 0.14;
    data.writeInt16LE(Math.round(sample * 32767), i * 2);
  }

  // 44 baytlık RIFF/WAVE başlığı
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt bloğu boyutu
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // blok hizalama
  header.writeUInt16LE(16, 34); // bit derinliği
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

mkdirSync(AUDIO_DIR, { recursive: true });
const book = JSON.parse(readFileSync(BOOK_PATH, 'utf-8'));
const pad = (n) => String(n).padStart(2, '0');

for (const page of book.pages) {
  if (!page.text) {
    page.audioUrl = null;
    continue;
  }
  const fileName = `page-${pad(page.id)}.wav`;
  const wav = buildBreezeWav(estimateDuration(page.text));
  writeFileSync(resolve(AUDIO_DIR, fileName), wav);
  page.audioUrl = `/audio/${fileName}`;
  console.log(
    `✅ ${fileName} → ${(wav.length / 1024).toFixed(0)} KB (${estimateDuration(page.text).toFixed(1)} sn)`
  );
}

writeFileSync(BOOK_PATH, JSON.stringify(book, null, 2), 'utf-8');
console.log('🎉 Tamamlandı! bookData.json yer tutucu seslere bağlandı.');
