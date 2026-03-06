

## Plan: Centralizacja koloru hover przez token CSS + kolor Tailwind

### Problem
Hover jest hardkodowany w ~450 miejscach jako `hover:bg-muted/30`, `hover:bg-muted/50` itp. Zmiana koloru wymaga edycji każdego pliku.

### Rozwiązanie
Dodać semantyczny token CSS `--hover` i kolor Tailwind `hover`, a potem zamienić wszystkie wystąpienia na `hover:bg-hover` / `hover:bg-hover-strong`. Przyszła zmiana = edycja jednej linii w CSS.

### Kroki

**1. `src/index.css`** — dodać zmienne w `:root` i `.dark`:
```css
:root {
  --hover: 274 66% 32%; /* = primary */
  --hover-opacity: 0.10;
  --hover-strong-opacity: 0.15;
}
```

**2. `tailwind.config.ts`** — dodać kolory:
```ts
hover: {
  DEFAULT: 'hsl(var(--hover) / 0.10)',
  strong: 'hsl(var(--hover) / 0.15)',
}
```

**3. Zamiana we wszystkich plikach** (~450 wystąpień, jednorazowo):
- `hover:bg-muted/30` → `hover:bg-hover`
- `hover:bg-muted/50` → `hover:bg-hover-strong`
- `active:bg-muted/30` → `active:bg-hover`
- `data-[state=active]:bg-muted/30` → `data-[state=active]:bg-hover`

### Efekt
- Teraz: fioletowy hover wszędzie
- W przyszłości: zmiana jednej linii `--hover` w CSS zmienia kolor w całej aplikacji

