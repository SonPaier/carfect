import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Trash2, Info } from 'lucide-react';
import { Button } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ServiceSelectionDrawer from './ServiceSelectionDrawer';

interface AssignedService {
  service_id: string;
  name: string;
}

interface TemplateAssignedServicesProps {
  templateId: string | null;
  instanceId: string | null;
}

export function TemplateAssignedServices({ templateId, instanceId }: TemplateAssignedServicesProps) {
  const { t } = useTranslation();
  const [services, setServices] = useState<AssignedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (templateId && instanceId) {
      fetchAssignedServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, instanceId]);

  const fetchAssignedServices = async () => {
    if (!templateId || !instanceId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_reminder_templates')
        .select('service_id, unified_services(name)')
        .eq('reminder_template_id', templateId)
        .eq('instance_id', instanceId);

      if (error) throw error;

      setServices(
        (data || []).map((row: { service_id: string; unified_services: { name: string } | null }) => ({
          service_id: row.service_id,
          name: row.unified_services?.name || '—',
        })),
      );
    } catch (error: unknown) {
      console.error('Error fetching assigned services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (serviceIds: string[]) => {
    if (!templateId || !instanceId) return;
    try {
      // Delete all current assignments for this template
      await supabase
        .from('service_reminder_templates')
        .delete()
        .eq('reminder_template_id', templateId)
        .eq('instance_id', instanceId);

      // Insert new assignments
      if (serviceIds.length > 0) {
        const rows = serviceIds.map((serviceId) => ({
          service_id: serviceId,
          reminder_template_id: templateId,
          instance_id: instanceId,
        }));
        const { error } = await supabase.from('service_reminder_templates').insert(rows);
        if (error) throw error;
      }

      toast.success('Usługi przypisane');
      fetchAssignedServices();
    } catch (error: unknown) {
      console.error('Error saving assignments:', error);
      toast.error(t('errors.generic'));
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!templateId) return;
    try {
      const { error } = await supabase
        .from('service_reminder_templates')
        .delete()
        .eq('service_id', serviceId)
        .eq('reminder_template_id', templateId)
        .eq('instance_id', instanceId);

      if (error) throw error;
      setServices((prev) => prev.filter((s) => s.service_id !== serviceId));
    } catch (error: unknown) {
      console.error('Error removing service:', error);
      toast.error(t('errors.generic'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start gap-3 p-4 mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <p className="text-sm">
          Jeśli masz włączone kończenie usług w ustawieniach, przypomnienie zostanie automatycznie ustawione na kliencie po zakończeniu usługi z tym szablonem w kalendarzu.
        </p>
      </div>
      <div className="space-y-3">
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Brak przypisanych usług
          </p>
        ) : (
          services.map((service) => (
            <div
              key={service.service_id}
              className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-white"
            >
              <span className="text-sm font-medium">{service.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveService(service.service_id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}

        <Button onClick={() => setDrawerOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Przypisz usługi
        </Button>
      </div>

      {instanceId && (
        <ServiceSelectionDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          instanceId={instanceId}
          carSize="medium"
          selectedServiceIds={services.map((s) => s.service_id)}
          onConfirm={(serviceIds) => handleConfirm(serviceIds)}
          hasUnifiedServices
          hideSelectedSection
          hidePricing
        />
      )}
    </>
  );
}
