import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UseAdminNotesOptions {
  reservationId: string | null;
  initialAdminNotes: string;
  initialCustomerNotes: string;
}

export function useAdminNotes({
  reservationId,
  initialAdminNotes,
  initialCustomerNotes,
}: UseAdminNotesOptions) {
  const { t } = useTranslation();
  const [adminNotes, setAdminNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync from reservation prop
  useEffect(() => {
    setAdminNotes(initialAdminNotes);
    setCustomerNotes(initialCustomerNotes);
    setEditingNotes(false);
  }, [initialAdminNotes, initialCustomerNotes]);

  const handleSaveAdminNotes = useCallback(async () => {
    if (!reservationId) return;
    setSavingNotes(true);

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ admin_notes: adminNotes || null })
        .eq('id', reservationId);

      if (error) throw error;
      setEditingNotes(false);
      toast.success(t('common.saved'));
    } catch (error: unknown) {
      console.error('Error saving notes:', error);
      toast.error(t('common.error'));
    } finally {
      setSavingNotes(false);
    }
  }, [reservationId, adminNotes, t]);

  const handleNotesBlur = useCallback(() => {
    setTimeout(() => {
      if (editingNotes) {
        const original = initialAdminNotes || '';
        const current = adminNotes || '';
        if (current !== original) {
          handleSaveAdminNotes();
        } else {
          setEditingNotes(false);
        }
      }
    }, 100);
  }, [editingNotes, adminNotes, initialAdminNotes, handleSaveAdminNotes]);

  const startEditingNotes = useCallback(() => {
    setEditingNotes(true);
    setTimeout(() => {
      notesTextareaRef.current?.focus();
    }, 50);
  }, []);

  return {
    adminNotes,
    setAdminNotes,
    customerNotes,
    editingNotes,
    savingNotes,
    notesTextareaRef,
    startEditingNotes,
    handleNotesBlur,
    handleSaveAdminNotes,
  };
}
