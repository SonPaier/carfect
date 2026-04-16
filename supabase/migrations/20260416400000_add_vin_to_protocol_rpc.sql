-- Add VIN field to get_protocol_by_token RPC response
-- (was missing from original RPC and the Phase 4 extension)

CREATE OR REPLACE FUNCTION public.get_protocol_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  proto record;
  inst jsonb;
  points jsonb;
  offer_token text;
  proto_config jsonb;
  custom_defs jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 4 THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  SELECT * INTO proto
  FROM vehicle_protocols
  WHERE public_token = p_token;

  IF proto IS NULL THEN
    RAISE EXCEPTION 'Protocol not found';
  END IF;

  SELECT jsonb_build_object(
    'id', i.id,
    'name', i.name,
    'logo_url', i.logo_url,
    'phone', i.phone,
    'email', i.email,
    'address', i.address
  ) INTO inst
  FROM instances i
  WHERE i.id = proto.instance_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', dp.id,
      'view', dp.view,
      'x_percent', dp.x_percent,
      'y_percent', dp.y_percent,
      'damage_type', dp.damage_type,
      'custom_note', dp.custom_note,
      'photo_url', dp.photo_url,
      'photo_urls', dp.photo_urls
    )
  ), '[]'::jsonb) INTO points
  FROM protocol_damage_points dp
  WHERE dp.protocol_id = proto.id;

  IF proto.offer_number IS NOT NULL THEN
    SELECT o.public_token INTO offer_token
    FROM offers o
    WHERE o.instance_id = proto.instance_id
      AND o.offer_number = proto.offer_number
    LIMIT 1;
  END IF;

  SELECT ps.config INTO proto_config
  FROM protocol_settings ps
  WHERE ps.instance_id = proto.instance_id
    AND ps.protocol_type = COALESCE(proto.protocol_type, 'reception');

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', cfd.id,
      'instance_id', cfd.instance_id,
      'context', cfd.context,
      'field_type', cfd.field_type,
      'label', cfd.label,
      'required', cfd.required,
      'sort_order', cfd.sort_order,
      'config', cfd.config
    ) ORDER BY cfd.sort_order
  ), '[]'::jsonb) INTO custom_defs
  FROM custom_field_definitions cfd
  WHERE cfd.instance_id = proto.instance_id
    AND cfd.context = 'protocol_' || COALESCE(proto.protocol_type, 'reception');

  result := jsonb_build_object(
    'protocol', jsonb_build_object(
      'id', proto.id,
      'public_token', proto.public_token,
      'offer_number', proto.offer_number,
      'customer_name', proto.customer_name,
      'customer_email', proto.customer_email,
      'vehicle_model', proto.vehicle_model,
      'nip', proto.nip,
      'phone', proto.phone,
      'registration_number', proto.registration_number,
      'vin', proto.vin,
      'fuel_level', proto.fuel_level,
      'odometer_reading', proto.odometer_reading,
      'body_type', proto.body_type,
      'protocol_date', proto.protocol_date,
      'protocol_time', proto.protocol_time,
      'received_by', proto.received_by,
      'status', proto.status,
      'customer_signature', proto.customer_signature,
      'instance_id', proto.instance_id,
      'protocol_type', proto.protocol_type,
      'photo_urls', proto.photo_urls,
      'custom_field_values', COALESCE(proto.custom_field_values, '{}'::jsonb)
    ),
    'instance', inst,
    'damage_points', points,
    'offer_public_token', offer_token,
    'protocol_config', proto_config,
    'custom_field_definitions', custom_defs
  );

  RETURN result;
END;
$$;
