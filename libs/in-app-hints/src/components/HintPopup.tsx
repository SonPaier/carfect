import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/ui';
import { Button } from '@shared/ui';
import type { AppHint } from '../types';

interface HintPopupProps {
  hint: AppHint;
  onDismiss: (id: string) => void;
}

export function HintPopup({ hint, onDismiss }: HintPopupProps) {
  return (
    <Dialog open onOpenChange={() => onDismiss(hint.id)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{hint.title}</DialogTitle>
        </DialogHeader>
        {hint.image_url && (
          <img src={hint.image_url} alt="" className="w-full rounded-md object-cover max-h-48" />
        )}
        {hint.body && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{hint.body}</p>
        )}
        <Button className="w-full mt-2" onClick={() => onDismiss(hint.id)}>
          Rozumiem
        </Button>
      </DialogContent>
    </Dialog>
  );
}
