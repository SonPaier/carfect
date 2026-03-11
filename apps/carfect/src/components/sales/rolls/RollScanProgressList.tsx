import { Loader2, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { Progress } from '@shared/ui';
import type { RollScanResult } from '../types/rolls';

interface RollScanProgressListProps {
  results: RollScanResult[];
  currentIndex: number;
  totalCount: number;
  processing: boolean;
}

const statusConfig = {
  uploading: { label: 'Wgrywanie...', icon: Loader2, color: 'text-blue-500' },
  extracting: { label: 'Analizowanie...', icon: Loader2, color: 'text-amber-500' },
  review: { label: 'Do weryfikacji', icon: Eye, color: 'text-blue-600' },
  confirmed: { label: 'Potwierdzona', icon: CheckCircle2, color: 'text-green-600' },
  error: { label: 'Błąd', icon: AlertCircle, color: 'text-destructive' },
};

const RollScanProgressList = ({
  results,
  currentIndex,
  totalCount,
  processing,
}: RollScanProgressListProps) => {
  if (results.length === 0) return null;

  const completedCount = results.filter(
    (r) => r.status === 'review' || r.status === 'confirmed' || r.status === 'error'
  ).length;

  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Overall progress */}
      {processing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Przetwarzanie {currentIndex}/{totalCount}...
            </span>
            <span className="text-muted-foreground">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}

      {/* Item list */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {results.map((item) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;
          const isAnimated = item.status === 'uploading' || item.status === 'extracting';

          return (
            <div
              key={item.tempId}
              className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
            >
              {/* Thumbnail */}
              <img
                src={item.thumbnailUrl}
                alt=""
                className="w-10 h-10 rounded object-cover shrink-0"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {item.extractedData?.productName || item.file.name}
                </p>
                {item.error && (
                  <p className="text-xs text-destructive truncate">{item.error}</p>
                )}
              </div>

              {/* Status */}
              <div className={`flex items-center gap-1.5 text-xs shrink-0 ${config.color}`}>
                <Icon className={`w-3.5 h-3.5 ${isAnimated ? 'animate-spin' : ''}`} />
                <span>{config.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RollScanProgressList;
