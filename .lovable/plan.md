

## Plan: Usunięcie wymuszania aparatu — wybór zdjęcia z galerii lub aparatu

### Problem
Atrybut `capture="environment"` na inputach `<input type="file">` wymusza otwarcie aparatu na urządzeniach mobilnych, nie dając użytkownikowi opcji wyboru zdjęcia z galerii.

### Rozwiązanie
Usunąć `capture="environment"` ze wszystkich inputów do uploadu zdjęć. Bez tego atrybutu przeglądarka mobilna wyświetli natywny dialog z wyborem: aparat **lub** galeria zdjęć.

### Pliki do edycji (6 plików, 1 zmiana w każdym)
1. `src/components/protocols/ProtocolPhotosUploader.tsx` — linia 159
2. `src/components/protocols/DamagePointDrawer.tsx` — linia 212
3. `src/components/admin/ReservationPhotosDialog.tsx` — linia 182
4. `src/pages/HallView.tsx` — linia 1722
5. `src/components/admin/employees/WorkerTimeDialog.tsx` — linia 264
6. `src/components/admin/employees/AddEditEmployeeDialog.tsx` — linia 238

W każdym pliku: usunięcie linii `capture="environment"`.

