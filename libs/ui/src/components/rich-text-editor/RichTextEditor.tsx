import { useEffect, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { AlignCenter, AlignLeft, AlignRight, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Toolbar } from './Toolbar';
import type { TiptapDocument } from './types';

type ImageAlign = 'left' | 'center' | 'right' | 'full';

const ALIGN_CLASS: Record<ImageAlign, string> = {
  left: 'float-left mr-4 mb-2 max-w-[45%]',
  right: 'float-right ml-4 mb-2 max-w-[45%]',
  center: 'block mx-auto my-2 max-w-[80%]',
  full: 'block w-full my-2',
};

const AlignedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') ?? 'center',
        renderHTML: (attributes) => {
          const align = (attributes.align as ImageAlign) ?? 'center';
          return {
            'data-align': align,
            class: `${ALIGN_CLASS[align]} h-auto rounded-md`,
          };
        },
      },
    };
  },
});

export interface RichTextEditorProps {
  value: TiptapDocument | null;
  onChange: (doc: TiptapDocument) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /**
   * Upload a file (image) and return its public URL. When provided, the
   * toolbar exposes an image button. Without it, image uploads are hidden.
   */
  onUploadImage?: (file: File) => Promise<string>;
  onReady?: (editor: ReturnType<typeof useEditor>) => void;
}

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  className,
  onUploadImage,
  onReady,
}: RichTextEditorProps) {
  const [hasImage, setHasImage] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: false }),
      AlignedImage,
    ],
    content: value ?? undefined,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as TiptapDocument);
      let found = false;
      ed.state.doc.descendants((n) => {
        if (n.type.name === 'image') {
          found = true;
          return false;
        }
        return true;
      });
      setHasImage(found);
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
      {!disabled && <Toolbar editor={editor} onUploadImage={onUploadImage} />}
      {editor && hasImage && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: ed }) => ed.isActive('image')}
          tippyOptions={{ placement: 'top' }}
          className="flex items-center gap-1 rounded-md border border-border bg-popover p-1 shadow-md"
        >
          {(['left', 'center', 'right', 'full'] as const).map((align) => {
            const Icon =
              align === 'left'
                ? AlignLeft
                : align === 'right'
                  ? AlignRight
                  : align === 'full'
                    ? Maximize2
                    : AlignCenter;
            return (
              <button
                key={align}
                type="button"
                aria-label={`Image align ${align}`}
                onClick={() => editor.chain().focus().updateAttributes('image', { align }).run()}
                className={cn(
                  'rounded p-1.5 transition-colors hover:bg-accent',
                  editor.isActive('image', { align }) && 'bg-accent text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </BubbleMenu>
      )}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-3 py-2 focus-within:outline-none"
      />
    </div>
  );
}
