import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'featureDetailSection',
  title: 'Sekcja Funkcja (szczegóły)',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Nagłówek', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'subheading', title: 'Podtytuł', type: 'string' }),
    defineField({ name: 'description', title: 'Opis', type: 'text', rows: 4 }),
    defineField({ name: 'image', title: 'Zdjęcie', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'imagePosition',
      title: 'Pozycja zdjęcia',
      type: 'string',
      options: { list: [{ title: 'Po lewej', value: 'left' }, { title: 'Po prawej', value: 'right' }] },
      initialValue: 'right',
    }),
    defineField({
      name: 'bulletPoints',
      title: 'Punkty',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'backgroundVariant',
      title: 'Wariant tła',
      type: 'string',
      options: { list: [
        { title: 'Domyślny', value: 'default' },
        { title: 'Szary', value: 'muted' },
        { title: 'Gradient', value: 'gradient' },
      ] },
      initialValue: 'default',
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Funkcja', subtitle: 'Sekcja Funkcja' }),
  },
});
