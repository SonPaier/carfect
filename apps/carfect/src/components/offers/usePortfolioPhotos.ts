import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  compressImage,
  shouldSkipCompression,
  getFileExtension,
  getContentType,
} from '@shared/utils';

const BUCKET = 'offer-portfolio';
const COMPRESS_MAX_WIDTH = 2000;
const COMPRESS_QUALITY = 0.85;
// Files above this size are skipped silently (with an info toast) — the
// browser canvas decoder OOMs on RAW/huge PSD-JPEGs, so it's better to
// upload the rest of the batch than fail the whole operation.
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export interface PortfolioPhoto {
  id: string;
  url: string;
  sort_order: number;
  created_at: string;
}

interface UploadProgress {
  current: number;
  total: number;
}

const extractStoragePath = (publicUrl: string): string | null => {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
};

/**
 * Manage an instance's portfolio of offer photos.
 * Provides loading, optimistic upload to Supabase Storage + DB, and delete with
 * CASCADE-aware UX (callers should warn the admin before invoking remove).
 *
 * `enabled=false` skips the initial fetch — useful when the consuming UI is
 * hidden (closed drawer, inactive tab) and we don't want to incur a query.
 */
export const usePortfolioPhotos = (instanceId: string, enabled: boolean = true) => {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  // Start `false` regardless of `enabled`; the effect flips to `true` while
  // it actually fetches. Otherwise consumers passing `enabled=false` (e.g. a
  // closed drawer) would render a forever-spinner.
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('instance_portfolio_photos')
      .select('id, url, sort_order, created_at')
      .eq('instance_id', instanceId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading portfolio photos:', error);
      toast.error(t('offers.portfolio.loadError'));
      setPhotos([]);
    } else {
      setPhotos((data ?? []) as PortfolioPhoto[]);
    }
    setLoading(false);
  }, [instanceId, t]);

  useEffect(() => {
    if (!instanceId || !enabled) return;
    void reload();
  }, [instanceId, enabled, reload]);

  const uploadFiles = useCallback(
    async (files: FileList | File[]): Promise<PortfolioPhoto[]> => {
      const allFiles = Array.from(files);
      if (allFiles.length === 0) return [];

      const fileArray = allFiles.filter((f) => f.size <= MAX_FILE_BYTES);
      const skippedCount = allFiles.length - fileArray.length;
      if (skippedCount > 0) {
        toast.info(
          t('offers.portfolio.fileTooLargeSkipped', {
            count: skippedCount,
            limit: MAX_FILE_BYTES / (1024 * 1024),
          }),
        );
      }
      if (fileArray.length === 0) return [];

      setUploadProgress({ current: 0, total: fileArray.length });
      const uploaded: PortfolioPhoto[] = [];

      try {
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          const skipCompress = shouldSkipCompression(file);
          const blob = skipCompress
            ? file
            : await compressImage(file, COMPRESS_MAX_WIDTH, COMPRESS_QUALITY);
          const ext = getFileExtension(file);
          const contentType = getContentType(file);
          const photoId = crypto.randomUUID();
          const path = `${instanceId}/${photoId}${ext}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, blob, { contentType, cacheControl: '3600', upsert: false });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

          // Compute sort_order from current state to avoid colliding indexes
          // when uploads are kicked off in quick succession.
          const sortOrder =
            photos.reduce((max, p) => Math.max(max, p.sort_order), -1) + uploaded.length + 1;

          const { data: row, error: insertError } = await supabase
            .from('instance_portfolio_photos')
            .insert({
              id: photoId,
              instance_id: instanceId,
              url: urlData.publicUrl,
              sort_order: sortOrder,
            })
            .select('id, url, sort_order, created_at')
            .single();

          if (insertError) {
            // Best-effort cleanup: remove orphan storage object so the next
            // attempt does not silently leak files into the bucket.
            await supabase.storage.from(BUCKET).remove([path]);
            throw insertError;
          }

          uploaded.push(row as PortfolioPhoto);
          setUploadProgress({ current: i + 1, total: fileArray.length });
        }

        setPhotos((prev) => [...prev, ...uploaded]);
        toast.success(t('offers.portfolio.uploadSuccess', { count: uploaded.length }));
        return uploaded;
      } catch (error) {
        console.error('Error uploading portfolio photos:', error);
        toast.error(t('offers.portfolio.uploadError'));
        throw error;
      } finally {
        setUploadProgress(null);
      }
    },
    [instanceId, photos, t],
  );

  const removePhoto = useCallback(
    async (photoId: string) => {
      const target = photos.find((p) => p.id === photoId);
      if (!target) return;

      const { error: deleteError } = await supabase
        .from('instance_portfolio_photos')
        .delete()
        .eq('id', photoId);

      if (deleteError) {
        console.error('Error deleting portfolio photo:', deleteError);
        toast.error(t('offers.portfolio.deleteError'));
        return;
      }

      // Cascade in DB takes care of offer_portfolio_photos. Storage object is
      // best-effort: leftover blobs cost nothing but a DB delete that succeeded
      // shouldn't be rolled back if the storage call fails.
      const path = extractStoragePath(target.url);
      if (path) {
        const { error: storageError } = await supabase.storage.from(BUCKET).remove([path]);
        if (storageError) console.error('Error deleting portfolio storage object:', storageError);
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast.success(t('offers.portfolio.deleteSuccess'));
    },
    [photos, t],
  );

  return {
    photos,
    loading,
    uploadProgress,
    uploadFiles,
    removePhoto,
    reload,
  };
};
