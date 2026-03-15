import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'caseStudy',
  title: 'Case Study',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tytuł', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'metaTitle', title: 'Meta tytuł', type: 'string' }),
        defineField({ name: 'metaDescription', title: 'Meta opis', type: 'text', rows: 3 }),
        defineField({ name: 'ogImage', title: 'OG Image', type: 'image' }),
      ],
    }),
    defineField({ name: 'heroTitle', title: 'Tytuł hero', type: 'string' }),
    defineField({ name: 'heroHighlight', title: 'Wyróżniony tekst w hero', type: 'string', description: 'Np. metryka "40h miesięcznie"' }),
    defineField({ name: 'heroSubtitle', title: 'Podtytuł hero', type: 'text', rows: 2 }),
    defineField({ name: 'coverImage', title: 'Zdjęcie główne', type: 'image', options: { hotspot: true } }),

    // Client info
    defineField({
      name: 'client',
      title: 'Klient',
      type: 'object',
      fields: [
        defineField({ name: 'name', title: 'Nazwa firmy', type: 'string' }),
        defineField({ name: 'description', title: 'Opis firmy', type: 'text', rows: 4 }),
        defineField({ name: 'logo', title: 'Logo', type: 'image' }),
      ],
    }),

    // Challenge
    defineField({
      name: 'challenge',
      title: 'Wyzwanie',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Nagłówek', type: 'string' }),
        defineField({ name: 'description', title: 'Opis', type: 'text', rows: 6 }),
        defineField({ name: 'image', title: 'Zdjęcie', type: 'image', options: { hotspot: true } }),
        defineField({ name: 'quote', title: 'Cytat', type: 'text', rows: 3 }),
        defineField({ name: 'quoteAuthor', title: 'Autor cytatu', type: 'string' }),
      ],
    }),

    // Solution
    defineField({
      name: 'solution',
      title: 'Rozwiązanie',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Nagłówek', type: 'string' }),
        defineField({ name: 'description', title: 'Opis', type: 'text', rows: 6 }),
        defineField({ name: 'image', title: 'Zdjęcie', type: 'image', options: { hotspot: true } }),
      ],
    }),

    // Metrics
    defineField({
      name: 'metrics',
      title: 'Metryki',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'value', title: 'Wartość', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'label', title: 'Etykieta', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'sublabel', title: 'Podpis', type: 'string' }),
          defineField({
            name: 'variant',
            title: 'Wariant koloru',
            type: 'string',
            options: { list: ['primary', 'success', 'default'] },
            initialValue: 'default',
          }),
        ],
        preview: {
          select: { title: 'value', subtitle: 'label' },
        },
      }],
    }),

    // Results
    defineField({
      name: 'results',
      title: 'Rezultaty',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Nagłówek', type: 'string' }),
        defineField({
          name: 'items',
          title: 'Punkty',
          type: 'array',
          of: [{
            type: 'object',
            fields: [
              defineField({ name: 'icon', title: 'Ikona (nazwa lucide)', type: 'string' }),
              defineField({ name: 'text', title: 'Tekst', type: 'string', validation: (r) => r.required() }),
            ],
            preview: { select: { title: 'text' } },
          }],
        }),
      ],
    }),

    // Benefit cards
    defineField({
      name: 'benefitCards',
      title: 'Karty korzyści',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'icon', title: 'Ikona (nazwa lucide)', type: 'string' }),
          defineField({ name: 'title', title: 'Tytuł', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'description', title: 'Opis', type: 'text', rows: 3 }),
        ],
        preview: { select: { title: 'title' } },
      }],
    }),

    // CTA
    defineField({
      name: 'ctaSection',
      title: 'Sekcja CTA',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Nagłówek', type: 'string' }),
        defineField({ name: 'subheading', title: 'Podtytuł', type: 'text', rows: 2 }),
        defineField({ name: 'ctaText', title: 'Tekst przycisku', type: 'string' }),
        defineField({ name: 'ctaLink', title: 'Link przycisku', type: 'string' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'client.name' },
  },
});
