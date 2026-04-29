# Invoice Edit Flow — Architecture

Companion to `plan.md`. The plan says _what_ to build and in what order; this document
says _how_ the pieces fit together — boundaries, contracts, invariants, failure modes.

> **Scope reminder.** v1: read/edit/cancel/delete invoices in Fakturownia, view KSeF
> status (read-only, no send button).
>
> **Confirmed decisions** (from user):
>
> - **Cancel only**, no korekta korygująca (out of scope, future feature).
> - **Hard delete** in our DB on user "Usuń" — mirrors Fakturownia.
> - **Order-edit flow**: dialog at save → on "Tak" the order is saved first,
>   then `InvoiceDrawer` opens in edit mode with diff highlight (added=green,
>   removed=red). User reviews before clicking "Zapisz zmiany". No silent
>   auto-apply.
>
> **Out of scope** (deferred): KSeF send, korekta korygująca, iFirma edit
> (later, same shape), multi-provider diff, bulk operations, audit trail,
> reconciliation job.

---

## 1. Layered breakdown

```
┌──────────────────────────────────────────────────────────────────────┐
│                         UI (apps/carfect)                            │
│                                                                      │
│   SalesOrdersView ─────► SalesOrderInvoiceActions                    │
│         │                  (Pobierz | Edytuj | Anuluj | Usuń)        │
│         │                          │                                 │
│         ▼                          ▼                                 │
│   AddSalesOrderDrawer        InvoiceDrawer                           │
│       (edit-mode             (mode: create | edit)                   │
│        confirm)                  │   ▲                               │
│         │                        │   └── KsefStatusBadge             │
│         └──► UpdateInvoice       │       (read-only)                 │
│              ConfirmDialog       │                                   │
│                                  │                                   │
│   CancelInvoiceDialog       DeleteInvoiceDialog                      │
└─────────────────┬────────────────────────────────────────────────────┘
                  │   props + react-hook-form / state
                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  HOOKS  (libs/shared-invoicing)                      │
│                                                                      │
│   useInvoiceForm({ existingInvoiceId? })                             │
│       ├─ initializes from get_invoice (edit) or defaults (create)    │
│       ├─ tracks originalPositions snapshot for diff                  │
│       └─ exposes handleSubmit (dispatches create vs update)          │
│                                                                      │
│   useInvoiceMutations(supabaseClient, instanceId)                    │
│       ├─ create / update / cancel / delete / sendByEmail / getPdf    │
│       ├─ each is a React Query mutation                              │
│       └─ invalidates ['invoices', orderId] on success                │
│                                                                      │
│   useInvoiceQuery(invoiceId)   useOrderInvoiceLink(orderId)          │
└─────────────────┬────────────────────────────────────────────────────┘
                  │   single contract: { action, instanceId, ...payload }
                  │   defined in libs/shared-invoicing/edgeContracts.ts
                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│            EDGE FUNCTION  (supabase/functions/invoicing-api)         │
│                                                                      │
│   1. Auth (Bearer token → user)                                      │
│   2. Load invoicing_settings for instance                            │
│   3. Dispatch by `action`:                                           │
│        get_invoice | create_invoice | update_invoice |               │
│        cancel_invoice | delete_invoice | send_invoice | get_pdf      │
│   4. Call FakturowniaClient                                          │
│   5. Sync result to invoices table                                   │
│   6. Return { success | error, ...data }                             │
└─────────────────┬────────────────────────────────────────────────────┘
                  │   typed methods, no string concatenation
                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│       FAKTUROWNIA CLIENT  (supabase/functions/_shared/fakturownia/)  │
│                                                                      │
│   types.ts        — 1:1 with github.com/fakturownia/api docs         │
│   client.ts       — invoices.{create,get,list,update,cancel,delete,  │
│                                sendByEmail,getPdf}                   │
│                     clients.{create,findByTaxNo,...}                 │
│                     products.{...}, webhooks.{...}                   │
│   mappers.ts      — internal ⇄ Fakturownia types                     │
│   *_test.ts       — Deno tests (mappers; client uses mocked fetch)   │
│                                                                      │
│   Throws: FakturowniaApiError(status, body, endpoint)                │
└─────────────────┬────────────────────────────────────────────────────┘
                  │   HTTPS
                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│              FAKTUROWNIA REST API  (n2service.fakturownia.pl)        │
└──────────────────────────────────────────────────────────────────────┘
```

