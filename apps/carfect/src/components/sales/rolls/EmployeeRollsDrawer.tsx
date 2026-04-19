import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { ConfirmDialog } from '@shared/ui';
import { toast } from 'sonner';
import { fetchWorkerRollUsagesForMonth, fetchWorkerProfiles, createScrapUsage, deleteRollUsage, type WorkerRollUsageWithRoll } from '../services/rollService';

interface EmployeeRollsDrawerProps {
  open: boolean;
  onClose: () => void;
  instanceId: string;
}

const EmployeeRollsDrawer = ({ open, onClose, instanceId }: EmployeeRollsDrawerProps) => {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [usages, setUsages] = useState<WorkerRollUsageWithRoll[]>([]);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addWorker, setAddWorker] = useState('');
  const [addWidthM, setAddWidthM] = useState('');
  const [addLengthM, setAddLengthM] = useState('');
  const [addVehicle, setAddVehicle] = useState('');
  const [addNote, setAddNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !instanceId) return;
    fetchWorkerProfiles(instanceId).then(setProfiles);
  }, [open, instanceId]);

  const handleAddScrap = async () => {
    const w = parseFloat(addWidthM);
    const l = parseFloat(addLengthM);
    if (!addWorker || isNaN(w) || isNaN(l) || w <= 0 || l <= 0) {
      toast.error(t('sales.rolls.employeeToastValidation'));
      return;
    }
    setSaving(true);
    try {
      await createScrapUsage({ workerName: addWorker, widthM: w, lengthM: l, vehicleName: addVehicle || null, note: addNote || null });
      toast.success(t('sales.rolls.employeeToastAdded'));
      setShowAddForm(false);
      setAddWorker(''); setAddWidthM(''); setAddLengthM(''); setAddVehicle(''); setAddNote('');
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error(t('sales.rolls.employeeToastAddError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUsage = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRollUsage(deleteTarget);
      toast.success(t('sales.rolls.employeeToastDeleted'));
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error(t('sales.rolls.employeeToastDeleteError'));
    } finally {
      setDeleteTarget(null);
    }
  };

  useEffect(() => {
    if (!open || !instanceId) return;

    let cancelled = false;
    setLoading(true);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    fetchWorkerRollUsagesForMonth(instanceId, year, month)
      .then((data) => {
        if (!cancelled) setUsages(data);
      })
      .catch(() => {
        if (!cancelled) setUsages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, instanceId, currentMonth, refreshKey]);

  const monthLabel = format(currentMonth, 'LLLL yyyy', { locale: pl });

  // Group case-insensitively — normalize to title case for display
  const grouped = usages.reduce<Record<string, WorkerRollUsageWithRoll[]>>((acc, usage) => {
    const raw = usage.workerName ?? t('sales.rolls.employeeUnknownWorker');
    // Normalize: capitalize first letter of each word
    const name = raw.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\b(\w)(\w*)/g, (_, f, r) => f.toUpperCase() + r.toLowerCase());
    if (!acc[name]) acc[name] = [];
    acc[name].push(usage);
    return acc;
  }, {});

  const workerNames = Object.keys(grouped).sort();
  const grandTotal = usages.reduce((sum, u) => sum + u.usedM2, 0);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent
        side="right"
        className="!w-[80vw] !max-w-[80vw] flex flex-col bg-white p-0 gap-0"
        hideCloseButton
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 px-6 py-4 border-b shrink-0">
          <SheetTitle className="text-foreground">{t('sales.rolls.employeeDrawerTitle')}</SheetTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white hover:bg-hover transition-colors absolute top-3 right-3 z-50"
          >
            <X className="w-5 h-5" />
          </button>
        </SheetHeader>

        {/* Month selector + add button */}
        <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
          <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            aria-label={t('sales.rolls.employeeAriaLabelPrevMonth')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold capitalize min-w-[140px] text-center text-foreground">
            {monthLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            aria-label={t('sales.rolls.employeeAriaLabelNextMonth')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-1" />
            {t('sales.rolls.employeeBtnAddUsage')}
          </Button>
        </div>

        {/* Add scrap usage form */}
        {showAddForm && (
          <div className="px-6 py-4 border-b space-y-3 bg-muted/20 shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t('sales.rolls.employeeLabelWorker')}</Label>
                <Select value={addWorker} onValueChange={setAddWorker}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={t('sales.rolls.employeePlaceholderWorker')} /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t('sales.rolls.employeeLabelCar')}</Label>
                <Input className="h-8 text-sm" value={addVehicle} onChange={(e) => setAddVehicle(e.target.value)} placeholder="np. BMW 320d WA12345" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">{t('sales.rolls.employeeLabelWidthM')}</Label>
                <Input className="h-8 text-sm" type="number" step="0.01" min="0" value={addWidthM} onChange={(e) => setAddWidthM(e.target.value)} placeholder="np. 1.52" />
              </div>
              <div>
                <Label className="text-xs">{t('sales.rolls.employeeLabelLengthM')}</Label>
                <Input className="h-8 text-sm" type="number" step="0.01" min="0" value={addLengthM} onChange={(e) => setAddLengthM(e.target.value)} placeholder="np. 3.00" />
              </div>
              <div>
                <Label className="text-xs">{t('sales.rolls.employeeLabelM2Calculated')}</Label>
                <div className="h-8 flex items-center text-sm font-medium text-foreground">
                  {addWidthM && addLengthM ? (parseFloat(addWidthM) * parseFloat(addLengthM)).toFixed(2) : '—'} m²
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">{t('sales.rolls.employeeLabelNote')}</Label>
              <Input className="h-8 text-sm" value={addNote} onChange={(e) => setAddNote(e.target.value)} placeholder="np. ścinki z realizacji" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddScrap} disabled={saving}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                {t('sales.rolls.employeeBtnAdd')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>{t('sales.rolls.employeeBtnCancel')}</Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : usages.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-12">
              {t('sales.rolls.employeeEmpty')}
            </div>
          ) : (
            <>
              {workerNames.map((workerName) => {
                const workerUsages = grouped[workerName];
                const workerTotal = workerUsages.reduce((sum, u) => sum + u.usedM2, 0);

                return (
                  <div key={workerName}>
                    <h3 className="font-bold text-sm mb-2 text-foreground">{workerName}</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/30 border-b">
                            <th className="text-left px-3 py-2 font-semibold text-foreground w-[100px]">{t('sales.rolls.employeeColDate')}</th>
                            <th className="text-left px-3 py-2 font-semibold text-foreground">{t('sales.rolls.employeeColRoll')}</th>
                            <th className="text-left px-3 py-2 font-semibold text-foreground w-[180px]">{t('sales.rolls.employeeColCar')}</th>
                            <th className="text-right px-3 py-2 font-semibold text-foreground w-[80px]">mb</th>
                            <th className="text-right px-3 py-2 font-semibold text-foreground w-[80px]">m²</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workerUsages.map((usage) => (
                            <tr key={usage.id} className="border-b last:border-b-0">
                              <td className="px-3 py-2 text-foreground whitespace-nowrap">
                                {format(parseISO(usage.createdAt), 'dd.MM.yyyy')}
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-foreground font-medium text-sm">
                                  {usage.rollProductName ?? '—'}
                                  {usage.rollProductCode && (
                                    <span className="text-foreground ml-1 text-sm">({usage.rollProductCode})</span>
                                  )}
                                  {usage.rollWidthMm && (
                                    <span className="text-foreground ml-1 text-sm">{usage.rollWidthMm}mm</span>
                                  )}
                                </div>
                                {usage.note && (
                                  <p className="text-sm text-foreground mt-0.5">{usage.note}</p>
                                )}
                              </td>
                              <td className="px-3 py-2 text-foreground">
                                {usage.vehicleName ?? '—'}
                              </td>
                              <td className="px-3 py-2 text-right text-foreground">
                                {usage.usedMb.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right text-foreground font-medium">
                                {usage.usedM2.toFixed(2)}
                              </td>
                              <td className="px-1 py-2 w-[30px]">
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(usage.id)}
                                  className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-primary/10">
                            <td colSpan={4} className="px-3 py-2 text-right text-foreground font-semibold">
                              {t('sales.rolls.employeeWorkerTotal')}
                            </td>
                            <td className="px-3 py-2 text-right text-foreground font-bold">
                              {workerTotal.toFixed(2)} m²
                            </td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 border-t font-bold text-right text-foreground">
                {t('sales.rolls.employeeGrandTotal', { total: grandTotal.toFixed(2) })}
              </div>
            </>
          )}
        </div>
      </SheetContent>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t('sales.rolls.employeeDeleteTitle')}
        description={t('sales.rolls.employeeDeleteDescription')}
        confirmLabel={t('sales.rolls.employeeDeleteConfirmLabel')}
        onConfirm={handleDeleteUsage}
        variant="destructive"
      />
    </Sheet>
  );
};

export default EmployeeRollsDrawer;
