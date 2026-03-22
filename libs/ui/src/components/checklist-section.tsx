import * as React from 'react';
import { Checkbox } from './checkbox';
import { cn } from '../lib/utils';
import { Trash2, Plus } from 'lucide-react';

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts (HTTP, older environments)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistSectionProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  mode: 'edit' | 'execute';
  addLabel?: string;
  addListLabel?: string;
  placeholder?: string;
}

const ChecklistSection = ({
  items,
  onChange,
  mode,
  addLabel = 'Dodaj punkt',
  addListLabel = 'Dodaj listę zadań',
  placeholder = 'Wpisz treść...',
}: ChecklistSectionProps) => {
  const [addingNew, setAddingNew] = React.useState(false);
  const [newText, setNewText] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState('');
  const newInputRef = React.useRef<HTMLInputElement>(null);
  // Keep fresh ref to avoid stale closure on rapid clicks
  const itemsRef = React.useRef(items);
  itemsRef.current = items;

  React.useEffect(() => {
    if (addingNew && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [addingNew]);

  const handleToggle = (id: string) => {
    onChange(
      itemsRef.current.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  };

  const handleDelete = (id: string) => {
    onChange(itemsRef.current.filter((item) => item.id !== id));
  };

  const handleAddNew = () => {
    const text = newText.trim();
    if (!text) {
      setAddingNew(false);
      setNewText('');
      return;
    }
    const newItem: ChecklistItem = {
      id: generateId(),
      text,
      checked: false,
    };
    onChange([...items, newItem]);
    setNewText('');
    setAddingNew(false);
  };

  const handleEditStart = (item: ChecklistItem) => {
    if (mode !== 'edit') return;
    setEditingId(item.id);
    setEditText(item.text);
  };

  const handleEditSave = () => {
    if (!editingId) return;
    const text = editText.trim();
    if (text) {
      onChange(items.map((item) => (item.id === editingId ? { ...item, text } : item)));
    } else {
      onChange(items.filter((item) => item.id !== editingId));
    }
    setEditingId(null);
    setEditText('');
  };

  if (items.length === 0 && !addingNew) {
    return (
      <button
        type="button"
        onClick={() => setAddingNew(true)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="w-4 h-4" />
        {addListLabel}
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2 group">
          {mode === 'execute' ? (
            <Checkbox
              checked={item.checked}
              onCheckedChange={() => handleToggle(item.id)}
              className="shrink-0"
            />
          ) : (
            <span className="text-sm text-muted-foreground w-5 shrink-0 text-right">
              {index + 1}.
            </span>
          )}

          {editingId === item.id ? (
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSave();
                if (e.key === 'Escape') {
                  setEditingId(null);
                  setEditText('');
                }
              }}
              autoFocus
              className="flex-1 text-sm bg-transparent border-b border-primary/30 outline-none py-0.5"
            />
          ) : (
            <span
              onClick={() => handleEditStart(item)}
              className={cn(
                'flex-1 text-sm py-0.5',
                item.checked && mode === 'execute' && 'line-through text-muted-foreground',
                mode === 'edit' && 'cursor-pointer hover:bg-primary/5 rounded px-1 -mx-1',
              )}
            >
              {item.text}
            </span>
          )}

          {mode === 'edit' && (
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="shrink-0 p-1 rounded hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          )}
        </div>
      ))}

      {addingNew ? (
        <div className="flex items-center gap-2">
          {mode === 'execute' ? (
            <Checkbox disabled className="shrink-0" />
          ) : (
            <span className="text-sm text-muted-foreground w-5 shrink-0 text-right">
              {items.length + 1}.
            </span>
          )}
          <input
            ref={newInputRef}
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onBlur={handleAddNew}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddNew();
              if (e.key === 'Escape') {
                setAddingNew(false);
                setNewText('');
              }
            }}
            placeholder={placeholder}
            className="flex-1 text-sm bg-transparent border-b border-primary/30 outline-none py-0.5"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingNew(true)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
        >
          <Plus className="w-4 h-4" />
          {addLabel}
        </button>
      )}
    </div>
  );
};
ChecklistSection.displayName = 'ChecklistSection';

export { ChecklistSection };