**Cardinal rule:** each layer talks only to its immediate neighbour. No UI calls
the edge function directly except via `useInvoiceMutations`. No edge function
writes raw fetch to Fakturownia — only through `FakturowniaClient`.

---

## 2. Boundary contracts

### 2.1 UI ↔ Hooks

**Type-checked at compile time.**

```ts
// libs/shared-invoicing/src/useInvoiceMutations.ts
export function useInvoiceMutations(opts: { supabaseClient: SupabaseClient; instanceId: string }): {
  create: UseMutationResult<InvoiceRow, Error, CreateInvoiceInput>;
  update: UseMutationResult<InvoiceRow, Error, UpdateInvoiceInput>;
  cancel: UseMutationResult<void, Error, CancelInvoiceInput>;
  remove: UseMutationResult<void, Error, { invoiceId: string }>;
  sendByEmail: UseMutationResult<void, Error, { invoiceId: string }>;
  getPdf: UseMutationResult<Blob, Error, { invoiceId: string }>;
};
```

UI never knows the action string. UI never calls `supabase.functions.invoke`
directly. Cancellation reason text comes from `CancelInvoiceDialog`, not
hardcoded in the mutation hook.

### 2.2 Hooks ↔ Edge function

**Single dispatch endpoint.** Defined in `libs/shared-invoicing/edgeContracts.ts`
and re-imported by both Vite (frontend) and Deno (edge function).

```ts
// libs/shared-invoicing/edgeContracts.ts
export type InvoicingAction =
  | {
      action: 'create_invoice';
      instanceId: string;
      invoiceData: InternalInvoiceData;
      salesOrderId?: string;
      customerId?: string;
      autoSendEmail?: boolean;
    }
  | {
      action: 'update_invoice';
      instanceId: string;
      invoiceId: string;
      invoiceData: InternalInvoiceData;
      autoSendEmail?: boolean;
    }
  | { action: 'get_invoice'; instanceId: string; invoiceId: string }
  | { action: 'cancel_invoice'; instanceId: string; invoiceId: string; cancelReason?: string }
  | { action: 'delete_invoice'; instanceId: string; invoiceId: string }
  | { action: 'send_invoice'; instanceId: string; invoiceId: string }
  | { action: 'get_pdf'; instanceId: string; invoiceId: string };

export type InvoicingResponse =
  | { success: true; invoice?: InvoiceRow; fakturownia?: FakturowniaInvoice; pdf?: ArrayBuffer }
  | { success: false; error: string; code?: InvoicingErrorCode };

export type InvoicingErrorCode =
  | 'fakturownia_not_found' // 404 — invoice gone in Fakturownia
  | 'fakturownia_locked' // 422 — sent/paid invoice can't be edited/deleted
  | 'fakturownia_unreachable' // 5xx
  | 'unauthorized'
  | 'invalid_payload';
```

**Why `code` matters:** UI dispatches different recovery flows per code
(`locked` → offer cancel-and-replace; `not_found` → reset external link).

### 2.3 Edge function ↔ Fakturownia client

```ts
// In edge function
const client = new FakturowniaClient(settings.provider_config);
try {
  const fv = await client.invoices.get(externalId);
  return { success: true, fakturownia: fv, ... };
} catch (e) {
  if (e instanceof FakturowniaApiError) {
    if (e.status === 404) return { success: false, error: 'Faktura nie istnieje', code: 'fakturownia_not_found' };
    if (e.status === 422) return { success: false, error: e.body, code: 'fakturownia_locked' };
  }
  return { success: false, error: 'Błąd Fakturowni', code: 'fakturownia_unreachable' };
}
```

**Edge function never inspects raw HTTP response.** All Fakturownia errors come
through `FakturowniaApiError`. This means tests can mock the client without
mocking `fetch`.

### 2.4 Client ↔ Fakturownia REST

`FakturowniaClient` is **dumb**: takes a typed input, calls fetch, parses JSON,
throws typed error. No business logic, no DB writes, no logging beyond
`FakturowniaApiError.message`.

This is the _only_ place where field names from Fakturownia docs appear. Every
historical bug in this codebase was caused by violating that rule (e.g.
`bank_account` vs `seller_bank_account`).

---

