import { X } from 'lucide-react';
import { Sheet, SheetContent } from '@shared/ui';
import { CustomerVisitHistory } from './CustomerVisitHistory';

interface CustomerHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  customerPhone: string;
  customerName: string;
  instanceId: string;
  onOpenReservation?: (reservationId: string) => void;
}

export const CustomerHistoryDrawer = ({
  open,
  onClose,
  customerPhone,
  customerName,
  instanceId,
  onOpenReservation,
}: CustomerHistoryDrawerProps) => {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col" hideCloseButton>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Historia wizyt</h2>
            <p className="text-sm text-muted-foreground">{customerName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white hover:bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {open && (
            <CustomerVisitHistory
              customerPhone={customerPhone}
              instanceId={instanceId}
              showNotes={true}
              showDuration={true}
              onOpenReservation={(id) => {
                onClose();
                onOpenReservation?.(id);
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
