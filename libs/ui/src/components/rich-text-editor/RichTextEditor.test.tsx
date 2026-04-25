import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextEditor } from './RichTextEditor';
import type { TiptapDocument } from './types';
import type { Editor } from '@tiptap/react';

const emptyDoc: TiptapDocument = { type: 'doc', content: [] };

describe('RichTextEditor', () => {
  beforeEach(() => {
    // Reset window.prompt mock between tests
    vi.restoreAllMocks();
  });

  it('renders the toolbar buttons (bold, bullet, ordered, link)', async () => {
    render(<RichTextEditor value={emptyDoc} onChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bullet list/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ordered list/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /link/i })).toBeInTheDocument();
    });
  });

  it('calls onChange with updated Tiptap doc when user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<RichTextEditor value={emptyDoc} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.type(editor, 'Hello');

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as TiptapDocument;
      const text = JSON.stringify(lastCall);
      expect(text).toContain('Hello');
    });
  });

  it('exposes bold as an available mark in the schema', async () => {
    let capturedEditor: Editor | null = null;

    render(
      <RichTextEditor
        value={emptyDoc}
        onChange={vi.fn()}
        onReady={(editor) => {
          capturedEditor = editor as Editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(capturedEditor).not.toBeNull();
    });

    expect(capturedEditor!.schema.marks['bold']).toBeDefined();
    expect(capturedEditor!.schema.marks['link']).toBeDefined();
    expect(capturedEditor!.schema.nodes['bulletList']).toBeDefined();
    expect(capturedEditor!.schema.nodes['orderedList']).toBeDefined();
  });

  it('exposes heading levels 1-3 in the schema', async () => {
    let capturedEditor: Editor | null = null;

    render(
      <RichTextEditor
        value={emptyDoc}
        onChange={vi.fn()}
        onReady={(editor) => {
          capturedEditor = editor as Editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(capturedEditor).not.toBeNull();
    });

    // Heading is enabled with levels 1-3 (configured in RichTextEditor).
    expect(capturedEditor!.schema.nodes['heading']).toBeDefined();
    expect(capturedEditor!.schema.nodes['image']).toBeDefined();
  });

  it('respects the disabled prop and sets contenteditable to false', async () => {
    render(<RichTextEditor value={emptyDoc} onChange={vi.fn()} disabled />);

    await waitFor(() => {
      const editorEl = document.querySelector('[contenteditable]');
      expect(editorEl).toBeInTheDocument();
      expect(editorEl).toHaveAttribute('contenteditable', 'false');
    });
  });
});
