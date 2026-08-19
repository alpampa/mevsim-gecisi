import { useCallback, useEffect, useRef, useState } from 'react';
import Book from './components/Book';
import Controls from './components/Controls';
import { useAudio } from './hooks/useAudio';
import { playPageFlipSound } from './lib/pageFlipSound';

const SITE_URL = 'https://mevsim-gecisi-app.web.app';

export default function App() {
  const [book, setBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [audioBlocked, setAudioBlocked] = useState(false);
  // Gece modu (yalnızca kitap dışı arka plan; sayfalar aynen kalır)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('mg-night') === '1';
  });
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // Kitap görünümü: dar ekranda kütüphane otomatik "portrait" (tek sayfa) olur.
  // İlk tahmin: ekran 712px'den darsa (konteyner < 680px) portrait.
  const [orientation, setOrientation] = useState(() => {
    if (typeof window === 'undefined') return 'landscape';
    return window.matchMedia('(max-width: 712px)').matches ? 'portrait' : 'landscape';
  });
  const bookRef = useRef(null);

  // Sayfa çevirme - ses senkronu
  const pageIndexRef = useRef(0); // en son e.data (sağdaki sayfa index'i)
  const lastSpreadRef = useRef(-1); // son okunan grup (çift çalmayı önler)
  const queueRef = useRef([]);
  const queuePosRef = useRef(0);

  const { play, stop, pause, resume, toggleMute, muted, isPlaying } = useAudio();

  // Kitap verisini yükle
  useEffect(() => {
    fetch('/bookData.json')
      .then((res) => res.json())
      .then(setBook)
      .catch((err) => {
        console.error('bookData.json yüklenemedi:', err);
      });
  }, []);

  // Okuma düzeni (normal kitap gibi, kullanıcı gözlemine göre):
  //   kapak (0)            → sadece 1. ses
  //   masaüstü açık (2,3)  → 2, sonra 3  (e.data = 1 iken [1,2] okunur)
  //   masaüstü açık (4,5)  → 4, sonra 5
  //   arka kapak (son)     → sadece son ses
  //   mobil tek sayfa      → yalnızca açık olan sayfa okunur
  const computeReadOrder = useCallback(
    (pageIndex) => {
      const pages = book?.pages;
      if (!pages?.length) return [];
      if (pageIndex <= 0) return [0]; // kapak tek başına
      if (pageIndex >= pages.length - 1) return [pages.length - 1]; // arka kapak
      if (orientation === 'portrait') return [pageIndex]; // mobil: tek sayfa
      return [pageIndex, pageIndex + 1]; // masaüstü: sol, sonra sağ
    },
    [book, orientation]
  );

  // Kütüphane yön değiştirdiğinde (ekran döndürme / daraltma) güncelle
  const handleOrientationChange = useCallback((ori) => {
    if (ori === 'portrait' || ori === 'landscape') {
      setOrientation(ori);
      lastSpreadRef.current = -1; // yeni düzende yeniden okumak için kilidi aç
    }
  }, []);

  // Sıradaki parçayı çal; bitince bir sonrakine geç
  const playNextInQueue = useCallback(() => {
    const pages = book?.pages;
    if (!pages) return;
    if (queuePosRef.current >= queueRef.current.length) return;
    const idx = queueRef.current[queuePosRef.current];
    queuePosRef.current += 1;
    const page = pages[idx];
    if (!page) return;
    const result = play(page.audioUrl, playNextInQueue);
    if (result && typeof result.catch === 'function') {
      result.catch(() => setAudioBlocked(true));
    }
  }, [book, play]);

  // Bir sayfa grubunu sırayla okut
  const playSequence = useCallback(
    (indices) => {
      const pages = book?.pages;
      if (!pages) return;
      stop();
      queueRef.current = indices.filter((i) => i >= 0 && i < pages.length);
      queuePosRef.current = 0;
      playNextInQueue();
    },
    [book, stop, playNextInQueue]
  );

  // Uygulama açıldığında kapak okunur
  useEffect(() => {
    if (book?.pages?.length > 0) {
      pageIndexRef.current = 0;
      lastSpreadRef.current = '0';
      playSequence([0]);
    }
  }, [book, playSequence]);

  // Flip BAŞLADIĞINDA: index'i kaydet, bekleyen sırayı iptal et, çevirme sesi çal
  const handleFlip = useCallback(
    (pageIndex) => {
      const total = book?.pages?.length ?? 1;
      const clamped = Math.max(0, Math.min(pageIndex, total - 1));
      pageIndexRef.current = clamped;
      setCurrentPage(clamped);
      queueRef.current = [];
      if (!muted) playPageFlipSound();
    },
    [book, muted]
  );

  // Flip TAMAMLANDIĞINDA: açık sayfalar okunur (önce sağ, sonra sol)
  const handleStateChange = useCallback(
    (state) => {
      if (state !== 'read') return;
      const i = pageIndexRef.current;
      const order = computeReadOrder(i);
      const key = order.join('-');
      if (key === lastSpreadRef.current) return;
      lastSpreadRef.current = key;
      playSequence(order);
    },
    [computeReadOrder, playSequence]
  );

  const handlePrev = useCallback(() => {
    bookRef.current?.pageFlip()?.flipPrev();
  }, []);

  const handleNext = useCallback(() => {
    bookRef.current?.pageFlip()?.flipNext();
  }, []);

  // Otomatik oynatma engellendiyse kullanıcı tıklamasıyla başlat
  const handleStartAudio = useCallback(() => {
    setAudioBlocked(false);
    lastSpreadRef.current = -1;
    playSequence(computeReadOrder(pageIndexRef.current));
  }, [computeReadOrder, playSequence]);

  // Gece modu aç/kapat (tercih cihazda hatırlanır)
  const handleToggleDark = useCallback(() => {
    setDarkMode((d) => {
      const next = !d;
      window.localStorage.setItem('mg-night', next ? '1' : '0');
      return next;
    });
  }, []);

  // Paylaşım: linki panoya kopyala
  const handleCopyLink = useCallback(() => {
    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(SITE_URL).then(done).catch(() => {});
    } else {
      // Eski tarayıcılar için yedek yöntem
      const ta = document.createElement('textarea');
      ta.value = SITE_URL;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        done();
      } catch {
        /* kopyalanamadı */
      }
      document.body.removeChild(ta);
    }
  }, []);

  // Paylaşım: telefonun yerel paylaşım menüsü (WhatsApp vb.)
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mevsim Geçisi',
          text: 'Kıştan ilkbahara doğanın uyanışı 🌷📖',
          url: SITE_URL,
        });
      } catch {
        // kullanıcı iptal etti — sorun değil
      }
    } else {
      handleCopyLink();
    }
  }, [handleCopyLink]);

  // İlerleme yüzdesi: kapak %0, arka kapak %100
  const total = book?.pages?.length ?? 1;
  const progressPct = total > 1 ? Math.round((currentPage / (total - 1)) * 100) : 0;

  if (!book) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          darkMode
            ? 'bg-gradient-to-b from-emerald-950 to-slate-900'
            : 'bg-gradient-to-b from-emerald-100 to-cream'
        }`}
      >
        <p className={`font-book text-xl font-bold ${darkMode ? 'text-cream' : 'text-night'}`}>
          Kitap yükleniyor…
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-dvh flex-col items-center overflow-hidden px-3 py-6 transition-colors sm:px-4 sm:py-8 ${
        darkMode
          ? 'bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-900'
          : 'bg-gradient-to-b from-sky-200 via-emerald-50 to-cream'
      }`}
    >
      {/* Uçan dekorlar (kitabın dışında sadece görsel, yazı yok) */}
      <div className="sky-deco" aria-hidden="true">
        <span className="deco deco-1">❄️</span>
        <span className="deco deco-2">🌙</span>
        <span className="deco deco-3">☁️</span>
        <span className="deco deco-4">🌱</span>
        <span className="deco deco-5">🌸</span>
        <span className="deco deco-6">☀️</span>
      </div>

      {/* Üst çubuk: solda paylaş + gece modu, sağda ses, ortada ilerleme */}
      <div className="fixed left-2 top-2 z-40 flex gap-2 sm:left-3 sm:top-3 sm:gap-3">
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          title="Kitabı paylaş"
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-mustard text-lg shadow-xl transition hover:scale-110 hover:bg-sand sm:h-12 sm:w-12 sm:text-xl ${
            darkMode ? 'ring-2 ring-white/40' : 'ring-4 ring-white/60'
          }`}
        >
          📤
        </button>
        <button
          type="button"
          onClick={handleToggleDark}
          title={darkMode ? 'Gündüz modu' : 'Gece modu'}
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-night text-lg shadow-xl transition hover:scale-110 sm:h-12 sm:w-12 sm:text-xl ${
            darkMode ? 'ring-2 ring-white/40' : 'ring-4 ring-white/60'
          }`}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* İlerleme çubuğu */}
      <div className="fixed left-1/2 top-2 z-40 w-28 -translate-x-1/2 sm:top-3 sm:w-52">
        <div
          className={`h-3 overflow-hidden rounded-full shadow-inner ${
            darkMode ? 'bg-white/20' : 'bg-white/60'
          }`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-mustard to-emerald2 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p
          className={`mt-0.5 text-center text-[11px] font-extrabold sm:text-xs ${
            darkMode ? 'text-cream/90' : 'text-night/80'
          }`}
        >
          {progressPct}%
        </p>
      </div>

      {/* Ses düğmesi (yazısız, sağ üstte) */}
      <button
        type="button"
        onClick={toggleMute}
        title={muted ? 'Sesi aç' : 'Sesi kapat'}
        className={`fixed right-2 top-2 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-night text-lg text-white shadow-xl transition hover:scale-110 hover:bg-emerald2 sm:right-4 sm:top-4 sm:h-14 sm:w-14 sm:text-2xl ${
          darkMode ? 'ring-2 ring-white/40' : ''
        }`}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {/* Kitap */}
      <main className="relative z-10 flex w-full flex-1 items-center justify-center py-4">
        {book.pages?.length > 0 ? (
          <Book
            ref={bookRef}
            pages={book.pages}
            onFlip={handleFlip}
            onStateChange={handleStateChange}
            onOrientationChange={handleOrientationChange}
          />
        ) : (
          <p className={`font-book text-lg font-bold ${darkMode ? 'text-cream' : 'text-night'}`}>
            Kitap boş görünüyor.
          </p>
        )}
      </main>

      {/* Alt kontroller (yazısız oklar + duraklat/devam) */}
      <footer className="relative z-10 mt-2">
        <Controls
          onPrev={handlePrev}
          onNext={handleNext}
          onPause={pause}
          onResume={resume}
          isPlaying={isPlaying}
          page={currentPage}
          total={book.pages?.length ?? 0}
        />
      </footer>

      {/* Otomatik oynatma engellendiyse başlatma katmanı */}
      {audioBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/70 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <p className="text-4xl">📖</p>
            <p className="mt-3 font-book text-2xl font-extrabold text-night">
              Sesli kitabı başlatmak için dokun
            </p>
            <button
              type="button"
              onClick={handleStartAudio}
              className="mt-6 rounded-full bg-mustard px-8 py-4 font-book text-lg font-extrabold text-night shadow-xl transition hover:scale-105"
            >
              🔊 Sesi Başlat
            </button>
          </div>
        </div>
      )}

      {/* Paylaşım katmanı: QR kod + link */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/70 p-4 backdrop-blur-sm"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-3xl">✨</p>
            <h2 className="mt-2 font-book text-2xl font-extrabold text-night">Kitabı Paylaş</h2>
            <p className="mt-1 text-sm font-semibold text-night/60">
              Telefonla QR kodu okutun ya da linki gönderin
            </p>
            <img
              src="/images/qr-kitap.png"
              alt="Kitabın QR kodu"
              className="mx-auto mt-4 h-48 w-48 rounded-2xl border-4 border-mustard object-contain"
            />
            <p className="mt-3 break-all rounded-xl bg-cream px-3 py-2 font-book text-sm font-bold text-night">
              mevsim-gecisi-app.web.app
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 rounded-full bg-mustard px-4 py-3 font-book text-base font-extrabold text-night shadow-lg transition hover:scale-105"
              >
                {copied ? '✓ Kopyalandı' : '📋 Kopyala'}
              </button>
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex-1 rounded-full bg-emerald2 px-4 py-3 font-book text-base font-extrabold text-white shadow-lg transition hover:scale-105"
              >
                📤 Paylaş
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShareOpen(false)}
              className="mt-3 rounded-full px-6 py-2 font-book font-bold text-night/60 transition hover:bg-cream"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
