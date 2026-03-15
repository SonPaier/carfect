import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'comparisonTableSection',
  title: 'Sekcja Tabela porównawcza',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Nagłówek', type: 'string' }),
    defineField({ name: 'subheading', title: 'Podtytuł', type: 'text', rows: 2 }),
    defineField({
      name: 'columnLabels',
      title: 'Etykiety kolumn',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (r) => r.min(2),
    }),
    defineField({
      name: 'rows',
      title: 'Wiersze',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'feature', title: 'Funkcja', type: 'string', validation: (r) => r.required() }),
          defineField({
            name: 'values',
            title: 'Wartości (po jednej na kolumnę)',
            type: 'array',
            of: [{ type: 'string' }],
          }),
        ],
        preview: {
          select: { title: 'feature' },
        },
      }],
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Tabela porównawcza', subtitle: 'Sekcja Tabela porównawcza' }),
  },
});
