import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@shared/ui';
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
          {hint.body && (
            <DialogDescription className="whitespace-pre-wrap">{hint.body}</DialogDescription>
          )}
        </DialogHeader>
        {hint.image_url && (
          <img src={hint.image_url} alt="" className="w-full rounded-md object-cover max-h-48" />
        )}
        <Button className="w-full mt-2" onClick={() => onDismiss(hint.id)}>
          Rozumiem
        </Button>
      </DialogContent>
    </Dialog>
  );
}
