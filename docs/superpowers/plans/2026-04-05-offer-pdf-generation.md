# Offer PDF Generation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate professional multi-page PDF offers using @react-pdf/renderer via Vercel API route, with proper page breaks, Polish fonts, and branding.

**Architecture:** Vercel Node.js serverless function (`api/generate-offer-pdf.ts`) renders React-PDF components. Shared PDF primitives in `libs/pdf/`. Frontend triggers from offer list, editor, and public view.

**Tech Stack:** @react-pdf/renderer, React, Vercel serverless functions, Inter font (Polish characters), Supabase service role for data fetch.

---

## File Structure

```
libs/pdf/                          # NEW — shared PDF library
  src/
    index.ts                       # barrel exports
    fonts.ts                       # font registration (Inter TTF)
    styles.ts                      # shared StyleSheet, PDF config type
    components/
      PdfHeader.tsx                # logo + offer number (fixed)
      PdfFooter.tsx                # company info + page numbers (fixed)
      PdfCustomerSection.tsx       # customer + vehicle data
      PdfTrustTiles.tsx            # trust tiles row
      PdfItemsTable.tsx            # scope header + line items
      PdfSummary.tsx               # totals (net, VAT, gross)
      PdfTerms.tsx                 # validity, payment, warranty, notes
      PdfBankAccount.tsx           # bank account number
      PdfExpertContact.tsx         # contact person info
  fonts/
    Inter-Regular.ttf              # downloaded from Google Fonts
    Inter-Bold.ttf
  package.json                     # @shared/pdf package
  tsconfig.json

api/generate-offer-pdf.ts          # NEW — Vercel serverless function

apps/carfect/src/
  lib/pdfUtils.ts                  # NEW — helper to call API and open PDF
  components/admin/
    OfferListCard.tsx              # MODIFY — add "Drukuj PDF" to menu
  components/offers/
    OfferGenerator.tsx             # MODIFY — add print icon in bottom bar
  pages/
    PublicOfferView.tsx            # MODIFY — add "Pobierz PDF" button
```

---

## Chunk 1: Shared PDF Library Setup

### Task 1: Install dependencies and create libs/pdf package

**Files:**
- Create: `libs/pdf/package.json`
- Create: `libs/pdf/tsconfig.json`
- Modify: root `package.json` (pnpm workspace)
- Modify: `apps/carfect/package.json` (add @shared/pdf dep)

- [ ] **Step 1: Create libs/pdf/package.json**

```json
{
  "name": "@shared/pdf",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "peerDependencies": {
    "react": "^19.0.0"
  },
  "dependencies": {
    "@react-pdf/renderer": "^4.3.0"
  }
}
```

- [ ] **Step 2: Create libs/pdf/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Add workspace alias in apps/carfect**

Add `"@shared/pdf": "workspace:*"` to `apps/carfect/package.json` dependencies.

Add path alias in `apps/carfect/tsconfig.json` and `vite.config.ts`:
```
"@shared/pdf": ["../../libs/pdf/src"]
```

- [ ] **Step 4: Install dependencies**

```bash
pnpm install
```

- [ ] **Step 5: Commit**

```bash
git add libs/pdf/ apps/carfect/package.json apps/carfect/tsconfig.json apps/carfect/vite.config.ts pnpm-lock.yaml
git commit -m "chore: add @shared/pdf package with react-pdf dependency"
```

### Task 2: Download Inter font and setup font registration

**Files:**
- Create: `libs/pdf/fonts/Inter-Regular.ttf`
- Create: `libs/pdf/fonts/Inter-Bold.ttf`
- Create: `libs/pdf/src/fonts.ts`

- [ ] **Step 1: Download Inter font files**

```bash
mkdir -p libs/pdf/fonts
curl -sL "https://fonts.gstatic.com/s/inter/v21/UcCo3FwrK3iLTcviYwY.ttf" -o libs/pdf/fonts/Inter-Regular.ttf
curl -sL "https://fonts.gstatic.com/s/inter/v21/UcCo3FwrK3iLTcviBhY.ttf" -o libs/pdf/fonts/Inter-Bold.ttf
file libs/pdf/fonts/Inter-Regular.ttf
```

Expected: `TrueType Font data`. If it shows HTML, use the react-pdf skill's `references/google-fonts.txt` to find correct URLs.

- [ ] **Step 2: Create fonts.ts**

```tsx
import { Font } from '@react-pdf/renderer';
import path from 'path';

export function registerFonts() {
  const fontsDir = path.join(__dirname, '..', 'fonts');

  Font.register({
    family: 'Inter',
    fonts: [
      { src: path.join(fontsDir, 'Inter-Regular.ttf'), fontWeight: 'normal' },
      { src: path.join(fontsDir, 'Inter-Bold.ttf'), fontWeight: 'bold' },
    ],
  });

  // Custom fonts lack hyphenation dictionaries — disable to prevent crashes
  Font.registerHyphenationCallback((word: string) => [word]);
}
```

