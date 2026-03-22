import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import {
  escapeHtml,
  sanitizeUrl,
  truncate,
  isValidUuid,
  formatDuration,
} from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-instance-slug',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

// --- Validation & Sanitization ---

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = {
  name: 200,
  email: 254,
  phone: 20,
  model: 200,
  notes: 2000,
  color: 100,
  timeframe: 50,
};

// --- Types ---

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  gdpr_accepted: boolean;
}

interface VehicleData {
  model_id?: string | null;
  custom_model_name?: string;
  car_size?: string;
  mileage?: string;
  paint_color?: string;
  paint_finish?: 'gloss' | 'matte' | null;
}

interface OfferDetails {
  template_ids: string[];
  extra_service_ids?: string[];
  budget_suggestion?: number | null;
  additional_notes?: string;
  planned_timeframe?: string | null;
  duration_selections?: Record<string, number | null>;
}

interface SubmitLeadRequest {
  customer_data: CustomerData;
  vehicle_data: VehicleData;
  offer_details: OfferDetails;
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get instance slug from header or referer
    let instanceSlug = req.headers.get('x-instance-slug');

    if (!instanceSlug) {
      const referer = req.headers.get('referer') || req.headers.get('origin');
      if (referer) {
        try {
          const url = new URL(referer);
          const hostname = url.hostname;
          if (hostname.endsWith('.carfect.pl')) {
            instanceSlug = hostname.split('.')[0];
          }
        } catch {
          /* invalid referer URL */
        }
      }
    }

