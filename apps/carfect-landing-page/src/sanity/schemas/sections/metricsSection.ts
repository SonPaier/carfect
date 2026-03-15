import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'metricsSection',
  title: 'Sekcja Metryki',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Nagłówek', type: 'string' }),
    defineField({ name: 'subheading', title: 'Podtytuł', type: 'text', rows: 2 }),
    defineField({
      name: 'items',
      title: 'Metryki',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'value', title: 'Wartość (np. 40h, +10%, -90%)', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'label', title: 'Etykieta', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'sublabel', title: 'Podpis dodatkowy', type: 'string' }),
          defineField({ name: 'icon', title: 'Ikona (nazwa lucide)', type: 'string' }),
        ],
        preview: {
          select: { title: 'value', subtitle: 'label' },
        },
      }],
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Metryki', subtitle: 'Sekcja Metryki' }),
  },
});
