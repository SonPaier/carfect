# Follow-up Visit Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow field workers to create follow-up visits when they can't finish a job, with a calendar drawer for admins to schedule them.

**Architecture:** New `parent_item_id` column on `calendar_items` links follow-ups to originals (flat — always points to root). Two new statuses (`unfinished`, `follow_up`) with purple color scheme. Employee "End work" button becomes a 3-option choice. New `UnscheduledFollowUpsDrawer` shows pending items in calendar header.

**Tech Stack:** React 19, Supabase (Postgres migration), TanStack Query v5, shadcn/ui Sheet + Button + Badge

**Spec:** `docs/superpowers/specs/2026-03-21-follow-up-visit-design.md`

---

## Chunk 1: Database & Status Infrastructure

### Task 1: Database migration — add `parent_item_id`

**Files:**

- Create: `supabase-hiservice/migrations/20260322100000_add_parent_item_id.sql`

- [ ] **Step 1: Write migration**

```sql
-- Add parent_item_id for follow-up visit linking (flat: always points to root original)
ALTER TABLE public.calendar_items
  ADD COLUMN parent_item_id uuid REFERENCES public.calendar_items(id) ON DELETE SET NULL;

-- Index for querying follow-ups by parent
CREATE INDEX idx_calendar_items_parent_item_id ON public.calendar_items(parent_item_id)
  WHERE parent_item_id IS NOT NULL;
```

- [ ] **Step 2: Apply migration**

Run: `supabase db push --db-url "$HISERVICE_DB_URL"`
Expected: Migration applied successfully

- [ ] **Step 3: Commit**

```bash
git add supabase-hiservice/migrations/20260322100000_add_parent_item_id.sql
git commit -m "feat(hiservice): add parent_item_id column for follow-up visits"
```

### Task 2: Add new statuses to all status maps

Three files have independent status color/label maps that all need the same two entries.

**Files:**

- Modify: `apps/hiservice/src/components/admin/CalendarItemDetailsDrawer.tsx:104-118`
- Modify: `apps/hiservice/src/components/admin/AdminCalendar.tsx:117-132`

- [ ] **Step 1: Update CalendarItemDetailsDrawer status maps**

In `CalendarItemDetailsDrawer.tsx`, add to `statusLabels` (after line 109):

```typescript
unfinished: 'Nieukończone',
follow_up: 'Ponowna wizyta',
```

Add to `statusColors` (after line 117):

```typescript
unfinished: 'bg-purple-100 text-purple-800 border-purple-400',
follow_up: 'bg-purple-50 text-purple-700 border-purple-300',
```

- [ ] **Step 2: Update AdminCalendar getStatusColor**

In `AdminCalendar.tsx`, add two cases before `default` in `getStatusColor` (around line 130):

```typescript
case 'unfinished':
  return 'bg-purple-200 border-purple-500 text-purple-900';
case 'follow_up':
  return 'bg-purple-100 border-purple-300 text-purple-800';
```

- [ ] **Step 3: Verify visually**

Run: `pnpm --filter hiservice dev`
Open a calendar item, check that `unfinished` and `follow_up` labels/colors render if you temporarily set status in DB.

- [ ] **Step 4: Commit**

```bash
git add apps/hiservice/src/components/admin/CalendarItemDetailsDrawer.tsx apps/hiservice/src/components/admin/AdminCalendar.tsx
git commit -m "feat(hiservice): add unfinished and follow_up status colors and labels"
```

---

## Chunk 2: Employee "End Work" Flow

### Task 3: Replace single "Zakończ pracę" button with 3-option dialog

Currently `CalendarItemDetailsDrawer.tsx:839-845` renders a single button that calls `onEndWork(item.id)`. Replace it with a dropdown offering three choices.

**Files:**

- Modify: `apps/hiservice/src/components/admin/CalendarItemDetailsDrawer.tsx:839-845`
- Modify: `apps/hiservice/src/components/admin/CalendarItemDetailsDrawer.tsx` (props interface ~line 93)

