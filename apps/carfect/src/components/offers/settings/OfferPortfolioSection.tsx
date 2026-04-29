import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/ui';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui';
import { useState } from 'react';
import { usePortfolioPhotos } from '../usePortfolioPhotos';

interface OfferPortfolioSectionProps {
  instanceId: string;
}

export const OfferPortfolioSection = ({ instanceId }: OfferPortfolioSectionProps) => {
  const { t } = useTranslation();
  const { photos, loading, uploadProgress, uploadFiles, removePhoto } =
    usePortfolioPhotos(instanceId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      await uploadFiles(files);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isUploading = uploadProgress !== null;
  const percent = uploadProgress
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-medium">{t('offers.portfolio.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('offers.portfolio.description')}</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('offers.portfolio.uploadingProgress', { percent })}
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              {t('offers.portfolio.addPhotos')}
            </>
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          {t('offers.portfolio.photoCount', { count: photos.length })}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('common.loading')}
        </div>
      ) : photos.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
          {t('offers.portfolio.empty')}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted group"
            >
              <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              <button
                type="button"
                onClick={() => setConfirmDeleteId(photo.id)}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-sm hover:scale-110 transition-transform"
                aria-label={t('offers.portfolio.deletePhoto')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('offers.portfolio.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('offers.portfolio.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmDeleteId) await removePhoto(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
