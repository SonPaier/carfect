import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'richTextSection',
  title: 'Sekcja tekst (rich text)',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Nagłówek (opcjonalny)', type: 'string' }),
    defineField({
      name: 'body',
      title: 'Treść',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true } },
      ],
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Rich Text', subtitle: 'Sekcja tekst' }),
  },
});
