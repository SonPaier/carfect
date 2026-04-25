import { Editor } from '@tiptap/react';
import { Bold, List, ListOrdered, Link as LinkIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToolbarProps {
  editor: Editor | null;
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  function handleLinkClick() {
    const url = window.prompt('URL');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  return (
    <div className="flex gap-1 border-b border-border p-1">
      <button
        type="button"
        aria-label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          'rounded p-1.5 transition-colors hover:bg-accent',
          editor.isActive('bold') && 'bg-accent text-accent-foreground',
        )}
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          'rounded p-1.5 transition-colors hover:bg-accent',
          editor.isActive('bulletList') && 'bg-accent text-accent-foreground',
        )}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Ordered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          'rounded p-1.5 transition-colors hover:bg-accent',
          editor.isActive('orderedList') && 'bg-accent text-accent-foreground',
        )}
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Link"
        onClick={handleLinkClick}
        className={cn(
          'rounded p-1.5 transition-colors hover:bg-accent',
          editor.isActive('link') && 'bg-accent text-accent-foreground',
        )}
      >
        <LinkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
