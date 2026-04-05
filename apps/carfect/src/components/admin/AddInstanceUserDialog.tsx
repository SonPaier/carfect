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
import { toast } from 'sonner';
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
  const [loading, setLoading] = useState(false);
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

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesja wygasła');
        return;
      }

      const response = await supabase.functions.invoke('manage-instance-users', {
        body: {
          action: 'create',
          instanceId,
          username: username.trim(),
          password,
          role,
          ...(role === 'hall' && selectedHallId ? { hallId: selectedHallId } : {}),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('Użytkownik został utworzony');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      toast.error((error as Error).message || 'Nie udało się utworzyć użytkownika');
    } finally {
      setLoading(false);
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
            <DialogTitle>Dodaj użytkownika</DialogTitle>
            <DialogDescription>Utwórz nowe konto użytkownika dla tej instancji.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nazwa użytkownika</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="np. jan.kowalski"
                autoComplete="off"
              />
            </div>

            <PasswordInput
              label="Hasło"
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

            <div className="space-y-2">
              <Label htmlFor="role">Rola</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Pracownik</SelectItem>
                  <SelectItem value="hall">Kalendarz (tablet/kiosk)</SelectItem>
                  <SelectItem value="sales">Sprzedaż (CRM)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {role === 'admin'
                  ? 'Admin ma pełny dostęp do ustawień i zarządzania użytkownikami'
                  : role === 'hall'
                    ? 'Uproszczony widok: kalendarz, raportowanie czasu, protokoły (np. tablet w warsztacie)'
                    : role === 'sales'
                      ? 'Dostęp do panelu sprzedaży CRM (zamówienia, klienci, produkty)'
                      : 'Pracownik ma ograniczony dostęp do wybranych modułów'}
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
                Anuluj
              </Button>
              <Button type="submit" disabled={loading || !isPasswordValid}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Utwórz użytkownika
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
              Uprawnienia administratora
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Administrator instancji będzie miał dostęp do:</p>
              <ul className="list-disc list-inside text-left space-y-1 text-sm">
                <li>Wszystkich ustawień instancji</li>
                <li>Zarządzania użytkownikami</li>
                <li>Wszystkich modułów aplikacji</li>
                <li>Tworzenia i usuwania innych kont</li>
              </ul>
              <p className="text-amber-600 flex items-center gap-1 mt-2">
                <AlertTriangle className="w-4 h-4" />
                Przyznawaj te uprawnienia tylko zaufanym osobom.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelAdminRole}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAdminRole}>
              Rozumiem, nadaj uprawnienia
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddInstanceUserDialog;