## 3. Source of truth

| Field / state                                           | Owner                            | Sync direction                                                                                  |
| ------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Invoice header (number, dates, buyer, seller, totals)   | Fakturownia                      | We read on demand via `get_invoice`. Our `invoices` row is a cache.                             |
| Invoice positions (current state)                       | Fakturownia                      | Same as header.                                                                                 |
| `external_invoice_id` (FK to Fakturownia)               | Fakturownia (assigned at create) | Stored once in our DB; never changes unless invoice deleted.                                    |
| `status` ∈ `{draft,issued,sent,paid,overdue,cancelled}` | Both, with sync rules below      | See 3.1                                                                                         |
| `cancel_reason`, `cancelled_at`                         | Us                               | Set when we call `cancel_invoice`; reflected in Fakturownia.                                    |
| KSeF (`gov_status`, `gov_id`, `gov_send_date`, ...)     | Fakturownia                      | Read-only. Re-fetched on demand. Not stored in our DB.                                          |
| Seller data (name, NIP, address, email, phone)          | `sales_instance_settings`        | Per-invoice override goes only to Fakturownia (not back to Sales CRM settings).                 |
| Customer data                                           | `sales_customers`                | Per-invoice edits go to Fakturownia; we don't auto-update `sales_customers` from invoice edits. |

### 3.1 Status sync rules

```
Action                       Local DB                Fakturownia
─────────────────────────────────────────────────────────────────────
create_invoice               status='issued'         creates invoice
update_invoice               (no status change)      updates invoice
send_invoice                 status='sent'           sends email
cancel_invoice               status='cancelled'      marks cancelled
delete_invoice               row deleted             invoice deleted
fakturownia-webhook (paid)   status='paid'           (event received)
```

**Invariant:** if Fakturownia says cancelled and we say issued, we have a sync
bug — the webhook (or a future reconciliation job) is responsible for healing.

**Read freshness:** every time the user opens `InvoiceDrawer` in edit mode, we
do a fresh `get_invoice` — the local row is treated as a hint, not as truth.

---

## 4. Module composition

### 4.1 Component reuse

```
InvoiceDrawer
├── (always) InvoiceForm
│   ├── (always) Top-row: type/number/dates
│   ├── (always) Seller section (editable inputs)
│   ├── (always) Buyer section (editable inputs)
│   ├── (always) Positions table (editable; rows accept diffStatus)
│   ├── (always) Totals summary (right-aligned)
│   └── (always) Payment row + split-payment checkbox
├── (edit mode) KsefStatusBadge       ← reads fakturownia.gov_*
└── (edit + diff) Diff legend strip   ← when launched from order-edit confirm

SalesOrderInvoiceActions  ← reused per row in SalesOrdersView
└── DropdownMenu of context-aware actions

UpdateInvoiceConfirmDialog ← shown from AddSalesOrderDrawer
CancelInvoiceDialog        ← shown from SalesOrderInvoiceActions
DeleteInvoiceDialog        ← shown from SalesOrderInvoiceActions
```

### 4.2 Forbidden cross-imports

