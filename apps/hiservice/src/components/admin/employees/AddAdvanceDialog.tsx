import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');

  const parsedAmount = parseFloat(amount.replace(',', '.'));
  const isValid = !isNaN(parsedAmount) && parsedAmount > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(parsedAmount, date, note || undefined);
    setAmount('');
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
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
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
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            Dodaj zaliczkę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
