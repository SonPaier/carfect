

## Plan: Calendar-first reservation from offers + inline drawer on desktop

### Problem
1. "Rezerwuj" from offers list opens the reservation drawer over the offers view — user can't see the calendar to find free slots.
2. On desktop, the reservation drawer (Sheet) overlays the calendar with no overlay but still floats on top, hiding calendar columns underneath.

### Solution

#### 1. Navigate to calendar before opening reservation drawer from offers

**OffersView.tsx**: Instead of opening `AddReservationDialogV2` internally, emit the offer data upward so `AdminDashboard` can navigate to calendar first, then open the drawer.

- Add `onReserveFromOffer?: (offerData: EditingReservation) => void` prop to `OffersViewProps`
- In `handleReserveFromOffer`, call `onReserveFromOffer(getReservationDataFromOffer(offer))` instead of setting local state
- Remove the local `AddReservationDialogV2` render and `reservationFromOffer` state

**AdminDashboard.tsx**: 
- Pass `onReserveFromOffer` callback to `<OffersView>`
- In the callback: `setCurrentView('calendar')`, set `editingReservation` with the offer data, open the reservation drawer
- The existing `AddReservationDialogV2` in AdminDashboard handles it from there

#### 2. Inline (push) drawer on desktop instead of overlay

Currently `AddReservationDialogV2` uses `<Sheet>` (radix dialog) which renders in a portal, floating over content. To make it push/squeeze the calendar:

**AdminDashboard.tsx layout change**:
- Wrap the calendar content area and the reservation form in a flex row on desktop
- When drawer is open on desktop (`!isMobile && addReservationOpen`), render the form as a side panel (not a Sheet/portal) that takes ~27rem, and the calendar takes the remaining space
- On mobile, keep the current Sheet behavior (full-screen slide-in)

**AddReservationDialogV2.tsx**:
- Add an `inline?: boolean` prop
- When `inline=true`, render the form content directly (no `<Sheet>` wrapper) inside a `<div>` with the same styling
- When `inline=false` (mobile), keep the existing `<Sheet>` behavior
- Extract the form content into a shared inner component to avoid duplication

**AdminDashboard.tsx rendering**:
- On desktop + calendar view + drawer open: render `AddReservationDialogV2` with `inline={true}` as a sibling to the calendar `<div>`, both inside a `flex` row
- Otherwise: render with `inline={false}` (Sheet mode, for mobile or non-calendar views)

```text
Desktop layout when drawer open:
┌──────────┬─────────────────────────┬──────────────┐
│ Sidebar  │   Calendar (flex-1)     │  Reservation │
│          │   columns compress      │  Form ~27rem │
│          │   to fit               │  (inline)    │
└──────────┴─────────────────────────┴──────────────┘

Mobile: unchanged (Sheet full-screen)
```

### Files to modify
1. **`src/components/admin/OffersView.tsx`** — lift reservation-from-offer up via callback prop, remove local dialog
2. **`src/pages/AdminDashboard.tsx`** — handle `onReserveFromOffer` (navigate to calendar + open drawer), change calendar area layout to flex row with inline drawer
3. **`src/components/admin/AddReservationDialogV2.tsx`** — add `inline` prop, conditionally render as `<Sheet>` or plain `<div>`