The component needs a new prop to open the follow-up creation drawer.

- [ ] **Step 1: Add new prop to CalendarItemDetailsDrawer**

Add to the props interface (around line 93, after `onEndWork`):

```typescript
onFollowUpRequest?: (item: CalendarItem) => void;
```

- [ ] **Step 2: Replace employee "Zakończ pracę" button**

Replace the block at lines 839-845:

```typescript
{item.status === 'in_progress' && onEndWork && (
  <Button
    className="bg-sky-500 hover:bg-sky-600 text-white flex-1"
    onClick={() => onEndWork(item.id)}
  >
    Zakończ pracę
  </Button>
)}
```

With a DropdownMenu:

```tsx
{
  item.status === 'in_progress' && onEndWork && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-sky-500 hover:bg-sky-600 text-white flex-1">
          Zakończ pracę
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEndWork(item.id)}>
          <Check className="w-4 h-4 mr-2" />
          Zakończyłem pracę
        </DropdownMenuItem>
        {onFollowUpRequest && (
          <DropdownMenuItem onClick={() => onFollowUpRequest(item)}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Konieczna ponowna wizyta
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 3: Add `unfinished` status display for employee**

After the `cancelled` disabled button block (line 856), add:

```tsx
{
  item.status === 'unfinished' && (
    <Button
      variant="outline"
      className="flex-1 bg-purple-50 text-purple-800 border-purple-300"
      disabled
    >
      Nieukończone
    </Button>
  );
}
```

- [ ] **Step 4: Add `unfinished` and `follow_up` to admin status dropdowns**

In the admin view `completed` dropdown (lines 892-913), add an option:

```tsx
<DropdownMenuItem onClick={() => onStatusChange?.(item.id, 'unfinished')}>
  <RotateCcw className="w-4 h-4 mr-2" />
  Nieukończone
