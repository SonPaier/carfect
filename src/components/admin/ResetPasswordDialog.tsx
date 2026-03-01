import { useState } from 'react';
import { Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
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
    setAdminPassword('');
    setAdminPasswordError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPasswordError('');

    if (!user) return;

    if (!adminPassword) {
      setAdminPasswordError(t('password.adminConfirm.required'));
      return;
    }

    if (!isFormValid) {
      toast.error(t('password.req.minLength'));
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
          adminPassword,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        if (response.data.error.includes('hasło administratora') || response.data.error.includes('admin password')) {
          setAdminPasswordError(t('password.adminConfirm.invalid'));
          return;
        }
        throw new Error(response.data.error);
      }

      toast.success('Hasło zostało zresetowane');
      handleReset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Nie udało się zresetować hasła');
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
          {/* Admin password confirmation */}
          <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
            <Label htmlFor="admin-password" className="flex items-center gap-1.5 text-sm font-medium">
              <ShieldCheck className="w-4 h-4 text-primary" />
              {t('password.adminConfirm.label')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('password.adminConfirm.hint')}
            </p>
            <Input
              id="admin-password"
              type="password"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                if (adminPasswordError) setAdminPasswordError('');
              }}
              placeholder={t('password.adminConfirm.placeholder')}
              autoComplete="current-password"
              className={adminPasswordError ? 'border-destructive' : ''}
            />
            {adminPasswordError && (
              <p className="text-sm text-destructive">{adminPasswordError}</p>
            )}
          </div>

          {/* New password */}
          <PasswordInput
            label="Nowe hasło"
            value={password}
            onChange={setPassword}
            validation={validation}
            strength={strength}
          />

          <PasswordConfirmInput
            label="Potwierdź hasło"
            value={confirmPassword}
            onChange={setConfirmPassword}
            match={confirmMatch}
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
            <Button type="submit" disabled={loading || !isFormValid || !adminPassword}>
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
