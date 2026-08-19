# Mevsim Geçisi 🌷

Kışın dondurucu soğuğundan ilkbaharın canlılığına geçişi anlatan, doğanın uyanışını
konu alan kısa ve etkileşimli bir sesli çocuk hikayesi. Sayfaları çevir, anlatıcıyı dinle.

## Özellikler

- Sayfa çevirme efektli dijital kitap (react-pageflip)
- Her sayfa için ElevenLabs sesli anlatım
- Mobil uyumlu (tek sayfa modu), gece modu
- QR kod ile paylaşım, ilerleme çubuğu, duraklat/devam, ses kapatma

## Yerel geliştirme

```bash
npm install
npm run dev      # http://localhost:5173
```

## Sesleri üret (ElevenLabs API anahtarı gerekir)

`.env` dosyasına `ELEVENLABS_API_KEY` ekle, sonra:

```bash
npm run audio
```

Komut, `public/bookData.json` içindeki metinleri seslendirir, mp3'leri
`public/audio/` altına yazar ve `audioUrl` alanlarını günceller.
Anahtar yoksa kitap sessiz (yalnızca okuma) modunda da çalışır.

## Görseller

Sayfa görselleri şu an `public/images/*.svg` içindeki yer tutucu illüstrasyonlardır.
Yapay zeka ile daha zengin görseller üretmek için
[GORSEL-PROMPTLARI.md](./GORSEL-PROMPTLARI.md) dosyasına bak.

## QR kod üret

```bash
node scripts/prepare-assets.mjs
```

## Derleme ve yayın

```bash
npm run build
firebase deploy --only hosting
```

Canlı adres: https://mevsim-gecisi-app.web.app
