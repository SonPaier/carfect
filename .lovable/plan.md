

## Plan: Axis-locking scroll na mobile

### Problem
Kod axis-locking (`handleScrollTouchStart/Move/End`, linie 358-395) istnieje, ale **nie jest podpięty** do `gridScrollRef` na mobile. Efekt: scroll po skosie przesuwa jednocześnie oś X i Y.

### Rozwiązanie
Podpiąć touch handlery do `gridScrollRef` na mobile. Obecna implementacja (manipulacja `overflowX`/`overflowY`) jest poprawna koncepcyjnie, ale wymaga drobnej poprawki — na mobile w jednym kontenerze scrollowalnym blokowanie overflow w jednej osi skutecznie zablokuje scroll po skosie.

### Zmiana

**`src/components/admin/AdminCalendar.tsx`**, linia ~1509 — dodać touch handlery do kontenera gridu na mobile:

```tsx
<div 
  ref={gridScrollRef} 
  onScroll={!isMobile ? handleGridScroll : undefined} 
  onTouchStart={isMobile ? handleScrollTouchStart : undefined}
  onTouchMove={isMobile ? handleScrollTouchMove : undefined}
  onTouchEnd={isMobile ? handleScrollTouchEnd : undefined}
  className="flex-1 overflow-auto"
  ...
>
```

Jedna zmiana, jeden plik.

