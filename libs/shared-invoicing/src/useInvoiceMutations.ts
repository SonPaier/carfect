import { useState } from 'react';
import { toast } from 'sonner';

interface UseInvoiceMutationsOpts {
  supabaseClient: any;
  instanceId: string;
  /** Called after any successful mutation. Use to invalidate React Query keys. */
  onSuccess?: () => void;
}

export function useInvoiceMutations({
  supabaseClient,
  instanceId,
  onSuccess,
}: UseInvoiceMutationsOpts) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  /** Tries to extract the human-readable message from a Fakturownia JSON error string. */
  const extractFakturowniaMessage = (raw: string): string => {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.message === 'string') return parsed.message;
      if (parsed?.message && typeof parsed.message === 'object') {
        // Validation errors arrive as { field: ["error1", "error2"] }
        const entries = Object.entries(parsed.message as Record<string, unknown>);
        return entries
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
          .join('; ');
      }
      return raw;
    } catch {
      return raw;
    }
  };

  const invoke = async (action: string, params: Record<string, unknown>) => {
    setPendingAction(action);
    try {
      const { data, error } = await supabaseClient.functions.invoke('invoicing-api', {
        body: { action, instanceId, ...params },
      });
      if (error) throw error;
      if (data?.error) {
        const friendly = extractFakturowniaMessage(data.error);
        if (data.code === 'unauthorized') throw new Error('Brak uprawnień (wymagana rola admin)');
        if (data.code === 'fakturownia_locked') throw new Error(friendly);
        if (data.code === 'fakturownia_not_found')
          throw new Error('Faktura nie istnieje już w Fakturowni');
        throw new Error(friendly);
      }
      return data;
    } finally {
      setPendingAction(null);
    }
  };

  const sendByEmail = async (invoiceId: string) => {
    try {
      await invoke('send_invoice', { invoiceId });
      toast.success('Faktura wysłana mailem');
      onSuccess?.();
    } catch (e) {
      toast.error((e as Error).message || 'Błąd wysyłania faktury');
    }
  };

  const cancelInvoice = async (invoiceId: string, cancelReason?: string) => {
    try {
      await invoke('cancel_invoice', { invoiceId, cancelReason });
      toast.success('Faktura anulowana');
      onSuccess?.();
    } catch (e) {
      toast.error((e as Error).message || 'Błąd anulowania faktury');
    }
  };

  const downloadPdf = async (invoiceId: string, fileName: string) => {
    setPendingAction('get_pdf');
    try {
      // edge function returns the PDF as binary, not JSON; use raw fetch via supabase
      const session = (await supabaseClient.auth.getSession()).data.session;
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('Brak sesji użytkownika');
      const projectId = (supabaseClient.supabaseUrl as string)
        .replace('https://', '')
        .split('.')[0];
      const url = `https://${projectId}.supabase.co/functions/v1/invoicing-api`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get_pdf', instanceId, invoiceId }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`PDF download failed: ${errText}`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.pdf_url) {
          window.open(data.pdf_url, '_blank');
          return;
        }
        throw new Error(data.error || 'Brak PDF do pobrania');
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      toast.error((e as Error).message || 'Błąd pobierania PDF');
    } finally {
      setPendingAction(null);
    }
  };

  return { sendByEmail, cancelInvoice, downloadPdf, pendingAction };
}
