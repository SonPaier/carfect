import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TemplateType = 'payment_terms' | 'warranty' | 'service_info' | 'notes';

export interface ConditionTemplate {
  id: string;
  instance_id: string;
  template_type: TemplateType;
  name: string;
  content: string;
  sort_order: number;
}

export function useConditionTemplates(instanceId: string | null) {
  const [templates, setTemplates] = useState<ConditionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!instanceId) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('offer_condition_templates')
      .select('*')
      .eq('instance_id', instanceId)
      .order('template_type')
      .order('sort_order');

    if (error) {
      console.error('Error fetching condition templates:', error);
      setTemplates([]);
    } else {
      setTemplates(
        (data || []).map((d) => ({
          id: d.id,
          instance_id: d.instance_id,
          template_type: d.template_type as TemplateType,
          name: d.name,
          content: d.content,
          sort_order: d.sort_order,
        })),
      );
    }
    setLoading(false);
  }, [instanceId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const byType = useCallback(
    (type: TemplateType) => templates.filter((t) => t.template_type === type),
    [templates],
  );

  const createTemplate = async (
    type: TemplateType,
    name: string,
    content: string,
  ): Promise<boolean> => {
    if (!instanceId) return false;

    const maxOrder = templates
      .filter((t) => t.template_type === type)
      .reduce((max, t) => Math.max(max, t.sort_order), -1);

    const { data, error } = await supabase
      .from('offer_condition_templates')
      .insert({
        instance_id: instanceId,
        template_type: type,
        name: name.trim(),
        content: content.trim(),
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      toast.error('Błąd dodawania szablonu');
      return false;
    }

    setTemplates((prev) => [
      ...prev,
      {
        id: data.id,
        instance_id: data.instance_id,
        template_type: data.template_type as TemplateType,
        name: data.name,
        content: data.content,
        sort_order: data.sort_order,
      },
    ]);
    toast.success('Szablon dodany');
    return true;
  };

  const updateTemplate = async (
    id: string,
    updates: { name?: string; content?: string },
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('offer_condition_templates')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Błąd aktualizacji szablonu');
      return false;
    }

    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
    toast.success('Szablon zaktualizowany');
    return true;
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('offer_condition_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Błąd usuwania szablonu');
      return false;
    }

    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success('Szablon usunięty');
    return true;
  };

  return {
    templates,
    loading,
    byType,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
}
