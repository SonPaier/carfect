

## Plan: Axis-locking scroll na mobile w N2Service

### Problem
`AdminCalendar.tsx` w projekcie [N2Service](/projects/1982c817-3fc7-408f-8f64-5e5f54dbcf4b) ma dokładnie ten sam stary kod axis-lockingu (React `onTouch` props + manipulacja `overflowX`/`overflowY`), który nie działa poprawnie — scroll po skosie nadal możliwy, skoki pozycji.

Employee calendars (`employee-calendars/`) to widoki listowe/kartowe — nie mają własnego gridu do scrollowania, więc nie wymagają zmian.

### Zmiana — 1 plik: `src/components/admin/AdminCalendar.tsx`

**Krok 1:** Zamienić stare React handlery (linie 233-262) na natywne event listenery z `useEffect`:

```tsx
const scrollTouchStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
const scrollDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);
const AXIS_LOCK_THRESHOLD = 8;

useEffect(() => {
  if (!isMobile) return;
  const timerId = setTimeout(() => {
    const el = gridScrollRef.current;
    if (!el) return;
    // Native touchstart/touchmove(passive:false)/touchend
    // Lock axis after 8px, e.preventDefault() + manual scrollLeft/scrollTop
  }, 50);
  return () => { clearTimeout(timerId); cleanup(); };
}, [isMobile, currentDate, viewMode]);
```

Usunąć `handleScrollTouchStart`, `handleScrollTouchMove`, `handleScrollTouchEnd` jako osobne `useCallback`.

**Krok 2:** Usunąć React touch props z gridu (linia 957):

```tsx
// Przed:
<div ref={gridScrollRef} onScroll={handleGridScroll} 
     onTouchStart={handleScrollTouchStart} onTouchMove={handleScrollTouchMove} onTouchEnd={handleScrollTouchEnd} ...>

// Po:
<div ref={gridScrollRef} onScroll={handleGridScroll} ...>
```

Identyczna logika jak w N2Wash — `preventDefault` + ręczne ustawianie `scrollLeft`/`scrollTop` w zablokowanej osi.

