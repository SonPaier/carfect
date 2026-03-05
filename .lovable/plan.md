

## Fix: Restore white background on inline reservation drawer

The inline mode div (line 1792) uses `bg-background` instead of `bg-white` like the Sheet mode does (line 1816).

### Change
**`src/components/admin/AddReservationDialogV2.tsx`** line 1792:
- Change `bg-background` to `bg-white` to match the Sheet mode styling.

