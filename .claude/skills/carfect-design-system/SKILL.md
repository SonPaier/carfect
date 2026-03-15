---
name: carfect-design-system
description: Carfect monorepo design system guide for component architecture, placement (@shared/ui vs app-specific), shadcn/ui extension, Tailwind v3 theming, form patterns (React Hook Form + Zod), responsive design, tables, loading states, and icon conventions. Use this skill whenever creating new UI components, modifying existing ones, adding shadcn components, building forms, building tables, working with Tailwind theme tokens, or making layout/responsive decisions in the Carfect monorepo. Also triggers when moving components between shared and app layers, asking about component conventions, or working on Hi Service app theming.
---

# Carfect Design System

Guide for building UI in the Carfect monorepo — covers where components live, how they're structured, and the conventions the team follows.

## Architecture Overview

```
libs/ui/                          → @shared/ui (cross-app shared)
  src/
    components/ui/                → shadcn/ui primitives + shared composites
    hooks/                        → useIsMobile, useToast
    lib/utils.ts                  → cn() utility
  tailwind.config.ts              → shared Tailwind preset (structure, typography, animations)

apps/carfect/                     → Carfect app
  src/
    components/ui/                → app-specific composites (autocompletes, uploaders)
    components/admin/             → admin panel components
    index.css                     → Carfect color palette (CSS variables)
  tailwind.config.ts              → extends shared preset

apps/hiservice/                   → Hi Service app (planned)
  src/
    index.css                     → Hi Service color palette (different CSS variables)
  tailwind.config.ts              → extends same shared preset
```

### Multi-App Theming Strategy

Components in @shared/ui are color-agnostic — they use semantic tokens (`bg-primary`, `text-destructive`). Each app defines its own color palette via CSS variables in `index.css`:

| Layer                          | What it defines                                                          | Shared?            |
| ------------------------------ | ------------------------------------------------------------------------ | ------------------ |
| `@shared/ui` components        | Structure, layout, variants, animations                                  | ✅ Yes             |
| `libs/ui/tailwind.config.ts`   | Typography (Inter, Lora, Space Mono), border-radius, shadows, animations | ✅ Yes             |
| `apps/carfect/src/index.css`   | Carfect colors (gold primary, blue-gray secondary)                       | ❌ Carfect only    |
| `apps/hiservice/src/index.css` | Hi Service colors (TBD palette)                                          | ❌ Hi Service only |

This means the same Button component renders gold in Carfect and a different color in Hi Service — zero code changes, just different CSS variables.

## Where Does a Component Go?

### `@shared/ui` — libs/ui/src/components/ui/

Put here when:

- A design primitive (buttons, inputs, dialogs, cards, tooltips)
- Not tied to any business domain or Supabase query
- Useful across Carfect AND Hi Service
- A shadcn/ui component (always lives here)

Examples: Button, Input, Select, Dialog, Drawer, AlertDialog, Card, Tabs, Toast, PhoneMaskedInput, ConfirmDialog, EmptyState, StarLoader, Pagination

### App-specific — apps/carfect/src/components/ui/

Put here when:

- Uses app-specific context (CarModelsContext, Supabase client)
- Contains business logic (customer search, vehicle lookup)
- Only makes sense within this app

Examples: CarSearchAutocomplete, ClientSearchAutocomplete, PhotoUploader, ImagePasteZone

### Decision checklist

1. Does it call Supabase or use app context? → **app-specific**
2. Does it contain business logic? → **app-specific**
3. Is it a pure UI primitive or layout component? → **@shared/ui**
4. Could Hi Service use it unchanged? → **@shared/ui**

## Component Structure Patterns

### shadcn/ui components (in @shared/ui)

Follow the standard shadcn pattern — don't deviate:

```tsx
import * as React from 'react';
import { cn } from '../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('base-classes rounded-[1px]', {
  variants: {
    variant: {
      default: '...',
      destructive: '...',
      outline: '...',
      secondary: '...',
      ghost: '...',
      link: '...',
    },
    size: { default: 'h-11', sm: 'h-9', lg: 'h-14', xl: 'h-16', icon: 'h-11 w-11' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});
// All buttons use rounded-[1px] — no per-size radius overrides.
// Removed variants: hero, glass, success.

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
);
Button.displayName = 'Button';
```

Key rules:

