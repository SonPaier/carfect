import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Checkbox,
} from '@shared/ui';
import { X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const ALL_ROLES = ['admin', 'employee', 'hall', 'sales', 'super_admin'] as const;

interface HintRow {
  id: string;
  type: 'tooltip' | 'popup' | 'infobox';
  title: string;
  body: string;
  image_url: string | null;
  target_element_id: string | null;
  route_pattern: string | null;
  target_roles: string[];
  delay_ms: number;
  active: boolean;
}

interface HintFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hint: HintRow | null;
  onSuccess: () => void;
}

const EMPTY: Omit<HintRow, 'id'> = {
  type: 'popup',
  title: '',
  body: '',
  image_url: null,
  target_element_id: null,
  route_pattern: null,
  target_roles: ['admin', 'employee'],
  delay_ms: 0,
  active: true,
};

function extractFileName(url: string): string | null {
  const parts = url.split('/');
  return parts[parts.length - 1] || null;
}

export function HintFormDialog({ open, onOpenChange, hint, onSuccess }: HintFormDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(
        hint
          ? {
              type: hint.type,
              title: hint.title,
              body: hint.body,
              image_url: hint.image_url ?? null,
              target_element_id: hint.target_element_id ?? null,
              route_pattern: hint.route_pattern ?? null,
              target_roles: hint.target_roles,
              delay_ms: hint.delay_ms,
              active: hint.active,
            }
          : EMPTY,
      );
      setUploading(false);
    }
  }, [open, hint]);

  const toggleRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter((r) => r !== role)
        : [...prev.target_roles, role],
    }));
  };

  const deleteImageFromStorage = async (imageUrl: string) => {
    const fileName = extractFileName(imageUrl);
    if (fileName) {
      await supabase.storage.from('hint-images').remove([fileName]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';

    const ext = file.name.split('.').pop() ?? 'png';
    const fileName = `hint-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

    try {
      setUploading(true);

      // Delete old image if replacing
      if (form.image_url) {
        try {
          await deleteImageFromStorage(form.image_url);
        } catch {
          // Don't block upload if old image cleanup fails
        }
      }

      const { error } = await supabase.storage
        .from('hint-images')
        .upload(fileName, file, { contentType: file.type, cacheControl: '3600' });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('hint-images').getPublicUrl(fileName);
      setForm((p) => ({ ...p, image_url: urlData.publicUrl }));
    } catch (error: unknown) {
      toast.error((error as Error).message ?? t('superAdmin.hintFormDialog.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!form.image_url) return;

    try {
      setUploading(true);
      await deleteImageFromStorage(form.image_url);
    } catch {
      // Don't block removal from form if storage cleanup fails
    } finally {
      setForm((p) => ({ ...p, image_url: null }));
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error(t('superAdmin.hintFormDialog.titleRequired'));
      return;
    }
    if (!form.body.trim()) {
      toast.error(t('superAdmin.hintFormDialog.bodyRequired'));
      return;
    }
    if (form.target_roles.length === 0) {
      toast.error(t('superAdmin.hintFormDialog.rolesRequired'));
      return;
    }
    if (form.type === 'tooltip' && !form.target_element_id?.trim()) {
      toast.error(t('superAdmin.hintFormDialog.tooltipElementRequired'));
      return;
    }

    const payload = {
      type: form.type,
      title: form.title.trim(),
      body: form.body.trim(),
      image_url: form.image_url?.trim() || null,
      target_element_id: form.type === 'tooltip' ? form.target_element_id?.trim() || null : null,
      route_pattern: form.route_pattern?.trim() || null,
      target_roles: form.target_roles,
      delay_ms: form.delay_ms,
      active: form.active,
    };

    try {
      setSubmitting(true);

      if (hint) {
        const { error } = await supabase.from('app_hints').update(payload).eq('id', hint.id);
        if (error) throw error;
        toast.success(t('superAdmin.hintFormDialog.updateSuccess'));
      } else {
        const { error } = await supabase.from('app_hints').insert(payload);
        if (error) throw error;
        toast.success(t('superAdmin.hintFormDialog.createSuccess'));
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error((error as Error).message ?? t('superAdmin.hintFormDialog.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {hint
              ? t('superAdmin.hintFormDialog.editTitle')
              : t('superAdmin.hintFormDialog.newTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="hint-type">{t('superAdmin.hintFormDialog.type')}</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((p) => ({ ...p, type: v as HintRow['type'] }))}
            >
              <SelectTrigger id="hint-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popup">{t('superAdmin.hintFormDialog.typePopup')}</SelectItem>
                <SelectItem value="infobox">{t('superAdmin.hintFormDialog.typeInfobox')}</SelectItem>
                <SelectItem value="tooltip">{t('superAdmin.hintFormDialog.typeTooltip')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="hint-title">{t('superAdmin.hintFormDialog.titleLabel')}</Label>
            <Input
              id="hint-title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder={t('superAdmin.hintFormDialog.titlePlaceholder')}
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label htmlFor="hint-body">{t('superAdmin.hintFormDialog.body')}</Label>
            <textarea
              id="hint-body"
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              rows={3}
              placeholder={t('superAdmin.hintFormDialog.bodyPlaceholder')}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Image upload — hidden for infobox type */}
          {form.type !== 'infobox' && (
            <div className="space-y-1.5">
              <Label>{t('superAdmin.hintFormDialog.image')}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {form.image_url ? (
                <div className="relative rounded-md overflow-hidden border border-border">
                  <img
                    src={form.image_url}
                    alt={t('superAdmin.hintFormDialog.imagePreviewAlt')}
                    className="w-full rounded-md object-cover max-h-48"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={uploading}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={t('superAdmin.hintFormDialog.removeImageAriaLabel')}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 w-full rounded-md border border-dashed border-input bg-transparent px-3 py-6 text-sm text-muted-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="h-5 w-5" />
                      <span>{t('superAdmin.hintFormDialog.addImageLabel')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Target element ID — only for tooltip */}
          {form.type === 'tooltip' && (
            <div className="space-y-1.5">
              <Label htmlFor="hint-element-id">
                {t('superAdmin.hintFormDialog.elementId')}{' '}
                <span className="font-normal text-muted-foreground">
                  {t('superAdmin.hintFormDialog.elementIdHint')}
                </span>
              </Label>
              <Input
                id="hint-element-id"
                value={form.target_element_id ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, target_element_id: e.target.value || null }))
                }
                placeholder={t('superAdmin.hintFormDialog.elementIdPlaceholder')}
              />
            </div>
          )}

          {/* Route pattern */}
          <div className="space-y-1.5">
            <Label htmlFor="hint-route">
              {t('superAdmin.hintFormDialog.route')}{' '}
              <span className="font-normal text-muted-foreground">
                {t('superAdmin.hintFormDialog.routeHint')}
              </span>
            </Label>
            <Input
              id="hint-route"
              value={form.route_pattern ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, route_pattern: e.target.value || null }))}
              placeholder={t('superAdmin.hintFormDialog.routePlaceholder')}
            />
          </div>

          {/* Target roles */}
          <div className="space-y-2">
            <Label>{t('superAdmin.hintFormDialog.targetRoles')}</Label>
            <div className="flex flex-wrap gap-3">
              {ALL_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <Checkbox
                    checked={form.target_roles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>

          {/* Delay */}
          <div className="space-y-1.5">
            <Label htmlFor="hint-delay">{t('superAdmin.hintFormDialog.delay')}</Label>
            <Input
              id="hint-delay"
              type="number"
              min={0}
              step={100}
              value={form.delay_ms}
              onChange={(e) => setForm((p) => ({ ...p, delay_ms: Number(e.target.value) }))}
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-3">
            <Switch
              id="hint-active"
              checked={form.active}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, active: checked }))}
            />
            <Label htmlFor="hint-active" className="cursor-pointer">
              {t('superAdmin.hintFormDialog.active')}
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {hint
                ? t('superAdmin.hintFormDialog.saveChanges')
                : t('superAdmin.hintFormDialog.addHint')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
