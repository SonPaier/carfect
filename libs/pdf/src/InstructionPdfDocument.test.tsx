import { describe, it, expect } from 'vitest';
import { flattenTiptapToText } from './tiptapText';
import type { TiptapDocument } from './tiptapText';

describe('flattenTiptapToText', () => {
  it('flattens a simple paragraph to its text content', () => {
    const doc: TiptapDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world' }],
        },
      ],
    };

    const result = flattenTiptapToText(doc);

    expect(result).toContain('Hello world');
  });

  it('prefixes bullet list items with the bullet glyph', () => {
    const doc: TiptapDocument = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'First item' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Second item' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = flattenTiptapToText(doc);

    expect(result).toContain('• First item');
    expect(result).toContain('• Second item');
  });

  it('numbers ordered list items starting at 1', () => {
    const doc: TiptapDocument = {
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Step one' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Step two' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = flattenTiptapToText(doc);

    expect(result).toContain('1. Step one');
    expect(result).toContain('2. Step two');
  });

  it('preserves bold text content without losing it', () => {
    const doc: TiptapDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Important',
              marks: [{ type: 'bold' }],
            },
          ],
        },
      ],
    };

    const result = flattenTiptapToText(doc);

    expect(result).toContain('Important');
  });

  it('renders link node text content (href lives in mark attrs)', () => {
    const doc: TiptapDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Click here',
              marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
            },
          ],
        },
      ],
    };

    const result = flattenTiptapToText(doc);

    // Plain-text flatten keeps the visible text; href is in the mark attr
    expect(result).toContain('Click here');
  });

  it('gracefully ignores unknown node types and renders their children', () => {
    const doc: TiptapDocument = {
      type: 'doc',
      content: [
        {
          type: 'unknownBlockType',
          content: [
            {
              type: 'text',
              text: 'fallback content',
            },
          ],
        },
      ],
    };

    const result = flattenTiptapToText(doc);

    expect(result).toContain('fallback content');
  });
});
