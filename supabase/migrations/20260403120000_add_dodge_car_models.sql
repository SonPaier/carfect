-- Add missing Dodge models to car_models
INSERT INTO public.car_models (brand, name, size, active, status)
VALUES
  ('Dodge', 'Dodge Charger', 'L', true, 'active'),
  ('Dodge', 'Dodge Challenger', 'L', true, 'active'),
  ('Dodge', 'Dodge Durango', 'L', true, 'active')
ON CONFLICT DO NOTHING;
