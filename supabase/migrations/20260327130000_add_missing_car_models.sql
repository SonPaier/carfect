-- Add missing car models identified from user proposals
INSERT INTO public.car_models (brand, name, size) VALUES
  -- Smart
  ('Smart', 'ForTwo', 'S'),
  ('Smart', 'ForFour', 'S'),
  ('Smart', '#1', 'M'),
  ('Smart', '#3', 'M'),
  -- Cupra
  ('Cupra', 'Terramar', 'L'),
  -- Mazda
  ('Mazda', 'CX-80', 'L'),
  -- Citroen
  ('Citroen', 'Jumper', 'L'),
  -- Fiat
  ('Fiat', 'Grande Punto', 'S'),
  ('Fiat', 'Freemont', 'L'),
  -- Toyota
  ('Toyota', 'Celica', 'M'),
  -- Mini
  ('Mini', 'One', 'S'),
  -- Kia
  ('Kia', 'Optima', 'M'),
  -- Mercedes
  ('Mercedes', 'ML', 'L')
ON CONFLICT (brand, name) DO NOTHING;
