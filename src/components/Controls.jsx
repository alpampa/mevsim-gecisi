/**
 * Alt kontrol çubuğu: yazısız, büyük yuvarlak butonlar.
 * Ortada Duraklat / Devam, yanlarda sayfa okları.
 * (Sayfa numaraları sayfaların üzerinde.)
 */
export default function Controls({ onPrev, onNext, onPause, onResume, isPlaying, page, total }) {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8">
      <button
        type="button"
        onClick={onPrev}
        disabled={page === 0}
        title="Önceki sayfa"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-mustard text-3xl text-night shadow-xl ring-4 ring-white/60 transition hover:scale-110 hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
      >
        ◀
      </button>

      <button
        type="button"
        onClick={isPlaying ? onPause : onResume}
        title={isPlaying ? 'Sesi duraklat' : 'Sesi devam ettir'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-rosepink text-2xl text-white shadow-xl ring-4 ring-white/60 transition hover:scale-110"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={page >= total - 1}
        title="Sonraki sayfa"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-mustard text-3xl text-night shadow-xl ring-4 ring-white/60 transition hover:scale-110 hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
      >
        ▶
      </button>
    </div>
  );
}
