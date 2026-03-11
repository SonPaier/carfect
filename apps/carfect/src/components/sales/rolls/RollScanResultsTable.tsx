import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Input, Button, Badge } from '@shared/ui';
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
  onUpdateField: (tempId: string, field: string, value: unknown) => void;
  onConfirm: (tempId: string) => void;
  onConfirmAll: () => void;
  onRemove: (tempId: string) => void;
}

const CONFIDENCE_THRESHOLD_WARN = 0.8;
const CONFIDENCE_THRESHOLD_ERROR = 0.5;

function confidenceClass(confidence: number | undefined): string {
  if (confidence === undefined) return '';
  if (confidence < CONFIDENCE_THRESHOLD_ERROR) return 'bg-red-50 border-red-200';
  if (confidence < CONFIDENCE_THRESHOLD_WARN) return 'bg-yellow-50 border-yellow-200';
  return '';
}

function ConfidenceBadge({ value }: { value: number | undefined }) {
  if (value === undefined) return null;
  if (value >= CONFIDENCE_THRESHOLD_WARN) return null;

  return value < CONFIDENCE_THRESHOLD_ERROR ? (
    <AlertTriangle className="w-3.5 h-3.5 text-destructive inline ml-1" />
  ) : (
    <AlertTriangle className="w-3.5 h-3.5 text-orange-500 inline ml-1" />
  );
}

const RollScanResultsTable = ({
  results,
  onUpdateField,
  onConfirm,
  onConfirmAll,
  onRemove,
}: RollScanResultsTableProps) => {
  const reviewableResults = results.filter(
    (r) => r.status === 'review' || r.status === 'confirmed'
  );

  if (reviewableResults.length === 0) return null;

  const allConfirmed = reviewableResults.every((r) => r.status === 'confirmed');
  const hasUnconfirmed = reviewableResults.some((r) => r.status === 'review');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Wyniki ekstrakcji ({reviewableResults.length})
        </h3>
        {hasUnconfirmed && (
          <Button size="sm" variant="outline" onClick={onConfirmAll}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Potwierdź wszystkie
          </Button>
        )}
      </div>

      {/* Low confidence warning */}
      {reviewableResults.some((r) =>
        Object.values(r.confidence).some(
          (c) => c < CONFIDENCE_THRESHOLD_WARN
        )
      ) && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Uwaga: niektóre pola mają niską pewność odczytu</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Pola zaznaczone na żółto/czerwono mogą zawierać błędy. Zweryfikuj je przed zapisaniem.
            </p>
          </div>
        </div>
      )}

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
              <TableHead>Data dostawy</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviewableResults.map((item) => {
              const d = item.extractedData;
              const c = item.confidence;
              const isConfirmed = item.status === 'confirmed';

              return (
                <TableRow
                  key={item.tempId}
                  className={isConfirmed ? 'bg-green-50/50' : ''}
                >
                  {/* Thumbnail */}
                  <TableCell>
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="w-8 h-8 rounded object-cover"
                    />
                  </TableCell>

                  {/* Brand */}
                  <TableCell>
                    <Input
                      value={d.brand || ''}
                      onChange={(e) =>
                        onUpdateField(item.tempId, 'brand', e.target.value)
                      }
                      className={`h-8 text-xs w-24 ${confidenceClass(c.brand)}`}
                      disabled={isConfirmed}
                    />
                    <ConfidenceBadge value={c.brand} />
                  </TableCell>

                  {/* Product name */}
                  <TableCell>
                    <Input
                      value={d.productName || ''}
                      onChange={(e) =>
                        onUpdateField(item.tempId, 'productName', e.target.value)
                      }
                      className={`h-8 text-xs w-28 ${confidenceClass(c.productName)}`}
                      disabled={isConfirmed}
                    />
                    <ConfidenceBadge value={c.productName} />
                  </TableCell>

                  {/* Product Code */}
                  <TableCell>
                    <Input
                      value={d.productCode || ''}
                      onChange={(e) =>
                        onUpdateField(item.tempId, 'productCode', e.target.value)
                      }
                      className={`h-8 text-xs font-mono w-40 ${confidenceClass(c.productCode)}`}
                      disabled={isConfirmed}
                    />
                    <ConfidenceBadge value={c.productCode} />
                  </TableCell>

                  {/* Barcode */}
                  <TableCell>
                    <Input
                      value={d.barcode || ''}
                      onChange={(e) =>
                        onUpdateField(item.tempId, 'barcode', e.target.value)
                      }
                      className={`h-8 text-xs font-mono w-32 ${confidenceClass(c.barcode)}`}
                      disabled={isConfirmed}
                    />
                    <ConfidenceBadge value={c.barcode} />
                  </TableCell>

                  {/* Width */}
                  <TableCell>
                    <Input
                      type="number"
                      value={d.widthMm || ''}
                      onChange={(e) =>
                        onUpdateField(
                          item.tempId,
                          'widthMm',
                          e.target.value ? Number(e.target.value) : ''
                        )
                      }
                      className={`h-8 text-xs w-20 ${confidenceClass(c.widthMm)}`}
                      disabled={isConfirmed}
                    />
                    <ConfidenceBadge value={c.widthMm} />
                  </TableCell>

                  {/* Length */}
                  <TableCell>
                    <Input
                      type="number"
                      value={d.lengthM || ''}
                      onChange={(e) =>
                        onUpdateField(
                          item.tempId,
                          'lengthM',
                          e.target.value ? Number(e.target.value) : ''
                        )
                      }
                      className={`h-8 text-xs w-20 ${confidenceClass(c.lengthM)}`}
                      disabled={isConfirmed}
                    />
                    <ConfidenceBadge value={c.lengthM} />
                  </TableCell>

                  {/* Delivery date */}
                  <TableCell>
                    <Input
                      type="date"
                      value={d.deliveryDate || ''}
                      onChange={(e) =>
                        onUpdateField(item.tempId, 'deliveryDate', e.target.value)
                      }
                      className={`h-8 text-xs w-32 ${confidenceClass(c.deliveryDate)}`}
                      disabled={isConfirmed}
                    />
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {isConfirmed ? (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        OK
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => onConfirm(item.tempId)}
                      >
                        Potwierdź
                      </Button>
                    )}
                  </TableCell>

                  {/* Remove */}
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

export default RollScanResultsTable;
