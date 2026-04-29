import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui';
import { Image as ImageIcon } from 'lucide-react';
import { PhotoFullscreenDialog } from '@/components/protocols/PhotoFullscreenDialog';
import { cn } from '@/lib/utils';

export interface PublicOfferGalleryPhoto {
  id: string;
  url: string;
  sort_order?: number;
}

interface Branding {
  offer_section_bg_color: string;
  offer_section_text_color: string;
}

interface PublicOfferGalleryProps {
  photos: PublicOfferGalleryPhoto[];
  branding: Branding;
}

export const PublicOfferGallery = ({ photos, branding }: PublicOfferGalleryProps) => {
  const { t } = useTranslation();
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  const ordered = [...photos].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const urls = ordered.map((p) => p.url);

  return (
    <>
      <Card
        className="border"
        style={{
          backgroundColor: branding.offer_section_bg_color,
          borderColor: '#e0e0e0',
        }}
      >
        <CardHeader className="pb-3">
          <CardTitle
            className="flex items-center gap-2 text-base"
            style={{ color: branding.offer_section_text_color }}
          >
            <ImageIcon className="w-4 h-4" />
            {t('publicOffer.galleryTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ordered.map((photo, idx) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setFullscreenIndex(idx)}
                className={cn(
                  'relative aspect-[4/3] rounded-lg overflow-hidden bg-muted',
                  'group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary',
                )}
              >
                <img
                  src={photo.url}
                  alt={t('publicOffer.galleryPhotoAlt', { index: idx + 1 })}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <PhotoFullscreenDialog
        open={fullscreenIndex !== null}
        onOpenChange={(open) => !open && setFullscreenIndex(null)}
        photoUrl={fullscreenIndex !== null ? urls[fullscreenIndex] : null}
        allPhotos={urls}
        initialIndex={fullscreenIndex ?? 0}
      />
    </>
  );
};
