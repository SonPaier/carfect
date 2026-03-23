import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { EmptyState } from '@shared/ui';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FollowUpItem {
  id: string;
  title: string;
  customer_name: string | null;
  customer_phone: string | null;
  admin_notes: string | null;
  created_at: string;
  parent_item_id: string | null;
  customer_addresses: {
    city: string | null;
    street: string | null;
    name: string | null;
  } | null;
}

interface UnscheduledFollowUpsDrawerProps {
  open: boolean;
  onClose: () => void;
  instanceId: string;
  onItemClick: (itemId: string) => void;
  onAddClick: () => void;
  refreshKey?: number;
}

const UnscheduledFollowUpsDrawer = ({
  open,
  onClose,
  instanceId,
  onItemClick,
  onAddClick,
  refreshKey = 0,
}: UnscheduledFollowUpsDrawerProps) => {
  const isMobile = useIsMobile();
  const [openCount, setOpenCount] = useState(0);
  useEffect(() => {
    if (open) setOpenCount((c) => c + 1);
  }, [open]);

  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const fetchFollowUps = useCallback(() => {
    setLoading(true);
    supabase
      .from('calendar_items')
      .select(
        'id, title, customer_name, customer_phone, admin_notes, created_at, parent_item_id, customer_addresses(city, street, name)',
      )
      .eq('instance_id', instanceId)
      .eq('status', 'follow_up')
      .is('item_date', null)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setItems((data || []) as FollowUpItem[]);
        setLoading(false);
      });
  }, [instanceId]);

  useEffect(() => {
    if (open || refreshKey > 0) fetchFollowUps();
  }, [open, openCount, refreshKey, fetchFollowUps]);

  const handleDelete = async () => {
    if (!deleteItemId) return;
    const { error } = await supabase
      .from('calendar_items')
      .delete()
      .eq('id', deleteItemId);
    if (error) {
      toast.error('Błąd usuwania zlecenia');
    } else {
      setItems((prev) => prev.filter((i) => i.id !== deleteItemId));
      toast.success('Zlecenie usunięte');
    }
    setDeleteItemId(null);
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        <SheetContent
          side="right"
          className={cn(
            'z-[1400] h-full p-0 flex flex-col',
            isMobile ? 'w-full' : 'w-full sm:w-[550px] sm:max-w-[550px]',
          )}
          hideCloseButton
          hideOverlay
        >
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-border shrink-0 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Do wykonania</h2>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={onAddClick}>
                  <Plus className="w-4 h-4 mr-1" />
                  Dodaj
                </Button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full bg-white hover:bg-hover transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {items.length === 0 && (
                <EmptyState
                  title="Brak zleceń do wykonania"
                  description="Wszystkie ponowne wizyty zostały zaplanowane"
                />
              )}
              {items.map((item) => {
                const addr = item.customer_addresses;
                const addrParts = [addr?.name, [addr?.street, addr?.city].filter(Boolean).join(', ')].filter(Boolean);
                const addressText = addrParts.join(' — ');

                return (
                  <div
                    key={item.id}
                    className="relative w-full text-left p-3 rounded-lg border border-border bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer"
                    onClick={() => {
                      onItemClick(item.id);
                      onClose();
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteItemId(item.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>

                    <div className="pr-8 space-y-1">
                      <div className="font-medium text-sm text-foreground">{item.title}</div>
                      {item.customer_name && (
                        <div className="text-xs text-foreground">{item.customer_name}</div>
                      )}
                      {addressText && (
                        <div className="text-xs text-foreground">{addressText}</div>
                      )}
                      {item.admin_notes && (
                        <div className="text-xs text-foreground mt-1 whitespace-pre-line line-clamp-3">
                          {item.admin_notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteItemId} onOpenChange={(v) => { if (!v) setDeleteItemId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć zlecenie?</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć. Zlecenie zostanie trwale usunięte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UnscheduledFollowUpsDrawer;
