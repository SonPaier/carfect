# Checklist w zleceniach

## Problem

Pracownicy chcą mieć listę zadań w zleceniach. Notatki nie pozwalają odznaczać co zrobione.

## Dane

Nowa kolumna JSONB `checklist_items` na `calendar_items`, default `'[]'::jsonb`.

```typescript
export interface ChecklistItem {
  id: string; // crypto.randomUUID()
  text: string;
  checked: boolean;
}
```

## Komponent `ChecklistSection` — `@shared/ui`

Jeden komponent, dwa tryby via prop `mode`:

### Props

```typescript
interface ChecklistSectionProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  mode: 'edit' | 'execute';
}
```

### Tryb `execute` (drawer szczegółów zlecenia)

- Ponumerowane checkboxy z tekstem
- Klik checkbox = toggle `checked`, wywołuje `onChange`
- Tekst przekreślony gdy `checked`
- Czerwona ikona `Trash2` po prawej każdego punktu — usuwa punkt
- Przycisk "+ Dodaj punkt" na dole → pojawia się input → blur/Enter = dodaje punkt → `onChange`

### Tryb `edit` (dialog tworzenia/edycji zlecenia)

- Lista tekstów z numeracją (bez checkboxów — jeszcze nie ma co odznaczać)
- Edytowalny tekst każdego punktu (klik → input → blur = save)
- Czerwona ikona `Trash2` po prawej
- Przycisk "+ Dodaj punkt" na dole → input → blur/Enter = dodaje

### Placement

Pod sekcją "Notatki" w obu widokach. Gdy lista pusta → przycisk "Dodaj listę zadań". Gdy są punkty → lista + przycisk "+ Dodaj punkt".

## Auto-save (app layer, nie w komponencie)

Pattern jak `media_items` — `onChange` w HiService robi:

```typescript
// CalendarItemDetailsDrawer
onChange={(newItems) => {
  setChecklistItems(newItems);
  supabase.from('calendar_items')
    .update({ checklist_items: newItems })
    .eq('id', item.id);
}}
```

W `AddCalendarItemDialog` — `onChange` updateuje local state, zapis przy submit.

## Pliki

- **Migracja DB**: `checklist_items jsonb DEFAULT '[]'` na `calendar_items`
- **Nowy**: `libs/ui/src/components/ui/checklist-section.tsx` — komponent w `@shared/ui`
- **Export**: `libs/ui/src/index.ts` — dodać eksport
- **Modify**: `CalendarItemDetailsDrawer.tsx` — render pod notatkami, auto-save onChange
- **Modify**: `AddCalendarItemDialog.tsx` — render pod notatkami, local state, zapis w payload

## Design system

- Komponent w `@shared/ui` — pure UI, zero Supabase, zero i18n
- Texty jako props (przycisk label, placeholder)
- Checkbox z `@/components/ui/checkbox` (shadcn)
- Trash2 z lucide-react, `text-destructive`
- Bez drag-and-drop, kolejność dodawania
