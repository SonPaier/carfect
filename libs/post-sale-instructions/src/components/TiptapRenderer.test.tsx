import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TiptapRenderer } from './TiptapRenderer';
import type { TiptapDocument } from '../types';

function makeDoc(content: TiptapDocument['content']): TiptapDocument {
  return { type: 'doc', content };
}

describe('TiptapRenderer', () => {
  it('renders a simple paragraph as <p>', () => {
    const doc = makeDoc([
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
    ]);
    const { container } = render(<TiptapRenderer doc={doc} />);
    expect(container.querySelector('p')?.textContent).toBe('Hello');
  });

  it('renders a bullet list with <ul>/<li>', () => {
    const doc = makeDoc([
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item A' }] }],
          },
        ],
      },
    ]);
    const { container } = render(<TiptapRenderer doc={doc} />);
    expect(container.querySelector('ul li')?.textContent).toBe('Item A');
  });

  it('renders an ordered list with <ol>/<li>', () => {
    const doc = makeDoc([
      {
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step 1' }] }],
          },
        ],
      },
    ]);
    const { container } = render(<TiptapRenderer doc={doc} />);
    expect(container.querySelector('ol li')?.textContent).toBe('Step 1');
  });

  it('renders bold text as <strong>', () => {
    const doc = makeDoc([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Bold!', marks: [{ type: 'bold' }] }],
      },
    ]);
    const { container } = render(<TiptapRenderer doc={doc} />);
    expect(container.querySelector('p strong')?.textContent).toBe('Bold!');
  });

  it('renders a link with target="_blank" and rel="noopener noreferrer"', () => {
    const doc = makeDoc([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Click',
            marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
          },
        ],
      },
    ]);
    const { container } = render(<TiptapRenderer doc={doc} />);
    const a = container.querySelector('a');
    expect(a?.getAttribute('href')).toBe('https://example.com');
    expect(a?.getAttribute('target')).toBe('_blank');
    expect(a?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders hardBreak as <br>', () => {
    const doc = makeDoc([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'A' },
          { type: 'hardBreak' },
          { type: 'text', text: 'B' },
        ],
      },
    ]);
    const { container } = render(<TiptapRenderer doc={doc} />);
    expect(container.querySelector('br')).not.toBeNull();
  });

  it('safely handles unknown node types by rendering children only', () => {
    const doc = makeDoc([
      {
        type: 'unknownBlock',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Inside' }] }],
      },
    ]);
    const { container } = render(<TiptapRenderer doc={doc} />);
    expect(container.textContent).toBe('Inside');
  });
});
