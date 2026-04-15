# Spec: Add Service Shortcut in Service Selection Drawer

**Date:** 2026-04-15
**Status:** Approved

---

## Problem Statement

When an admin creates a reservation and opens the service selection drawer, if the required service does not exist yet, they must:

1. Close the service selection drawer
2. Abandon the reservation form (or remember all filled-in data)
3. Navigate to the Services (Products) module
4. Create the missing service
5. Navigate back to the reservation form
6. Re-fill any lost form data
7. Open the service selection drawer again

This is a significant UX friction point reported by users. The fix is to allow admins to create a service without leaving the reservation creation flow.

---

## Current Flow Analysis

### Files Involved

- **`apps/carfect/src/components/admin/ServiceSelectionDrawer.tsx`**
  The Sheet drawer that renders the service list. Uses `!z-[350]` on `SheetContent` (overrides the base Sheet `z-[300]`). Fetches services from `unified_services` and categories from `unified_categories` internally via raw `useEffect` + `useState` (not TanStack Query). It has two empty-state scenarios:
  1. **Search with no matches** — renders a plain `<p>` with `t('serviceDrawer.noMatches')` (line 464–466)
  2. **No services at all** — no dedicated empty state; the list area renders nothing

- **`apps/carfect/src/components/admin/ServiceFormDialog.tsx`**
  The existing service creation/editing dialog. On mobile renders as a `Drawer` (`z-[300]` default), on desktop as a `Dialog` (`z-[300]` default). Requires: `instanceId`, `categories: { id, name, prices_are_net? }[]`, `onSaved`, `onOpenChange`. Saves to `unified_services` and calls `onSaved()` on success.

- **`apps/carfect/src/components/admin/reservation-form/ServicesSection.tsx`**
  Renders `ServiceSelectionDrawer` inside the reservation form. Does not pass any "add service" capability.

- **`apps/carfect/src/components/admin/AddReservationDialogV2.tsx`**
  The main reservation creation sheet. Owns all form state.

- **`libs/ui/src/components/empty-state.tsx`** → exported as `EmptyState` from `@shared/ui`
  Shared empty state component. Props: `icon?: LucideIcon`, `title: string`, `description?: string`, `children?: ReactNode`, `className?: string`. Renders icon in a rounded container, heading, optional description, optional children slot for action buttons.

### z-index Stack

| Layer | Value |
|---|---|
| Sheet / Dialog / Drawer base | `z-[300]` |
| `ServiceSelectionDrawer` SheetContent override | `!z-[350]` |
| `ServiceFormDialog` when opened from drawer | Must be `z-[400]` |

The `ServiceFormDialog` uses the default `Dialog` (desktop) and `Drawer` (mobile) both at `z-[300]`, which places them **behind** the selection drawer at `z-[350]`. This must be fixed explicitly.

### How `ServiceFormDialog` Gets Its `categories`

`ServiceFormDialog` needs a `categories` array. `ServiceSelectionDrawer` already fetches `unified_categories` internally and holds them in local state. This data is available inside the drawer without any new props needed from parents.

---

## Proposed Solution

### UX Description

Two entry points to create a service, both self-contained inside `ServiceSelectionDrawer`:

**Entry point 1 — Enhanced search empty state:**
When the user types a query that finds no matching services, replace the current plain `"Brak dopasowań"` text with the shared `EmptyState` component:
- Icon: `Search` (lucide)
- Title: `"Nie znaleziono usługi \"{{query}}\""` (i18n key: `serviceDrawer.noMatchesWithQuery`)
- Children: a primary button `+ Dodaj usługę` — pre-fills the service name field in the creation dialog with the search query text

**Entry point 2 — Persistent footer button:**
A ghost/outline secondary button placed above the primary "Dodaj" confirm button in the fixed footer. Always visible. Label: `+ Dodaj nową usługę`. No prefill.

Both buttons open `ServiceFormDialog` layered above the drawer.

### After Service Creation

When `ServiceFormDialog.onSaved` fires:
1. `ServiceFormDialog` closes
2. The drawer re-fetches its service list
3. The newly created service is **automatically selected** (auto-select is required)
4. The user remains in the drawer and can confirm their full selection

Auto-select is achieved by tracking the newly created service by name match in the re-fetched list, then adding it to `selectedIds`.

---

## Technical Approach

### Self-Contained in `ServiceSelectionDrawer.tsx` — No Parent Changes

`ServiceFormDialog` is embedded directly inside `ServiceSelectionDrawer`. The drawer already owns `instanceId` (prop) and `categories` (local state from its own fetch), so no changes are needed to `ServicesSection`, `AddReservationDialogV2`, or any other consumer.

New internal state:
```typescript
const [addServiceOpen, setAddServiceOpen] = useState(false);
const [addServicePrefillName, setAddServicePrefillName] = useState('');
```

### z-index Fix for `ServiceFormDialog`

`ServiceFormDialog` renders a `Dialog` on desktop and `Drawer` on mobile, both defaulting to `z-[300]`. When opened from inside the selection drawer (`z-[350]`), both the overlay and the content panel must be forced above the drawer.

Pass `className` overrides on the `DialogContent` and `DrawerContent` inside `ServiceFormDialog`:
- Desktop `DialogContent`: add `z-[400]` and override the overlay via `DialogOverlay` if needed
- Mobile `DrawerContent`: add `z-[400]`

Since `ServiceFormDialog` is a shared component used elsewhere (ProductsView etc.), the z-index override should be passed as a prop, not hardcoded:

