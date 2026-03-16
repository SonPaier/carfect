import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getApaczkaCredentials, apaczkaFetch } from '../_shared/apaczka/client.ts';
import { mapPackagesToShipmentItems, formatPostalCode } from '../_shared/apaczka/mappers.ts';
import type { SenderAddress, OrderPackage, ApaczkaOrderRequest } from '../_shared/apaczka/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface CustomerAddress {
  postal_code: string;
  city: string;
  country_code?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { instanceId, packages, customerAddress } = (await req.json()) as {
      instanceId?: string;
      packages?: OrderPackage[];
      customerAddress?: CustomerAddress;
    };

    if (!instanceId) {
      return jsonResponse({ error: 'instanceId jest wymagany' }, 400);
    }
    if (!packages || packages.length === 0) {
      return jsonResponse({ error: 'Brak paczek do wyceny' }, 400);
    }
    if (!customerAddress?.postal_code || !customerAddress?.city) {
      return jsonResponse({ error: 'Adres odbiorcy (kod pocztowy i miasto) jest wymagany' }, 400);
    }

    // Fetch instance for credentials, sender address, service_id
    const { data: instance, error: instanceErr } = await supabase
      .from('instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (instanceErr || !instance) {
      console.error('Instance fetch error:', instanceErr);
      return jsonResponse({ error: 'Instancja nie znaleziona' }, 404);
    }

    // Get sender address
    const senderAddress = (instance.apaczka_sender_address as SenderAddress) || null;
    if (!senderAddress) {
      return jsonResponse({ error: 'Brak konfiguracji adresu nadawcy na instancji' }, 422);
    }

    // Get service ID
    const serviceId = (instance.apaczka_service_id as number) || null;
    if (!serviceId) {
      return jsonResponse(
        { error: 'Brak konfiguracji serwisu kurierskiego (apaczka_service_id) na instancji' },
        422,
      );
    }

    // Get credentials
    const credentials = getApaczkaCredentials(instance as Record<string, unknown>);

    // Build shipment items from packages
    const shipmentItems = mapPackagesToShipmentItems(packages);
    if (shipmentItems.length === 0) {
      return jsonResponse({ error: "Brak paczek z metodą wysyłki 'shipping'" }, 400);
    }

    // Build minimal order for valuation
    const minimalOrder: ApaczkaOrderRequest = {
      service_id: serviceId,
      address: {
        sender: {
          country_code: senderAddress.country_code || 'PL',
          name: senderAddress.name,
          line1: senderAddress.street,
          line2: '',
          postal_code: formatPostalCode(senderAddress.postal_code),
          state_code: '',
          city: senderAddress.city,
          is_residential: 0,
          contact_person: senderAddress.contact_person || senderAddress.name,
          email: senderAddress.email || '',
          phone: senderAddress.phone || '',
          foreign_address_id: '',
        },
        receiver: {
          country_code: customerAddress.country_code || 'PL',
          name: 'Wycena',
          line1: 'ul. Wycena 1',
          line2: '',
          postal_code: formatPostalCode(customerAddress.postal_code),
          state_code: '',
          city: customerAddress.city,
          is_residential: 1,
          contact_person: 'Wycena',
          email: '',
          phone: '',
          foreign_address_id: '',
        },
      },
      option: {},
      notification: {
        new: { isReceiverEmail: 0, isReceiverSms: 0, isSenderEmail: 0 },
        sent: { isReceiverEmail: 0, isReceiverSms: 0, isSenderEmail: 0, isSenderSms: 0 },
        exception: { isReceiverEmail: 0, isReceiverSms: 0, isSenderEmail: 0, isSenderSms: 0 },
        delivered: { isReceiverEmail: 0, isReceiverSms: 0, isSenderEmail: 0, isSenderSms: 0 },
      },
      shipment_value: 0,
      shipment_currency: 'PLN',
      pickup: {
        type: 'SELF',
        date: new Date().toISOString().split('T')[0],
        hours_from: '',
        hours_to: '',
      },
      shipment: shipmentItems,
      comment: '',
      content: 'Produkty',
      is_zebra: 0,
    };

    // Call order_valuation
    const valuation = await apaczkaFetch<Record<string, unknown>>(credentials, 'order_valuation', {
      order: minimalOrder,
    });

    return jsonResponse(
      {
        success: true,
        valuation: valuation.response,
      },
      200,
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in apaczka-valuation:', err.message);

    const apaczkaResponse = (err as any).apaczkaResponse;
    if (apaczkaResponse) {
      return jsonResponse(
        {
          error: 'Nie udalo sie pobrac wyceny przesylki',
          apaczka_errors: apaczkaResponse.errors || null,
          details: apaczkaResponse.message || err.message,
        },
        502,
      );
    }

    return jsonResponse({ error: err.message }, 500);
  }
});
