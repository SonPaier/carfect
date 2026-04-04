import { useState } from 'react';
import { Loader2, KeyRound } from 'lucide-react';
import { Button } from '@shared/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PasswordInput, PasswordConfirmInput, usePasswordValidation } from '@/components/password';

interface InstanceUser {
  id: string;
  username: string;
}

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  user: InstanceUser | null;
}

const ResetPasswordDialog = ({
  open,
  onOpenChange,
  instanceId,
  user
}: ResetPasswordDialogProps) => {
  const [loading, setLoading] = useState(false);
  const {
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,
    validation,
    strength,
    confirmMatch,
    isFormValid,
    reset,
  } = usePasswordValidation({ username: user?.username });

  const handleReset = () => {
    reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!isFormValid) {
      toast.error('Hasło nie spełnia wymagań');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesja wygasła');
        return;
      }

      const response = await supabase.functions.invoke('manage-instance-users', {
        body: {
          action: 'reset-password',
          instanceId,
          userId: user.id,
          password,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('Hasło zostało zresetowane');
      handleReset();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      toast.error((error as Error).message || 'Nie udało się zresetować hasła');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleReset();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Resetuj hasło
          </DialogTitle>
          <DialogDescription>
            Ustaw nowe hasło dla użytkownika <strong>{user.username}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New password — always visible, no eye toggle */}
          <PasswordInput
            label="Nowe hasło"
            value={password}
            onChange={setPassword}
            validation={validation}
            strength={strength}
            showRequirements={false}
            alwaysVisible
          />

          <PasswordConfirmInput
            label="Potwierdź hasło"
            value={confirmPassword}
            onChange={setConfirmPassword}
            match={confirmMatch}
            alwaysVisible
          />

          {/* Requirements checklist — below confirm */}
          <PasswordInput
            value={password}
            onChange={setPassword}
            validation={validation}
            strength={strength}
            showStrength={false}
            showInput={false}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Resetuj hasło
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
