# Invoice Edit Flow — Implementation Plan

**Branch target:** `feat/invoice-edit-flow` (from `main`)
**Working directory:** `/Users/tomasznastaly/Documents/programming/carfect`

---

## Context

Today the only thing user can do with an existing invoice in Sales CRM is "Pobierz PDF". User asked for:

1. **Edit existing invoice** — click on FV in sales-crm → load data from Fakturownia (same number as in Fakturownia) → full edit → save back to Fakturownia.
2. **Cancel** invoice (`POST /invoices/cancel.json`) and **Delete** (`DELETE /invoices/{id}.json`) actions in the same view.
3. **Order-edit ⇒ invoice-update flow:** when user edits a sales order that already has an invoice and clicks "Zapisz", show a confirmation dialog _"Faktura {number} istnieje. Chcesz ją zaktualizować?"_. After "tak" — open the invoice in edit mode, with **diff highlighting** in the position table: green = added, red = removed, yellow = modified.
4. **KSeF status** visible in the UI (read-only display of `gov_status`, `gov_id`, `gov_send_date`).

This plan is sequenced so each phase ships independently. Phase 1 is invisible to the user (backend refactor only). Phases 2-3 deliver the visible features.

## Fakturownia API surface used

Verified against `https://github.com/fakturownia/api`:

