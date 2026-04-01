import { useRef } from 'react';
import { XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@shared/ui';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@shared/ui';
import type { RollScanResult } from '../types/rolls';

interface RollScanResultsTableProps {
  results: RollScanResult[];
  onRemove: (tempId: string) => void;
  onRetry?: (tempId: string, file: File) => void;
}

const RollScanResultsTable = ({
  results,
  onRemove,
  onRetry,
}: RollScanResultsTableProps) => {
  const readyResults = results.filter(
    (r) => r.status === 'review' || r.status === 'confirmed' || r.status === 'error'
  );

  if (readyResults.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">
        Odczytane rolki ({readyResults.length})
      </h3>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Marka</TableHead>
              <TableHead>Produkt</TableHead>
              <TableHead>Kod produktu</TableHead>
              <TableHead>Kod kreskowy</TableHead>
              <TableHead>Szer. (mm)</TableHead>
              <TableHead>Dł. (m)</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {readyResults.map((item) => {
              if (item.status === 'error') {
                return (
                  <ErrorRow
                    key={item.tempId}
                    item={item}
                    onRemove={onRemove}
                    onRetry={onRetry}
                  />
                );
              }

              const d = item.extractedData;
              return (
                <TableRow key={item.tempId}>
                  <TableCell>
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="w-8 h-8 rounded object-cover"
                    />
                  </TableCell>
                  <TableCell className="text-xs">{d.brand || '—'}</TableCell>
                  <TableCell className="text-xs">{d.productName || '—'}</TableCell>
                  <TableCell className="text-xs font-mono">{d.productCode || '—'}</TableCell>
                  <TableCell className="text-xs font-mono">{d.barcode || '—'}</TableCell>
                  <TableCell className="text-xs">{d.widthMm || '—'}</TableCell>
                  <TableCell className="text-xs">{d.lengthM || '—'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(item.tempId)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

function ErrorRow({
  item,
  onRemove,
  onRetry,
}: {
  item: RollScanResult;
  onRemove: (tempId: string) => void;
  onRetry?: (tempId: string, file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <TableRow className="bg-amber-50">
      <TableCell>
        <img
          src={item.thumbnailUrl}
          alt=""
          className="w-8 h-8 rounded object-cover opacity-60"
        />
      </TableCell>
      <TableCell colSpan={5}>
        <div className="space-y-1">
          <p className="text-xs font-medium text-amber-800">
            Nie udało się odczytać — {item.error}
          </p>
          {onRetry && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onRetry(item.tempId, file);
                  e.target.value = '';
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <RefreshCw className="w-3 h-3" />
                Wgraj ponownie
              </Button>
            </>
          )}
        </div>
      </TableCell>
      <TableCell colSpan={1} />
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(item.tempId)}
        >
          <XCircle className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default RollScanResultsTable;
