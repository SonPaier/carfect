import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

export function HintFormDialog({ open, onOpenChange, hint, onSuccess }: HintFormDialogProps) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Tytuł jest wymagany');
      return;
    }
    if (!form.body.trim()) {
      toast.error('Treść jest wymagana');
      return;
    }
    if (form.target_roles.length === 0) {
      toast.error('Wybierz co najmniej jedną rolę');
      return;
    }
    if (form.type === 'tooltip' && !form.target_element_id?.trim()) {
      toast.error('Dla tooltipa podaj ID elementu (data-hint-id)');
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
        toast.success('Wskazówka zaktualizowana');
      } else {
        const { error } = await supabase.from('app_hints').insert(payload);
        if (error) throw error;
        toast.success('Wskazówka dodana');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error((error as Error).message ?? 'Błąd podczas zapisywania');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{hint ? 'Edytuj wskazówkę' : 'Nowa wskazówka'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="hint-type">Typ</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((p) => ({ ...p, type: v as HintRow['type'] }))}
            >
              <SelectTrigger id="hint-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popup">Popup (wyśrodkowany modal)</SelectItem>
                <SelectItem value="infobox">Infobox (baner na górze)</SelectItem>
                <SelectItem value="tooltip">Tooltip (zakotwiczony do elementu)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="hint-title">Tytuł</Label>
            <Input
              id="hint-title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Tytuł wskazówki"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label htmlFor="hint-body">Treść</Label>
            <textarea
              id="hint-body"
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              rows={3}
              placeholder="Opis wskazówki..."
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="hint-image">URL obrazka (opcjonalnie)</Label>
            <Input
              id="hint-image"
              value={form.image_url ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value || null }))}
              placeholder="https://..."
            />
          </div>

          {/* Target element ID — only for tooltip */}
          {form.type === 'tooltip' && (
            <div className="space-y-1.5">
              <Label htmlFor="hint-element-id">
                ID elementu{' '}
                <span className="font-normal text-muted-foreground">
                  (wartość atrybutu data-hint-id)
                </span>
              </Label>
              <Input
                id="hint-element-id"
                value={form.target_element_id ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, target_element_id: e.target.value || null }))
                }
                placeholder="np. add-employee-button"
              />
            </div>
          )}

          {/* Route pattern */}
          <div className="space-y-1.5">
            <Label htmlFor="hint-route">
              Trasa{' '}
              <span className="font-normal text-muted-foreground">
                (pusty lub * = wszystkie strony)
              </span>
            </Label>
            <Input
              id="hint-route"
              value={form.route_pattern ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, route_pattern: e.target.value || null }))}
              placeholder="np. /admin lub /halls"
            />
          </div>

          {/* Target roles */}
          <div className="space-y-2">
            <Label>Role docelowe</Label>
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
            <Label htmlFor="hint-delay">Opóźnienie (ms)</Label>
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
              Aktywna
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {hint ? 'Zapisz zmiany' : 'Dodaj wskazówkę'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
