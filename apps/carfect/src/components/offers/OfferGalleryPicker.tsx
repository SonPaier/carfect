import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui';
import { Camera, Check, Grid3x3, Loader2, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { OfferGalleryPhoto } from '@/hooks/useOfferTypes';
import { MAX_GALLERY_PHOTOS } from '@/hooks/useOfferTypes';
import { usePortfolioPhotos } from './usePortfolioPhotos';

interface OfferGalleryPickerProps {
  open: boolean;
  onClose: () => void;
  instanceId: string;
  initialSelection: OfferGalleryPhoto[];
  onConfirm: (selection: OfferGalleryPhoto[]) => void;
}

export const OfferGalleryPicker = ({
  open,
  onClose,
  instanceId,
  initialSelection,
  onConfirm,
}: OfferGalleryPickerProps) => {
  const { t } = useTranslation();
  const { photos, loading, uploadProgress, uploadFiles } = usePortfolioPhotos(instanceId, open);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelection.map((p) => p.id));
  // Always start in grid mode each time the drawer opens. Full-width is a
  // one-off "look closer" tool, not a persistent preference.
  const [viewMode, setViewMode] = useState<'grid' | 'full'>('grid');

  // Reset selection (and view mode) whenever the drawer opens.
  useEffect(() => {
    if (open) {
      setSelectedIds(initialSelection.map((p) => p.id));
      setViewMode('grid');
    }
  }, [open, initialSelection]);

  const isUploading = uploadProgress !== null;
  const percent = uploadProgress
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
    : 0;

  const photosById = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);

  const toggle = (photoId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      }
      if (prev.length >= MAX_GALLERY_PHOTOS) {
        toast.error(t('offers.gallery.maxSelectionError', { count: MAX_GALLERY_PHOTOS }));
        return prev;
      }
      return [...prev, photoId];
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const uploaded = await uploadFiles(files);
      // Auto-select newly uploaded photos up to the offer limit.
      setSelectedIds((prev) => {
        const remaining = Math.max(0, MAX_GALLERY_PHOTOS - prev.length);
        const additions = uploaded.slice(0, remaining).map((p) => p.id);
        return [...prev, ...additions];
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    const result: OfferGalleryPhoto[] = selectedIds
      .map((id) => photosById.get(id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined)
      .map((p) => ({ id: p.id, url: p.url }));
    onConfirm(result);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col" hideCloseButton>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-50 p-2 rounded-full bg-white hover:bg-hover transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>

        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle>{t('offers.gallery.pickerTitle')}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {t('offers.gallery.pickerSubtitle', {
                  selected: selectedIds.length,
                  max: MAX_GALLERY_PHOTOS,
                })}
              </p>
            </div>
            <div className="flex items-center gap-1 mr-10">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                aria-label={t('offers.gallery.viewModeGrid')}
                className={cn(
                  'p-2 rounded-md border transition-colors',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white border-border hover:bg-hover',
                )}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('full')}
                aria-pressed={viewMode === 'full'}
                aria-label={t('offers.gallery.viewModeFull')}
                className={cn(
                  'p-2 rounded-md border transition-colors',
                  viewMode === 'full'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white border-border hover:bg-hover',
                )}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mb-4"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('offers.portfolio.uploadingProgress', { percent })}
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                {t('offers.gallery.uploadAndSelect')}
              </>
            )}
          </Button>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('common.loading')}
            </div>
          ) : photos.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
              {t('offers.gallery.emptyPortfolio')}
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-3',
                viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1',
              )}
            >
              {photos.map((photo) => {
                const isSelected = selectedIds.includes(photo.id);
                const orderIndex = isSelected ? selectedIds.indexOf(photo.id) + 1 : null;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => toggle(photo.id)}
                    className={cn(
                      'relative rounded-lg overflow-hidden bg-muted text-left',
                      'border-2 transition-all focus:outline-none',
                      viewMode === 'grid' ? 'aspect-[4/3]' : '',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-transparent hover:border-muted-foreground/30',
                    )}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className={cn(
                        'w-full',
                        viewMode === 'grid' ? 'h-full object-cover' : 'h-auto object-contain',
                      )}
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-semibold shadow-md">
                        {orderIndex}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between gap-3 bg-background">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            <Check className="w-4 h-4 mr-2" />
            {t('offers.gallery.applySelection', { count: selectedIds.length })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
