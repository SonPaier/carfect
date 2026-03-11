import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhotoFullscreenDialog } from '@/components/protocols/PhotoFullscreenDialog';

interface ScopePhotoCarouselProps {
  photos: string[];
  className?: string;
}

export const ScopePhotoCarousel = ({ photos, className }: ScopePhotoCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  if (photos.length === 0) return null;

  const goTo = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <>
      <div className={cn("relative w-full", className)}>
        {/* Main image */}
        <div
          className="w-full aspect-[4/3] rounded-lg overflow-hidden cursor-pointer bg-muted"
          onClick={() => setFullscreenPhoto(photos[currentIndex])}
        >
          <img
            src={photos[currentIndex]}
            alt={`Zdjęcie ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goTo((currentIndex - 1 + photos.length) % photos.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-border flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goTo((currentIndex + 1) % photos.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-border flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goTo(idx); }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    idx === currentIndex ? "bg-white" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <PhotoFullscreenDialog
        open={!!fullscreenPhoto}
        onOpenChange={(open) => !open && setFullscreenPhoto(null)}
        photoUrl={fullscreenPhoto}
        allPhotos={photos}
        initialIndex={fullscreenPhoto ? photos.indexOf(fullscreenPhoto) : 0}
      />
    </>
  );
};
