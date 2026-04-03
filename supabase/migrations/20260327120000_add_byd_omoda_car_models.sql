-- Add BYD and Omoda car models
INSERT INTO public.car_models (brand, name, size) VALUES
  -- BYD
  ('BYD', 'Seagull', 'S'),
  ('BYD', 'Dolphin', 'S'),
  ('BYD', 'Atto 2', 'S'),
  ('BYD', 'Atto 3', 'M'),
  ('BYD', 'Seal', 'M'),
  ('BYD', 'Seal U', 'M'),
  ('BYD', 'Sealion 6', 'M'),
  ('BYD', 'Sealion 7', 'L'),
  ('BYD', 'Song', 'M'),
  ('BYD', 'Song Plus', 'M'),
  ('BYD', 'Qin', 'M'),
  ('BYD', 'Qin Plus', 'M'),
  ('BYD', 'Han', 'L'),
  ('BYD', 'Tang', 'L'),
  ('BYD', 'Denza D9', 'L'),
  -- Omoda
  ('Omoda', 'Omoda 5', 'M'),
  ('Omoda', 'Omoda E5', 'M'),
  ('Omoda', 'Omoda 3', 'S'),
  ('Omoda', 'Omoda 7', 'L')
ON CONFLICT (brand, name) DO NOTHING;