- [ ] **Step 3: Commit**

```bash
git add libs/pdf/fonts/ libs/pdf/src/fonts.ts
git commit -m "feat: add Inter font files and registration for PDF"
```

### Task 3: Create shared styles and PDF config type

**Files:**
- Create: `libs/pdf/src/styles.ts`

- [ ] **Step 1: Create styles.ts with config type and base styles**

```tsx
import { StyleSheet } from '@react-pdf/renderer';

/** Configuration object for PDF rendering — future: stored per-instance in DB */
export interface PdfConfig {
  accentColor: string;      // branding accent (separator line, section headers)
  companyName: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  logoUrl?: string | null;
  showTrustTiles: boolean;
  showBankAccount: boolean;
  showExpertContact: boolean;
}

export const defaultPdfConfig: PdfConfig = {
  accentColor: '#2563eb',
  companyName: '',
  showTrustTiles: true,
  showBankAccount: true,
  showExpertContact: true,
};

export const baseStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    paddingTop: 70,
    paddingBottom: 50,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#111111',
  },
  // Fixed header
  header: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  headerSeparator: {
    position: 'absolute',
    top: 55,
    left: 40,
    right: 40,
    height: 1,
  },
  // Fixed footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#888888',
  },
  // Section
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  // Table row
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    fontWeight: 'bold',
    fontSize: 8,
    color: '#666666',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add libs/pdf/src/styles.ts
git commit -m "feat: add PDF base styles and config type"
```

### Task 4: Create PDF section components

**Files:**
- Create: `libs/pdf/src/components/PdfHeader.tsx`
- Create: `libs/pdf/src/components/PdfFooter.tsx`
- Create: `libs/pdf/src/components/PdfCustomerSection.tsx`
- Create: `libs/pdf/src/components/PdfTrustTiles.tsx`
- Create: `libs/pdf/src/components/PdfItemsTable.tsx`
- Create: `libs/pdf/src/components/PdfSummary.tsx`
- Create: `libs/pdf/src/components/PdfTerms.tsx`
- Create: `libs/pdf/src/components/PdfBankAccount.tsx`
- Create: `libs/pdf/src/components/PdfExpertContact.tsx`
- Create: `libs/pdf/src/index.ts`

Each component receives typed props, uses `baseStyles`, accent color from `PdfConfig`. Key patterns:

