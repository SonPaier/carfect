import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_PHOTOS = 8;

export interface PhotoUploadOptions {
  reservationId: string;
  currentPhotos: string[];
  onPhotosUpdated: (newPhotos: string[]) => void;
}

/**
 * Creates a file input and triggers a photo upload flow for a reservation.
 * Compresses images before uploading to Supabase Storage.
 */
export function triggerReservationPhotoUpload(options: PhotoUploadOptions): void {
  const { reservationId, currentPhotos, onPhotosUpdated } = options;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.multiple = true;
  fileInput.capture = 'environment';

  fileInput.onchange = async (e) => {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - currentPhotos.length;

    if (remainingSlots <= 0) {
      toast.error(`Maksymalna liczba zdjęć: ${MAX_PHOTOS}`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    try {
      const uploadedUrls: string[] = [];
      const { compressImage } = await import('@/lib/imageUtils');

      for (const file of filesToUpload) {
        const compressed = await compressImage(file, 1200, 0.8);
        const fileName = `reservation-${reservationId}-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('reservation-photos')
          .upload(fileName, compressed, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('reservation-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      const newPhotos = [...currentPhotos, ...uploadedUrls];

      const { error: updateError } = await supabase
        .from('reservations')
        .update({ photo_urls: newPhotos })
        .eq('id', reservationId);

      if (updateError) throw updateError;

      onPhotosUpdated(newPhotos);
      toast.success(`Dodano ${uploadedUrls.length} zdjęć`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Błąd podczas przesyłania zdjęć');
    }
  };

  fileInput.click();
}
