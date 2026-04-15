-- Carspa: keep only station #1 (lowest sort_order), move all reservations there

DO $$
DECLARE
  v_instance_id uuid;
  v_keep_station_id uuid;
BEGIN
  SELECT id INTO v_instance_id FROM instances WHERE slug = 'carspa';
  IF v_instance_id IS NULL THEN
    RAISE NOTICE 'Instance carspa not found, skipping';
    RETURN;
  END IF;

  -- Find station #1 (lowest sort_order)
  SELECT id INTO v_keep_station_id
  FROM stations
  WHERE instance_id = v_instance_id AND active = true
  ORDER BY sort_order ASC, created_at ASC
  LIMIT 1;

  IF v_keep_station_id IS NULL THEN
    RAISE NOTICE 'No active station found for carspa, skipping';
    RETURN;
  END IF;

  -- Move all reservations to station #1
  UPDATE reservations
  SET station_id = v_keep_station_id
  WHERE instance_id = v_instance_id
    AND station_id != v_keep_station_id;

  -- Move all breaks to station #1
  UPDATE breaks
  SET station_id = v_keep_station_id
  WHERE station_id IN (
    SELECT id FROM stations
    WHERE instance_id = v_instance_id AND id != v_keep_station_id
  );

  -- Move all trainings to station #1
  UPDATE trainings
  SET station_id = v_keep_station_id
  WHERE station_id IN (
    SELECT id FROM stations
    WHERE instance_id = v_instance_id AND id != v_keep_station_id
  );

  -- Deactivate other stations
  UPDATE stations
  SET active = false
  WHERE instance_id = v_instance_id
    AND id != v_keep_station_id;
END $$;
