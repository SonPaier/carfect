import { useState, useEffect } from 'react';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Button } from '@shared/ui';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { IfirmaConfig } from './invoicing.types';

interface IfirmaConfigFormProps {
  config: IfirmaConfig | null;
  onChange: (config: IfirmaConfig) => void;
  instanceId: string;
  supabaseClient: any; // SupabaseClient
}

export function IfirmaConfigForm({
  config,
  onChange,
  instanceId,
  supabaseClient,
}: IfirmaConfigFormProps) {
  const [user, setUser] = useState(config?.invoice_api_user || '');
  const [apiKey, setApiKey] = useState(config?.invoice_api_key || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    setUser(config?.invoice_api_user || '');
    setApiKey(config?.invoice_api_key || '');
  }, [config]);

  const handleChange = (field: keyof IfirmaConfig, value: string) => {
    if (field === 'invoice_api_user') setUser(value);
    if (field === 'invoice_api_key') setApiKey(value);
    onChange({
      invoice_api_user: field === 'invoice_api_user' ? value : user,
      invoice_api_key: field === 'invoice_api_key' ? value : apiKey,
    });
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!user || !apiKey) return;
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabaseClient.functions.invoke('invoicing-api', {
        body: {
          action: 'test_connection',
          instanceId,
          provider: 'ifirma',
          config: { invoice_api_user: user, invoice_api_key: apiKey },
        },
      });
      setTestResult(error || data?.error ? 'error' : 'success');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Email uzytkownika API</Label>
        <Input
          type="email"
          value={user}
          onChange={(e) => handleChange('invoice_api_user', e.target.value)}
          placeholder="email@firma.pl"
          className="bg-white"
        />
      </div>

      <div className="space-y-2">
        <Label>Klucz API faktur</Label>
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => handleChange('invoice_api_key', e.target.value)}
          placeholder="Wklej klucz API iFirma"
          className="bg-white"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTestConnection}
          disabled={!user || !apiKey || testing}
        >
          {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Testuj polaczenie
        </Button>
        {testResult === 'success' && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" /> Polaczono
          </span>
        )}
        {testResult === 'error' && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <XCircle className="w-4 h-4" /> Blad polaczenia
          </span>
        )}
      </div>
    </div>
  );
}
