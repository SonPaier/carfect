import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'appPreviewSection',
  title: 'Sekcja Podgląd Aplikacji',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Nagłówek', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'subtitle', title: 'Podtytuł', type: 'text', rows: 3 }),
    defineField({ name: 'desktopImage', title: 'Zdjęcie desktop', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'mobileImage', title: 'Zdjęcie mobile', type: 'image', options: { hotspot: true } }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Podgląd aplikacji', subtitle: 'Sekcja Podgląd Aplikacji' }),
  },
});