| Operation      | Endpoint                                          | Notes                                                                                                                            |
| -------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Get invoice    | `GET /invoices/{id}.json`                         | Includes positions + `gov_*` (KSeF) fields                                                                                       |
| Update invoice | `PUT /invoices/{id}.json`                         | Positions: pass `id` to edit, `_destroy: 1` to remove, no id to add. No documented status restrictions; will verify empirically. |
| Cancel invoice | `POST /invoices/cancel.json`                      | Body: `cancel_invoice_id`, optional `cancel_reason`. Marks invoice as cancelled in Fakturownia (doesn't auto-create correction). |
| Delete invoice | `DELETE /invoices/{id}.json`                      | Hard delete. May fail on sent/paid — handle 4xx.                                                                                 |
| Change status  | `POST /invoices/{id}/change_status.json?status=…` | For marking as paid etc. (out of scope for v1, listed for completeness).                                                         |
| KSeF send      | `GET /invoices/{id}.json?send_to_ksef=yes`        | Optional v1.1.                                                                                                                   |

KSeF read-only fields on `GET /invoices/{id}.json`:

- `gov_status` — `ok | processing | send_error | server_error | not_applicable`
- `gov_id` — KSeF number (`{NIP}-{date}-{id}`)
- `gov_send_date`
- `gov_error_messages[]`
- `gov_verification_link`

---

## Global rules

- **DB migrations:** apply `supabase db push` immediately in the same task that creates the migration file.
- **Tests:** every `vitest` call MUST include `--run`. Max 1 test process at any time. Sub-agents do NOT run tests — only the main context does.
- **Tests written from spec, not implementation.** Each new component/hook/edge function gets a sibling test file. All test descriptions in **English**.
- **No `any` in new code.** Reuse Supabase generated types or local interfaces.
- **i18n in apps/carfect:** ALL new UI strings via `t()`. (`libs/shared-invoicing` keeps Polish hardcoded — existing convention.)
- **Never `git push`** without explicit user request.
- **Never bypass hooks.** No `--no-verify`.

## Verification commands

| Purpose                  | Command                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| Carfect typecheck        | `pnpm --filter carfect exec tsc --noEmit`                                                           |
| Carfect tests            | `pnpm --filter carfect test -- --run`                                                               |
| Targeted test            | `pnpm --filter carfect test -- --run path/to/file.test.tsx`                                         |
| Edge function Deno tests | `deno test supabase/functions/_shared/fakturownia/ --no-check --allow-env --allow-net --allow-read` |
| DB migration apply       | `supabase db push`                                                                                  |
| Edge function deploy     | `supabase functions deploy invoicing-api`                                                           |
| Vite dev server          | `pnpm --filter carfect dev` (already running on :8080 in this session)                              |

---

# Phase 1 — Backend wire-up (invisible to user)

Connects the already-written Fakturownia client (`supabase/functions/_shared/fakturownia/`) to the edge function. Adds new actions: `get_invoice`, `update_invoice`, `cancel_invoice`, `delete_invoice`. Refactors existing `create_invoice`, `send_invoice`, `get_pdf_url` to use the client.

### Task 1.1 — Wire Fakturownia client into `invoicing-api`

**Goal:** Replace inline `fakturownia*` functions in `supabase/functions/invoicing-api/index.ts` with calls to `FakturowniaClient`. Behaviour stays identical.

**Files:**

- modify `supabase/functions/invoicing-api/index.ts`

**Steps:**

1. Add `import { FakturowniaClient, mapInternalInvoiceToFakturownia } from '../_shared/fakturownia/index.ts';` at top.
2. Replace `fakturowniaCreateInvoice` body with: `const client = new FakturowniaClient(config); const fakturowniaInvoice = mapInternalInvoiceToFakturownia(invoiceData); const created = await client.invoices.create(fakturowniaInvoice); return { external_invoice_id: String(created.id), invoice_number: created.number, … }`.
3. Same pattern for `fakturowniaSendEmail` → `client.invoices.sendByEmail(externalId)`.
4. Same for `fakturowniaTestConnection` → `client.testConnection()`.
5. PDF action: `client.invoices.getPdf(externalId)` — returns `ArrayBuffer`.
6. Delete legacy inline `fakturownia*` functions.

**Verification:**

- `pnpm --filter carfect exec tsc --noEmit` → no errors related to invoicing-api (it's Deno but TS infra picks up `_shared`).
- `deno test supabase/functions/_shared/fakturownia/ --no-check --allow-env --allow-net --allow-read` → mappers tests still pass.
- Manual: in demo, "Testuj połączenie" still works, "Wystaw fakturę" still creates invoice with correct fields.

### Task 1.2 — DB migration: invoices status + cancel reason

**Goal:** Persist cancellation reason and the new `cancelled` status.

**Files:**

- create `supabase/migrations/20260428200000_invoices_cancellation.sql`

**Steps:**

1. `ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cancel_reason text;`
2. `ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;`
3. Update `status` check constraint (or enum) to include `'cancelled'`. Use `pg_constraint` introspection if existing constraint name unknown:
   ```sql
   DO $$
   DECLARE c_name text;
   BEGIN
     SELECT conname INTO c_name FROM pg_constraint
     WHERE conrelid = 'public.invoices'::regclass AND contype = 'c'
       AND pg_get_constraintdef(oid) LIKE '%status%';
     IF c_name IS NOT NULL THEN
       EXECUTE format('ALTER TABLE public.invoices DROP CONSTRAINT %I', c_name);
     END IF;
   END $$;
   ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check
     CHECK (status IN ('draft','issued','sent','paid','overdue','cancelled'));
   ```
4. Run `supabase db push`.
5. Regenerate types: `supabase gen types typescript --project-id xsscqmlrnrodwydmgvac --schema public > apps/carfect/src/integrations/supabase/types.ts`.

**Verification:**

- `supabase db push` exits 0.
- `grep "'cancelled'" apps/carfect/src/integrations/supabase/types.ts` finds new enum value.

### Task 1.3 — Edge function action: `get_invoice`

**Goal:** Fetch fresh invoice data from Fakturownia (including `gov_*` KSeF fields).

**Files:**

- modify `supabase/functions/invoicing-api/index.ts`

**Steps:**

1. New action handler after `test_connection`: `if (action === 'get_invoice') { … }`.
2. Look up `invoices` row by `id`/`instance_id`, get `external_invoice_id`.
3. `const fv = await client.invoices.get(externalInvoiceId);` — returns `FakturowniaInvoice` typed.
4. Return `{ invoice: <our DB row>, fakturownia: fv }` so frontend has both.
5. Handle 404 from Fakturownia: return `{ error: 'Faktura nie istnieje w Fakturowni', code: 'fakturownia_not_found' }` with 404 status. Frontend will display reset UI.

**Verification:**

- `deno test supabase/functions/invoicing-api/ --no-check --allow-env` (write a test that mocks `FakturowniaClient.invoices.get` and asserts edge function returns combined payload).
- Manual: from demo, hit edge function with curl, get back live data + `gov_*` fields.

### Task 1.4 — Edge function action: `update_invoice`

**Goal:** Update Fakturownia invoice + sync our DB row.

**Files:**

- modify `supabase/functions/invoicing-api/index.ts`
- modify `supabase/functions/_shared/fakturownia/mappers.ts` — add `mapInternalInvoiceToFakturowniaUpdate(data, existingPositionsByName?: Map<string, number>)` helper

**Steps:**

1. Action `update_invoice` accepts `{ instanceId, invoiceId, invoiceData, autoSendEmail? }` (same shape as create).
2. Look up `invoices` row → get `external_invoice_id`.
3. Map internal data → Fakturownia update payload. **Position diff strategy:**
   - Frontend sends `positions` with optional `external_id` field for existing rows.
   - Mapper converts to Fakturownia format: existing rows keep `id`, new rows have no `id`, removed rows are sent with `id` + `_destroy: 1`.
   - Frontend computes the "removed" set by comparing pre-edit positions list to post-edit list.
4. `await client.invoices.update(externalInvoiceId, payload)`.
5. Update our DB row with the resulting positions, totals, `updated_at`.
6. Return `{ success: true, invoice: updatedRow }`.
7. Auto-send email if `autoSendEmail && invoice.status !== 'sent'`.

**Verification:**

- New Deno test in `mappers_test.ts` for `mapInternalInvoiceToFakturowniaUpdate` covering: edited position keeps `id`; new position has no `id`; removed position has `id` + `_destroy: 1`.
- Manual: edit invoice in demo, verify Fakturownia shows updated values.

### Task 1.5 — Edge function action: `cancel_invoice`

**Files:**

- modify `supabase/functions/invoicing-api/index.ts`

**Steps:**

1. Action `cancel_invoice` accepts `{ instanceId, invoiceId, cancelReason? }`.
2. Look up `invoices` row → `external_invoice_id`.
3. `await client.invoices.cancel({ cancel_invoice_id: Number(externalInvoiceId), cancel_reason: cancelReason });`.
4. Update DB row: `status = 'cancelled'`, `cancel_reason = cancelReason`, `cancelled_at = now()`.
5. Return `{ success: true }`.

**Verification:**

- Manual: cancel an issued invoice in demo. Refresh Fakturownia — invoice marked as cancelled. Our DB row shows `status='cancelled'`.

### Task 1.6 — Edge function action: `delete_invoice`

**Files:**

- modify `supabase/functions/invoicing-api/index.ts`

**Steps:**

1. Action `delete_invoice` accepts `{ instanceId, invoiceId }`.
2. Look up `invoices` row.
3. `await client.invoices.delete(externalInvoiceId)`.
4. On success: `DELETE FROM invoices WHERE id = invoiceId` (hard delete since Fakturownia hard-deletes too).
5. On Fakturownia error (e.g. 422 "cannot delete sent invoice"): return error to frontend, don't touch our DB.

**Verification:**

- Manual: delete a draft invoice in demo. Disappears from Fakturownia and our list.
- Manual: try to delete a sent invoice. Get error toast, our row stays.

### Task 1.7 — Deploy edge function and run smoke tests

**Steps:**

1. `supabase functions deploy invoicing-api`.
2. Smoke check via Sales CRM UI for: create, get_pdf, send (existing flows). Confirm nothing regressed.

---

# Phase 2 — Frontend: edit / cancel / delete

### Task 2.1 — Reverse mapper `mapFakturowniaToInternal`

**Goal:** Take a `FakturowniaInvoice` and map it to the shape `useInvoiceForm` consumes.

**Files:**

- modify `supabase/functions/_shared/fakturownia/mappers.ts` (add reverse mapper)
- copy of mapper for the frontend: create `libs/shared-invoicing/src/fakturowniaMappers.ts` (since Deno paths can't be imported by Vite)

**Steps:**

1. In `_shared/fakturownia/mappers.ts` add `mapFakturowniaToInternal(fv: FakturowniaInvoice): InternalInvoiceData & { positions: (InternalInvoicePosition & { external_id: string })[] }`.
2. Position mapping: each Fakturownia position → `{ name, quantity: Number(quantity), unit_price_gross: Number(price_gross), vat_rate: tax === 'zw' ? -1 : Number(tax), unit: quantity_unit, discount: Number(discount_percent) || 0, external_id: String(p.id) }`.
3. Mirror file under `libs/shared-invoicing/src/fakturowniaMappers.ts` exporting same function for frontend use (DRY violation acceptable here — they live in different runtimes).
4. Tests in both: `mappers_test.ts` (Deno) + `fakturowniaMappers.test.ts` (vitest).

**Verification:**

- Both test suites green.
- Round-trip test: `mapFakturowniaToInternal(mapInternalInvoiceToFakturownia(x))` ≈ `x` for canonical fields.

### Task 2.2 — `useInvoiceForm` extension: edit mode

**Files:**

- modify `libs/shared-invoicing/src/useInvoiceForm.ts`

**Steps:**

1. Add option `existingInvoiceId?: string` to `UseInvoiceFormOptions`.
2. New effect: when `open && existingInvoiceId` — call edge function `get_invoice`, get back `{ invoice, fakturownia }`, run `mapFakturowniaToInternal(fakturownia)`, populate form state (overrides any defaults).
3. Track `originalPositions` (snapshot of positions at load time) on a ref — used by edit mode to compute removals.
4. Track `mode = existingInvoiceId ? 'edit' : 'create'`.
5. `handleSubmit` branches:
   - `mode === 'create'` → existing `create_invoice` action.
   - `mode === 'edit'` → new `update_invoice` action. Build positions array: each current position keeps its `external_id` if present (becomes `id`); each `originalPositions` entry not present in current list adds a `_destroy: 1` row.
6. Add `kseFStatus: { id, status, sendDate, errorMessages, verificationLink } | null` to return — populated from `fakturownia.gov_*`.

**Verification:**

- Vitest: new `useInvoiceForm.edit.test.ts` covering load, edit-name, edit-position, remove-position, save → asserts payload sent to edge function has correct shape.

### Task 2.3 — `CreateInvoiceDrawer` rename → `InvoiceDrawer` with edit mode

**Files:**

- rename `libs/shared-invoicing/src/CreateInvoiceDrawer.tsx` → `InvoiceDrawer.tsx` (keep `CreateInvoiceDrawer` as a thin re-export for backward compat)
- modify `libs/shared-invoicing/src/index.ts`
- modify all consumers — at minimum `apps/carfect/src/components/sales/SalesOrdersView.tsx`

**Steps:**

1. Add prop `existingInvoiceId?: string`. When set: drawer header reads "Edytuj fakturę {number}", submit button reads "Zapisz zmiany".
2. Pass `existingInvoiceId` to `useInvoiceForm`.
3. KSeF badge: small badge in the drawer header, color-coded per `gov_status` (`ok` = green, `processing` = yellow, `send_error|server_error` = red, `not_applicable` = grey).
4. Re-export `CreateInvoiceDrawer = InvoiceDrawer` so existing imports still work; mark the alias `@deprecated — use InvoiceDrawer`.

**Verification:**

- Existing `CreateInvoiceDrawer.test.tsx` still green (after p2.7 fixes).
- New `InvoiceDrawer.edit.test.tsx`: render with `existingInvoiceId='123'`, asserts `get_invoice` is called, form fields are populated, submit triggers `update_invoice`.

### Task 2.4 — Invoice actions menu in `SalesOrdersView`

**Goal:** Per-invoice dropdown with: Pobierz PDF | Wyślij mailem | Edytuj | Anuluj | Usuń. Actions are gated by status.

**Files:**

- modify `apps/carfect/src/components/sales/SalesOrdersView.tsx` (or extract `SalesOrderInvoiceActions.tsx`)
- new `apps/carfect/src/components/sales/SalesOrderInvoiceActions.tsx` + test

**Steps:**

1. New component `SalesOrderInvoiceActions` accepts `{ invoice, onAction(actionName) }`.
2. Use `DropdownMenu` from `@shared/ui`.
3. Action gating:
   - `draft` → Edytuj, Usuń
   - `issued` → Pobierz PDF, Wyślij mailem, Edytuj, Anuluj, Usuń (Anuluj only if not yet anulowana)
   - `sent` → Pobierz PDF, Wyślij ponownie, Edytuj, Anuluj
   - `paid` → Pobierz PDF (only)
   - `cancelled` → Pobierz PDF (only)
4. Confirmation dialog (`<ConfirmDialog>`-like) for Anuluj (asks for `cancel_reason`) and Usuń (yes/no).
5. After action — invalidate React Query `['invoices', salesOrderId]`.

**Verification:**

- New test `SalesOrderInvoiceActions.test.tsx`: renders correct items per status, fires correct callbacks, confirmation flow.
- Manual: in demo, every action works end-to-end.

### Task 2.5 — Polish bugfix collateral: KSeF read-only display

**Files:**

- modify `libs/shared-invoicing/src/InvoiceDrawer.tsx`

**Steps:**

1. Below header, when `kseFStatus` available: render a strip "KSeF: {status}, ID: {gov_id}, wysłano: {gov_send_date}". Link icon → opens `gov_verification_link` in new tab.
2. If `gov_status === 'send_error'`: red border + show `gov_error_messages`.
3. Read-only — no submit-to-KSeF button in v1.

**Verification:**

- Manual: open an invoice that's been sent to KSeF in demo, see KSeF section.

### Task 2.6 — Update existing `CreateInvoiceDrawer.test.tsx`

**Files:**

- modify `apps/carfect/src/components/sales/invoicing/CreateInvoiceDrawer.test.tsx`

**Steps:**

1. Update placeholder/text assertions to match the rebuilt `InvoiceForm`:
   - "Nazwa nabywcy" no longer has `*` in placeholder (label has the `*`).
   - "Razem netto/brutto" → "Wartość netto/brutto" or "Razem".
   - Email placeholder removed (label only).
2. Add test for `existingInvoiceId` prop path.

---

# Phase 3 — Order edit confirmation flow

When user edits a sales order that has an invoice, prompt to update the invoice on save.

### Task 3.1 — Detect existing invoice on order edit

**Files:**

- modify `apps/carfect/src/components/sales/AddSalesOrderDrawer.tsx`

**Steps:**

1. When `mode === 'edit'`, query `invoices` table where `sales_order_id = currentOrderId` (limit 1, where `status != 'cancelled'`).
2. Store `existingInvoice` in state.
3. Compute `invoiceFieldsChanged: boolean` — true if user modified any field that influences invoice (positions, prices, discounts, customer name/NIP, shipping costs that go on FV). Use `useMemo` comparing initial vs current state for the relevant subset.

**Verification:**

- New test `AddSalesOrderDrawer.invoiceDetect.test.ts`: mock invoices query, assert `existingInvoice` is populated; edit a position → `invoiceFieldsChanged === true`.

### Task 3.2 — Confirmation dialog on save

**Files:**

- modify `apps/carfect/src/components/sales/AddSalesOrderDrawer.tsx`
- new `apps/carfect/src/components/sales/UpdateInvoiceConfirmDialog.tsx`

**Steps:**

1. Save handler: if `existingInvoice && invoiceFieldsChanged`, open confirmation dialog before persisting the order.
2. Dialog text: "Faktura {number} jest powiązana z tym zamówieniem. Czy chcesz zaktualizować fakturę po zapisie?"
3. Buttons: "Tak, edytuj fakturę" | "Tylko zapisz zamówienie" | "Anuluj".
4. Tak → save the order, then open `InvoiceDrawer` with `existingInvoiceId={existingInvoice.id}` and the new positions pre-loaded for diff display.
5. Tylko zapisz → save only.
6. Anuluj → close dialog, no save.

**Verification:**

- Test: `AddSalesOrderDrawer.confirmDialog.test.ts`: verifies dialog shows in the right scenarios, each button does the right thing.

### Task 3.3 — Diff highlighting in the invoice positions table

**Goal:** Show two-state diff (added vs removed) when the drawer is opened via
the order-edit confirm flow. Modified positions (changed quantity/price on
existing row) are NOT highlighted — only true add/remove.

**Files:**

- new `libs/shared-invoicing/src/positionDiff.ts` + `positionDiff.test.ts`
- modify `libs/shared-invoicing/src/InvoiceForm.tsx` (rows accept `diffStatus`)
- modify `libs/shared-invoicing/src/InvoiceDrawer.tsx` (compute and pass `diffStatus` per row when in edit-mode-with-diff)

**Steps:**

1. `positionDiff(invoicePositions: Position[], orderPositions: Position[]): { merged: Position[]; statuses: ('added' | 'removed' | 'unchanged')[] }`.
   - Match by `external_id` first (when both sides have it), fallback `name + unit_price_gross`.
   - `merged` = invoice positions in original order + order-only positions appended (added) + invoice-only positions appended (removed).
   - `statuses[i]` corresponds to `merged[i]`.
2. `InvoiceForm` accepts new prop `positionDiffStatus?: ('added' | 'removed' | 'unchanged')[]`. Apply Tailwind classes:
   - `added` → `bg-green-50` row + `border-l-4 border-green-500`
   - `removed` → `bg-red-50` row + strikethrough text + `border-l-4 border-red-500` + position is **non-editable** (will be sent as `_destroy:1`)
   - `unchanged` → no highlight
3. `InvoiceDrawer` (edit-with-diff mode): receives `incomingPositions` prop. Computes `positionDiff(fakturowniaInvoice.positions, incomingPositions)` after `get_invoice` resolves. Passes `merged` to `InvoiceForm` as the editable positions list and `statuses` for highlighting.
4. Diff legend strip above the table: "Zmiany do zatwierdzenia: dodano X pozycji (zielony), usunięto Y pozycji (czerwony)."
5. User can still edit non-removed rows (e.g. fix a quantity) before clicking "Zapisz zmiany".

**Verification:**

- `positionDiff.test.ts`: pure add, pure remove, mixed, identical lists, duplicate names tie-breaking.
- `InvoiceDrawer.diff.test.tsx`: render with original + incoming, assert green/red rows + count in legend.
- Manual: edit an order, change a position, click "Tak, edytuj fakturę", verify diff visible and submit only sends `_destroy:1` for actually removed rows.

---

# Phase 4 — Edge cases & robustness

### Task 4.1 — Handle Fakturownia 4xx/5xx during edit gracefully

**Files:**

- modify `useInvoiceForm` and `InvoiceDrawer`.

**Steps:**

1. If `update_invoice` returns `{ error: 'cannot edit sent/paid invoice' }` (a 422 from Fakturownia), show a toast and offer "Anuluj fakturę i utwórz nową" as an alternative.
2. If `get_invoice` returns 404 (`code: 'fakturownia_not_found'`), set our DB row's `external_invoice_id = null` (with user confirmation) and switch drawer to create mode.
3. Network errors: keep edits local, retry button.

**Verification:**

- `InvoiceDrawer.edit.test.tsx` covers each error path.

### Task 4.2 — Realtime invalidation

**Steps:**

1. After any successful action (create/update/cancel/delete) — invalidate `['invoices', salesOrderId]` and `['sales_orders']` React Query keys.

---

# Phase 5 — Documentation

### Task 5.1 — Update `libs/shared-invoicing/FAKTUROWNIA_API.md`

Add the verified endpoints and field names from this plan. Cross-link to `_shared/fakturownia/client.ts`.

### Task 5.2 — Memory: edit-flow patterns

Save short feedback memory: "When editing Fakturownia invoices, always pass `id` for kept positions, no `id` for new, and `id + _destroy:1` for removed. Do NOT send positions without ids on update — Fakturownia treats it as add-new."

---

# Sequencing & merge points

**Suggested merge boundaries** (for incremental review):

1. **MR-1** = Phase 1 (backend + migration). Behaviour-preserving for users; unlocks Phase 2.
2. **MR-2** = Phase 2 (edit/cancel/delete UI in SalesOrdersView). Visible feature.
3. **MR-3** = Phase 3 (order-edit confirm + diff). Final user-facing flow.
4. **MR-4** = Phase 4 (edge cases) — can be folded into MR-3 if time permits.

Each MR ships independently — between MRs the app remains in a working state.

# Decisions (closed open questions)

1. **Cancel only.** No correction-invoice flow in this feature. Fakturownia
   `cancel.json` is sufficient. Korekta korygująca = separate future feature.
2. **KSeF read-only.** No "Wyślij do KSeF" button. Just display
   `gov_status / gov_id / gov_send_date / gov_verification_link`.
3. **Hard delete in our DB** when user clicks "Usuń" — mirrors Fakturownia's
   hard-delete. No `deleted_at` audit trail.
4. **Order-edit confirm flow (user-confirmed):** at save in `AddSalesOrderDrawer`:
   - User clicks "Zapisz".
   - If invoice exists for the order → dialog "Czy chcesz edytować fakturę?"
   - On "Tak" → **save the order first**, then **open `InvoiceDrawer` in edit
     mode**, fetch the invoice by its number from Fakturownia, show position
     **diff highlighting** (added in green, removed in red) so the user reviews
     before clicking "Zapisz zmiany".
   - On "Tylko zapisz zamówienie" → save order, leave invoice untouched.
   - On "Anuluj" → close dialog, no save.
   - **No silent auto-apply** — user always reviews the diff before sending to
     Fakturownia.
5. **Position match key (still open):** default — match by `external_id` first,
   fallback `name + unit_price_gross`. Heuristic for duplicates. Revisit if
   issues arise during testing.
