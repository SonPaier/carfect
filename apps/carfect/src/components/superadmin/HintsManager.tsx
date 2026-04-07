import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Switch,
  ConfirmDialog,
} from '@shared/ui';
import { Plus, Pencil, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { HintFormDialog } from './HintFormDialog';

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
  created_at: string;
}

const TYPE_LABELS: Record<HintRow['type'], string> = {
  popup: 'Popup',
  infobox: 'Infobox',
  tooltip: 'Tooltip',
};

const TYPE_VARIANTS: Record<HintRow['type'], 'default' | 'secondary' | 'outline'> = {
  popup: 'default',
  infobox: 'secondary',
  tooltip: 'outline',
};

export function HintsManager() {
  const [hints, setHints] = useState<HintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHint, setEditingHint] = useState<HintRow | null>(null);
  const [deleteHint, setDeleteHint] = useState<HintRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHints = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_hints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHints((data ?? []) as HintRow[]);
    } catch (error: unknown) {
      toast.error((error as Error).message ?? 'Błąd podczas pobierania wskazówek');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHints();
  }, [fetchHints]);

  const handleToggleActive = async (hint: HintRow) => {
    try {
      const { error } = await supabase
        .from('app_hints')
        .update({ active: !hint.active })
        .eq('id', hint.id);

      if (error) throw error;

      setHints((prev) => prev.map((h) => (h.id === hint.id ? { ...h, active: !hint.active } : h)));
    } catch (error: unknown) {
      toast.error((error as Error).message ?? 'Błąd podczas zmiany statusu');
    }
  };

  const handleDelete = async () => {
    if (!deleteHint) return;
    setDeleting(true);
    try {
      // Delete image from storage if exists
      if (deleteHint.image_url) {
        try {
          const urlParts = deleteHint.image_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          if (fileName) {
            await supabase.storage.from('hint-images').remove([fileName]);
          }
        } catch {
          // Don't block hint deletion if image cleanup fails
        }
      }

      const { error } = await supabase.from('app_hints').delete().eq('id', deleteHint.id);
      if (error) throw error;

      setHints((prev) => prev.filter((h) => h.id !== deleteHint.id));
      toast.success('Wskazówka usunięta');
      setDeleteHint(null);
    } catch (error: unknown) {
      toast.error((error as Error).message ?? 'Błąd podczas usuwania');
    } finally {
      setDeleting(false);
    }
  };

  const openAdd = () => {
    setEditingHint(null);
    setFormOpen(true);
  };

  const openEdit = (hint: HintRow) => {
    setEditingHint(hint);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Wskazówki in-app</h1>
            <p className="text-muted-foreground">
              Zarządzaj tooltipami, popupami i infoboxami dla adminów instancji
            </p>
          </div>
          <Button className="gap-2" onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Nowa wskazówka
          </Button>
        </div>

        {hints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <p>Brak wskazówek. Dodaj pierwszą.</p>
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Tytuł</TableHead>
                  <TableHead className="hidden md:table-cell">Trasa</TableHead>
                  <TableHead className="hidden lg:table-cell">Role</TableHead>
                  <TableHead>Aktywna</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {hints.map((hint) => (
                  <TableRow key={hint.id}>
                    <TableCell>
                      <Badge variant={TYPE_VARIANTS[hint.type]}>{TYPE_LABELS[hint.type]}</Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {hint.title}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {hint.route_pattern ?? '*'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {hint.target_roles.map((r) => (
                          <Badge key={r} variant="outline" className="text-xs">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={hint.active}
                        onCheckedChange={() => handleToggleActive(hint)}
                        aria-label={hint.active ? 'Dezaktywuj' : 'Aktywuj'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edytuj"
                          onClick={() => openEdit(hint)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Usuń"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteHint(hint)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <HintFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        hint={editingHint}
        onSuccess={fetchHints}
      />

      <ConfirmDialog
        open={!!deleteHint}
        onOpenChange={(open) => {
          if (!open) setDeleteHint(null);
        }}
        title="Usuń wskazówkę"
        description={`Czy na pewno chcesz usunąć wskazówkę "${deleteHint?.title}"? Tej operacji nie można cofnąć.`}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