- Always use `React.forwardRef`
- Always set `displayName`
- Always merge className with `cn()`
- Use CVA for variants
- Use Radix UI as primitive base when applicable

### App-specific composites

```tsx
// Naming: PascalCase component, kebab-case filename
// car-search-autocomplete.tsx → CarSearchAutocomplete

interface CarSearchAutocompleteProps {
  value?: string;
  onChange: (value: CarSearchValue) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  className?: string;
}

export type CarSearchValue = CarModel | { type: 'custom'; label: string } | null;
```

Conventions:

- **Controlled components** — accept value + onChange, no internal form state
- **Selective imports** — `import { Input } from '@shared/ui'` (named, never wildcard)
- **Keyboard navigation** — ArrowUp/Down, Enter, Escape, Tab for dropdowns
- **ARIA attributes** — role, aria-expanded, aria-haspopup, aria-autocomplete
- **Refs** — containerRef, inputRef, listRef (useRef pattern)
- **Handlers** — prefix with `handle`: handleInputChange, handleKeyDown, handleClear

## Icon Conventions

Use **lucide-react** exclusively. Consistent icon mapping across all apps:

| Action          | Icon      | Color/Style              |
| --------------- | --------- | ------------------------ |
| Delete/Remove   | `Trash2`  | `text-destructive` (red) |
| Close/Dismiss   | `X`       | default foreground       |
| Add/Create      | `Plus`    | default or primary       |
| Edit            | `Pencil`  | default foreground       |
| Loading/Spinner | `Loader2` | `animate-spin`           |
| Search          | `Search`  | `text-muted-foreground`  |
| Save/Confirm    | `Check`   | default or success       |

Never mix icon libraries. When adding a new action, check if an existing icon mapping covers it before introducing a new icon.

## Import Paths

```tsx
import { Button, Input, cn } from '@shared/ui';
import { compressImage } from '@shared/utils';
import { supabase } from '@/integrations/supabase/client';
import { useCarModels } from '@/contexts/CarModelsContext';
```

Never import from relative paths across library boundaries. Never import Supabase client in @shared/ui.

## i18n & Shared Components

Carfect uses react-i18next for translations. Hi Service may not use i18n at all. This means shared components must be **language-agnostic**:

### Rule: @shared/ui components never contain text or call `t()`

All user-visible strings must come in as props:

```tsx
// ✅ Shared component — accepts text as props
interface ConfirmDialogProps {
  title: string
  description?: string
  confirmLabel?: string     // default: undefined, NOT a Polish string
  cancelLabel?: string
  onConfirm: () => void
}

// ✅ Carfect wraps it with translations
const { t } = useTranslation()
<ConfirmDialog
  title={t('confirm.deleteTitle')}
  confirmLabel={t('common.delete')}
  cancelLabel={t('common.cancel')}
  onConfirm={handleDelete}
/>

// ✅ Hi Service uses it without i18n
<ConfirmDialog
  title="Are you sure?"
  confirmLabel="Delete"
  onConfirm={handleDelete}
/>
```

```tsx
// ❌ NEVER do this in @shared/ui
import { useTranslation } from 'react-i18next'
const { t } = useTranslation()
<button>{t('common.save')}</button>  // ties component to i18n
```

### Where i18n calls live

| Layer                            | i18n calls? | Text source                   |
| -------------------------------- | ----------- | ----------------------------- |
| `@shared/ui`                     | ❌ Never    | Props only                    |
| `apps/carfect/src/components/`   | ✅ Yes      | `t('key')` from react-i18next |
| `apps/hiservice/src/components/` | Depends     | Direct strings or own i18n    |

When adding text props to shared components, use descriptive prop names: `title`, `description`, `confirmLabel`, `cancelLabel`, `placeholder`, `emptyMessage` — not generic `text` or `label`.

## Tailwind Theme System

### Color tokens (per-app CSS variables)

All colors use HSL format: `hsl(var(--name))`. Defined in each app's `index.css`.

**Carfect palette:**

| Token           | Purpose             | Value         |
| --------------- | ------------------- | ------------- |
| `--primary`     | Brand gold/amber    | 45 100% 32.4% |
| `--secondary`   | Blue-gray           | 215 19% 34%   |
| `--destructive` | Error red           | 0 72% 50%     |
| `--warning`     | Caution orange      | 40 100% 50%   |
| `--muted`       | Subdued backgrounds | 210 11% 96%   |

