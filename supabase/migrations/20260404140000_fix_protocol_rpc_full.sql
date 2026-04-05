-- Replace get_protocol_by_token with full version including instance + offer data
-- Frontend needs: protocol, instance, damage_points, offer_public_token

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

  -- Fetch instance
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

  -- Fetch damage points
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

  -- Fetch linked offer public_token if exists
  IF proto.offer_number IS NOT NULL THEN
    SELECT o.public_token INTO offer_token
    FROM offers o
    WHERE o.instance_id = proto.instance_id
      AND o.offer_number = proto.offer_number
    LIMIT 1;
  END IF;

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
      'photo_urls', proto.photo_urls
    ),
    'instance', inst,
    'damage_points', points,
    'offer_public_token', offer_token
  );

  RETURN result;
END;
$$;
