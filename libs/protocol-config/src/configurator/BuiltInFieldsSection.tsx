import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Card,
  Switch,
  Input,
  Textarea,
  Label,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  cn,
} from '@shared/ui';
import type { BuiltInFieldsConfig, BuiltInFieldToggle, ServiceItemsConfig } from '../types';

interface Props {
  config: BuiltInFieldsConfig;
  onChange: (config: BuiltInFieldsConfig) => void;
}

const FIELD_LABELS: Record<keyof BuiltInFieldsConfig, string> = {
  nip: 'NIP firmy',
  vin: 'VIN',
  fuelLevel: 'Poziom paliwa',
  odometer: 'Przebieg (km)',
  serviceItems: 'Lista usług',
  releaseSection: 'Sekcja odbioru pojazdu',
  valuableItemsClause: 'Przedmioty wartościowe',
};

type SimpleToggleKey = 'nip' | 'vin' | 'fuelLevel' | 'odometer';
type SimpleClauseKey = 'valuableItemsClause';

function SimpleToggleFields({
  field,
  onChange,
}: {
  field: BuiltInFieldToggle;
  onChange: (updated: BuiltInFieldToggle) => void;
}) {
  return (
    <div className="space-y-3 pt-3">
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Etykieta</Label>
        <Input
          placeholder="Domyślna etykieta"
          value={field.label ?? ''}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Widoczne dla klienta</Label>
        <Switch
          checked={field.visibleToCustomer}
          onCheckedChange={(checked) =>
            onChange({ ...field, visibleToCustomer: checked })
          }
        />
      </div>
    </div>
  );
}

function ServiceItemsFields({
  field,
  onChange,
}: {
  field: ServiceItemsConfig;
  onChange: (updated: ServiceItemsConfig) => void;
}) {
  return (
    <div className="space-y-3 pt-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Ręczne dodawanie usług</Label>
        <Switch
          checked={field.allowManualEntry}
          onCheckedChange={(checked) =>
            onChange({ ...field, allowManualEntry: checked })
          }
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Wczytaj z oferty</Label>
        <Switch
          checked={field.loadFromOffer}
          onCheckedChange={(checked) =>
            onChange({ ...field, loadFromOffer: checked })
          }
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Wczytaj z rezerwacji</Label>
        <Switch
          checked={field.loadFromReservation}
          onCheckedChange={(checked) =>
            onChange({ ...field, loadFromReservation: checked })
          }
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Widoczne dla klienta</Label>
        <Switch
          checked={field.visibleToCustomer}
          onCheckedChange={(checked) =>
            onChange({ ...field, visibleToCustomer: checked })
          }
        />
      </div>
    </div>
  );
}

function ReleaseSectionFields({
  field,
  onChange,
}: {
  field: BuiltInFieldsConfig['releaseSection'];
  onChange: (updated: BuiltInFieldsConfig['releaseSection']) => void;
}) {
  return (
    <div className="space-y-3 pt-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="release-declaration-text" className="text-xs text-muted-foreground">
          Tekst deklaracji
        </Label>
        <Textarea
          id="release-declaration-text"
          value={field.declarationText ?? ''}
          onChange={(e) => onChange({ ...field, declarationText: e.target.value })}
          rows={3}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Widoczne dla klienta</Label>
        <Switch
          checked={field.visibleToCustomer}
          onCheckedChange={(checked) =>
            onChange({ ...field, visibleToCustomer: checked })
          }
        />
      </div>
    </div>
  );
}

function ClauseFields({
  field,
  onChange,
}: {
  field: { enabled: boolean; visibleToCustomer: boolean };
  onChange: (updated: { enabled: boolean; visibleToCustomer: boolean }) => void;
}) {
  return (
    <div className="space-y-3 pt-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Widoczne dla klienta</Label>
        <Switch
          checked={field.visibleToCustomer}
          onCheckedChange={(checked) =>
            onChange({ ...field, visibleToCustomer: checked })
          }
        />
      </div>
    </div>
  );
}

interface FieldCardProps {
  label: string;
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  children: React.ReactNode;
}

function FieldCard({ label, enabled, onToggleEnabled, children }: FieldCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border rounded-lg p-3">
        <div className="flex items-center justify-between gap-2">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 flex-1 text-left"
            >
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform',
                  open && 'rotate-180',
                )}
              />
              <span className="text-sm font-medium">{label}</span>
            </button>
          </CollapsibleTrigger>
          <Switch
            checked={enabled}
            onCheckedChange={onToggleEnabled}
          />
        </div>
        <CollapsibleContent>{children}</CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

const SIMPLE_TOGGLE_KEYS: SimpleToggleKey[] = ['nip', 'vin', 'fuelLevel', 'odometer'];
const SIMPLE_CLAUSE_KEYS: SimpleClauseKey[] = ['valuableItemsClause'];

export function BuiltInFieldsSection({ config, onChange }: Props) {
  function updateField<K extends keyof BuiltInFieldsConfig>(
    key: K,
    value: BuiltInFieldsConfig[K],
  ) {
    onChange({ ...config, [key]: value });
  }

  return (
    <div className="space-y-3">
      {SIMPLE_TOGGLE_KEYS.map((key) => (
        <FieldCard
          key={key}
          label={FIELD_LABELS[key]}
          enabled={config[key].enabled}
          onToggleEnabled={(enabled) =>
            updateField(key, { ...config[key], enabled })
          }
        >
          <SimpleToggleFields
            field={config[key]}
            onChange={(updated) => updateField(key, updated)}
          />
        </FieldCard>
      ))}

      <FieldCard
        label={FIELD_LABELS.serviceItems}
        enabled={config.serviceItems.enabled}
        onToggleEnabled={(enabled) =>
          updateField('serviceItems', { ...config.serviceItems, enabled })
        }
      >
        <ServiceItemsFields
          field={config.serviceItems}
          onChange={(updated) => updateField('serviceItems', updated)}
        />
      </FieldCard>

      <FieldCard
        label={FIELD_LABELS.releaseSection}
        enabled={config.releaseSection.enabled}
        onToggleEnabled={(enabled) =>
          updateField('releaseSection', { ...config.releaseSection, enabled })
        }
      >
        <ReleaseSectionFields
          field={config.releaseSection}
          onChange={(updated) => updateField('releaseSection', updated)}
        />
      </FieldCard>

      {SIMPLE_CLAUSE_KEYS.map((key) => (
        <FieldCard
          key={key}
          label={FIELD_LABELS[key]}
          enabled={config[key].enabled}
          onToggleEnabled={(enabled) =>
            updateField(key, { ...config[key], enabled })
          }
        >
          <ClauseFields
            field={config[key]}
            onChange={(updated) => updateField(key, updated)}
          />
        </FieldCard>
      ))}
    </div>
  );
}
