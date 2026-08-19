import { forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import PageContent from './PageContent';

/**
 * Normal kitap: her sayfa ayrı bir yapraktır.
 * - Geniş ekran (masaüstü): iki sayfa yan yana görünür (2-3, 4-5...).
 * - Dar ekran (telefon dikey): usePortrait ile otomatik TEK sayfa modu.
 *   (Kap genişliği 2 x minWidth altına düşünce kütüphane kendisi tek sayfaya geçer.)
 * showCover ile kapak ve arka kapak tek sayfa olarak gösterilir.
 */
const Book = forwardRef(({ pages, onFlip, onStateChange, onOrientationChange }, ref) => (
  <HTMLFlipBook
    ref={ref}
    width={460}
    height={620}
    size="stretch"
    minWidth={340}
    maxWidth={580}
    minHeight={460}
    maxHeight={780}
    showCover
    usePortrait
    flippingTime={650}
    useMouseEvents
    mobileScrollSupport
    clickEventForward
    onFlip={(event) => onFlip(event.data)}
    onChangeState={(event) => onStateChange(event.data)}
    onChangeOrientation={(event) => onOrientationChange?.(event.data)}
  >
    {pages.map((page, index) => (
      <div key={page.id} className="book-page">
        <PageContent
          page={page}
          isCover={index === 0}
          isBack={page.image === null}
          total={pages.length}
        />
      </div>
    ))}
  </HTMLFlipBook>
));

export default Book;