**Hi Service palette:** TBD — will use the same CSS variable names with different values. When creating Hi Service's `index.css`, copy Carfect's structure and replace color values only.

### Using tokens

```tsx
// Correct — semantic tokens (works in both apps)
<div className="bg-primary text-primary-foreground" />
<span className="text-muted-foreground" />

// Wrong — hardcoded colors (breaks multi-app theming)
<div className="bg-amber-600 text-white" />
```

Dark mode is defined (`.dark` class) but not actively used. Don't add dark mode logic unless asked.

### Visual Rules (strict)

These rules apply across all apps:

1. **White backgrounds everywhere** — forms, cards, inputs, selects, textareas all use `bg-white` or `bg-background`. Never use gray cards (`bg-muted`, `bg-gray-50`, `bg-slate-100`).

2. **Black, readable text** — use `text-foreground` (black) for all body text, labels, and values. Never use `text-muted-foreground` or `text-gray-400/500` for important content — those grays are barely visible. Reserve muted text only for truly secondary info (timestamps, helper text under inputs).

3. **Controls are white** — Input, Select, Textarea, Checkbox containers all have white background. No gray input fields.

4. **Hover uses theme variable** — all hover states use `hover:bg-hover` (the `--hover` CSS variable). Don't invent custom hover colors like `hover:bg-gray-100` or `hover:bg-slate-50`.

5. **Tabs always underline style** — use underline/border-bottom variant for tabs, never pills, buttons, or boxed tabs. Active tab has a bottom border indicator.

```tsx
// ✅ Correct
<Card className="bg-white" />
<Input className="bg-white" />
<span className="text-foreground">Nazwa klienta</span>
<Button className="hover:bg-hover" />

// ❌ Wrong
<Card className="bg-muted" />
<Input className="bg-gray-50" />
<span className="text-muted-foreground">Nazwa klienta</span>  // too light!
<Button className="hover:bg-gray-100" />
```

### Custom utility classes (Carfect-specific, in index.css @layer)

- `.gradient-text` — gradient text via background-clip
- `.card-elevated` — elevated card shadow

### Shared animations (from libs/ui/tailwind.config.ts)

Available: `accordion-down`, `accordion-up`, `shimmer`, `slide-in-left`, `slide-in-right`, `fade-in`, `pulse-dot`

## Responsive Design

Mobile-first with Tailwind breakpoints. `useIsMobile()` hook (768px) for JS-level logic.

```tsx
// CSS-level (preferred for simple changes)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" />;

// JS-level (when layout structure changes — e.g., Drawer vs Dialog)
import { useIsMobile } from '@shared/ui';
const isMobile = useIsMobile();
return isMobile ? <Drawer>...</Drawer> : <Dialog>...</Dialog>;
```

### Modals: Drawer vs Dialog

- **Drawer** — default for all modals (forms, details, editors). Always opens from right side.
- **Dialog** — only for confirmations and short yes/no decisions (ConfirmDialog).
- On mobile (<768px), ConfirmDialog renders as bottom Drawer instead of Dialog (useIsMobile hook).

When building a new modal: use `Drawer` unless it's a simple confirmation.

### Close Button Pattern

All drawers, overlays, and full-screen dialogs use a consistent custom close button:

```tsx
<button
  type="button"
  onClick={onClose}
  className="p-2 rounded-full bg-white hover:bg-hover transition-colors"
>
  <X className="w-5 h-5" />
</button>
```

Position: `absolute top-3 right-3 z-50`

- **shadcn Sheet/Drawer**: pass `hideCloseButton` to `SheetContent`, render custom button
- **shadcn Dialog**: add `[&>button]:hidden` to `DialogContent`, wrap custom button in `<div>` to avoid the selector hiding it

Used in: ReservationDetailsDrawer, CustomerEditDrawer, AddTrainingDrawer, OfferPreviewDialog.

### Admin Module Content Width

All views within an admin module (e.g. offers) use the same `max-w-3xl mx-auto w-full` content width for consistency. This applies to:

- List views (offer list, template list)
- Form/editor views (offer generator steps, template editor)
- Sticky footer button containers

```tsx
// Content wrapper
<div className="max-w-3xl mx-auto w-full space-y-6 pb-6">{/* page content */}</div>
```

### Fixed Footer Pattern

Editor views (offer generator, template editor) use a fixed footer with action buttons:

