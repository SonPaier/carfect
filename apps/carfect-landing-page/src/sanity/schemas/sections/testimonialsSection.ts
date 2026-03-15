import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'testimonialsSection',
  title: 'Sekcja Opinie',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Nagłówek', type: 'string' }),
    defineField({
      name: 'testimonials',
      title: 'Opinie',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'name', title: 'Imię i nazwisko', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'role', title: 'Rola / stanowisko', type: 'string' }),
          defineField({ name: 'company', title: 'Firma', type: 'string' }),
          defineField({ name: 'companyUrl', title: 'URL firmy', type: 'url' }),
          defineField({ name: 'location', title: 'Lokalizacja', type: 'string' }),
          defineField({ name: 'text', title: 'Treść opinii', type: 'text', rows: 4, validation: (r) => r.required() }),
          defineField({ name: 'rating', title: 'Ocena (1-5)', type: 'number', validation: (r) => r.min(1).max(5) }),
          defineField({ name: 'avatar', title: 'Avatar', type: 'image', options: { hotspot: true } }),
          defineField({ name: 'logo', title: 'Logo firmy', type: 'image' }),
        ],
        preview: {
          select: { title: 'name', subtitle: 'company' },
        },
      }],
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Opinie', subtitle: 'Sekcja Opinie' }),
  },
});
