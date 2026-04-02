-- Add service_items JSONB column to vehicle_protocols for receipt-like display
-- Structure: [{name: string, quantity: number, unit_price: number}]
ALTER TABLE vehicle_protocols ADD COLUMN IF NOT EXISTS service_items jsonb DEFAULT '[]'::jsonb;
