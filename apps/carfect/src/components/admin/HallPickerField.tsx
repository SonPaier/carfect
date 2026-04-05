import { Label } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';

interface HallOption {
  id: string;
  name: string;
}

interface HallPickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  halls: HallOption[];
}

const HallPickerField = ({ value, onChange, halls }: HallPickerFieldProps) => {
  if (halls.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>Przypisany kalendarz</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Wybierz kalendarz..." />
        </SelectTrigger>
        <SelectContent>
          {halls.map((hall) => (
            <SelectItem key={hall.id} value={hall.id}>
              {hall.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Użytkownik po zalogowaniu zobaczy wybrany kalendarz
      </p>
    </div>
  );
};

export type { HallOption };
export default HallPickerField;