```tsx
// Content wrapper — pb-24 reserves space for fixed footer
<div className="pb-24">
  <div className="max-w-3xl mx-auto w-full space-y-6">{/* form fields */}</div>

  {/* Fixed footer — always at bottom of viewport */}
  <div className="fixed bottom-0 left-0 right-0 bg-background border-t py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
    <div className="flex items-center justify-between max-w-3xl mx-auto px-4">
      <Button variant="outline">Wróć</Button>
      <Button>Zapisz</Button>
    </div>
  </div>
</div>
```

Key rules:

- Use `fixed bottom-0 left-0 right-0` — always pinned to viewport bottom
- Content needs `pb-24` to prevent footer from covering last items
- Footer buttons align with content via `max-w-3xl mx-auto px-4`
- `z-40` — below dialogs (`z-50`) but above content
- Mobile bottom nav is hidden during editing via `onEditModeChange` callback

### Selection Patterns

Different entity types use different selection UIs:

| Entity        | Component                  | Type                                        |
| ------------- | -------------------------- | ------------------------------------------- |
| **Klient**    | `ClientSearchAutocomplete` | Inline autocomplete (search by name/phone)  |
| **Samochód**  | `CarSearchAutocomplete`    | Inline autocomplete (search by brand/model) |
| **Pracownik** | Dedicated selection Drawer | Drawer with list + search                   |
| **Usługa**    | `ServiceSelectionDrawer`   | Drawer with categorized list                |

When building a form that needs entity selection:

- **Klient/Samochód** → always use the existing autocomplete components inline in the form
- **Pracownik/Usługa** → open a Drawer with a searchable list, return selection to the form

### Z-index strategy

Autocomplete dropdowns: `z-[9999]` (must appear above dialogs).

## Form Patterns

### Validation strategy

- **Trigger:** `onSubmit` only (on save/submit button click)
- **Error display:** Red text below the field with error
- **Scroll:** Auto-scroll to first error field after failed submit
- **Error messages:** Always in Polish

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Wymagane pole'),
  phone: z.string().regex(/^\d{9}$/, 'Nieprawidłowy numer'),
  email: z.string().email('Nieprawidłowy email').optional(),
})

type FormData = z.infer<typeof schema>

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  mode: 'onSubmit',  // validate only on submit
})

