import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { useTranslation } from 'react-i18next';
import { PasswordInput, PasswordConfirmInput, usePasswordValidation } from '@/components/password';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeUsername } from '@shared/utils';
import { toast } from 'sonner';
import { useCreateInstanceUser } from '@/hooks/useCreateInstanceUser';
import HallPickerField from './HallPickerField';
import type { HallOption } from './HallPickerField';

interface AddInstanceUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  onSuccess: () => void;
}

const AddInstanceUserDialog = ({
  open,
  onOpenChange,
  instanceId,
  onSuccess,
}: AddInstanceUserDialogProps) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'employee' | 'admin' | 'hall' | 'sales'>('employee');
  const [selectedHallId, setSelectedHallId] = useState<string>('');
  const [halls, setHalls] = useState<HallOption[]>([]);
  const { createUser, isPending: loading } = useCreateInstanceUser();
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState<'admin' | null>(null);

  useEffect(() => {
    if (!open) return;
    const fetchHalls = async () => {
      const { data } = await supabase
        .from('halls')
        .select('id, name')
        .eq('instance_id', instanceId)
        .eq('active', true)
        .order('sort_order');
      if (data) setHalls(data);
    };
    fetchHalls();
  }, [open, instanceId]);

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

  const resetForm = () => {
    setUsername('');
    resetPassword();
    setRole('employee');
    setSelectedHallId('');
    setPendingRole(null);
  };

  const handleRoleChange = (newRole: 'employee' | 'admin' | 'hall' | 'sales') => {
    if (newRole === 'admin') {
      setPendingRole('admin');
      setShowAdminConfirm(true);
    } else {
      setRole(newRole);
    }
  };

  const confirmAdminRole = () => {
    if (pendingRole === 'admin') {
      setRole('admin');
    }
    setPendingRole(null);
    setShowAdminConfirm(false);
  };

  const cancelAdminRole = () => {
    setPendingRole(null);
    setShowAdminConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error(t('addUser.usernameRequired'));
      return;
    }

    if (username.length < 3) {
      toast.error(t('addUser.usernameMinLength'));
      return;
    }

    if (!isPasswordValid) {
      toast.error(t('password.req.minLength'));
      return;
    }

    try {
      await createUser({
        instanceId,
        username: username.trim(),
        password,
        role,
        ...(role === 'hall' && selectedHallId ? { hallId: selectedHallId } : {}),
      });

      toast.success(t('addUser.success'));
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      toast.error((error as Error).message || t('addUser.error'));
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) resetForm();
          onOpenChange(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('addUser.title')}</DialogTitle>
            <DialogDescription>{t('addUser.dialogDescription')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('addUser.usernameLabel')}</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                placeholder={t('addUser.usernamePlaceholder')}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">{t('addUser.usernameHint')}</p>
            </div>

            <PasswordInput
              label={t('addUser.passwordLabel')}
              value={password}
              onChange={setPassword}
              validation={validation}
              strength={strength}
            />

            <PasswordConfirmInput
              label={t('addUser.confirmPasswordLabel')}
              value={confirmPassword}
              onChange={setConfirmPassword}
              match={confirmMatch}
            />

            <div className="space-y-2">
              <Label htmlFor="role">{t('addUser.roleLabel')}</Label>
              <Select value={role} onValueChange={handleRoleChange}>
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
              <p className="text-xs text-muted-foreground">
                {role === 'admin'
                  ? t('addUser.roleAdminDesc')
                  : role === 'hall'
                    ? t('addUser.roleHallDesc')
                    : role === 'sales'
                      ? t('addUser.roleSalesDesc')
                      : t('addUser.roleEmployeeDesc')}
              </p>
            </div>

            {role === 'hall' && (
              <HallPickerField value={selectedHallId} onChange={setSelectedHallId} halls={halls} />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {t('addUser.cancel')}
              </Button>
              <Button type="submit" disabled={loading || !isPasswordValid}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('addUser.createButton')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showAdminConfirm} onOpenChange={setShowAdminConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {t('addUser.adminPermissionsTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t('addUser.adminPermissionsDesc')}</p>
              <ul className="list-disc list-inside text-left space-y-1 text-sm">
                <li>{t('addUser.adminPermission1')}</li>
                <li>{t('addUser.adminPermission2')}</li>
                <li>{t('addUser.adminPermission3')}</li>
                <li>{t('addUser.adminPermission4')}</li>
              </ul>
              <p className="text-amber-600 flex items-center gap-1 mt-2">
                <AlertTriangle className="w-4 h-4" />
                {t('addUser.adminWarning')}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelAdminRole}>{t('addUser.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAdminRole}>
              {t('addUser.confirmAdmin')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddInstanceUserDialog;
