import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { X, MapPin, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { EmptyState } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';

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
  refreshKey?: number;
}

const UnscheduledFollowUpsDrawer = ({
  open,
  onClose,
  instanceId,
  onItemClick,
  refreshKey = 0,
}: UnscheduledFollowUpsDrawerProps) => {
  const isMobile = useIsMobile();
  // Increment key each time drawer opens to force fresh fetch
  const [openCount, setOpenCount] = useState(0);
  useEffect(() => {
    if (open) setOpenCount((c) => c + 1);
  }, [open]);

  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Fetch on every open and when refreshKey changes (even if closed — pre-fetch for next open)
  useEffect(() => {
    if (open || refreshKey > 0) fetchFollowUps();
  }, [open, openCount, refreshKey, fetchFollowUps]);

  return (
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
            <h2 className="text-lg font-semibold">Do dokończenia</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white hover:bg-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {items.length === 0 && (
              <EmptyState
                title="Brak zleceń do dokończenia"
                description="Wszystkie ponowne wizyty zostały zaplanowane"
              />
            )}
            {items.map((item) => {
              const addr = item.customer_addresses;
              const addressText =
                [addr?.city, addr?.street].filter(Boolean).join(', ') || addr?.name;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onItemClick(item.id);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-lg border border-border bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors space-y-1"
                >
                  <div className="font-medium text-sm text-foreground">{item.title}</div>
                  {item.customer_name && (
                    <div className="text-xs text-muted-foreground">{item.customer_name}</div>
                  )}
                  {addressText && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{addressText}</span>
                    </div>
                  )}
                  {item.admin_notes && (
                    <div className="flex items-start gap-1 text-xs text-foreground/80 bg-muted/50 rounded p-2 mt-1">
                      <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="whitespace-pre-line line-clamp-3">{item.admin_notes}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UnscheduledFollowUpsDrawer;
