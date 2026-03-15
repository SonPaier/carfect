import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'benefitsZigZagSection',
  title: 'Sekcja Korzyści (zigzag)',
  type: 'object',
  fields: [
    defineField({ name: 'sectionTitle', title: 'Tytuł sekcji', type: 'string' }),
    defineField({ name: 'sectionSubtitle', title: 'Podtytuł sekcji', type: 'text', rows: 3 }),
    defineField({
      name: 'items',
      title: 'Elementy',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'title', title: 'Tytuł', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'subtitle', title: 'Podtytuł', type: 'text', rows: 3 }),
          defineField({
            name: 'points',
            title: 'Punkty',
            type: 'array',
            of: [{ type: 'string' }],
          }),
          defineField({ name: 'image', title: 'Zdjęcie', type: 'image', options: { hotspot: true } }),
        ],
        preview: {
          select: { title: 'title' },
        },
      }],
    }),
  ],
  preview: {
    select: { title: 'sectionTitle' },
    prepare: ({ title }) => ({ title: title || 'Korzyści zigzag', subtitle: 'Sekcja Korzyści (zigzag)' }),
  },
});