- `apps/carfect/**` may import from `libs/**` ✓
- `libs/shared-invoicing/**` may import from `libs/shared-utils/**` and `libs/ui/**` ✓
- `libs/shared-invoicing/**` may NOT import from `apps/**` ✗ (would break portability)
- `libs/shared-invoicing/**` may NOT import from `supabase/functions/**` ✗ (different runtime)
- `supabase/functions/**` may import from `supabase/functions/_shared/**` ✓ but NOT from `libs/**` ✗ (Deno can't resolve npm aliases)

### 4.3 Where each piece lives

| Piece                        | Path                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| Fakturownia types (1:1 docs) | `supabase/functions/_shared/fakturownia/types.ts`                                   |
| Fakturownia client class     | `supabase/functions/_shared/fakturownia/client.ts`                                  |
| Mappers (server-side)        | `supabase/functions/_shared/fakturownia/mappers.ts`                                 |
| Mappers (mirrored, frontend) | `libs/shared-invoicing/src/fakturowniaMappers.ts`                                   |
| Edge function dispatcher     | `supabase/functions/invoicing-api/index.ts`                                         |
| Edge contract types          | `libs/shared-invoicing/src/edgeContracts.ts`                                        |
| Mutation hooks               | `libs/shared-invoicing/src/useInvoiceMutations.ts`                                  |
| Form hook                    | `libs/shared-invoicing/src/useInvoiceForm.ts` (existing, extended)                  |
| Drawer + form components     | `libs/shared-invoicing/src/InvoiceDrawer.tsx`, `InvoiceForm.tsx`                    |
| Action menu                  | `apps/carfect/src/components/sales/SalesOrderInvoiceActions.tsx`                    |
| Dialogs                      | `apps/carfect/src/components/sales/dialogs/{Update,Cancel,Delete}InvoiceDialog.tsx` |
| Diff helper                  | `libs/shared-invoicing/src/positionDiff.ts`                                         |
| KSeF badge                   | `libs/shared-invoicing/src/KsefStatusBadge.tsx`                                     |

**Mappers duplicated** between Deno (`_shared/`) and Vite (`libs/shared-invoicing/`)
because runtimes can't share files. Single source of truth in `_shared/`; Vite
copy is mechanically generated/manually-mirrored. Test parity guaranteed by both
suites covering the same cases.

---

## 5. Mode matrix for `InvoiceDrawer`

| Mode           | `existingInvoiceId` | `incomingPositions` | Submit action    | Header                                  | Footer button      |
| -------------- | ------------------- | ------------------- | ---------------- | --------------------------------------- | ------------------ |
| Create         | undefined           | undefined           | `create_invoice` | "Wystaw fakturę"                        | "Wystaw fakturę"   |
| Edit           | string              | undefined           | `update_invoice` | "Edytuj fakturę {number}"               | "Zapisz zmiany"    |
| Edit-with-diff | string              | array               | `update_invoice` | "Edytuj fakturę {number}" + diff legend | "Zatwierdź zmiany" |

`mode` is **derived**, not stored explicitly:

- `existingInvoiceId !== undefined` → edit mode.
- `existingInvoiceId !== undefined && incomingPositions !== undefined` → edit-with-diff.

The "with-diff" variant is triggered by the order-edit confirmation flow, which:

1. Saves the order first.
2. Reads the linked invoice number from our DB (`invoices.external_invoice_id`).
3. Opens `InvoiceDrawer` with `existingInvoiceId={invoice.id}` and
   `incomingPositions={updatedOrder.positions.map(orderPositionToInvoice)}`.
4. Drawer fetches the live invoice from Fakturownia (`get_invoice`).
5. Diff helper merges the two lists; rows are highlighted green/red.
6. User reviews, optionally edits unchanged rows, clicks "Zatwierdź zmiany".
7. `update_invoice` action sends the merged payload — added positions have no
   `id`, removed positions have `id` + `_destroy: 1`.

**No silent auto-apply.** The user always sees the drawer.

---

## 6. State invariants

1. **`mode === 'edit'` ⇒ `originalPositions !== null`.** The form must have a
   snapshot to compute removals.

2. **Each position has an immutable `external_id`** once persisted. Editing a
   field doesn't change the id. Removing a position keeps the id locally
   (so `_destroy: 1` can be sent on save).

3. **`status='cancelled'` is terminal** in our UI. No edit/cancel/delete actions
   available. Only "Pobierz PDF".

4. **`fakturowniaInvoice.id === existingInvoice.external_invoice_id`** —
   verified after every `get_invoice`. If they diverge, our DB is corrupt;
   show the user the Fakturownia state and ask whether to relink.

5. **Cancel reason is required if entered** — CancelInvoiceDialog forces user to
   either type a reason or explicitly tick "bez powodu". Empty string ≠ unprovided.

---

## 7. Failure mode matrix

| Failure                                                                                | Symptom                                                                  | UX                                                                                                                              |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Network down                                                                           | mutation pending forever                                                 | Spinner timeout 30s → toast "Brak połączenia" + retry button. Form state preserved.                                             |
| Fakturownia 4xx (locked)                                                               | `code: 'fakturownia_locked'`                                             | Toast + dialog "Faktura jest zablokowana do edycji. Anulować i wystawić nową?"                                                  |
| Fakturownia 4xx (validation)                                                           | `code: 'invalid_payload'`                                                | Toast with raw error message from Fakturownia. Form stays open.                                                                 |
| Fakturownia 404 on get                                                                 | `code: 'fakturownia_not_found'`                                          | Drawer renders "Ta faktura nie istnieje już w Fakturowni" + buttons "Odlinkuj" (sets `external_invoice_id=null`) and "Zamknij". |
| Fakturownia 5xx                                                                        | `code: 'fakturownia_unreachable'`                                        | Auto-retry 3× with backoff, then toast "Fakturownia niedostępna" + retry button.                                                |
| User edits stale data (someone else changed in Fakturownia between our get and update) | Last-write-wins (Fakturownia API doesn't support optimistic concurrency) | Accept it. Add note "Faktura mogła zostać zmieniona w Fakturowni — odśwież w razie wątpliwości" near save button.               |
| Webhook delivers `paid` while user is editing                                          | UI shows stale status                                                    | Accept staleness during the edit session; refresh on close. Don't auto-merge mid-edit.                                          |
| KSeF data not yet returned (`gov_status: 'processing'`)                                | Badge shows yellow "Wysyłka KSeF w toku"                                 | No action; user can re-open later.                                                                                              |

---

## 8. Test pyramid

```
                           ┌──────────────┐
                           │     E2E      │  3 happy paths in demo:
                           │ (Playwright) │  create → list, edit, cancel
                           └──────────────┘
                       ┌──────────────────────┐
                       │   Integration tests  │  InvoiceDrawer + mocked
                       │      (Vitest)        │  edge function
                       └──────────────────────┘
                ┌──────────────────────────────────┐
                │           Unit tests              │
                │   ─────────────────────────────  │
                │   - mappers (Deno + Vitest mirror)│
                │   - positionDiff (Vitest)        │
                │   - status gating (Vitest)       │
                │   - FakturowniaClient (Deno;     │
                │     mocks fetch)                 │
                └──────────────────────────────────┘
```

**Coverage target by layer:**

- Mappers: 100% branches. Adversarial inputs (empty positions, all-zeros, vat=-1,
  unicode in name).
- `positionDiff`: 100% branches. Property test: round-trip stability.
- Status gating: table-driven; every combination of (status × action) asserted.
- `FakturowniaClient`: each method, plus error path (404, 422, 500, network
  error). Use `Deno.test` with a stubbed `fetch`.
- Edge function actions: smoke tests via `deno test` with stubbed
  `FakturowniaClient`.
- `InvoiceDrawer` integration: render in create/edit/edit+diff modes; assert
  the right action string is dispatched on submit.

**Tests that must be in English** (per `MEMORY.md`): all of them.

**Tests must be written from spec, not implementation** (per `MEMORY.md`): each
phase's tests reference the relevant section of `plan.md` in a comment.

---

## 9. Sequencing

The plan in `plan.md` describes _what_ — see Section "Sequencing & merge points"
for the merge boundaries. Architecturally, the dependency graph is:

```
Phase 1 (backend) ─► must finish before Phase 2 (UI for new actions)
                  └► must finish before Phase 3 (uses update_invoice)

Phase 2 ─► must finish before Phase 3 (Phase 3 uses InvoiceDrawer in edit mode)

Phase 4 (edge cases) ─► can be folded into Phase 2 + 3 incrementally
```

Each phase ends in a deployable state — no "broken until phase N+1" intermediate.

---

## 10. Out of scope (recorded explicitly)

Considered and deliberately deferred (confirmed with user):

1. **KSeF send** — read-only only. No "Wyślij do KSeF" button.
2. **Korekta korygująca (correction invoice)** — `cancel.json` only marks the
   invoice as cancelled. For accounting purposes a separate correction may be
   needed; tracked as a future feature, **not** in this PR.
3. **iFirma edit/cancel/delete** — different API, different mappers. Same
   architectural pattern, future PR.
4. **Multi-provider diff** — diff highlighting only for Fakturownia in v1.
5. **Optimistic concurrency** — Fakturownia API doesn't support it.
   Last-write-wins accepted as a tradeoff.
6. **Bulk operations** (cancel many, delete many) — single-invoice only in v1.
7. **Audit trail / change log** — no `invoice_changes` table. Fakturownia keeps
   its own history; revisit if needed.
8. **Hard refresh / reconciliation job** between our DB and Fakturownia — relies
   on the existing webhook for now. Sync drift detection deferred.
9. **Soft delete on "Usuń"** — confirmed hard-delete (matches Fakturownia).