    if (!instanceSlug || instanceSlug.length > 50) {
      return new Response(JSON.stringify({ error: 'Instance slug required' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // Parse request body
    const body: SubmitLeadRequest = await req.json();
    const { customer_data, vehicle_data, offer_details } = body;

    // --- Input validation ---

    if (!customer_data?.gdpr_accepted) {
      return new Response(JSON.stringify({ error: 'GDPR consent is required' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const name = truncate(customer_data?.name?.trim(), MAX_LEN.name);
    const email = truncate(customer_data?.email?.trim(), MAX_LEN.email);
    const phone = truncate(customer_data?.phone?.trim().replace(/[^\d+\s()-]/g, ''), MAX_LEN.phone);

    if (!name || !email || !phone) {
      return new Response(JSON.stringify({ error: 'Name, email, and phone are required' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    if (!EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    if (phone.replace(/\D/g, '').length < 9) {
      return new Response(JSON.stringify({ error: 'Phone must have at least 9 digits' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    if (
      !offer_details?.template_ids ||
      offer_details.template_ids.length === 0 ||
      offer_details.template_ids.length > 20
    ) {
      return new Response(
        JSON.stringify({ error: 'Between 1 and 20 templates must be selected' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // Validate all UUIDs
    if (!offer_details.template_ids.every(isValidUuid)) {
      return new Response(JSON.stringify({ error: 'Invalid template ID format' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    if (offer_details.extra_service_ids && !offer_details.extra_service_ids.every(isValidUuid)) {
      return new Response(JSON.stringify({ error: 'Invalid extra service ID format' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // Sanitize text fields
    const additionalNotes = truncate(offer_details.additional_notes, MAX_LEN.notes);
    const paintColor = truncate(vehicle_data?.paint_color, MAX_LEN.color);
    const customModelName = truncate(vehicle_data?.custom_model_name, MAX_LEN.model);
    const plannedTimeframe = truncate(offer_details.planned_timeframe, MAX_LEN.timeframe);
    const budgetSuggestion =
      typeof offer_details.budget_suggestion === 'number' &&
      isFinite(offer_details.budget_suggestion) &&
      offer_details.budget_suggestion > 0
        ? offer_details.budget_suggestion
        : null;

    // --- Fetch instance ---

    const { data: instance, error: instanceError } = await supabase
      .from('instances')
      .select(
        'id, name, email, phone, address, website, contact_person, social_instagram, offer_portfolio_url',
      )
      .eq('slug', instanceSlug)
      .eq('active', true)
      .maybeSingle();

    if (instanceError || !instance) {
      return new Response(JSON.stringify({ error: 'Instance not found' }), {
        status: 404,
        headers: jsonHeaders,
      });
    }

    // --- Rate limiting: max 5 leads per email per instance per hour ---
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentLeads } = await supabase
      .from('offers')
      .select('id', { count: 'exact', head: true })
      .eq('instance_id', instance.id)
      .eq('source', 'website')
      .gte('created_at', oneHourAgo)
      .contains('customer_data', { email });

    if (recentLeads !== null && recentLeads >= 5) {
      return new Response(
        JSON.stringify({ error: 'Too many submissions. Please try again later.' }),
        { status: 429, headers: jsonHeaders },
      );
    }

    // --- Validate templates belong to this instance ---
    const { data: templates, error: templatesError } = await supabase
      .from('offer_scopes')
      .select(
        'id, name, description, default_warranty, default_payment_terms, default_notes, default_service_info',
      )
      .in('id', offer_details.template_ids)
      .eq('instance_id', instance.id)
      .eq('active', true);

    if (templatesError) {
      console.error('Templates fetch error:', templatesError);
      return new Response(JSON.stringify({ error: 'Failed to validate templates' }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    if (!templates || templates.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid templates found' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // --- Validate extras belong to this instance ---
    let validatedExtras: string[] = [];
    if (offer_details.extra_service_ids && offer_details.extra_service_ids.length > 0) {
      const { data: validExtras } = await supabase
        .from('unified_services')
        .select('id')
        .in('id', offer_details.extra_service_ids)
        .eq('instance_id', instance.id);

      validatedExtras = validExtras?.map((e) => e.id) || [];
    }

    // --- Generate offer number ---
    const { data: offerNumber, error: offerNumberError } = await supabase.rpc(
      'generate_offer_number',
      { _instance_id: instance.id },
    );

    if (offerNumberError) {
      console.error('Offer number generation error:', offerNumberError);
      return new Response(JSON.stringify({ error: 'Failed to generate offer number' }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    // --- Create offer ---
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .insert({
        instance_id: instance.id,
        offer_number: offerNumber,
        status: 'draft',
        source: 'website',
        customer_data: { name, email, phone },
        vehicle_data: vehicle_data
          ? {
              brandModel: customModelName,
              mileage: vehicle_data.mileage || '',
              car_size: vehicle_data.car_size || '',
            }
          : null,
        budget_suggestion: budgetSuggestion,
        inquiry_notes: additionalNotes || null,
        paint_color: paintColor || null,
        paint_finish: vehicle_data?.paint_finish || null,
        planned_timeframe: plannedTimeframe || null,
        total_net: 0,
        total_gross: 0,
        has_unified_services: true,
        widget_selected_extras: validatedExtras,
        widget_duration_selections: offer_details.duration_selections || null,
      })
      .select('id, public_token')
      .single();

    if (offerError) {
      console.error('Offer creation error:', offerError);
      return new Response(JSON.stringify({ error: 'Failed to create offer' }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    // --- Create offer options ---
    if (templates.length > 0) {
      const optionsToInsert = templates.map((template, index) => ({
        offer_id: offer.id,
        name: template.name,
        description: template.description,
        scope_id: template.id,
        sort_order: index,
        is_selected: false,
        is_upsell: false,
        subtotal_net: 0,
      }));

      const { error: optionsError } = await supabase.from('offer_options').insert(optionsToInsert);

      if (optionsError) {
        console.error('Options creation error:', optionsError);
      }
    }

    // --- Create notification ---
    await supabase.from('notifications').insert({
      instance_id: instance.id,
      type: 'new_lead',
      title: `Nowe zapytanie z WWW: ${escapeHtml(name)}`,
      description: `${escapeHtml(customModelName || 'Pojazd')} - ${templates.length} pakiet(ów)`,
      entity_type: 'offer',
      entity_id: offer.id,
    });

    // --- Send confirmation email ---
    try {
      await sendLeadConfirmationEmail(
        { name, email, phone },
        vehicle_data
          ? { ...vehicle_data, custom_model_name: customModelName, paint_color: paintColor }
          : undefined,
        {
          ...offer_details,
          additional_notes: additionalNotes,
          budget_suggestion: budgetSuggestion,
        },
        instance,
        templates,
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        offer_id: offer.id,
        offer_number: offerNumber,
      }),
      { headers: jsonHeaders },
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});

// --- Helpers ---

function buildServicesHtml(
  templates: { id: string; name: string }[],
  durationSelections: Record<string, number | null> | undefined | null,
): string {
  return templates
    .map((t) => {
      const duration = durationSelections?.[t.id];
      if (duration === null) {
        return `<li>${escapeHtml(t.name)} – Nie wiem, proszę o propozycję</li>`;
      } else if (duration !== undefined) {
        return `<li>${escapeHtml(t.name)} (${formatDuration(duration)})</li>`;
      }
      return `<li>${escapeHtml(t.name)}</li>`;
    })
    .join('\n');
}

function buildPortfolioLinksHtml(instagram: string | null, portfolioUrl: string | null): string {
  const links: string[] = [];
  const safeInstagram = sanitizeUrl(instagram);
  const safePortfolio = sanitizeUrl(portfolioUrl);
  if (safeInstagram) {
    links.push(
      `<a href="${escapeHtml(safeInstagram)}" style="display: inline-block; margin: 0 8px; padding: 8px 16px; background-color: #E1306C; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">📸 Instagram</a>`,
    );
  }
  if (safePortfolio) {
    links.push(
      `<a href="${escapeHtml(safePortfolio)}" style="display: inline-block; margin: 0 8px; padding: 8px 16px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">🖼️ Nasze realizacje</a>`,
    );
  }
  return links.join('\n');
}

async function sendLeadConfirmationEmail(
  customerData: { name: string; email: string; phone: string },
  vehicleData: VehicleData | undefined,
  offerDetails: OfferDetails,
  instance: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    website: string | null;
    contact_person: string | null;
    social_instagram: string | null;
    offer_portfolio_url: string | null;
  },
  templates: { id: string; name: string }[],
): Promise<void> {
  const smtpHost = Deno.env.get('SMTP_HOST');
  const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
  const smtpUser = Deno.env.get('SMTP_USER');
  const smtpPass = Deno.env.get('SMTP_PASS');

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('SMTP not configured, skipping confirmation email');
    return;
  }

  // Build vehicle info (all escaped)
  const vehicleParts: string[] = [];
  if (vehicleData?.custom_model_name) vehicleParts.push(escapeHtml(vehicleData.custom_model_name));
  if (vehicleData?.paint_color) vehicleParts.push(escapeHtml(vehicleData.paint_color));
  if (vehicleData?.paint_finish)
    vehicleParts.push(vehicleData.paint_finish === 'matte' ? 'mat' : 'połysk');
  const vehicleInfo = vehicleParts.length > 0 ? vehicleParts.join(', ') : 'Nie podano';

  const servicesHtml = buildServicesHtml(templates, offerDetails.duration_selections);

  let extrasSection = '';
  if (offerDetails.extra_service_ids && offerDetails.extra_service_ids.length > 0) {
    extrasSection = `<div style="font-size:12px;color:#666;text-transform:uppercase;margin-bottom:4px;">Dodatki</div><div style="font-size:14px;margin-bottom:12px;">${offerDetails.extra_service_ids.length} dodatkowych usług</div>`;
  }

  let budgetSection = '';
  if (
    offerDetails.budget_suggestion &&
    typeof offerDetails.budget_suggestion === 'number' &&
    isFinite(offerDetails.budget_suggestion)
  ) {
    budgetSection = `<div style="font-size:12px;color:#666;text-transform:uppercase;margin-bottom:4px;">Budżet</div><div style="font-size:14px;margin-bottom:12px;">${offerDetails.budget_suggestion.toLocaleString('pl-PL')} zł</div>`;
  }

  let notesSection = '';
  if (offerDetails.additional_notes) {
    notesSection = `<div style="font-size:12px;color:#666;text-transform:uppercase;margin-bottom:4px;">Twoje uwagi</div><div style="font-size:14px;margin-bottom:12px;">${escapeHtml(offerDetails.additional_notes)}</div>`;
  }

  let portfolioSection = '';
  const portfolioLinksHtml = buildPortfolioLinksHtml(
    instance.social_instagram,
    instance.offer_portfolio_url,
  );
  if (portfolioLinksHtml) {
    portfolioSection = `<div style="background-color:#f0f4f8;border-radius:8px;padding:16px;margin:20px 0;text-align:center;"><p style="margin:0 0 8px 0;font-weight:500;">Zapraszamy do odwiedzenia naszego portfolio:</p><div style="margin-top:12px;">${portfolioLinksHtml}</div></div>`;
  }

  const safeWebsite = sanitizeUrl(instance.website);
  const phoneRow = instance.phone
    ? `<div style="margin-bottom:8px;">📞 ${escapeHtml(instance.phone)}</div>`
    : '';
  const addressRow = instance.address
    ? `<div style="margin-bottom:8px;">📍 ${escapeHtml(instance.address)}</div>`
    : '';
  const websiteRow = safeWebsite
    ? `<div style="margin-bottom:8px;">🌐 <a href="${escapeHtml(safeWebsite)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(safeWebsite)}</a></div>`
    : '';

  const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;"><div style="max-width:600px;margin:0 auto;padding:20px;"><p>Dzień dobry <strong>${escapeHtml(customerData.name)}</strong>,</p><p>dziękujemy za przesłanie zapytania! Poniżej znajdziesz podsumowanie Twojego zgłoszenia.</p><div style="background-color:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;"><div style="font-size:12px;color:#666;text-transform:uppercase;margin-bottom:4px;">Pojazd</div><div style="font-size:14px;margin-bottom:12px;">${vehicleInfo}</div><div style="font-size:12px;color:#666;text-transform:uppercase;margin-bottom:4px;">Wybrane usługi</div><ul style="margin:0 0 12px 0;padding-left:20px;">${servicesHtml}</ul>${extrasSection}${budgetSection}${notesSection}</div><p>Twoje zapytanie zostało przekazane do naszego zespołu. Skontaktujemy się z Tobą wkrótce z indywidualną wyceną.</p>${portfolioSection}<div style="margin-top:30px;padding-top:20px;border-top:1px solid #e5e5e5;font-size:13px;color:#666;"><p style="margin-bottom:15px;">Pozdrawiamy serdecznie,<br><strong>${escapeHtml(instance.name)}</strong>${instance.contact_person ? `<br>${escapeHtml(instance.contact_person)}` : ''}</p>${phoneRow}${addressRow}${websiteRow}</div><div style="margin-top:20px;padding-top:15px;border-top:1px solid #e5e5e5;font-size:10px;color:#999;text-align:center;">Email generowany automatycznie przy użyciu systemu CRM dla studiów detailingu i myjni carfect.pl</div></div></body></html>`;

  const client = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: smtpPort,
      tls: true,
      auth: {
        username: smtpUser,
        password: smtpPass,
      },
    },
  });

  try {
    await client.send({
      from: `${instance.name} <${smtpUser}>`,
      to: customerData.email,
      replyTo: instance.email || smtpUser,
      subject: `${instance.name} - Potwierdzenie zapytania`,
      html: emailHtml,
    });
    console.log('Confirmation email sent to:', customerData.email);
  } finally {
    await client.close();
  }
}
