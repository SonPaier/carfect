import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/ui';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { useCreateInstanceUser } from '@/hooks/useCreateInstanceUser';
import { sanitizeUsername } from '@shared/utils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { PasswordInput, PasswordConfirmInput, usePasswordValidation } from '@/components/password';

interface GrantAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  employeeName: string;
}

const GrantAccessDialog = ({
  open,
  onOpenChange,
  instanceId,
  employeeName,
}: GrantAccessDialogProps) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'employee' | 'admin' | 'hall' | 'sales'>('employee');
  const { createUser, isPending } = useCreateInstanceUser();

  const {
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,
    validation,
    strength,
    confirmMatch,
    isFormValid: isPasswordValid,
    reset: resetPassword,
  } = usePasswordValidation({ username });

  useEffect(() => {
    if (!open) return;
    // Pre-fill username from employee name
    const suggested = sanitizeUsername(employeeName).slice(0, 20);
    setUsername(suggested);
    setRole('employee');
    resetPassword();
  }, [open, employeeName]);

  const handleSubmit = async () => {
    if (!username.trim() || username.length < 3) {
      toast.error(t('addUser.usernameMinLength'));
      return;
    }
    if (!isPasswordValid) {
      toast.error(t('employeeDialog.fixPassword'));
      return;
    }

    try {
      await createUser({
        instanceId,
        username: username.trim(),
        password,
        role,
      });
      toast.success(t('employeeDialog.userCreated'));
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('employeeDialog.grantAccess')}: {employeeName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="grant-username">{t('employeeDialog.usernameLabel')}</Label>
            <Input
              id="grant-username"
              value={username}
              onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
              placeholder={t('employeeDialog.usernamePlaceholder')}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">{t('employeeDialog.usernameHint')}</p>
          </div>

          <PasswordInput
            label={t('addUser.password')}
            value={password}
            onChange={setPassword}
            validation={validation}
            strength={strength}
          />

          <PasswordConfirmInput
            label={t('addUser.confirmPassword')}
            value={confirmPassword}
            onChange={setConfirmPassword}
            match={confirmMatch}
          />

          <div className="space-y-2">
            <Label>{t('addUser.role')}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">{t('addUser.roleEmployee')}</SelectItem>
                <SelectItem value="hall">{t('addUser.roleHall')}</SelectItem>
                <SelectItem value="sales">{t('addUser.roleSales')}</SelectItem>
                <SelectItem value="admin">{t('addUser.roleAdmin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-white">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !isPasswordValid}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('addUser.createUser')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GrantAccessDialog;
