import { useRef, useState } from 'react';
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
import { mbToM2 } from '../types/rolls';

interface RollScanResultsTableProps {
  results: RollScanResult[];
  onRemove: (tempId: string) => void;
  onRetry?: (tempId: string, file: File) => void;
  onUpdateField?: (tempId: string, field: string, value: unknown) => void;
}

function InlineEditCell({
  value,
  onChange,
  suffix,
}: {
  value: string | number | undefined;
  onChange: (val: string) => void;
  suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ''));

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => {
            onChange(editValue);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onChange(editValue);
              setEditing(false);
            }
            if (e.key === 'Escape') {
              setEditValue(String(value ?? ''));
              setEditing(false);
            }
          }}
          className="w-16 h-7 px-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setEditValue(String(value ?? ''));
        setEditing(true);
      }}
      className="text-xs hover:bg-muted/50 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
    >
      {value ?? '—'}
    </button>
  );
}

const RollScanResultsTable = ({
  results,
  onRemove,
  onRetry,
  onUpdateField,
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

      <div className="border rounded-lg overflow-x-auto bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Produkt</TableHead>
              <TableHead>Kod produktu</TableHead>
              <TableHead>Kod kreskowy</TableHead>
              <TableHead>Szer. (mm)</TableHead>
              <TableHead>Dł. (m)</TableHead>
              <TableHead>Na stanie</TableHead>
              <TableHead>Zużyto</TableHead>
              <TableHead>Pozostało</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {readyResults.map((item, index) => {
              if (item.status === 'error') {
                return (
                  <ErrorRow
                    key={item.tempId}
                    item={item}
                    index={index + 1}
                    onRemove={onRemove}
                    onRetry={onRetry}
                  />
                );
              }

              const d = item.extractedData;
              const lengthM = Number(d.lengthM) || 0;
              const widthMm = Number(d.widthMm) || 0;
              const stockM2 = mbToM2(lengthM, widthMm);

              // remainingMb defaults to full length if not set
              const remainingMb = d.remainingMb != null ? Number(d.remainingMb) : lengthM;
              const usedMb = Math.max(0, lengthM - remainingMb);
              const remainingM2 = mbToM2(remainingMb, widthMm);
              const usedM2 = mbToM2(usedMb, widthMm);

              return (
                <TableRow key={item.tempId}>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {index + 1}
                  </TableCell>
                  <TableCell className="text-xs">{d.productName || '—'}</TableCell>
                  <TableCell className="text-xs font-mono">
                    {onUpdateField ? (
                      <InlineEditCell
                        value={d.productCode}
                        onChange={(val) => onUpdateField(item.tempId, 'productCode', val || null)}
                      />
                    ) : (
                      d.productCode || '—'
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{d.barcode || '—'}</TableCell>
                  <TableCell className="text-xs">
                    {onUpdateField ? (
                      <InlineEditCell
                        value={d.widthMm}
                        onChange={(val) => onUpdateField(item.tempId, 'widthMm', val ? Number(val) : null)}
                      />
                    ) : (
                      d.widthMm || '—'
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {onUpdateField ? (
                      <InlineEditCell
                        value={d.lengthM}
                        onChange={(val) => onUpdateField(item.tempId, 'lengthM', val ? Number(val) : null)}
                      />
                    ) : (
                      d.lengthM || '—'
                    )}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {lengthM > 0 ? (
                      <span>{lengthM.toFixed(1)} mb / {stockM2.toFixed(2)} m²</span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                    {usedMb > 0 ? (
                      <span>{usedMb.toFixed(1)} mb / {usedM2.toFixed(2)} m²</span>
                    ) : '0'}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {onUpdateField && lengthM > 0 ? (
                      <div className="flex items-center gap-1">
                        <InlineEditCell
                          value={remainingMb}
                          onChange={(val) => {
                            const num = Number(val);
                            if (!isNaN(num)) {
                              onUpdateField(item.tempId, 'remainingMb', Math.min(num, lengthM));
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">mb</span>
                      </div>
                    ) : lengthM > 0 ? (
                      <span>{remainingMb.toFixed(1)} mb / {remainingM2.toFixed(2)} m²</span>
                    ) : '—'}
                  </TableCell>
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
  index,
  onRemove,
  onRetry,
}: {
  item: RollScanResult;
  index: number;
  onRemove: (tempId: string) => void;
  onRetry?: (tempId: string, file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <TableRow className="bg-amber-50">
      <TableCell className="text-xs text-muted-foreground font-medium">
        {index}
      </TableCell>
      <TableCell colSpan={7}>
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
