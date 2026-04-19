import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Button, Input, Label, NumericInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SalesRoll, SalesRollUsage, RollUsageSource } from '../types/rolls';
import { mbToM2 } from '../types/rolls';
import {
  createManualRollUsage,
  updateManualRollUsage,
  deleteRollUsage,
  fetchRollUsages,
  fetchWorkerProfiles,
} from '../services/rollService';

const ACTIVE = 'bg-primary text-primary-foreground border-primary';
const INACTIVE = 'bg-white hover:bg-hover border-border';

interface UsageCardProps {
  usage: SalesRollUsage;
  onEdit: (usage: SalesRollUsage) => void;
  onDelete: (id: string) => void;
  sourceLabel: (source: RollUsageSource) => string;
}

function UsageCard({ usage, onEdit, onDelete, sourceLabel }: UsageCardProps) {
  const canEditDelete = usage.source !== 'order';

  return (
    <div className="bg-white border rounded-lg p-3 text-sm space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{sourceLabel(usage.source)}</span>
          {usage.source === 'worker' && usage.workerName && (
            <span className="text-muted-foreground">— {usage.workerName}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {canEditDelete && (
            <>
              <button
                type="button"
                className="p-1 rounded hover:bg-hover transition-colors"
                onClick={() => onEdit(usage)}
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button
                type="button"
                className="p-1 rounded hover:bg-destructive/10 transition-colors"
                onClick={() => onDelete(usage.id)}
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </>
          )}
          <span className="text-muted-foreground ml-1">
            {format(parseISO(usage.createdAt), 'dd.MM.yyyy')}
          </span>
        </div>
      </div>
      <div>
        <span className="tabular-nums font-medium">
          {usage.usedMb.toFixed(2)} mb · {usage.usedM2.toFixed(2)} m²
        </span>
      </div>
      {usage.note && (
        <p className="text-muted-foreground text-xs">{usage.note}</p>
      )}
    </div>
  );
}

interface RollUsageTabProps {
  roll: SalesRoll;
  instanceId: string;
  onUsageChange?: () => void;
}

const RollUsageTab = ({ roll, instanceId, onUsageChange }: RollUsageTabProps) => {
  const { t } = useTranslation();
  const [usages, setUsages] = useState<SalesRollUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSource, setFormSource] = useState<'manual' | 'worker'>('manual');
  const [formMb, setFormMb] = useState('');
  const [formWorkerName, setFormWorkerName] = useState('');
  const [formVehicleName, setFormVehicleName] = useState('');
  const [formNote, setFormNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [workerProfiles, setWorkerProfiles] = useState<{ id: string; name: string }[]>([]);

  const SOURCE_LABELS: Record<RollUsageSource, string> = {
    order: t('sales.rolls.usageSourceOrder'),
    manual: t('sales.rolls.usageSourceManual'),
    worker: t('sales.rolls.usageSourceWorker'),
  };

  const SOURCE_OPTIONS: { value: 'manual' | 'worker'; label: string }[] = [
    { value: 'manual', label: t('sales.rolls.usageSourceManual') },
    { value: 'worker', label: t('sales.rolls.usageSourceWorker') },
  ];

  const parsedMb = parseFloat(formMb);
  const isValidMb = !isNaN(parsedMb) && parsedMb > 0;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchRollUsages(roll.id)
      .then((data) => {
        if (!cancelled) setUsages(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roll.id]);

  useEffect(() => {
    if (instanceId) fetchWorkerProfiles(instanceId).then(setWorkerProfiles);
  }, [instanceId]);

  const resetForm = () => {
    setFormMb('');
    setFormWorkerName('');
    setFormVehicleName('');
    setFormNote('');
    setFormSource('manual');
    setEditingId(null);
    setShowForm(false);
  };

  const refreshUsages = useCallback(async () => {
    const data = await fetchRollUsages(roll.id);
    setUsages(data);
    onUsageChange?.();
  }, [roll.id, onUsageChange]);

  const handleEdit = (usage: SalesRollUsage) => {
    setEditingId(usage.id);
    setFormSource(usage.source === 'order' ? 'manual' : usage.source);
    setFormMb(usage.usedMb.toString());
    setFormWorkerName(usage.workerName || '');
    setFormVehicleName(usage.vehicleName || '');
    setFormNote(usage.note || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRollUsage(id);
      await refreshUsages();
    } catch {
      toast.error(t('sales.rolls.usageToastDeleteError'));
    }
  };

  const handleSubmit = async () => {
    if (!isValidMb) return;

    setSaving(true);
    try {
      const payload = {
        usedMb: parsedMb,
        usedM2: mbToM2(parsedMb, roll.widthMm),
        source: formSource,
        workerName: formSource === 'worker' ? formWorkerName : undefined,
        vehicleName: formSource === 'worker' ? formVehicleName || undefined : undefined,
        note: formNote || undefined,
      };

      if (editingId) {
        await updateManualRollUsage(editingId, payload);
      } else {
        await createManualRollUsage({ rollId: roll.id, ...payload });
      }

      await refreshUsages();
      resetForm();
    } catch {
      toast.error(t('sales.rolls.usageToastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const renderForm = () => (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <div className="flex gap-2">
        {SOURCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`flex-1 text-sm py-2 px-3 rounded-md border transition-colors ${
              formSource === opt.value ? ACTIVE : INACTIVE
            }`}
            onClick={() => setFormSource(opt.value)}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          className="flex-1 text-sm py-2 px-3 rounded-md border bg-muted/50 text-muted-foreground cursor-not-allowed"
          disabled
        >
          {t('sales.rolls.usageSourceOrder')}
        </button>
      </div>

      {formSource === 'worker' && (
        <>
          <div>
            <Label className="text-xs">{t('sales.rolls.usageLabelWorker')}</Label>
            <Select value={formWorkerName} onValueChange={setFormWorkerName}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={t('sales.rolls.usagePlaceholderWorker')} /></SelectTrigger>
              <SelectContent>
                {workerProfiles.map((p) => (
                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t('sales.rolls.usageLabelCar')}</Label>
            <Input
              value={formVehicleName}
              onChange={(e) => setFormVehicleName(e.target.value)}
              className="mt-1"
            />
          </div>
        </>
      )}

      <div>
        <Label className="text-xs">{t('sales.rolls.usageLabelMb')}</Label>
        <NumericInput
          min={0}
          step={0.01}
          value={parsedMb > 0 ? parsedMb : undefined}
          onChange={(v) => setFormMb(v != null ? String(v) : '')}
          className="mt-1"
        />
        {isValidMb && (
          <p className="text-xs text-muted-foreground mt-1">
            = {mbToM2(parsedMb, roll.widthMm).toFixed(2)} m²
          </p>
        )}
      </div>

      <div>
        <Label className="text-xs">{t('sales.rolls.usageLabelNote')}</Label>
        <Input
          value={formNote}
          onChange={(e) => setFormNote(e.target.value)}
          className="mt-1"
        />
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={saving || !isValidMb}
        >
          {saving
            ? t('sales.rolls.usageBtnSaving')
            : editingId
              ? t('sales.rolls.usageBtnSave')
              : t('sales.rolls.usageBtnAdd')}
        </Button>
        <Button size="sm" variant="ghost" onClick={resetForm}>
          {t('sales.rolls.btnCancel')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {!showForm ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => { resetForm(); setShowForm(true); }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('sales.rolls.usageBtnAddUsage')}
        </Button>
      ) : (
        renderForm()
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t('sales.rolls.loading')}</p>
      ) : usages.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t('sales.rolls.usageEmpty')}
        </p>
      ) : (
        usages.map((u) => (
          <UsageCard
            key={u.id}
            usage={u}
            onEdit={handleEdit}
            onDelete={handleDelete}
            sourceLabel={(source) => SOURCE_LABELS[source]}
          />
        ))
      )}
    </div>
  );
};

export default RollUsageTab;