- `PdfHeader`: `fixed` prop, logo as `Image` (fetched as buffer in API), offer number right-aligned
- `PdfFooter`: `fixed` prop, `render` for page numbers
- `PdfItemsTable`: `wrap={false}` per scope group. If scope has many items, allow wrap with `minPresenceAhead={80}`
- `PdfSummary`: `wrap={false}`, right-aligned totals
- `PdfTerms`: `wrap={false}`, compact 8pt font
- `PdfTrustTiles`: horizontal row with text (no icons in PDF — react-pdf can't render lucide SVGs easily)

- [ ] **Step 1: Create all component files** (implement one by one, each ~30-60 lines)
- [ ] **Step 2: Create barrel export in index.ts**

```tsx
export { registerFonts } from './fonts';
export { baseStyles, type PdfConfig, defaultPdfConfig } from './styles';
export { PdfHeader } from './components/PdfHeader';
export { PdfFooter } from './components/PdfFooter';
// ... etc
```

- [ ] **Step 3: Commit**

```bash
git add libs/pdf/src/
git commit -m "feat: add PDF section components for offer generation"
```

---

## Chunk 2: Vercel API Route

### Task 5: Create the API endpoint

**Files:**
- Create: `api/generate-offer-pdf.ts`

- [ ] **Step 1: Implement the serverless function**

Key logic:
1. Parse `publicToken` from POST body or GET query
2. Create Supabase client with service role key
3. Fetch offer via `get_public_offer` RPC (same as PublicOfferView uses)
4. Fetch instance data for branding
5. If logo URL exists, fetch logo image as buffer
6. Call `registerFonts()`
7. Render `<OfferPdfDocument data={offer} config={config} />` with `renderToBuffer`
8. Return buffer with `Content-Type: application/pdf` and `Content-Disposition: inline; filename="oferta-{number}.pdf"`

```tsx
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@supabase/supabase-js';
import React from 'react';
import { registerFonts } from '../libs/pdf/src/fonts';
import { OfferPdfDocument } from '../libs/pdf/src/OfferPdfDocument';

export const maxDuration = 30;

export default async function handler(req, res) {
  // ... implementation
}
```

- [ ] **Step 2: Test locally with `vercel dev`**

```bash
vercel dev
curl -X POST http://localhost:3000/api/generate-offer-pdf \
  -H "Content-Type: application/json" \
  -d '{"publicToken": "test-token"}' \
  -o test-output.pdf
```

- [ ] **Step 3: Commit**

```bash
git add api/generate-offer-pdf.ts
git commit -m "feat: add Vercel API route for PDF generation"
```

### Task 6: Create OfferPdfDocument — the full document component

**Files:**
- Create: `libs/pdf/src/OfferPdfDocument.tsx`

Composes all section components into a `<Document><Page>` structure:

```tsx
<Document title={`Oferta ${offerNumber}`} language="pl">
  <Page size="A4" style={baseStyles.page}>
    <PdfHeader config={config} offerNumber={offerNumber} logo={logoBuffer} />
    <View style={baseStyles.headerSeparator} fixed>
      <View style={{ height: 1, backgroundColor: config.accentColor }} />
    </View>

    <PdfCustomerSection customer={data.customer_data} vehicle={data.vehicle_data} />
    {config.showTrustTiles && <PdfTrustTiles tiles={instance.offer_trust_tiles} />}

    {/* Scope groups */}
    {scopeGroups.map(scope => (
      <PdfItemsTable key={scope.id} scope={scope} hideUnitPrices={data.hide_unit_prices} />
    ))}

    <PdfSummary totalNet={data.total_net} totalGross={data.total_gross} vatRate={data.vat_rate} />
    <PdfTerms offer={data} />
    {config.showBankAccount && <PdfBankAccount instance={instance} />}
    {config.showExpertContact && <PdfExpertContact instance={instance} />}

    <PdfFooter config={config} />
  </Page>
</Document>
```

- [ ] **Step 1: Implement OfferPdfDocument**
- [ ] **Step 2: Test with a real offer token — verify page breaks, Polish characters**
- [ ] **Step 3: Commit**

```bash
git add libs/pdf/src/OfferPdfDocument.tsx
git commit -m "feat: add OfferPdfDocument composing all sections"
```

---

## Chunk 3: Frontend Integration

### Task 7: Create pdfUtils helper

**Files:**
- Create: `apps/carfect/src/lib/pdfUtils.ts`

```tsx
const PDF_API_URL = '/api/generate-offer-pdf';

export async function openOfferPdf(publicToken: string): Promise<void> {
  const response = await fetch(PDF_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate PDF');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
```

- [ ] **Step 1: Create pdfUtils.ts**
- [ ] **Step 2: Commit**

### Task 8: Add "Drukuj PDF" to offer list dropdown

**Files:**
- Modify: `apps/carfect/src/components/admin/OfferListCard.tsx`

- [ ] **Step 1: Add `onPrintPdf` callback to OfferListCard props**
- [ ] **Step 2: Add DropdownMenuItem with Printer icon**
- [ ] **Step 3: Wire up in OffersView.tsx — call `openOfferPdf(offer.public_token)`**
- [ ] **Step 4: Commit**

### Task 9: Add print icon to OfferGenerator bottom bar

**Files:**
- Modify: `apps/carfect/src/components/offers/OfferGenerator.tsx`

- [ ] **Step 1: Add Printer icon button next to existing actions in bottom bar**
- [ ] **Step 2: Only show when offer is saved (has public_token)**
- [ ] **Step 3: Commit**

### Task 10: Add "Pobierz PDF" button to public offer view

**Files:**
- Modify: `apps/carfect/src/pages/PublicOfferView.tsx`
- Modify: `apps/carfect/src/components/offers/PublicOfferCustomerView.tsx`

- [ ] **Step 1: Add "Pobierz PDF" button (Download icon) near top of page**
- [ ] **Step 2: Call `openOfferPdf` with the public token**
- [ ] **Step 3: Hide the button when in print mode (`?print=true`)**
- [ ] **Step 4: Commit**

---

## Chunk 4: Testing & Cleanup

### Task 11: Visual verification

- [ ] **Step 1: Generate PDF for a short offer (1-2 items) — verify fits one page**
- [ ] **Step 2: Generate PDF for a long offer (10+ items, multiple scopes) — verify page breaks**
- [ ] **Step 3: Verify Polish characters: ąćęłńóśźż in customer name, description, terms**
- [ ] **Step 4: Verify company logo renders correctly**
- [ ] **Step 5: Verify accent color from instance branding**
- [ ] **Step 6: Test all 3 UI triggers (list, editor, public view)**

### Task 12: Deploy and verify on production

- [ ] **Step 1: Push branch, create PR**
- [ ] **Step 2: Verify Vercel preview deployment includes the API route**
- [ ] **Step 3: Test with real production offer data on preview URL**
- [ ] **Step 4: Merge**

### Task 13: Remove old edge function (after verification)

- [ ] **Step 1: Remove or deprecate `supabase/functions/generate-offer-pdf/`**
- [ ] **Step 2: Remove old PDF generation code from OfferGenerator if applicable**
- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove old generate-offer-pdf edge function"
```
