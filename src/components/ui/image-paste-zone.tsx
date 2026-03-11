import { useState } from 'react';
import { Loader2, X, ClipboardPaste } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageUtils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { PhotoFullscreenDialog } from '@/components/protocols/PhotoFullscreenDialog';

interface ImagePasteZoneProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  bucketName?: string;
  pathPrefix?: string;
  maxImages?: number;
  disabled?: boolean;
  label?: string;
}

export const ImagePasteZone = ({
  images,
  onImagesChange,
  bucketName = 'order-attachments',
  pathPrefix = '',
  maxImages = 10,
  disabled = false,
  label = 'Formatki',
}: ImagePasteZoneProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const uploadImage = async (file: File) => {
    if (images.length >= maxImages) {
      toast.error(`Maksymalnie ${maxImages} obrazów`);
      return;
    }

    setUploading(true);
    try {
      const blob = await compressImage(file, 1200, 0.8);
      const uuid = crypto.randomUUID();
      const fileName = pathPrefix ? `${pathPrefix}/${uuid}.jpg` : `${uuid}.jpg`;

      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      onImagesChange([...images, urlData.publicUrl]);
      toast.success('Obraz wklejony');
    } catch (err) {
      console.error('Paste upload error:', err);
      toast.error('Błąd podczas wklejania obrazu');
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (disabled || uploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        await uploadImage(file);
        break;
      }
    }
  };

  const handleRemove = async (index: number) => {
    const url = images[index];
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    try {
      const parts = url.split('/');
      const bucketIndex = parts.indexOf(bucketName);
      if (bucketIndex !== -1) {
        const storagePath = parts.slice(bucketIndex + 1).join('/');
        await supabase.storage.from(bucketName).remove([storagePath]);
      }
    } catch (err) {
      console.error('Error deleting from storage:', err);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <Label className="text-sm">{label}</Label>}
      <div
        tabIndex={0}
        onPaste={handlePaste}
        className={cn(
          'outline-none',
          disabled && 'opacity-50 pointer-events-none',
        )}
      >
        <div className="flex flex-wrap gap-2">
          {images.map((url, index) => (
            <div key={url} className="relative w-20 h-20 group">
              <img
                src={url}
                alt={`Formatka ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border cursor-pointer"
                onClick={() => { setPreviewIndex(index); setPreviewOpen(true); }}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {images.length < maxImages && (
            <div
              className={cn(
                'w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30',
                'flex flex-col items-center justify-center gap-1 bg-background',
                'transition-colors cursor-pointer',
                'focus-within:border-primary hover:border-muted-foreground/50',
              )}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <ClipboardPaste className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">
                    Ctrl+V
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <PhotoFullscreenDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        photoUrl={images[previewIndex] || null}
        allPhotos={images}
        initialIndex={previewIndex}
      />
    </div>
  );
};
