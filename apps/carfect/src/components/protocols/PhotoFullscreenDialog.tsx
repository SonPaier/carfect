import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { PhotoAnnotationDialog } from './PhotoAnnotationDialog';

interface PhotoFullscreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoUrl: string | null;
  onAnnotate?: (newUrl: string) => void;
  /** Optional array of all photos for carousel navigation */
  allPhotos?: string[];
  /** Initial index when using allPhotos */
  initialIndex?: number;
}

// Distance between two touch points
const getTouchDistance = (t1: React.Touch, t2: React.Touch) =>
  Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

const getTouchCenter = (t1: React.Touch, t2: React.Touch) => ({
  x: (t1.clientX + t2.clientX) / 2,
  y: (t1.clientY + t2.clientY) / 2,
});

export const PhotoFullscreenDialog = ({
  open,
  onOpenChange,
  photoUrl,
  onAnnotate,
  allPhotos,
  initialIndex = 0,
}: PhotoFullscreenDialogProps) => {
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Zoom/pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isZoomed = scale > 1.05;

  // Touch tracking refs
  const touchRef = useRef<{
    initialDistance: number;
    initialScale: number;
    initialTranslate: { x: number; y: number };
    initialCenter: { x: number; y: number };
    lastTap: number;
    isPanning: boolean;
    panStart: { x: number; y: number };
  }>({
    initialDistance: 0,
    initialScale: 1,
    initialTranslate: { x: 0, y: 0 },
    initialCenter: { x: 0, y: 0 },
    lastTap: 0,
    isPanning: false,
    panStart: { x: 0, y: 0 },
  });

  const photos = allPhotos && allPhotos.length > 0 ? allPhotos : photoUrl ? [photoUrl] : [];
  const hasMultiple = photos.length > 1;

  // Sync index when dialog opens or initialIndex changes
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  // Reset zoom on photo change or dialog close
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [currentIndex, open]);

  const currentPhoto = photos[currentIndex] || null;

  const goNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open || annotationOpen || !hasMultiple) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, annotationOpen, hasMultiple, goNext, goPrev]);

  // Touch handlers for pinch-to-zoom and pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      const center = getTouchCenter(e.touches[0], e.touches[1]);
      touchRef.current.initialDistance = dist;
      touchRef.current.initialScale = scale;
      touchRef.current.initialTranslate = { ...translate };
      touchRef.current.initialCenter = center;
      touchRef.current.isPanning = false;
    } else if (e.touches.length === 1 && isZoomed) {
      touchRef.current.isPanning = true;
      touchRef.current.panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchRef.current.initialTranslate = { ...translate };
    }
  }, [scale, translate, isZoomed]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      const ratio = dist / touchRef.current.initialDistance;
      const newScale = Math.min(Math.max(touchRef.current.initialScale * ratio, 1), 5);

      // Adjust translate to keep pinch center stable
      const center = getTouchCenter(e.touches[0], e.touches[1]);
      const dx = center.x - touchRef.current.initialCenter.x;
      const dy = center.y - touchRef.current.initialCenter.y;

      setScale(newScale);
      setTranslate({
        x: touchRef.current.initialTranslate.x + dx,
        y: touchRef.current.initialTranslate.y + dy,
      });
    } else if (e.touches.length === 1 && touchRef.current.isPanning && isZoomed) {
      const dx = e.touches[0].clientX - touchRef.current.panStart.x;
      const dy = e.touches[0].clientY - touchRef.current.panStart.y;
      setTranslate({
        x: touchRef.current.initialTranslate.x + dx,
        y: touchRef.current.initialTranslate.y + dy,
      });
    }
  }, [isZoomed]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      touchRef.current.isPanning = false;

      // Snap back to 1 if close enough
      if (scale < 1.1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      }
    }
  }, [scale]);

  // Double-tap to toggle zoom
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const timeSinceLastTap = now - touchRef.current.lastTap;
    touchRef.current.lastTap = now;

    if (timeSinceLastTap < 300) {
      // Double-tap detected
      if (isZoomed) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      } else {
        setScale(2.5);
        // Zoom toward tap position
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const tapX = e.clientX - rect.left - rect.width / 2;
        const tapY = e.clientY - rect.top - rect.height / 2;
        setTranslate({ x: -tapX * 1.5, y: -tapY * 1.5 });
      }
    }
  }, [isZoomed]);

  if (!currentPhoto) return null;

  const handleAnnotateSave = (newUrl: string) => {
    setAnnotationOpen(false);
    onAnnotate?.(newUrl);
    onOpenChange(false);
  };

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={(v) => {
        if (!v && annotationOpen) return;
        onOpenChange(v);
      }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[9998] bg-black/95" onClick={() => {
            if (!annotationOpen && !isZoomed) onOpenChange(false);
          }} />
          <DialogPrimitive.Content
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 outline-none"
            onClick={() => {
              if (!annotationOpen && !isZoomed) onOpenChange(false);
            }}
          >
            {/* Top buttons */}
            {!annotationOpen && (
              <div className="fixed top-4 right-4 z-[10000] flex gap-2">
                {onAnnotate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnnotationOpen(true);
                    }}
                    className="flex items-center justify-center h-12 w-12 rounded-full bg-white text-black shadow-2xl border-2 border-gray-300 hover:bg-gray-100 active:bg-gray-200"
                    aria-label="Rysik"
                  >
                    <Pencil className="h-6 w-6" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenChange(false);
                  }}
                  className="flex items-center justify-center h-12 w-12 rounded-full bg-white text-black shadow-2xl border-2 border-gray-300 hover:bg-gray-100 active:bg-gray-200"
                  aria-label="Zamknij"
                >
                  <X className="h-7 w-7" />
                </button>
              </div>
            )}

            {/* Left arrow */}
            {hasMultiple && !annotationOpen && !isZoomed && (
              <button
                type="button"
                onClick={goPrev}
                className="fixed left-3 top-1/2 -translate-y-1/2 z-[10000] flex items-center justify-center h-12 w-12 rounded-full bg-white/80 text-black shadow-xl hover:bg-white active:bg-gray-200 transition-colors"
                aria-label="Poprzednie zdjęcie"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            )}

            {/* Right arrow */}
            {hasMultiple && !annotationOpen && !isZoomed && (
              <button
                type="button"
                onClick={goNext}
                className="fixed right-3 top-1/2 -translate-y-1/2 z-[10000] flex items-center justify-center h-12 w-12 rounded-full bg-white/80 text-black shadow-xl hover:bg-white active:bg-gray-200 transition-colors"
                aria-label="Następne zdjęcie"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            )}

            {/* Counter */}
            {hasMultiple && !annotationOpen && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] bg-black/60 text-white px-4 py-1.5 rounded-full text-sm font-medium">
                {currentIndex + 1} / {photos.length}
              </div>
            )}

            {/* Fullscreen image with zoom/pan */}
            <div
              className="touch-none select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={currentPhoto}
                alt="Zdjęcie uszkodzenia"
                className="max-w-full max-h-full object-contain transition-transform duration-75"
                style={{
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                  transformOrigin: 'center center',
                }}
                onClick={handleImageClick}
                draggable={false}
              />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {onAnnotate && (
        <PhotoAnnotationDialog
          open={annotationOpen}
          onOpenChange={setAnnotationOpen}
          photoUrl={currentPhoto}
          onSave={handleAnnotateSave}
        />
      )}
    </>
  );
};
