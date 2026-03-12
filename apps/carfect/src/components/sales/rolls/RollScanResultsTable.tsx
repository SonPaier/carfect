import { XCircle } from 'lucide-react';
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
}

const RollScanResultsTable = ({
  results,
  onRemove,
}: RollScanResultsTableProps) => {
  const readyResults = results.filter(
    (r) => r.status === 'review' || r.status === 'confirmed'
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
              <TableHead>Data dostawy</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {readyResults.map((item) => {
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
                  <TableCell className="text-xs">{d.deliveryDate || '—'}</TableCell>
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
