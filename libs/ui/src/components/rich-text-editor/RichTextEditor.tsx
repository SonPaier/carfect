import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { cn } from '../../lib/utils';
import { Toolbar } from './Toolbar';
import type { TiptapDocument } from './types';

export interface RichTextEditorProps {
  value: TiptapDocument | null;
  onChange: (doc: TiptapDocument) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onReady?: (editor: ReturnType<typeof useEditor>) => void;
}

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  className,
  onReady,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false }), Link.configure({ openOnClick: false })],
    content: value ?? undefined,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as TiptapDocument);
    },
  });

  // Sync external value changes without infinite loops
  useEffect(() => {
    if (editor && value && JSON.stringify(value) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Sync editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  // Expose editor instance for tests via onReady callback
  useEffect(() => {
    if (editor && onReady) {
      onReady(editor);
    }
  }, [editor, onReady]);

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background',
        disabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
    >
      {!disabled && <Toolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-3 py-2 focus-within:outline-none"
      />
    </div>
  );
}
