import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'pricingSection',
  title: 'Sekcja Cennik',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Nagłówek', type: 'string' }),
    defineField({ name: 'subheading', title: 'Podtytuł', type: 'text', rows: 2 }),
    defineField({
      name: 'usePricingConfig',
      title: 'Użyj kalkulatora cennika',
      type: 'boolean',
      initialValue: false,
      description: 'Zamiast planów poniżej, użyj kalkulatora z singletona pricingConfig',
    }),
    defineField({
      name: 'plans',
      title: 'Plany cenowe',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'name', title: 'Nazwa planu', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'price', title: 'Cena', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'period', title: 'Okres (np. "/mies.")', type: 'string' }),
          defineField({ name: 'description', title: 'Opis', type: 'text', rows: 2 }),
          defineField({
            name: 'features',
            title: 'Funkcje',
            type: 'array',
            of: [{ type: 'string' }],
          }),
          defineField({ name: 'ctaText', title: 'Tekst przycisku', type: 'string' }),
          defineField({ name: 'ctaLink', title: 'Link przycisku', type: 'string' }),
          defineField({ name: 'highlighted', title: 'Wyróżniony', type: 'boolean', initialValue: false }),
        ],
        preview: {
          select: { title: 'name', subtitle: 'price' },
        },
      }],
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Cennik', subtitle: 'Sekcja Cennik' }),
  },
});
