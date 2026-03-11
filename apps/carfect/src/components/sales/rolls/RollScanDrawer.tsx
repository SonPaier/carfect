import { X, Loader2, Save } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@shared/ui';
import { Button } from '@shared/ui';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRollScan } from '../hooks/useRollScan';
import { createRollsBatch } from '../services/rollService';
import RollScanUploadZone from './RollScanUploadZone';
import RollScanProgressList from './RollScanProgressList';
import RollScanResultsTable from './RollScanResultsTable';

interface RollScanDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string | null;
  onSaved?: () => void;
}

const RollScanDrawer = ({
  open,
  onOpenChange,
  instanceId,
  onSaved,
}: RollScanDrawerProps) => {
  const [saving, setSaving] = useState(false);

  const scan = useRollScan({ instanceId });

  const handleClose = () => {
    if (scan.processing) {
      scan.abort();
    }
    scan.reset();
    onOpenChange(false);
  };

  const handleSaveConfirmed = async () => {
    if (!instanceId) return;

    const confirmed = scan.confirmedResults;
    if (confirmed.length === 0) {
      toast.error('Brak potwierdzonych rolek do zapisania');
      return;
    }

    // Validate all confirmed have required fields
    for (const item of confirmed) {
      const d = item.extractedData;
      if (!d.productName || !d.widthMm || !d.lengthM) {
        toast.error(
          `Rolka "${d.productName || 'bez nazwy'}" nie ma wymaganych danych (nazwa, szerokość, długość)`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const rollsToCreate = confirmed.map((item) => ({
        instanceId,
        brand: item.extractedData.brand || 'ULTRAFIT',
        productName: item.extractedData.productName!,
        description: item.extractedData.description,
        productCode: item.extractedData.productCode,
        barcode: item.extractedData.barcode,
        widthMm: Number(item.extractedData.widthMm),
        lengthM: Number(item.extractedData.lengthM),
        deliveryDate: item.extractedData.deliveryDate,
        photoUrl: item.photoUrl,
        extractionConfidence: item.confidence,
      }));

      await createRollsBatch(rollsToCreate);
      toast.success(`Zapisano ${confirmed.length} ${confirmed.length === 1 ? 'rolkę' : 'rolek'}`);
      scan.reset();
      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      toast.error('Błąd zapisu: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-4xl flex flex-col"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b">
          <SheetTitle>Skanowanie rolek</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Upload zone */}
          <RollScanUploadZone
            onFilesSelected={scan.addFiles}
            disabled={scan.processing}
          />

          {/* Progress */}
          <RollScanProgressList
            results={scan.results}
            currentIndex={scan.currentIndex}
            totalCount={scan.totalCount}
            processing={scan.processing}
          />

          {/* Error summary */}
          {scan.errorResults.length > 0 && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-800">
                {scan.errorResults.length}{' '}
                {scan.errorResults.length === 1
                  ? 'zdjęcie nie zostało przetworzone'
                  : 'zdjęć nie zostało przetworzonych'}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Sprawdź czy zdjęcia są wyraźne i zawierają etykietę rolki. Możesz dodać nowe zdjęcia.
              </p>
            </div>
          )}

          {/* Results table */}
          <RollScanResultsTable
            results={scan.results}
            onUpdateField={scan.updateExtractedField}
            onConfirm={scan.confirmResult}
            onConfirmAll={scan.confirmAll}
            onRemove={scan.removeResult}
          />
        </div>

        <SheetFooter className="border-t pt-4 gap-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            {scan.results.length > 0 ? 'Anuluj' : 'Zamknij'}
          </Button>
          {scan.confirmedResults.length > 0 && (
            <Button onClick={handleSaveConfirmed} disabled={saving || scan.processing}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Zapisz {scan.confirmedResults.length}{' '}
              {scan.confirmedResults.length === 1 ? 'rolkę' : 'rolek'}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default RollScanDrawer;
