import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui';
import type { ConditionTemplate } from '@/hooks/useConditionTemplates';

interface TemplatePickerProps {
  templates: ConditionTemplate[];
  onSelect: (content: string) => void;
}

export function TemplatePicker({ templates, onSelect }: TemplatePickerProps) {
  if (templates.length === 0) return null;

  return (
    <Select
      value=""
      onValueChange={(id) => {
        const template = templates.find((t) => t.id === id);
        if (template) onSelect(template.content);
      }}
    >
      <SelectTrigger className="h-7 w-auto gap-1 text-xs text-primary border-none bg-transparent hover:bg-primary/5 px-2 shrink-0">
        <SelectValue placeholder="z szablonu" />
      </SelectTrigger>
      <SelectContent>
        {templates.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
