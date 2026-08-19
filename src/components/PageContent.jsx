/**
 * Tek sayfanın görsel içeriği.
 * - Kapak: başlık üstte, görsel arka planda.
 * - İç sayfalar: görsel + alttaki yarı saydam metin kutusu + sayfa numarası.
 * - Arka kapak (image: null): krem zemin üzerinde özlü söz.
 * Görseller object-contain ile gösterilir: KIRPMA YOK.
 */
export default function PageContent({ page, isCover, isBack, total }) {
  if (isBack) {
    return (
      <div className="back-page">
        <p className="back-quote">“Her kıştan sonra bir ilkbahar gelir.”</p>
        <p className="back-src">— Meşe Ağacı</p>
        <p className="back-note">Soğuk günler de bir gün biter; yüreğinde baharın sıcaklığını taşı.</p>
        <p className="back-author">Yazan ve Resimleyen: Recep Kızılırmak</p>
        <span className="page-num">{page.number} / {total}</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-cream">
      {page.image && (
        <img
          src={page.image}
          alt={`Sayfa ${page.number}`}
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}
      {/* dekoratif iç çerçeve */}
      <div className="page-frame" aria-hidden="true" />

      {isCover ? (
        <div className="cover-overlay">
          <span className="cover-star" aria-hidden="true">🌷</span>
          <h1 className="cover-title">Mevsim Geçisi</h1>
          <p className="cover-subtitle">Kıştan ilkbahara, doğanın uyanışı</p>
          <p className="cover-author">
            <span className="cover-author-role">Yazan ve Resimleyen</span>
            <span className="cover-author-name">Recep Kızılırmak</span>
          </p>
        </div>
      ) : (
        <div className="page-overlay">
          <p className="page-text">{page.text}</p>
        </div>
      )}

      {!isCover && (
        <span className="page-num">{page.number} / {total}</span>
      )}
    </div>
  );
}
