import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'pricingConfig',
  title: 'Konfiguracja cennika',
  type: 'document',
  fields: [
    defineField({ name: 'pricePerStation', title: 'Cena za stanowisko', type: 'number', validation: (r) => r.required() }),
    defineField({ name: 'currency', title: 'Symbol waluty (np. zł)', type: 'string', initialValue: 'zł' }),
    defineField({ name: 'currencyCode', title: 'Kod waluty (np. PLN)', type: 'string', initialValue: 'PLN' }),
    defineField({
      name: 'labels',
      title: 'Etykiety',
      type: 'object',
      fields: [
        defineField({ name: 'perStation', title: 'Za stanowisko', type: 'string', initialValue: 'za stanowisko' }),
        defineField({ name: 'perMonth', title: 'Za miesiąc', type: 'string', initialValue: 'miesięcznie' }),
        defineField({ name: 'perYear', title: 'Za rok', type: 'string', initialValue: 'rocznie' }),
        defineField({ name: 'stations', title: 'Stanowisk', type: 'string', initialValue: 'stanowisk' }),
        defineField({ name: 'station', title: 'Stanowisko', type: 'string', initialValue: 'stanowisko' }),
        defineField({ name: 'monthly', title: 'Miesięcznie', type: 'string', initialValue: 'Miesięcznie' }),
        defineField({ name: 'yearly', title: 'Rocznie', type: 'string', initialValue: 'Rocznie' }),
        defineField({ name: 'yearlyDiscount', title: 'Zniżka roczna (tekst)', type: 'string', initialValue: '-10%' }),
        defineField({ name: 'totalMonthly', title: 'Razem miesięcznie', type: 'string', initialValue: 'Razem miesięcznie' }),
        defineField({ name: 'totalYearly', title: 'Razem rocznie', type: 'string', initialValue: 'Razem rocznie' }),
        defineField({ name: 'cta', title: 'CTA', type: 'string', initialValue: 'Rozpocznij za darmo' }),
      ],
    }),
    defineField({ name: 'yearlyDiscountPercent', title: 'Procent zniżki rocznej', type: 'number', initialValue: 10 }),
    defineField({
      name: 'additionalModules',
      title: 'Moduły dodatkowe',
      type: 'object',
      fields: [
        defineField({ name: 'title', title: 'Tytuł sekcji', type: 'string' }),
        defineField({ name: 'subtitle', title: 'Podtytuł', type: 'text', rows: 2 }),
        defineField({
          name: 'items',
          title: 'Moduły',
          type: 'array',
          of: [{
            type: 'object',
            fields: [
              defineField({ name: 'icon', title: 'Ikona (nazwa lucide)', type: 'string' }),
              defineField({ name: 'title', title: 'Nazwa modułu', type: 'string', validation: (r) => r.required() }),
              defineField({ name: 'description', title: 'Opis', type: 'text', rows: 2 }),
              defineField({ name: 'price', title: 'Cena', type: 'string' }),
              defineField({ name: 'comingSoon', title: 'Wkrótce', type: 'boolean', initialValue: false }),
            ],
            preview: {
              select: { title: 'title', subtitle: 'price' },
            },
          }],
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Konfiguracja cennika' }),
  },
});