</DropdownMenuItem>
```

Add a new block after the `cancelled` dropdown for `unfinished` status (admin):

```tsx
{
  item.status === 'unfinished' && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex-1 bg-purple-50 text-purple-800 border-purple-300">
          Nieukończone
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onStatusChange?.(item.id, 'confirmed')}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Do wykonania
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange?.(item.id, 'completed')}>
          <Check className="w-4 h-4 mr-2" />
          Zakończone
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange?.(item.id, 'cancelled')}>
          <X className="w-4 h-4 mr-2" />
          Anulowane
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/hiservice/src/components/admin/CalendarItemDetailsDrawer.tsx
git commit -m "feat(hiservice): employee end-work dropdown with follow-up option"
```

### Task 4: Handle `unfinished` status in Dashboard.tsx

**Files:**

- Modify: `apps/hiservice/src/pages/Dashboard.tsx:732-758` (handleStatusChange)
- Modify: `apps/hiservice/src/pages/Dashboard.tsx` (onEndWork and onFollowUpRequest wiring)

- [ ] **Step 1: Extend handleStatusChange for `unfinished`**

In `handleStatusChange` (around line 744), add:

```typescript
if (newStatus === 'unfinished') updatePayload.work_ended_at = new Date().toISOString();
```

This goes right after the existing `if (newStatus === 'completed')` line.

- [ ] **Step 2: Add follow-up request state and handler**

Add state near other dialog states in Dashboard.tsx:

```typescript
const [followUpSourceItem, setFollowUpSourceItem] = useState<CalendarItem | null>(null);
```

Add handler:

```typescript
const handleFollowUpRequest = async (item: CalendarItem) => {
  // 1. Mark original as unfinished
  await handleStatusChange(item.id, 'unfinished');
  // 2. Close details drawer
  setDetailsOpen(false);
  setSelectedItem(null);
  // 3. Open AddCalendarItemDialog in follow-up mode
  setFollowUpSourceItem(item);
};
```

- [ ] **Step 3: Wire onFollowUpRequest to both CalendarItemDetailsDrawer instances**

In both places where `CalendarItemDetailsDrawer` is rendered (around lines 946-985 and 1052-1090), add:

```typescript
onFollowUpRequest = { handleFollowUpRequest };
```

- [ ] **Step 4: Commit**

```bash
git add apps/hiservice/src/pages/Dashboard.tsx
git commit -m "feat(hiservice): handle unfinished status and follow-up request in dashboard"
```

---

## Chunk 3: Follow-up Creation via AddCalendarItemDialog

### Task 5: Add follow-up mode to AddCalendarItemDialog

**Files:**

- Modify: `apps/hiservice/src/components/admin/AddCalendarItemDialog.tsx` (props + prefill logic)

- [ ] **Step 1: Add follow-up props**

Add to `AddCalendarItemDialogProps` interface (around line 63):

```typescript
followUpSourceItem?: {
  id: string;
  title: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_id?: string | null;
  customer_address_id?: string | null;
  project_id?: string | null;
  parent_item_id?: string | null;
} | null;
```

- [ ] **Step 2: Prefill follow-up data on open**

In the `useEffect` that resets form on open (find the effect that runs when `open` changes and sets initial values), add follow-up prefill logic:

```typescript
if (followUpSourceItem) {
  setTitle(`Ponowna wizyta — ${followUpSourceItem.title}`);
  setCustomerName(followUpSourceItem.customer_name || '');
  setCustomerPhone(followUpSourceItem.customer_phone || '');
  setCustomerEmail(followUpSourceItem.customer_email || '');
  setSelectedCustomerId(followUpSourceItem.customer_id || null);
  setSelectedAddressId(followUpSourceItem.customer_address_id || null);
  if (followUpSourceItem.project_id) {
    setSelectedProjectId(followUpSourceItem.project_id);
  }
  // Don't prefill date/time — leave empty for follow_up status
  setDateRange({ from: undefined, to: undefined });
  setStartTime('');
  setEndTime('');
}
```

- [ ] **Step 3: Set correct status and parent_item_id on save**

In the insert payload (find the `supabase.from('calendar_items').insert(...)` call), add:

```typescript
// Determine parent_item_id: if source is already a follow-up, use its parent (flat structure)
...(followUpSourceItem && {
  parent_item_id: followUpSourceItem.parent_item_id || followUpSourceItem.id,
  status: dateRange.from ? 'confirmed' : 'follow_up',
}),
```

If `followUpSourceItem` is set and no date was provided, set `status: 'follow_up'` instead of `'confirmed'`.

Also ensure `item_date` and times are null when not provided (the existing code may already handle nullable dates from the project stage feature — verify).

- [ ] **Step 4: Change dialog title in follow-up mode**

Where the dialog title is rendered (look for "Nowe zlecenie" or "Edytuj zlecenie" text), add:

```typescript
{
  followUpSourceItem ? 'Ponowna wizyta' : editingItem ? 'Edytuj zlecenie' : 'Nowe zlecenie';
}
```

- [ ] **Step 5: Wire in Dashboard.tsx**

Where `AddCalendarItemDialog` is rendered in Dashboard.tsx, pass:

```typescript
followUpSourceItem = { followUpSourceItem };
```

And in the dialog's `onClose`/`onSuccess`, reset:

```typescript
setFollowUpSourceItem(null);
```

Also open the dialog when `followUpSourceItem` is set:

```typescript
open={addItemOpen || !!followUpSourceItem}
```

- [ ] **Step 6: Commit**

```bash
git add apps/hiservice/src/components/admin/AddCalendarItemDialog.tsx apps/hiservice/src/pages/Dashboard.tsx
git commit -m "feat(hiservice): follow-up creation mode in AddCalendarItemDialog"
```

---

## Chunk 4: "Do dokończenia" Drawer

### Task 6: Create UnscheduledFollowUpsDrawer component

**Files:**

- Create: `apps/hiservice/src/components/admin/UnscheduledFollowUpsDrawer.tsx`

- [ ] **Step 1: Create the drawer component**

```tsx
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, MapPin, FileText, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface FollowUpItem {
  id: string;
  title: string;
  customer_name: string | null;
  customer_phone: string | null;
  admin_notes: string | null;
  created_at: string;
  parent_item_id: string | null;
  // Joined address fields
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
}

