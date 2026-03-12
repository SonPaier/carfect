import { useState, useCallback, useRef } from 'react';
import type { RollScanResult, RollScanStatus } from '../types/rolls';
import {
  extractRollData,
  uploadRollPhoto,
  fileToBase64,
} from '../services/rollService';

interface UseRollScanArgs {
  instanceId: string | null;
}

export function useRollScan({ instanceId }: UseRollScanArgs) {
  const [results, setResults] = useState<RollScanResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const abortRef = useRef(false);

  const updateResult = useCallback(
    (tempId: string, updates: Partial<RollScanResult>) => {
      setResults((prev) =>
        prev.map((r) => (r.tempId === tempId ? { ...r, ...updates } : r))
      );
    },
    []
  );

  const updateExtractedField = useCallback(
    (tempId: string, field: string, value: unknown) => {
      setResults((prev) =>
        prev.map((r) =>
          r.tempId === tempId
            ? { ...r, extractedData: { ...r.extractedData, [field]: value } }
            : r
        )
      );
    },
    []
  );

  const confirmResult = useCallback((tempId: string) => {
    updateResult(tempId, { status: 'confirmed' });
  }, [updateResult]);

  const confirmAll = useCallback(() => {
    setResults((prev) =>
      prev.map((r) =>
        r.status === 'review' ? { ...r, status: 'confirmed' } : r
      )
    );
  }, []);

  const removeResult = useCallback((tempId: string) => {
    setResults((prev) => prev.filter((r) => r.tempId !== tempId));
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setProcessing(false);
    setCurrentIndex(0);
    setTotalCount(0);
    abortRef.current = false;
  }, []);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!instanceId) return;

      abortRef.current = false;

      // Create initial entries
      const newResults: RollScanResult[] = files.map((file) => ({
        tempId: crypto.randomUUID(),
        file,
        thumbnailUrl: URL.createObjectURL(file),
        extractedData: {},
        confidence: {},
        warnings: [],
        status: 'uploading' as RollScanStatus,
      }));

      let startIdx = 0;
      setResults((prev) => {
        startIdx = prev.length;
        return [...prev, ...newResults];
      });
      setTotalCount((prev) => prev + files.length);
      setProcessing(true);

      // Process sequentially
      for (let i = 0; i < newResults.length; i++) {
        if (abortRef.current) break;

        const item = newResults[i];
        setCurrentIndex(startIdx + i + 1);

        try {
          // Step 1: Upload photo
          updateResult(item.tempId, { status: 'uploading' });
          const photoUrl = await uploadRollPhoto(item.file, instanceId);
          updateResult(item.tempId, { photoUrl });

          // Step 2: Extract data via AI
          updateResult(item.tempId, { status: 'extracting' });
          const base64 = await fileToBase64(item.file);
          const mediaType = item.file.type || 'image/jpeg';
          const extracted = await extractRollData(base64, mediaType);

          updateResult(item.tempId, {
            status: 'confirmed',
            photoUrl,
            extractedData: {
              brand: extracted.brand,
              productName: extracted.productName,
              description: extracted.description,
              productCode: extracted.productCode,
              barcode: extracted.barcode,
              widthMm: extracted.widthMm,
              lengthM: extracted.lengthM,
              deliveryDate: extracted.deliveryDate || undefined,
            },
            confidence: extracted.confidence || {},
            warnings: extracted.warnings || [],
          });
        } catch (err: any) {
          updateResult(item.tempId, {
            status: 'error',
            error: err.message || 'Nieznany błąd',
          });
        }
      }

      setProcessing(false);
    },
    [instanceId, updateResult]
  );

  const confirmedResults = results.filter((r) => r.status === 'confirmed');
  const reviewResults = results.filter((r) => r.status === 'review');
  const errorResults = results.filter((r) => r.status === 'error');

  return {
    results,
    processing,
    currentIndex,
    totalCount,
    confirmedResults,
    reviewResults,
    errorResults,
    addFiles,
    updateResult,
    updateExtractedField,
    confirmResult,
    confirmAll,
    removeResult,
    reset,
    abort,
  };
}
