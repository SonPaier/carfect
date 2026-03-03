

## Plan: Skracanie end_time przy zakończeniu rezerwacji

### Logika
Gdy ktoś klika "Zakończ" (STOP) i aktualny czas jest **wcześniejszy** niż planowany `end_time` — nadpisz `end_time` na aktualny czas. Gdy praca trwała dłużej niż plan — zachowaj oryginalny `end_time`.

### Zmiany w 3 miejscach

**1. `src/pages/AdminDashboard.tsx` — `handleEndWork` (linia ~1731)**
- Pobrać aktualny czas jako `HH:MM`
- Porównać z `reservation.endTime` (lub `end_time`)
- Jeśli teraz < end_time → dodać `end_time: currentTimeFormatted` do update
- Zaktualizować lokalny state z nowym end_time

**2. `src/pages/HallView.tsx` — `onEndWork` (linia ~1650)**
- Ta sama logika: pobrać rezerwację z listy, porównać czas, warunkowo nadpisać end_time

**3. `src/pages/AdminDashboard.tsx` — `handleStatusChange` (linia ~2009)**
- Gdy `newStatus === 'completed'`: zastosować tę samą logikę skracania end_time
- To obsługuje dropdown zmiany statusu

### Szczegół implementacji
```typescript
const nowTime = format(new Date(), 'HH:mm:ss');
const updateData = { status: 'completed', completed_at: now.toISOString() };
if (nowTime < reservation.endTime) {
  updateData.end_time = nowTime;
}
```
Lokalny state również musi odzwierciedlać zmieniony `endTime`, żeby kafelek na kalendarzu od razu się skrócił.

