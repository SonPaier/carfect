-- Add luxury/supercar brands
INSERT INTO public.car_models (brand, name, size) VALUES
  -- Lamborghini
  ('Lamborghini', 'Revuelto', 'M'),
  ('Lamborghini', 'Huracan', 'M'),
  ('Lamborghini', 'Huracan Tecnica', 'M'),
  ('Lamborghini', 'Huracan STO', 'M'),
  ('Lamborghini', 'Huracan Sterrato', 'M'),
  ('Lamborghini', 'Urus', 'L'),
  ('Lamborghini', 'Urus S', 'L'),
  ('Lamborghini', 'Urus Performante', 'L'),
  -- Bentley
  ('Bentley', 'Bentayga', 'L'),
  ('Bentley', 'Continental GT', 'L'),
  ('Bentley', 'Flying Spur', 'L'),
  -- Ferrari
  ('Ferrari', '296 GTB', 'M'),
  ('Ferrari', '296 GTS', 'M'),
  ('Ferrari', 'Roma', 'M'),
  ('Ferrari', 'SF90 Stradale', 'M'),
  ('Ferrari', 'SF90 Spider', 'M'),
  ('Ferrari', 'Purosangue', 'L'),
  ('Ferrari', '812 Superfast', 'M'),
  ('Ferrari', '812 GTS', 'M'),
  -- Rolls-Royce
  ('Rolls-Royce', 'Cullinan', 'L'),
  ('Rolls-Royce', 'Ghost', 'L'),
  ('Rolls-Royce', 'Phantom', 'L'),
  ('Rolls-Royce', 'Spectre', 'L'),
  -- McLaren
  ('McLaren', 'Artura', 'M'),
  ('McLaren', 'GT', 'M'),
  ('McLaren', '720S', 'M'),
  ('McLaren', '750S', 'M')
ON CONFLICT (brand, name) DO NOTHING;