```typescript
// New optional prop on ServiceFormDialog
contentClassName?: string;
```

The drawer passes `contentClassName="!z-[400]"` when opening from within the selection drawer context. All other callers omit this prop and retain default behavior.

Additionally, the `Dialog`/`Drawer` overlay (backdrop) must also appear above `z-[350]`. This requires overriding the overlay className. Check how `DialogContent` in `@shared/ui/dialog.tsx` renders the overlay — if it's a sibling rendered by `DialogPrimitive.Content`, it may need a portal-based approach or an `overlayClassName` prop.

Simpler alternative: Use Radix `Portal` with a custom `container` element positioned above the drawer. However, the cleanest approach is the `contentClassName` prop since `DialogContent` in `@shared/ui` already accepts `className`.

The `DialogOverlay` is rendered inside `DialogContent` (line 19 of `libs/ui/src/components/dialog.tsx`). Both the overlay and panel share the z-context of the Portal. Pass `z-[400]` on `DialogContent` — Radix Portal renders at the document body level, so the z-index of the content controls stacking correctly.

### Re-fetch and Auto-Select

Refactor the drawer's existing `useEffect` fetch into a named `fetchData` `useCallback` so it can be called imperatively on save:

```typescript
const fetchData = useCallback(async () => {
  // existing fetch logic
}, [instanceId, ...]);
```

After `ServiceFormDialog.onSaved`:
```typescript
const handleServiceCreated = async () => {
  setAddServiceOpen(false);
  await fetchData();
  // Auto-select: find service by prefill name in freshly fetched list
  // The name match is fuzzy-safe since we just created it with that exact name
  setSelectedIds((prev) => {
    const created = allServices.find(
      (s) => s.name === addServicePrefillName || s.short_name === addServicePrefillName
    );
    if (created && !prev.includes(created.id)) {
      return [...prev, created.id];
    }
    return prev;
  });
};
```

When the button in the footer (no prefill) triggers creation, `addServicePrefillName` will be empty — in that case, skip auto-select (user picks manually). Auto-select only applies when created from the search empty state with a prefill name.

### Empty State Component Usage

```tsx
import { EmptyState } from '@shared/ui';
import { Search } from 'lucide-react';

// Replace the current <p> at line 464:
{searchQuery.trim() && matchingServices.length === 0 && (
  <EmptyState
    icon={Search}
    title={t('serviceDrawer.noMatchesWithQuery', { query: searchQuery })}
    className="py-8"
  >
    <Button
      type="button"
      onClick={() => {
        setAddServicePrefillName(searchQuery);
        setAddServiceOpen(true);
      }}
    >
      <Plus className="w-4 h-4 mr-1" />
      {t('serviceDrawer.addService')}
    </Button>
  </EmptyState>
)}
```

### Zero-Services Empty State

When `allServices.length === 0` and not loading, also render `EmptyState`:
- Icon: `Package`
- Title: `t('serviceDrawer.noServicesYet')`
- Children: same "Dodaj nową usługę" button

---

## Data Model Changes

None. Services are created via `unified_services` by the existing `ServiceFormDialog`. No schema changes.

---

## Edge Cases and Error Handling

| Case | Handling |
|---|---|
| Categories not yet loaded when user clicks "Add service" | Button is disabled while `loading` is true (drawer already tracks loading state) |
| `ServiceFormDialog` save fails | `ServiceFormDialog` shows its own error toast; drawer stays open with dialog still visible |
| User creates service, then closes drawer without confirming | No selection passed up; reservation form unchanged. Normal behavior. |
| Empty prefill name (button from footer) | `ServiceFormDialog` opens with empty name field; auto-select skipped after save |
| Search query contains special characters | Passed as-is into `ServiceFormDialog` name prefill; user can edit before saving |
| Multiple consumers of `ServiceSelectionDrawer` | Feature is self-contained — works for all consumers automatically (ReservationDetailsDrawer, etc.) |
| No categories exist yet | `ServiceFormDialog` allows `category_id: null`; empty `categories` array passed from drawer's local state |
| Mobile: `ServiceFormDialog` renders as `Drawer` at `z-[300]` | Fixed by `contentClassName="!z-[400]"` prop |
| Desktop: `Dialog` overlay at `z-[300]` behind drawer | Fixed by `contentClassName="!z-[400]"` — Radix Dialog Portal renders at `document.body`, so z-index on content controls stacking |

---

## i18n Keys to Add (`pl.json`, `serviceDrawer` namespace)

```json
"serviceDrawer": {
  "addService": "Dodaj usługę",
  "addNewService": "Dodaj nową usługę",
  "noMatchesWithQuery": "Nie znaleziono usługi \"{{query}}\"",
  "noServicesYet": "Brak usług. Dodaj pierwszą usługę."
}
```

---

## Files to Modify

| File | Change |
|---|---|
| `apps/carfect/src/components/admin/ServiceSelectionDrawer.tsx` | Add `ServiceFormDialog` embed, empty state, footer button, refactor fetch, auto-select logic |
| `apps/carfect/src/components/admin/ServiceFormDialog.tsx` | Add optional `contentClassName` prop, pass to `DialogContent` / `DrawerContent` |
| `apps/carfect/src/i18n/locales/pl.json` | Add 4 new i18n keys under `serviceDrawer` |

No other files require changes.

---

## Out of Scope

- Auto-selecting by ID (would require `ServiceFormDialog` to return the created ID via `onSaved` — a larger change)
- Creating a service category from within the drawer
- Editing existing services from the drawer
- Migrating `ServiceSelectionDrawer` to TanStack Query
