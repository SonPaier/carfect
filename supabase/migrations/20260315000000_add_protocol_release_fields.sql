-- Add release (vehicle pickup) fields to vehicle_protocols
ALTER TABLE vehicle_protocols
  ADD COLUMN IF NOT EXISTS release_signature text,
  ADD COLUMN IF NOT EXISTS release_notes text;
