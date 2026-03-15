import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'iconCardsSection',
  title: 'Sekcja Karty z ikonami',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Nagłówek', type: 'string' }),
    defineField({ name: 'subheading', title: 'Podtytuł', type: 'text', rows: 3 }),
    defineField({
      name: 'columns',
      title: 'Liczba kolumn',
      type: 'number',
      options: { list: [2, 3, 4] },
      initialValue: 3,
    }),
    defineField({
      name: 'items',
      title: 'Karty',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'icon', title: 'Ikona (nazwa lucide)', type: 'string' }),
          defineField({ name: 'title', title: 'Tytuł', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'description', title: 'Opis', type: 'text', rows: 3 }),
          defineField({ name: 'link', title: 'Link (opcjonalny)', type: 'string' }),
        ],
        preview: {
          select: { title: 'title', subtitle: 'icon' },
        },
      }],
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Karty z ikonami', subtitle: 'Sekcja Karty z ikonami' }),
  },
});
