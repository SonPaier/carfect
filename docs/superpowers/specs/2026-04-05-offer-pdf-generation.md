# Offer PDF Generation

## Problem

Current `generate-offer-pdf` edge function generates HTML and relies on `window.print()`. This causes:

- Random page breaks splitting descriptions/sections mid-content
- Interactive elements rendered (buttons, carousels, copy buttons)
- No control over pagination

## Solution

Replace with `@react-pdf/renderer` in a Vercel API route. React-PDF gives full control over page breaks (`wrap={false}`), fixed headers/footers, and renders clean PDF binary.

## Architecture

### API Route

- **Path:** `/api/generate-offer-pdf`
- **Method:** POST `{ publicToken: string }` or GET `?token=xxx`
- **Response:** PDF binary (`application/pdf`)
- **Runtime:** Node.js (Vercel serverless function, not edge — react-pdf needs Node)

### Shared Library

- `libs/pdf/` — font registration, common styles, reusable PDF primitives
- Usable by other apps (hi-service protocols, invoices in future)

### Font

- Google Font with Polish characters (Inter or Roboto), downloaded as TTF to `libs/pdf/fonts/`
- Registered locally per react-pdf requirement (remote URLs don't work)
- Hyphenation disabled for custom fonts

## PDF Layout (multi-page A4)

### Fixed Header (every page)

- Company logo (left) + offer number (right)
- Thin separator line below
- Compact — ~40pt height

### Fixed Footer (every page)

- Company name, phone, email — one line
- "Strona X z Y" — right aligned
- ~25pt height

### Content Sections (in order)

1. **Customer & Vehicle** — name, phone, company, NIP, vehicle brand/model/plate
2. **Trust Tiles** — from instance config, horizontal row with icons
3. **Service Items** — grouped by scope:
   - Scope header (name + one photo if available, no carousel)
   - Line items: name, quantity, unit price, discount, total
   - Optional items marked with label
4. **Summary** — total net, VAT, total gross (right-aligned, bold)
5. **Terms** — validity date, payment terms, warranty, service info, notes (compact, smaller font)
6. **Bank Account** — account number as text (no copy buttons)
7. **Expert Contact** — name, phone, email as text

### What's excluded from PDF (vs web view)

- Social media links/buttons
- Copy-to-clipboard buttons
- Photo carousels (one photo per scope max)
- Expandable/truncated descriptions (show full text, trimmed if too long)
- Interactive elements (all buttons, links)
- Carfect branding footer

### Page Break Rules

- `wrap={false}` on each scope group (header + items together)
- `wrap={false}` on summary block
- `wrap={false}` on terms block
- If a scope is too large for one page, allow wrap but use `minPresenceAhead` to avoid orphans
- `break` before new scope if less than 100pt remaining

## Styling

- White background, black text (always — regardless of instance branding colors)
- Branding accent color used for: header line separator, scope header background tint, summary highlight
- Company logo: max 80x40pt, `objectFit: contain`
- Font sizes: header 8pt, body 10pt, section titles 12pt, summary 14pt
- Clean table-like layout for line items (flexbox rows)

## UI Triggers

### Offer List (ReservationsView or OffersView)

- Dropdown menu per offer → "Drukuj PDF" item
- Calls API, opens PDF in new tab or triggers download

### Public Offer View (client-facing)

- "Pobierz PDF" button, visible but not in print
- Calls same API endpoint with public token

## Data Flow

```
UI trigger → POST /api/generate-offer-pdf { publicToken }
           → Vercel function fetches offer via Supabase service role
           → Renders React-PDF components with offer data
           → Returns PDF buffer
           → Browser opens in new tab / downloads
```

## Dependencies

- `@react-pdf/renderer` — PDF generation
- `react` — peer dependency for react-pdf
- Font files (Inter/Roboto TTF) — committed to repo in libs/pdf/fonts/

## Migration

- Old `supabase/functions/generate-offer-pdf/` kept temporarily for backward compat
- New API route replaces it
- Remove old edge function after verification

## Offer Format Compatibility

PDF is built **only for v2 offers** (flat list, no scopes/templates). Legacy v1 offers are rejected by the API (400 error). UI hides "Drukuj PDF" button for non-v2 offers. V2 offers have `scope_id = NULL` — all items land in a single "Usługi" scope group. Optional/suggested items are marked with `(opcjonalnie)` badge.

## Future: PDF Configuration View

Not built now, but architecture supports it: all section visibility, font sizes, accent colors, and margins flow through a single config object. When an admin config UI is needed, it writes to DB → API reads config → passes to renderer. No component changes needed.

## Out of Scope

- PDF config UI (admin view for customizing layout) — architecture ready, UI deferred
- Email attachment (future — use same API, attach buffer)
- Batch PDF generation
