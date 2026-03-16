import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EmployeeCalendarConfig } from './EmployeeCalendarCard';

interface CalendarColumn {
  id: string;
  name: string;
}

interface EmployeeOption {
  employee_id: string;
  user_id: string | null;
  name: string;
}

interface AddEditEmployeeCalendarDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  config?: EmployeeCalendarConfig | null;
  onSaved: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  customer_name: 'Nazwa klienta',
  customer_phone: 'Telefon klienta',
  admin_notes: 'Notatki',
  price: 'Cena',
  address: 'Adres',
  hours: 'Godziny zlecenia',
};

const ACTION_LABELS: Record<string, string> = {
  add_item: 'Dodawanie zleceń',
  edit_item: 'Edycja zleceń',
  delete_item: 'Usuwanie zleceń',
  change_time: 'Zmiana czasu',
  change_column: 'Zmiana kolumny',
  edit_services: 'Edycja usług w zleceniu',
};

const defaultVisibleFields = {
  customer_name: true,
  customer_phone: true,
  admin_notes: true,
  price: true,
  address: true,
  hours: true,
};

const defaultAllowedActions = {
  add_item: true,
  edit_item: true,
  delete_item: true,
  change_time: true,
  change_column: true,
  edit_services: true,
};

const AddEditEmployeeCalendarDrawer = ({
  open,
  onOpenChange,
  instanceId,
  config,
  onSaved,
}: AddEditEmployeeCalendarDrawerProps) => {
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<CalendarColumn[]>([]);
  const [columnsLoading, setColumnsLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  const [name, setName] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([]);
  const [visibleFields, setVisibleFields] = useState(defaultVisibleFields);
  const [allowedActions, setAllowedActions] = useState(defaultAllowedActions);

  const isEditing = !!config;

  useEffect(() => {
    if (!open) return;

    const fetchColumns = async () => {
      setColumnsLoading(true);
      const { data } = await supabase
        .from('calendar_columns')
        .select('id, name')
        .eq('instance_id', instanceId)
        .eq('active', true)
        .order('sort_order');
      if (data) setColumns(data);
      setColumnsLoading(false);
    };

    const fetchEmployees = async () => {
      setEmployeesLoading(true);
      const { data: emps } = await supabase
        .from('employees')
        .select('id, name, linked_user_id')
        .eq('instance_id', instanceId)
        .eq('active', true)
        .order('name');

      if (emps && emps.length > 0) {
        setEmployees(
          emps.map((e: any) => ({
            employee_id: e.id,
            user_id: e.linked_user_id,
            name: e.name,
          })),
        );
      } else {
        setEmployees([]);
      }
      setEmployeesLoading(false);
    };

    fetchColumns();
    fetchEmployees();
  }, [open, instanceId]);

  // Reset form when drawer opens or config changes
  useEffect(() => {
    if (!open) return;
    if (config) {
      setName(config.name);
      setSelectedColumnIds(config.column_ids || []);
      setVisibleFields({ ...defaultVisibleFields, ...(config.visible_fields || {}) });
      setAllowedActions({ ...defaultAllowedActions, ...(config.allowed_actions || {}) });
    } else {
      setName('');
      setSelectedEmployeeId('');
      setSelectedColumnIds([]);
      setVisibleFields(defaultVisibleFields);
      setAllowedActions(defaultAllowedActions);
    }
  }, [config, open]);

  // Resolve employee selection when editing (needs employees to be loaded)
  useEffect(() => {
    if (!open || !config || employees.length === 0) return;
    const matchingEmployee = employees.find((e) => e.user_id === config.user_id);
    setSelectedEmployeeId(matchingEmployee?.employee_id || '');
  }, [open, config, employees]);

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumnIds((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId],
    );
  };

  const handleVisibleFieldToggle = (field: keyof typeof visibleFields) => {
    setVisibleFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAllowedActionToggle = (action: keyof typeof allowedActions) => {
    setAllowedActions((prev) => ({ ...prev, [action]: !prev[action] }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nazwa kalendarza jest wymagana');
      return;
    }
    if (!selectedEmployeeId) {
      toast.error('Wybierz pracownika');
      return;
    }
    const selectedEmployee = employees.find((e) => e.employee_id === selectedEmployeeId);
    if (!selectedEmployee?.user_id) {
      toast.error(
        'Wybrany pracownik nie ma powiązanego konta użytkownika. Najpierw powiąż go w zakładce Pracownicy.',
      );
      return;
    }
    if (selectedColumnIds.length === 0) {
      toast.error('Wybierz przynajmniej jedną kolumnę');
      return;
    }

    setLoading(true);
    try {
      const configData = {
        instance_id: instanceId,
        user_id: selectedEmployee.user_id,
        name: name.trim(),
        column_ids: selectedColumnIds,
        visible_fields: visibleFields,
        allowed_actions: allowedActions,
      };

      if (isEditing && config) {
        const { error } = await supabase
          .from('employee_calendar_configs')
          .update(configData as any)
          .eq('id', config.id);
        if (error) throw error;
        toast.success('Kalendarz zaktualizowany');
      } else {
        const { error } = await supabase
          .from('employee_calendar_configs')
          .insert(configData as any);
        if (error) throw error;
        toast.success('Kalendarz utworzony');
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error('Error saving employee calendar config:', error);
      toast.error('Błąd zapisu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[550px] sm:max-w-[550px] h-full p-0 flex flex-col z-[1000]"
        hideCloseButton
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="p-6 flex-1 overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-6">
            <div className="flex items-center justify-between">
              <SheetTitle>{isEditing ? 'Edytuj kalendarz' : 'Dodaj kalendarz'}</SheetTitle>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full bg-white hover:bg-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="calendar-name">Nazwa kalendarza</Label>
              <Input
                id="calendar-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Jan Kowalski"
                className="bg-white"
              />
            </div>

            {/* Employee select */}
            <div className="space-y-2">
              <Label>Pracownik</Label>
              {employeesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : employees.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak aktywnych pracowników</p>
              ) : (
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz pracownika" />
                  </SelectTrigger>
                  <SelectContent className="z-[1100] bg-white">
                    {employees.map((e) => (
                      <SelectItem key={e.employee_id} value={e.employee_id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Columns */}
            <div className="space-y-3">
              <Label>Kolumny kalendarza</Label>
              {columnsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : columns.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak kolumn kalendarza</p>
              ) : (
                <div className="space-y-2">
                  {columns.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer hover:bg-hover transition-colors"
                    >
                      <Checkbox
                        checked={selectedColumnIds.includes(col.id)}
                        onCheckedChange={() => handleColumnToggle(col.id)}
                      />
                      <span className="font-medium text-foreground">{col.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Visible Fields */}
            <div className="space-y-3">
              <Label>Widoczne pola</Label>
              <p className="text-xs text-muted-foreground">
                Które informacje pracownik widzi na zleceniu
              </p>
              <div className="space-y-2">
                {Object.entries(visibleFields).map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer hover:bg-hover transition-colors"
                  >
                    <Checkbox
                      checked={value}
                      onCheckedChange={() =>
                        handleVisibleFieldToggle(key as keyof typeof visibleFields)
                      }
                    />
                    <span className="text-sm text-foreground">{FIELD_LABELS[key] || key}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Allowed Actions */}
            <div className="space-y-3">
              <Label>Dozwolone akcje</Label>
              <p className="text-xs text-muted-foreground">Co pracownik może robić w kalendarzu</p>
              <div className="space-y-2">
                {Object.entries(allowedActions).map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer hover:bg-hover transition-colors"
                  >
                    <Checkbox
                      checked={value}
                      onCheckedChange={() =>
                        handleAllowedActionToggle(key as keyof typeof allowedActions)
                      }
                    />
                    <span className="text-sm text-foreground">{ACTION_LABELS[key] || key}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Save */}
            <div className="pt-4 border-t">
              <Button onClick={handleSave} disabled={loading} className="w-full">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? 'Zapisywanie...' : isEditing ? 'Zapisz' : 'Utwórz kalendarz'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddEditEmployeeCalendarDrawer;
