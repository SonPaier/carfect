-- ============================================================================
-- Single RPC endpoint for public offer view
-- Replaces 3+ separate table queries with one roundtrip
-- Returns only fields needed for the public customer view
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_offer(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  offer_row record;
  instance_data jsonb;
  options_data jsonb;
  product_descriptions jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 4 THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  -- Fetch the offer
  SELECT * INTO offer_row
  FROM offers
  WHERE public_token = p_token;

  IF offer_row IS NULL THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  -- Fetch instance branding data (only public-safe fields)
  SELECT jsonb_build_object(
    'id', i.id,
    'name', i.name,
    'logo_url', i.logo_url,
    'phone', i.phone,
    'email', i.email,
    'address', i.address,
    'website', i.website,
    'social_facebook', i.social_facebook,
    'social_instagram', i.social_instagram,
    'offer_branding_enabled', i.offer_branding_enabled,
    'offer_bg_color', i.offer_bg_color,
    'offer_header_bg_color', i.offer_header_bg_color,
    'offer_header_text_color', i.offer_header_text_color,
    'offer_section_bg_color', i.offer_section_bg_color,
    'offer_section_text_color', i.offer_section_text_color,
    'offer_primary_color', i.offer_primary_color,
    'offer_scope_header_text_color', i.offer_scope_header_text_color,
    'offer_portfolio_url', i.offer_portfolio_url,
    'offer_google_reviews_url', i.offer_google_reviews_url,
    'contact_person', i.contact_person,
    'offer_bank_company_name', i.offer_bank_company_name,
    'offer_bank_account_number', i.offer_bank_account_number,
    'offer_bank_name', i.offer_bank_name,
    'offer_trust_header_title', i.offer_trust_header_title,
    'offer_trust_description', i.offer_trust_description,
    'offer_trust_tiles', i.offer_trust_tiles
  ) INTO instance_data
  FROM instances i
  WHERE i.id = offer_row.instance_id;

  -- Fetch options with items and scope data
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', oo.id,
      'name', oo.name,
      'description', oo.description,
      'is_selected', oo.is_selected,
      'subtotal_net', oo.subtotal_net,
      'sort_order', oo.sort_order,
      'scope_id', oo.scope_id,
      'is_upsell', oo.is_upsell,
      'scope', (
        SELECT jsonb_build_object(
          'id', os.id,
          'name', os.name,
          'description', os.description,
          'is_extras_scope', os.is_extras_scope,
          'photo_urls', os.photo_urls
        )
        FROM offer_scopes os
        WHERE os.id = oo.scope_id
      ),
      'offer_option_items', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', ooi.id,
            'custom_name', ooi.custom_name,
            'custom_description', ooi.custom_description,
            'quantity', ooi.quantity,
            'unit_price', ooi.unit_price,
            'unit', ooi.unit,
            'discount_percent', ooi.discount_percent,
            'is_optional', ooi.is_optional,
            'is_custom', ooi.is_custom,
            'product_id', ooi.product_id,
            'sort_order', ooi.sort_order
          ) ORDER BY ooi.sort_order
        )
        FROM offer_option_items ooi
        WHERE ooi.option_id = oo.id
      ), '[]'::jsonb)
    ) ORDER BY oo.sort_order
  ), '[]'::jsonb) INTO options_data
  FROM offer_options oo
  WHERE oo.offer_id = offer_row.id;

  -- Fetch unified_services descriptions for product enrichment
  SELECT COALESCE(jsonb_object_agg(
    us.id::text,
    jsonb_build_object(
      'description', us.description,
      'photo_urls', us.photo_urls
    )
  ), '{}'::jsonb) INTO product_descriptions
  FROM unified_services us
  WHERE us.id IN (
    SELECT (ooi.product_id)::uuid
    FROM offer_option_items ooi
    JOIN offer_options oo ON oo.id = ooi.option_id
    WHERE oo.offer_id = offer_row.id
    AND ooi.product_id IS NOT NULL
  );

  -- Build final result
  result := jsonb_build_object(
    'id', offer_row.id,
    'instance_id', offer_row.instance_id,
    'offer_number', offer_row.offer_number,
    'public_token', offer_row.public_token,
    'status', offer_row.status,
    'customer_data', offer_row.customer_data,
    'vehicle_data', offer_row.vehicle_data,
    'total_net', offer_row.total_net,
    'total_gross', offer_row.total_gross,
    'vat_rate', offer_row.vat_rate,
    'notes', offer_row.notes,
    'payment_terms', offer_row.payment_terms,
    'warranty', offer_row.warranty,
    'service_info', offer_row.service_info,
    'valid_until', offer_row.valid_until,
    'hide_unit_prices', offer_row.hide_unit_prices,
    'created_at', offer_row.created_at,
    'approved_at', offer_row.approved_at,
    'viewed_at', offer_row.viewed_at,
    'selected_state', offer_row.selected_state,
    'has_unified_services', offer_row.has_unified_services,
    'offer_format', offer_row.offer_format,
    'offer_options', options_data,
    'instances', instance_data,
    'product_descriptions', product_descriptions
  );

  -- Mark as viewed (fire and forget equivalent)
  PERFORM mark_offer_viewed(p_token);

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_offer(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_offer(text) TO authenticated;
