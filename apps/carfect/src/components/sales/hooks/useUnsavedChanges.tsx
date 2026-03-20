import { useState, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui';
import { Button } from '@shared/ui';

export interface UnsavedChangesDialogProps {
  open: boolean;
  onContinue: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

export const UnsavedChangesDialog = ({
  open,
  onContinue,
  onDiscard,
  onSave,
}: UnsavedChangesDialogProps) => (
  <AlertDialog open={open}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Niezapisane zmiany</AlertDialogTitle>
        <AlertDialogDescription>Masz niezapisane zmiany. Co chcesz zrobić?</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" className="sm:mr-auto" onClick={onContinue}>
          Kontynuuj edycję
        </Button>
        <Button variant="destructive" onClick={onDiscard}>
          Odrzuć zmiany
        </Button>
        <Button onClick={onSave}>Zapisz</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export function useUnsavedChanges() {
  const [isDirty, setIsDirty] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const callbacksRef = useRef<{ onSave: () => void; onDiscard: () => void } | null>(null);

  const markDirty = () => setIsDirty(true);
  const resetDirty = () => setIsDirty(false);

  const handleClose = (onSave: () => void, onDiscard: () => void) => {
    if (dialogOpen) return;
    if (!isDirty) {
      onDiscard();
      return;
    }
    callbacksRef.current = { onSave, onDiscard };
    setDialogOpen(true);
  };

  const dialogProps: UnsavedChangesDialogProps = {
    open: dialogOpen,
    onContinue: () => setDialogOpen(false),
    onDiscard: () => {
      setDialogOpen(false);
      setIsDirty(false);
      callbacksRef.current?.onDiscard();
    },
    onSave: () => {
      setDialogOpen(false);
      callbacksRef.current?.onSave();
    },
  };

  return { isDirty, markDirty, resetDirty, handleClose, dialogProps };
}
