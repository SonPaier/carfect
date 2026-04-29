import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/ui';
import { Image as ImageIcon, Pencil, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { OfferGalleryPhoto } from '@/hooks/useOfferTypes';
import { MAX_GALLERY_PHOTOS } from '@/hooks/useOfferTypes';
import { OfferGalleryPicker } from './OfferGalleryPicker';

interface OfferGalleryEditorProps {
  instanceId: string;
  photos: OfferGalleryPhoto[];
  onChange: (photos: OfferGalleryPhoto[]) => void;
}

export const OfferGalleryEditor = ({ instanceId, photos, onChange }: OfferGalleryEditorProps) => {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);

  const move = (index: number, delta: number) => {
    const next = [...photos];
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= next.length) return;
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onChange(next);
  };

  const remove = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  return (
    <section className="border border-border rounded-lg bg-white p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            {t('offers.gallery.editorTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('offers.gallery.editorDescription', {
              count: photos.length,
              max: MAX_GALLERY_PHOTOS,
            })}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPickerOpen(true)}
          className="shrink-0"
        >
          <Pencil className="w-4 h-4 mr-2" />
          {t('offers.gallery.managePhotos')}
        </Button>
      </div>

      {photos.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
          {t('offers.gallery.editorEmpty')}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted group"
            >
              <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              <button
                type="button"
                onClick={() => remove(photo.id)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-90"
                aria-label={t('offers.gallery.removeFromOffer')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="bg-white/90 rounded-full p-1 shadow-sm disabled:opacity-30"
                  aria-label={t('offers.gallery.moveLeft')}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-medium bg-white/90 rounded px-1.5 py-0.5">
                  {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === photos.length - 1}
                  className="bg-white/90 rounded-full p-1 shadow-sm disabled:opacity-30"
                  aria-label={t('offers.gallery.moveRight')}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <OfferGalleryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        instanceId={instanceId}
        initialSelection={photos}
        onConfirm={onChange}
      />
    </section>
  );
};
