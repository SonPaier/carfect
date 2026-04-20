-- Fix create_reservation_reminders to use service_reminder_templates (M2M)
-- instead of dropped unified_services.reminder_template_id column

CREATE OR REPLACE FUNCTION public.create_reservation_reminders(p_reservation_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reservation RECORD;
  v_service_id UUID;
  v_template RECORD;
  v_item RECORD;
  v_count INTEGER := 0;
  v_completed_date DATE;
BEGIN
  SELECT * INTO v_reservation FROM reservations WHERE id = p_reservation_id;
  IF v_reservation IS NULL THEN RETURN 0; END IF;
  v_completed_date := COALESCE(v_reservation.completed_at::date, CURRENT_DATE);

  FOR v_service_id IN
    SELECT jsonb_array_elements_text(COALESCE(v_reservation.service_ids, '[]'::jsonb))::UUID
  LOOP
    -- Use M2M junction table instead of dropped reminder_template_id column
    FOR v_template IN
      SELECT rt.id AS template_id, rt.items AS template_items
      FROM service_reminder_templates srt
      JOIN reminder_templates rt ON rt.id = srt.reminder_template_id
      WHERE srt.service_id = v_service_id
    LOOP
      IF v_template.template_items IS NOT NULL THEN
        FOR v_item IN
          SELECT * FROM jsonb_to_recordset(v_template.template_items) AS x(months INTEGER, service_type TEXT)
        LOOP
          INSERT INTO customer_reminders (
            instance_id, reminder_template_id, reservation_id,
            customer_name, customer_phone, vehicle_plate,
            scheduled_date, months_after, service_type
          )
          VALUES (
            v_reservation.instance_id, v_template.template_id, p_reservation_id,
            COALESCE(v_reservation.customer_name, 'Klient'), v_reservation.customer_phone,
            COALESCE(v_reservation.vehicle_plate, ''),
            (v_completed_date + (v_item.months * INTERVAL '1 month'))::date,
            v_item.months, COALESCE(v_item.service_type, 'serwis')
          )
          ON CONFLICT (instance_id, customer_phone, vehicle_plate, reminder_template_id, months_after)
          DO NOTHING;
          v_count := v_count + 1;
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$function$;
