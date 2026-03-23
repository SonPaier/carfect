# Follow-up Visit ("Konieczna ponowna wizyta")

## Problem

Pracownik jedzie na serwis, nie może dokończyć (brak części, większy zakres prac, warunki zewnętrzne). Musi zaplanować kolejną wizytę, ale termin ustala szef. Wizyta czeka bez daty aż zostanie zaplanowana.

## Nowe statusy

| Status       | Label PL       | Kolor      | Hex       | Opis                                         |
| ------------ | -------------- | ---------- | --------- | -------------------------------------------- |
| `unfinished` | Nieukończone   | Purple-600 | `#9333ea` | Oryginalne zlecenie, które wymaga follow-upu |
| `follow_up`  | Ponowna wizyta | Purple-400 | `#c084fc` | Nowe zlecenie czekające na zaplanowanie      |

Dochodzą do istniejących: `confirmed`, `in_progress`, `completed`, `cancelled`, `change_requested`.

Kiedy admin ustawi datę na zleceniu `follow_up` → status zmienia się na `confirmed`.

## Schemat danych

### Nowe pole na `calendar_items`

- `parent_item_id: UUID nullable` — FK do `calendar_items.id`
- Wskazuje zawsze na root oryginał (płaska struktura, bez łańcuchów)
- Follow-up follow-upa też wskazuje na ten sam oryginał

## Flow pracownika

1. Pracownik klika "Zakończ pracę" na zleceniu `in_progress`
2. Widzi 3 opcje:
   - **"Zakończyłem pracę"** → status → `completed`, `work_ended_at = now()`
   - **"Konieczna ponowna wizyta"** → oryginał → `unfinished`, `work_ended_at = now()`, otwiera drawer follow-upa
   - **"Anuluj"** → zamknij dialog, nic się nie dzieje
3. Drawer nowego zlecenia (uproszczony tryb):
   - Tytuł: prefill "Ponowna wizyta — [tytuł oryginału]"
   - Lokalizacja: z oryginału (klient, adres)
   - Notatki: puste, pracownik opisuje co zostało do zrobienia
   - Usługi: do wyboru
   - **Opcjonalne**: data, godziny, pracownik
   - Projekt: dziedziczony z oryginału (jeśli istnieje)
4. Zapis → nowy `calendar_item`:
   - `parent_item_id` = id oryginału (lub root jeśli oryginał sam jest follow-upem)
   - Status = `follow_up` (jeśli bez daty) lub `confirmed` (jeśli z datą)

## Drawer "Do dokończenia"

- **Przycisk** w headerze kalendarza, obok przycisków widoku (dzień/tydzień/miesiąc)
- Badge z liczbą niezaplanowanych zleceń (`status = 'follow_up'` AND `item_date IS NULL`)
- Otwiera drawer z listą kafelków:
  - Tytuł, klient, adres
  - Notatka widoczna od razu (nie trzeba klikać)
  - Styl kafelka jak w historii wizyt
- Klik na kafelek → drawer edycji zlecenia, admin ustawia datę/godziny
- Kiedy admin zapisuje z datą → status `follow_up` → `confirmed`

## Automatyczne zakończenie oryginału

Kiedy dowolny follow-up zmienia status na `completed`:

1. Sprawdź `parent_item_id`
2. Sprawdź czy istnieją inne follow-upy tego oryginału z `status NOT IN ('completed', 'cancelled')`
3. Jeśli nie ma → oryginał → `completed`, `work_ended_at = now()`

Logika w `handleStatusChange` w Dashboard.tsx.

## Kolory statusów

Purpurowa para, łatwa do rozróżnienia od reszty:

- `unfinished` → `bg-purple-600` (ciemny) — "to zlecenie czeka na dokończenie"
- `follow_up` → `bg-purple-400` (jasny) — "to jest ta wizyta dokańczająca"

## Pliki do zmiany

### Migracja DB

- Nowe pole `parent_item_id` na `calendar_items` z FK

### Statusy i kolory

- `AdminCalendar.tsx` — dodać kolory/labele dla `unfinished` i `follow_up`
- `CalendarItemDetailsDrawer.tsx` — dodać kolory/labele, flow "Zakończ pracę" z 3 opcjami
- `MonthCalendarView.tsx` — kolory nowych statusów

### Flow pracownika

- `CalendarItemDetailsDrawer.tsx` — dialog wyboru przy "Zakończ pracę"
- `AddCalendarItemDialog.tsx` — tryb follow-up (uproszczony formularz, prefill z oryginału)
- `Dashboard.tsx` — `handleStatusChange` rozszerzony o logikę `unfinished` i auto-complete oryginału

### Drawer "Do dokończenia"

- Nowy komponent `UnscheduledFollowUpsDrawer.tsx`
- Przycisk w headerze kalendarza (`AdminCalendar.tsx`)
- Query: `calendar_items` WHERE `status = 'follow_up'` AND `item_date IS NULL`
