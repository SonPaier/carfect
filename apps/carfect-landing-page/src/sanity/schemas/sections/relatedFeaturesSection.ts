import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'relatedFeaturesSection',
  title: 'Sekcja Powiązane funkcje',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Nagłówek', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Funkcje',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'icon', title: 'Ikona (nazwa lucide)', type: 'string' }),
          defineField({ name: 'title', title: 'Tytuł', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'description', title: 'Opis', type: 'text', rows: 2 }),
          defineField({ name: 'href', title: 'Link', type: 'string', validation: (r) => r.required() }),
        ],
        preview: {
          select: { title: 'title', subtitle: 'href' },
        },
      }],
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Powiązane funkcje', subtitle: 'Sekcja Powiązane funkcje' }),
  },
});
