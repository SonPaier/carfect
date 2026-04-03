import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/ui';
import { OfferState } from '@/hooks/useOffer';
import { OfferPreviewPanel } from './OfferPreviewPanel';

interface OfferPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  offer: OfferState;
  instanceId: string;
  calculateTotalNet: () => number;
  calculateTotalGross: () => number;
}

export const OfferPreviewDialog = ({
  open,
  onClose,
  offer,
  instanceId,
  calculateTotalNet,
  calculateTotalGross,
}: OfferPreviewDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="w-screen h-screen max-w-none rounded-none border-none p-0 gap-0 overflow-hidden flex flex-col [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t('offers.previewTitle')}</DialogTitle>
        </DialogHeader>

        <div className="absolute top-3 right-3 z-50">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white hover:bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {open && (
            <OfferPreviewPanel
              offer={offer}
              instanceId={instanceId}
              calculateTotalNet={calculateTotalNet}
              calculateTotalGross={calculateTotalGross}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
