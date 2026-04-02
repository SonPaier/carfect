-- Add VIN column to vehicle_protocols
ALTER TABLE vehicle_protocols ADD COLUMN IF NOT EXISTS vin text;