const UnscheduledFollowUpsDrawer = ({
  open,
  onClose,
  instanceId,
  onItemClick,
}: UnscheduledFollowUpsDrawerProps) => {
  const isMobile = useIsMobile();

  const { data: items = [] } = useQuery({
    queryKey: ['unscheduled_follow_ups', instanceId],
    queryFn: async (): Promise<FollowUpItem[]> => {
      const { data, error } = await supabase
        .from('calendar_items')
        .select(
          'id, title, customer_name, customer_phone, admin_notes, created_at, parent_item_id, customer_addresses(city, street, name)',
        )
        .eq('instance_id', instanceId)
        .eq('status', 'follow_up')
        .is('item_date', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: open,
    staleTime: 30 * 1000,
  });

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
              className="w-8 h-8 flex items-center justify-center rounded-md bg-background hover:bg-primary/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Brak zleceń do dokończenia
              </p>
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
                  className="w-full text-left p-3 rounded-lg border border-border hover:bg-purple-50 hover:border-purple-300 transition-colors space-y-1"
                >
                  <div className="font-medium text-sm">{item.title}</div>
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/hiservice/src/components/admin/UnscheduledFollowUpsDrawer.tsx
git commit -m "feat(hiservice): create UnscheduledFollowUpsDrawer component"
```

### Task 7: Add "Do dokończenia" button to calendar header

**Files:**

- Modify: `apps/hiservice/src/components/admin/AdminCalendar.tsx` (props + header button)

- [ ] **Step 1: Add props to AdminCalendar**

Add to `AdminCalendarProps` interface:

```typescript
unscheduledFollowUpCount?: number;
onOpenFollowUps?: () => void;
```

- [ ] **Step 2: Add button in header**

In the header's right-side button group (around line 915, inside `<div className="flex items-center gap-2">`), add before the Settings popover:

```tsx
{
  onOpenFollowUps && (
    <Button
      variant="outline"
      size="sm"
      onClick={onOpenFollowUps}
      className="gap-1 relative"
      title="Do dokończenia"
    >
      <RotateCcw className="w-4 h-4" />
      {!isMobile && <span>Do dokończenia</span>}
      {(unscheduledFollowUpCount ?? 0) > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-purple-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {unscheduledFollowUpCount}
        </span>
      )}
    </Button>
  );
}
```

Add `RotateCcw` to the lucide-react imports at the top of the file.

- [ ] **Step 3: Commit**

```bash
git add apps/hiservice/src/components/admin/AdminCalendar.tsx
git commit -m "feat(hiservice): add follow-up button with badge to calendar header"
```

### Task 8: Wire drawer and count query in Dashboard.tsx

**Files:**

- Modify: `apps/hiservice/src/pages/Dashboard.tsx`

- [ ] **Step 1: Add follow-up count query**

```typescript
const { data: unscheduledFollowUpCount = 0 } = useQuery({
  queryKey: ['unscheduled_follow_ups_count', instanceId],
  queryFn: async (): Promise<number> => {
    const { count, error } = await supabase
      .from('calendar_items')
      .select('id', { count: 'exact', head: true })
      .eq('instance_id', instanceId!)
      .eq('status', 'follow_up')
      .is('item_date', null);
    if (error) throw error;
    return count || 0;
  },
  enabled: !!instanceId,
  staleTime: 30 * 1000,
});
```

- [ ] **Step 2: Add drawer state**

```typescript
const [followUpsDrawerOpen, setFollowUpsDrawerOpen] = useState(false);
```

- [ ] **Step 3: Add handler to open item from follow-ups drawer**

```typescript
const handleFollowUpItemClick = (itemId: string) => {
  // Find item or fetch it, then open edit dialog
  const item = calendarItems.find((i) => i.id === itemId);
  if (item) {
    handleEditItem(item);
  } else {
    // Item has no date so it's not in calendarItems — fetch and open edit
    supabase
      .from('calendar_items')
      .select('*')
      .eq('id', itemId)
      .single()
      .then(({ data }) => {
        if (data) handleEditItem(data as CalendarItem);
      });
  }
};
```

- [ ] **Step 4: Pass props to AdminCalendar**

On both `AdminCalendar` instances, add:

```typescript
unscheduledFollowUpCount={unscheduledFollowUpCount}
onOpenFollowUps={() => setFollowUpsDrawerOpen(true)}
```

- [ ] **Step 5: Render UnscheduledFollowUpsDrawer**

Add import and render after the existing `CalendarItemDetailsDrawer`:

```tsx
import UnscheduledFollowUpsDrawer from '@/components/admin/UnscheduledFollowUpsDrawer';

// In JSX:
<UnscheduledFollowUpsDrawer
  open={followUpsDrawerOpen}
  onClose={() => setFollowUpsDrawerOpen(false)}
  instanceId={instanceId!}
  onItemClick={handleFollowUpItemClick}
/>;
```

- [ ] **Step 6: Invalidate follow-up count after status changes**

In `handleStatusChange`, after the existing `queryClient.invalidateQueries` calls, add:

```typescript
queryClient.invalidateQueries({ queryKey: ['unscheduled_follow_ups_count', instanceId] });
queryClient.invalidateQueries({ queryKey: ['unscheduled_follow_ups', instanceId] });
```

Do the same in `handleFollowUpRequest` after the status change, and in `AddCalendarItemDialog`'s `onSuccess`.

- [ ] **Step 7: Commit**

```bash
git add apps/hiservice/src/pages/Dashboard.tsx
git commit -m "feat(hiservice): wire UnscheduledFollowUpsDrawer and count badge in dashboard"
```

---

## Chunk 5: Auto-complete Original & Status Transition

### Task 9: Auto-complete original when all follow-ups are done

**Files:**

- Modify: `apps/hiservice/src/pages/Dashboard.tsx` (handleStatusChange)

- [ ] **Step 1: Add auto-complete logic after status change**

After the successful status update in `handleStatusChange`, add:

```typescript
// Auto-complete original when last follow-up is completed
if (newStatus === 'completed') {
  // Find if this item has a parent_item_id
  const { data: completedItem } = await supabase
    .from('calendar_items')
    .select('parent_item_id')
    .eq('id', itemId)
    .single();

  if (completedItem?.parent_item_id) {
    // Check if any other follow-ups of this original are still open
    const { count } = await supabase
      .from('calendar_items')
      .select('id', { count: 'exact', head: true })
      .eq('parent_item_id', completedItem.parent_item_id)
      .not('status', 'in', '("completed","cancelled")')
      .neq('id', itemId);

    if (count === 0) {
      // All follow-ups done — complete the original
      await supabase
        .from('calendar_items')
        .update({ status: 'completed', work_ended_at: new Date().toISOString() })
        .eq('id', completedItem.parent_item_id);

      toast.success('Oryginalne zlecenie zostało automatycznie zakończone');
      queryClient.invalidateQueries({ queryKey: ['projects-orders', instanceId] });
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hiservice/src/pages/Dashboard.tsx
git commit -m "feat(hiservice): auto-complete original when all follow-ups are done"
```

### Task 10: Transition `follow_up` → `confirmed` when date is set

**Files:**

- Modify: `apps/hiservice/src/components/admin/AddCalendarItemDialog.tsx` (save handler)

- [ ] **Step 1: Add status transition on save**

In the update path of `AddCalendarItemDialog` (when editing an existing item), if the item's current status is `follow_up` and a date is now set, change status to `confirmed`:

```typescript
// When saving an edit: if item was follow_up and now has a date, confirm it
if (editingItem?.status === 'follow_up' && dateRange.from) {
  updatePayload.status = 'confirmed';
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hiservice/src/components/admin/AddCalendarItemDialog.tsx
git commit -m "feat(hiservice): auto-confirm follow_up items when date is assigned"
```

---

## Chunk 6: Tests

### Task 11: Test employee end-work dropdown

**Files:**

- Create: `apps/hiservice/src/components/admin/CalendarItemDetailsDrawer.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CalendarItemDetailsDrawer from './CalendarItemDetailsDrawer';
import { resetSupabaseMocks, mockSupabaseQuery } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/useInstanceFeatures', () => ({
  useInstanceFeature: () => ({ enabled: false, loading: false, toggle: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const inProgressItem = {
  id: 'item-1',
  title: 'Naprawa pieca',
  item_date: '2026-03-19',
  start_time: '08:00',
  end_time: '16:00',
  status: 'in_progress',
  column_id: 'col-1',
  customer_name: 'Jan Kowalski',
  customer_phone: '500100200',
  customer_email: null,
  admin_notes: null,
  assigned_employee_ids: null,
  price: null,
  end_date: null,
  photo_urls: null,
  media_items: null,
  payment_status: 'not_invoiced',
  order_number: '1/03/2026',
  project_id: null,
  customer_id: null,
  customer_address_id: null,
  priority: null,
};

function renderDrawer(props = {}) {
  const user = userEvent.setup();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    user,
    ...render(
      <QueryClientProvider client={queryClient}>
        <CalendarItemDetailsDrawer
          item={inProgressItem as any}
          open={true}
          onClose={vi.fn()}
          columns={[{ id: 'col-1', name: 'Serwis', color: '#000' }]}
          onStatusChange={vi.fn()}
          onStartWork={vi.fn()}
          onEndWork={vi.fn()}
          onFollowUpRequest={vi.fn()}
          isEmployee={true}
          {...props}
        />
      </QueryClientProvider>,
    ),
  };
}

describe('CalendarItemDetailsDrawer – follow-up flow', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('shows dropdown with follow-up option for in_progress items (employee view)', async () => {
    const { user } = renderDrawer();

    const endWorkBtn = await screen.findByText('Zakończ pracę');
    await user.click(endWorkBtn);

    await waitFor(() => {
      expect(screen.getByText('Zakończyłem pracę')).toBeInTheDocument();
      expect(screen.getByText('Konieczna ponowna wizyta')).toBeInTheDocument();
    });
  });

  it('calls onEndWork when "Zakończyłem pracę" is clicked', async () => {
    const onEndWork = vi.fn();
    const { user } = renderDrawer({ onEndWork });

    await user.click(await screen.findByText('Zakończ pracę'));
    await user.click(await screen.findByText('Zakończyłem pracę'));

    expect(onEndWork).toHaveBeenCalledWith('item-1');
  });

  it('calls onFollowUpRequest when "Konieczna ponowna wizyta" is clicked', async () => {
    const onFollowUpRequest = vi.fn();
    const { user } = renderDrawer({ onFollowUpRequest });

    await user.click(await screen.findByText('Zakończ pracę'));
    await user.click(await screen.findByText('Konieczna ponowna wizyta'));

    expect(onFollowUpRequest).toHaveBeenCalledWith(inProgressItem);
  });

  it('shows disabled "Nieukończone" button for unfinished items (employee view)', async () => {
    renderDrawer({ item: { ...inProgressItem, status: 'unfinished' } });

    await waitFor(() => {
      expect(screen.getByText('Nieukończone')).toBeInTheDocument();
    });
    expect(screen.getByText('Nieukończone').closest('button')).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `pnpm --filter hiservice test -- --run CalendarItemDetailsDrawer`
Expected: All 4 tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/hiservice/src/components/admin/CalendarItemDetailsDrawer.test.tsx
git commit -m "test(hiservice): add follow-up flow tests for CalendarItemDetailsDrawer"
```

### Task 12: Test UnscheduledFollowUpsDrawer

**Files:**

- Create: `apps/hiservice/src/components/admin/UnscheduledFollowUpsDrawer.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UnscheduledFollowUpsDrawer from './UnscheduledFollowUpsDrawer';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

function renderDrawer(props = {}) {
  const user = userEvent.setup();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    user,
    ...render(
      <QueryClientProvider client={queryClient}>
        <UnscheduledFollowUpsDrawer
          open={true}
          onClose={vi.fn()}
          instanceId="test-instance-id"
          onItemClick={vi.fn()}
          {...props}
        />
      </QueryClientProvider>,
    ),
  };
}

describe('UnscheduledFollowUpsDrawer', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  it('shows empty state when no follow-ups', async () => {
    mockSupabaseQuery('calendar_items', { data: [], error: null });
    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Brak zleceń do dokończenia')).toBeInTheDocument();
    });
  });

  it('renders follow-up items with notes visible', async () => {
    mockSupabaseQuery('calendar_items', {
      data: [
        {
          id: 'fu-1',
          title: 'Ponowna wizyta — Naprawa pieca',
          customer_name: 'Jan Kowalski',
          customer_phone: '500100200',
          admin_notes: 'Brakuje zaworu ciśnieniowego',
          created_at: '2026-03-19T10:00:00Z',
          parent_item_id: 'original-1',
          customer_addresses: { city: 'Warszawa', street: 'Marszałkowska 1', name: null },
        },
      ],
      error: null,
    });

    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('Ponowna wizyta — Naprawa pieca')).toBeInTheDocument();
    });
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
    expect(screen.getByText('Brakuje zaworu ciśnieniowego')).toBeInTheDocument();
    expect(screen.getByText(/Warszawa.*Marszałkowska 1/)).toBeInTheDocument();
  });

  it('calls onItemClick and closes on card click', async () => {
    const onItemClick = vi.fn();
    const onClose = vi.fn();

    mockSupabaseQuery('calendar_items', {
      data: [
        {
          id: 'fu-1',
          title: 'Follow-up task',
          customer_name: null,
          customer_phone: null,
          admin_notes: null,
          created_at: '2026-03-19T10:00:00Z',
          parent_item_id: 'original-1',
          customer_addresses: null,
        },
      ],
      error: null,
    });

    const { user } = renderDrawer({ onItemClick, onClose });

    await waitFor(() => {
      expect(screen.getByText('Follow-up task')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Follow-up task'));
    expect(onItemClick).toHaveBeenCalledWith('fu-1');
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `pnpm --filter hiservice test -- --run UnscheduledFollowUpsDrawer`
Expected: All 3 tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/hiservice/src/components/admin/UnscheduledFollowUpsDrawer.test.tsx
git commit -m "test(hiservice): add UnscheduledFollowUpsDrawer tests"
```

### Task 13: Final verification

- [ ] **Step 1: Run all hiservice tests**

Run: `pnpm --filter hiservice test -- --run`
Expected: All tests pass

- [ ] **Step 2: Manual smoke test**

1. Create a calendar item, start work, click "Zakończ pracę" → verify 3 options
2. Click "Konieczna ponowna wizyta" → verify original becomes `unfinished`, follow-up drawer opens with prefilled data
3. Save follow-up without date → verify status is `follow_up`
4. Check "Do dokończenia" button shows badge with count
5. Open drawer, click item → edit dialog opens, set date → verify status changes to `confirmed`
6. Complete the follow-up → verify original auto-completes

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(hiservice): follow-up visit feature complete"
```
