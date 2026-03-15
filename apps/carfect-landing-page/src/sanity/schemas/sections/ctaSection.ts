import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'ctaSection',
  title: 'Sekcja CTA',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Nagłówek', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'subheading', title: 'Podtytuł', type: 'text', rows: 2 }),
    defineField({ name: 'ctaText', title: 'Tekst przycisku', type: 'string' }),
    defineField({ name: 'ctaLink', title: 'Link przycisku', type: 'string' }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'CTA', subtitle: 'Sekcja CTA' }),
  },
});
