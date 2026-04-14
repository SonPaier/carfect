-- Add show_reservation_status setting to instances (default true)
ALTER TABLE instances
  ADD COLUMN IF NOT EXISTS show_reservation_status BOOLEAN NOT NULL DEFAULT true;
