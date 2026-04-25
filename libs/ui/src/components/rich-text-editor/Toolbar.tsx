import { useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToolbarProps {
  editor: Editor | null;
  onUploadImage?: (file: File) => Promise<string>;
}

export function Toolbar({ editor, onUploadImage }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!editor) return null;

  function handleLinkClick() {
    if (!editor) return;
    const url = window.prompt('URL');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUploadImage || !editor) return;
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border p-1">
      <button
        type="button"
        aria-label="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          'rounded p-1.5 transition-colors hover:bg-accent',
          editor.isActive('heading', { level: 1 }) && 'bg-accent text-accent-foreground',
        )}
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          'rounded p-1.5 transition-colors hover:bg-accent',
          editor.isActive('heading', { level: 2 }) && 'bg-accent text-accent-foreground',
        )}
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Heading 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(
          'rounded p-1.5 transition-colors hover:bg-accent',
          editor.isActive('heading', { level: 3 }) && 'bg-accent text-accent-foreground',
        )}
      >
        <Heading3 className="h-4 w-4" />
      </button>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
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
      {onUploadImage && (
        <>
          <button
            type="button"
            aria-label="Insert image"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn('rounded p-1.5 transition-colors hover:bg-accent disabled:opacity-50')}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            data-testid="rich-text-editor-image-input"
          />
        </>
      )}
    </div>
  );
}
