import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  NumericInput,
  Input,
} from '@shared/ui';

interface AddAdvanceDialogProps {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  onSubmit: (amount: number, date: string, note?: string) => void;
  isSubmitting?: boolean;
}

export function AddAdvanceDialog({
  open,
  onClose,
  employeeName,
  onSubmit,
  isSubmitting,
}: AddAdvanceDialogProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<number | undefined>();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!amount || amount <= 0) return;
    onSubmit(amount, date, note || undefined);
    setAmount(undefined);
    setNote('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj zaliczkę — {employeeName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Kwota (zł)</Label>
            <NumericInput
              value={amount}
              onChange={setAmount}
              min={0}
              step={0.01}
              placeholder="0,00"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Notatka (opcjonalnie)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="np. zaliczka na paliwo"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={!amount || amount <= 0 || isSubmitting}>
            Dodaj zaliczkę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
