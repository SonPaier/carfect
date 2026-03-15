import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'heroSection',
  title: 'Sekcja Hero',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Nagłówek', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'subheading', title: 'Podtytuł', type: 'text', rows: 3 }),
    defineField({ name: 'ctaText', title: 'Tekst CTA', type: 'string' }),
    defineField({ name: 'ctaLink', title: 'Link CTA', type: 'string' }),
    defineField({ name: 'secondaryCtaText', title: 'Tekst drugiego CTA', type: 'string' }),
    defineField({ name: 'secondaryCtaLink', title: 'Link drugiego CTA', type: 'string' }),
    defineField({ name: 'priceNote', title: 'Notatka o cenie (pod CTA)', type: 'string' }),
    defineField({
      name: 'variant',
      title: 'Wariant',
      type: 'string',
      options: { list: [
        { title: 'Gradient ciemny', value: 'gradient-dark' },
        { title: 'Gradient jasny', value: 'gradient-light' },
        { title: 'Prosty', value: 'simple' },
      ] },
      initialValue: 'gradient-dark',
    }),
    defineField({ name: 'backgroundImage', title: 'Zdjęcie w tle', type: 'image', options: { hotspot: true } }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Hero', subtitle: 'Sekcja Hero' }),
  },
});
