

# Dodanie linków do przykładów ofert na stronie CRM Detailing

## Co zostanie zmienione

W sekcji "Przykłady ofert stworzonych w N2Wash" na stronie `/crm/crm-dla-studia-detailingu`, trzy karty z placeholderami zostaną zamienione na klikalne linki otwierające się w nowej karcie przeglądarki.

## Przypisanie linków do kart

1. **Oferta PPF** -- https://demo.n2wash.com/offers/cbqwwa2l
2. **Oferta Ceramic** -- https://demo.n2wash.com/offers/fui6o14o
3. **Oferta Korekta** -- https://demo.n2wash.com/offers/opl7z9zt

## Szczegoly techniczne

- Plik: `src/pages/CrmDetailing.tsx`
- Kazdy `<div>` z klasa `bg-muted rounded-2xl aspect-[3/4]...` zostanie opakowany w tag `<a href="..." target="_blank" rel="noopener noreferrer">`
- Dodanie efektu hover (np. `hover:border-primary hover:shadow-md transition-all`) dla lepszego UX
- Kursor zmieni sie na pointer po najechaniu na karte

