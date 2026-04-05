import { useState, useEffect, useRef } from 'react';
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
import { Switch } from '@shared/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui';
import { useCreateEmployee, useUpdateEmployee, useDeleteEmployee, Employee } from '@/hooks/useEmployees';
import { useCreateInstanceUser } from '@/hooks/useCreateInstanceUser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, X, Trash2, Camera } from 'lucide-react';
import { ConfirmDialog } from '@shared/ui';
import { cn } from '@/lib/utils';
import { compressImage, sanitizeUsername } from '@shared/utils';
import { PasswordInput, PasswordConfirmInput, usePasswordValidation } from '@/components/password';

interface AddEditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string | null;
  employee?: Employee | null;
  isAdmin?: boolean;
}

const AddEditEmployeeDialog = ({
  open,
  onOpenChange,
  instanceId,
  employee,
  isAdmin = true,
}: AddEditEmployeeDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [grantAccess, setGrantAccess] = useState(false);
  const [username, setUsername] = useState('');

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const createEmployee = useCreateEmployee(instanceId);
  const updateEmployee = useUpdateEmployee(instanceId);
  const deleteEmployee = useDeleteEmployee(instanceId);
  const { createUser, isPending: isCreatingUser } = useCreateInstanceUser();

  const isEditing = !!employee;
  const isSubmitting = createEmployee.isPending || updateEmployee.isPending;
  const isDeleting = deleteEmployee.isPending;

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setPhotoUrl(employee.photo_url);
    } else {
      setName('');
      setPhotoUrl(null);
    }
    setGrantAccess(false);
    setUsername('');
    resetPassword();
  }, [employee, open]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !instanceId) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('employeeDialog.photoOnlyImages'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('employeeDialog.photoMaxSize'));
      return;
    }

    setIsUploading(true);
    try {
      const compressedBlob = await compressImage(file, 400, 0.85, true);
      const fileName = `${instanceId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('employee-photos')
        .upload(fileName, compressedBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('employee-photos')
        .getPublicUrl(fileName);

      setPhotoUrl(publicUrl);

      if (isEditing && employee) {
        await updateEmployee.mutateAsync({
          id: employee.id,
          photo_url: publicUrl,
          name: name.trim() || employee.name,
          hourly_rate: employee.hourly_rate,
        });
        toast.success(t('employeeDialog.photoSaved'));
      } else {
        toast.success(t('employeeDialog.photoUploaded'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('employeeDialog.photoUploadError'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t('employeeDialog.nameRequired'));
      return;
    }

    if (grantAccess) {
      if (!username.trim() || username.length < 3) {
        toast.error(t('employeeDialog.usernameMinLength'));
        return;
      }
      if (!isPasswordValid) {
        toast.error(t('employeeDialog.fixPassword'));
        return;
      }
    }

    try {
      const data = {
        name: name.trim(),
        photo_url: photoUrl,
      };

      if (isEditing && employee) {
        await updateEmployee.mutateAsync({ id: employee.id, ...data });
        toast.success(t('employeeDialog.employeeUpdated'));
      } else {
        await createEmployee.mutateAsync({ ...data, hourly_rate: null });
        toast.success(t('employeeDialog.employeeAdded'));
      }

      if (grantAccess && instanceId) {
        try {
          await createUser({
            instanceId,
            username: username.trim(),
            password,
            role: 'employee',
          });
          toast.success(t('employeeDialog.userCreated'));
        } catch (error) {
          toast.error(t('employeeDialog.userCreateError', { error: (error as Error).message }));
        }
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(t('employeeDialog.submitError'));
    }
  };

  const handleDelete = async () => {
    if (!employee) return;

    try {
      await deleteEmployee.mutateAsync(employee.id);
      toast.success(t('employeeDialog.employeeDeleted'));
      setDeleteConfirmOpen(false);
      onOpenChange(false);
    } catch (error) {
      toast.error(t('employeeDialog.deleteError'));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t('employeeDialog.editTitle') : t('employeeDialog.addTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Photo upload */}
            <div className="flex items-center gap-4">
              <div
                className="relative cursor-pointer group"
                onClick={handleAvatarClick}
              >
                <Avatar className="h-20 w-20 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                  <AvatarImage src={photoUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {name.slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                {isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
                {photoUrl && !isUploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto();
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('employeeDialog.photoHint')}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('employeeDialog.nameLabel')} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('employeeDialog.namePlaceholder')}
              />
            </div>

            {/* Grant access toggle - only for new employees */}
            {!isEditing && isAdmin && (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="grant-access">{t('employeeDialog.grantAccess')}</Label>
                  <Switch
                    size="sm"
                    id="grant-access"
                    checked={grantAccess}
                    onCheckedChange={setGrantAccess}
                  />
                </div>

                {grantAccess && (
                  <div className="space-y-3 pl-1 border-l-2 border-primary/20 ml-1">
                    <div className="space-y-2 pl-3">
                      <Label htmlFor="username">{t('employeeDialog.usernameLabel')}</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                        placeholder={t('employeeDialog.usernamePlaceholder')}
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">{t('employeeDialog.usernameHint')}</p>
                    </div>

                    <div className="pl-3">
                      <PasswordInput
                        label={t('addUser.password')}
                        value={password}
                        onChange={setPassword}
                        validation={validation}
                        strength={strength}
                      />
                    </div>

                    <div className="pl-3">
                      <PasswordConfirmInput
                        label={t('addUser.confirmPassword')}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        match={confirmMatch}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="flex flex-row gap-2">
            {isEditing && isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} className={cn("bg-white", !isEditing && "flex-1")}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || isCreatingUser || (grantAccess && !isPasswordValid)} className={cn(!isEditing && "flex-1")}>
              {(isSubmitting || isCreatingUser) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? t('common.save') : t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('employeeDialog.deleteTitle')}
        description={t('employeeDialog.deleteDescription', { name: employee?.name })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
};

export default AddEditEmployeeDialog;