// Scroll to first error after failed validation
const onError = () => {
  const firstError = document.querySelector('[data-error="true"]')
  firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

<form onSubmit={form.handleSubmit(onSuccess, onError)}>
```

### Error display pattern

```tsx
// Field with error state
<div>
  <Label>Nazwa</Label>
  <Input
    {...register('name')}
    data-error={!!errors.name}
    className={cn(errors.name && 'border-destructive')}
  />
  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
</div>
```

### UI components stay controlled, not form-aware

Autocompletes and uploaders accept value/onChange. The parent wires them via Controller:

```tsx
<Controller
  name="vehicle"
  control={control}
  render={({ field }) => (
    <CarSearchAutocomplete
      value={field.value}
      onChange={field.onChange}
      error={!!errors.vehicle}
      helperText={errors.vehicle?.message}
    />
  )}
/>
```

Don't bake React Hook Form into UI components — keep them controlled.

### Submit button with loading state

Every form submit button supports a loading state to prevent double-submit and give user feedback:

```tsx
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
  {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
</Button>
```

Pattern: `disabled` + spinner icon + Polish verb in gerund form ("Zapisywanie...", "Wysyłanie...", "Usuwanie...").

## Table Patterns

Tables use shadcn Table components with these conventions:

### Sorting

- Tables have sortable columns — when creating a table, always ask which columns should be sortable
- Sort indicator in column header (arrow up/down)
- Default sort defined per table

### Filtering

- Single search input above the table
- Searches across multiple columns (name, phone, email, etc.)
- Debounced input (300ms)

```tsx
<Input
  placeholder="Szukaj..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="max-w-sm"
/>
<Table>...</Table>
```

### Pagination

- **Server-side pagination** — always. Never load all records client-side.
- Use `Pagination` component from `@shared/ui`
- Standard page sizes: 10, 25, 50
- Show total count: "Wyniki 1-10 z 156"

```tsx
import { Pagination } from '@shared/ui';

<Pagination currentPage={page} totalPages={Math.ceil(total / pageSize)} onPageChange={setPage} />;
```

## Loading States

### StarLoader — full-screen loader (in @shared/ui)

Custom spinning star animation. Use as the primary loading indicator for:

- Page-level loading (route transitions, initial data fetch)
- Full-screen overlays during heavy operations

```tsx
import { StarLoader } from '@shared/ui'

// Full page
if (isLoading) return <StarLoader />

// Overlay on existing content
<div className="relative">
  {isLoading && (
    <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
      <StarLoader />
    </div>
  )}
  <Table>...</Table>
</div>
```

### Loader2 — inline/button spinner

For buttons and small inline indicators:

```tsx
import { Loader2 } from 'lucide-react';

<Button disabled={isLoading}>
  {isLoading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
  Zapisz
</Button>;
```

### Skeleton — content placeholders

For known layout shapes (cards, table rows, profile sections):

```tsx
import { Skeleton } from '@shared/ui'

<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-12 w-full" />
```

### When to use which

| Scenario                    | Loader                             |
| --------------------------- | ---------------------------------- |
| Page loading / route change | StarLoader (full screen)           |
| Table data loading          | StarLoader (overlay on table area) |
| Button submitting           | Loader2 (inline spinner)           |
| Card/content placeholder    | Skeleton                           |
| Inline async action         | Loader2 (next to text)             |

## Naming Conventions

| What            | Convention                     | Example                            |
| --------------- | ------------------------------ | ---------------------------------- |
| File            | kebab-case                     | `car-search-autocomplete.tsx`      |
| Component       | PascalCase                     | `CarSearchAutocomplete`            |
| Props interface | ComponentNameProps             | `PhotoUploaderProps`               |
| Value types     | ComponentNameValue             | `CarSearchValue`                   |
| Handlers        | handleAction                   | `handleInputChange`                |
| Refs            | purposeRef                     | `containerRef`, `inputRef`         |
| Test files      | `*.test.tsx` next to component | `car-search-autocomplete.test.tsx` |
| Test IDs        | `data-testid="kebab-case"`     | `data-testid="car-input"`          |
| CSS variables   | `--kebab-case`                 | `--primary`, `--drawer-width`      |

## Testing Patterns

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock at context level, never at Supabase client level
vi.mock('@/contexts/CarModelsContext', () => ({
  useCarModels: () => ({
    searchModels: mockSearchModels,
    models: [],
    isLoading: false,
  }),
}));

// Render helper
const renderComponent = (props = {}) => ({
  user: userEvent.setup(), // ALWAYS before render
  ...render(
    <TestWrapper>
      <Component {...defaultProps} {...props} />
    </TestWrapper>,
  ),
});
```

Rules:

- `userEvent.setup()` before every test (never fireEvent for user actions)
- Mock at context/hook level, not Supabase client level
- Don't use `vi.importActual` for mocked modules (causes Supabase init errors)
- Test IDs for interactive elements, role queries for semantic elements

## Adding a New shadcn Component

1. `cd libs/ui && npx shadcn@latest add <component-name>`
2. Export from `libs/ui/src/index.ts`
3. Use in app: `import { NewComponent } from '@shared/ui'`

Never copy shadcn components into app-specific directories.

## Toast Pattern

Single toast limit. Imperative API:

```tsx
import { toast } from '@shared/ui';

toast({ title: 'Zapisano', description: 'Rezerwacja została zaktualizowana' });
toast({ title: 'Błąd', description: 'Nie udało się zapisać', variant: 'destructive' });
```

SonnerToaster is the renderer (named export to avoid collision with shadcn Toaster).

## Business Logic Defaults

### Service Type

- `service_type: 'both'` is the default and required value for all new features
- Legacy values `'reservation'` and `'offer'` exist in old code but should not be used in new code
- Always use `has_unified_services: true` when creating new instances, features, or configurations

```tsx
// ✅ New code
const config = { service_type: 'both', has_unified_services: true };

// ❌ Legacy — don't use in new features
const config = { service_type: 'reservation' };
const config = { service_type: 'offer' };
```

## Polish Language UI

All user-facing text in Polish:

- Labels, placeholders, errors, toasts — all in Polish
- Polish diacritics mandatory (ą, ę, ó, ś, ź, ż, ł, ć, ń)
- Date: DD.MM.YYYY
- Phone: XXX XXX XXX (9 digits)
- Currency: 1 234,56 zł (comma decimal, space thousands)
- Loading text: Polish gerund ("Zapisywanie...", "Ładowanie...", "Usuwanie...")
