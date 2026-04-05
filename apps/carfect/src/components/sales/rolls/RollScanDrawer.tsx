import { X, Loader2, ScanLine } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui';
import { Button, EmptyState } from '@shared/ui';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { useRollScan } from '../hooks/useRollScan';
import { createRollsBatch } from '../services/rollService';
import { supabase } from '@/integrations/supabase/client';
import RollScanUploadZone from './RollScanUploadZone';
import RollScanProgressList from './RollScanProgressList';
import RollScanResultsTable from './RollScanResultsTable';

interface RollScanDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  onSaved?: () => void;
}

const RollScanDrawer = ({ open, onOpenChange, instanceId, onSaved }: RollScanDrawerProps) => {
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scan = useRollScan({ instanceId });

  const handleClose = () => {
    if (scan.processing) {
      scan.abort();
    }
    scan.reset();
    onOpenChange(false);
  };

  const savableResults = scan.results.filter(
    (r) => r.status === 'confirmed' || r.status === 'review',
  );

  const handleSave = async () => {
    if (saving) return;
    if (savableResults.length === 0) {
      toast.error('Brak rolek do zapisania');
      return;
    }
    setSaving(true);

    for (const item of savableResults) {
      const d = item.extractedData;
      if (!d.productName || !d.widthMm || !d.lengthM) {
        toast.error(
          `Rolka "${d.productName || 'bez nazwy'}" nie ma wymaganych danych (nazwa, szerokość, długość)`,
        );
        setSaving(false);
        return;
      }
    }

    // Check productCode uniqueness
    const productCodes = savableResults
      .map((r) => r.extractedData.productCode)
      .filter((code): code is string => !!code);

    const batchDupes = productCodes.filter((code, i) => productCodes.indexOf(code) !== i);
    if (batchDupes.length > 0) {
      toast.error(
        `Zduplikowane kody produktów w skanowaniu: ${[...new Set(batchDupes)].join(', ')}`,
      );
      setSaving(false);
      return;
    }

    if (productCodes.length > 0) {
      const { data: existing } = await supabase
        .from('sales_rolls')
        .select('product_code')
        .eq('instance_id', instanceId)
        .eq('status', 'active')
        .in('product_code', productCodes);

      const existingCodes = (existing || []).map((r) => r.product_code);
      if (existingCodes.length > 0) {
        toast.error(`Rolki z tymi kodami już istnieją: ${existingCodes.join(', ')}`);
        setSaving(false);
        return;
      }
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const rollsToCreate = savableResults.map((item) => ({
        instanceId,
        brand: item.extractedData.brand || 'ULTRAFIT',
        productName: item.extractedData.productName!,
        description: item.extractedData.description,
        productCode: item.extractedData.productCode,
        barcode: item.extractedData.barcode,
        widthMm: Number(item.extractedData.widthMm),
        lengthM: Number(item.extractedData.lengthM),
        initialRemainingMb:
          item.extractedData.remainingMb != null
            ? Number(item.extractedData.remainingMb)
            : undefined,
        photoUrl: item.photoUrl,
        extractionConfidence: item.confidence,
        createdBy: user?.id ?? null,
      }));

      await createRollsBatch(rollsToCreate);
      toast.success(
        `Zapisano ${savableResults.length} ${savableResults.length === 1 ? 'rolkę' : 'rolek'}`,
      );
      scan.reset();
      onOpenChange(false);
      onSaved?.();
    } catch (err: unknown) {
      toast.error('Błąd zapisu: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:w-[1000px] sm:max-w-[1000px] flex flex-col bg-white p-0 gap-0"
        hideCloseButton
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 px-6 py-4 border-b shrink-0">
          <SheetTitle>Skanowanie rolek</SheetTitle>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full bg-white hover:bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {scan.results.length === 0 && !scan.processing ? (
            <EmptyState
              icon={ScanLine}
              title="Wgraj zdjęcia etykiet rolek"
              description="Obsługiwane formaty: JPG, PNG, HEIC. Możesz wgrać wiele zdjęć na raz."
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    scan.addFiles(
                      Array.from(e.target.files).filter((f) => f.type.startsWith('image/')),
                    );
                    e.target.value = '';
                  }
                }}
              />
              <Button className="mt-2" onClick={() => fileInputRef.current?.click()}>
                Wgraj rolki
              </Button>
            </EmptyState>
          ) : (
            <RollScanUploadZone onFilesSelected={scan.addFiles} disabled={scan.processing} />
          )}

          <RollScanProgressList
            results={scan.results}
            currentIndex={scan.currentIndex}
            totalCount={scan.totalCount}
            processing={scan.processing}
          />

          <RollScanResultsTable
            results={scan.results}
            onRemove={scan.removeResult}
            onRetry={scan.retryFile}
            onUpdateField={scan.updateExtractedField}
          />
        </div>

        <div className="shrink-0 border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            {scan.results.length > 0 ? 'Anuluj' : 'Zamknij'}
          </Button>
          {savableResults.length > 0 && (
            <Button onClick={handleSave} disabled={saving || scan.processing}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Zapisz {savableResults.length} {savableResults.length === 1 ? 'rolkę' : 'rolek'}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RollScanDrawer;
