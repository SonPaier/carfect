import type { BuiltinTemplate, TiptapDocument } from './types';

const ppfContent: TiptapDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Dziękujemy za skorzystanie z naszych usług. Poniżej znajdziesz instrukcję właściwej pielęgnacji folii PPF, która pomoże zachować jej właściwości ochronne na lata.',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Co należy robić:',
          marks: [{ type: 'bold' }],
        },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Myj pojazd ręcznie lub w myjni bezdotykowej przez pierwsze 14 dni po aplikacji.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Używaj środków do mycia o pH neutralnym (6–8), dedykowanych do folii PPF.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Spłukuj pojazd czystą wodą przed myciem, aby usunąć piasek i luźny brud.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Suszyj nadwozie mikrofibrowymi ręcznikami — delikatnie przykładaj, nie trzyj.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Co 3–6 miesięcy nakładaj wosk lub sealant zgodny z folią PPF.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Czego unikać:',
          marks: [{ type: 'bold' }],
        },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Nie korzystaj z myjni szczotkowej — szczotki mogą zarysować powierzchnię folii.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Unikaj środków zawierających alkohol izopropylowy lub silne detergenty w pobliżu krawędzi folii.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Nie stosuj wosku z zawartością silnych rozpuszczalników (toluenu, ksylenu).',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Nie parkuj pod drzewami w czasie żywicowania — żywica może trwale zabarwić folię.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Przez pierwsze 48 godzin unikaj moczenia okolic krawędzi folii.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'W razie pytań zapraszamy do kontaktu — ' },
        {
          type: 'text',
          text: 'nasz serwis',
          marks: [{ type: 'link', attrs: { href: 'https://carfect.pl', target: '_blank' } }],
        },
        { type: 'text', text: ' jest do Twojej dyspozycji.' },
      ],
    },
  ],
};

const ceramicContent: TiptapDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Dziękujemy za skorzystanie z naszych usług. Poniżej znajdziesz instrukcję właściwej pielęgnacji powłoki ceramicznej, która pomoże utrzymać jej efekt hydrofobowy i połysk przez długi czas.',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Co należy robić:',
          marks: [{ type: 'bold' }],
        },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Odczekaj minimum 7 dni przed pierwszym myciem pojazdu po aplikacji powłoki.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Myj pojazd regularnie — zabrudzenia usuwane na bieżąco nie uszkadzają powłoki.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Używaj szamponu o pH neutralnym przeznaczonego do powłok ceramicznych.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Po myciu osusz nadwozie miękkim ręcznikiem z mikrofibry, aby uniknąć zacieków.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Co 6–12 miesięcy serwisuj powłokę preparatem boosterującym efekt hydrofobowy.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Czego unikać:',
          marks: [{ type: 'bold' }],
        },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Nie korzystaj z myjni szczotkowej — mikrozarysowania niszczą efekt hydrofobowy.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Unikaj środków o silnym kwasowym lub zasadowym pH (poniżej 5 lub powyżej 9).',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Nie nakładaj tradycyjnego wosku na powłokę ceramiczną — zmniejsza jej właściwości.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Nie pozostawiaj ptasich odchodów lub owadów na lakierze dłużej niż kilka godzin.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Nie używaj glinki lakierniczej bez wcześniejszego uzgodnienia z naszym serwisem.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'W razie pytań dotyczących pielęgnacji zapraszamy do kontaktu — ' },
        {
          type: 'text',
          text: 'nasz serwis',
          marks: [{ type: 'link', attrs: { href: 'https://carfect.pl', target: '_blank' } }],
        },
        { type: 'text', text: ' chętnie doradzi.' },
      ],
    },
  ],
};

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    key: 'ppf',
    titlePl: 'Instrukcja użytkowania folii PPF',
    titleEn: 'PPF Film Care Instructions',
    getContent: () => ppfContent,
  },
  {
    key: 'ceramic',
    titlePl: 'Instrukcja użytkowania powłoki ochronnej',
    titleEn: 'Ceramic Coating Care Instructions',
    getContent: () => ceramicContent,
  },
];
