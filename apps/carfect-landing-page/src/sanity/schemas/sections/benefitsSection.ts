import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'benefitsSection',
  title: 'Sekcja Korzyści',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Nagłówek', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Elementy',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'icon', title: 'Ikona (nazwa lucide)', type: 'string' }),
          defineField({ name: 'title', title: 'Tytuł', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'description', title: 'Opis', type: 'text', rows: 3 }),
          defineField({ name: 'image', title: 'Zdjęcie', type: 'image', options: { hotspot: true } }),
        ],
        preview: {
          select: { title: 'title' },
        },
      }],
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Korzyści', subtitle: 'Sekcja Korzyści' }),
  },
});
