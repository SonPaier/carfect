-- Add Porsche model variants (911, Cayenne, Macan, Taycan, Panamera)
-- Sizes: S=small, M=medium, L=large
INSERT INTO car_models (brand, name, size, active, status) VALUES
-- 911 variants (all M — sports car)
('Porsche', '911 Carrera', 'M', true, 'active'),
('Porsche', '911 Carrera S', 'M', true, 'active'),
('Porsche', '911 Carrera T', 'M', true, 'active'),
('Porsche', '911 Carrera 4S', 'M', true, 'active'),
('Porsche', '911 Carrera GTS', 'M', true, 'active'),
('Porsche', '911 Targa 4', 'M', true, 'active'),
('Porsche', '911 Targa 4S', 'M', true, 'active'),
('Porsche', '911 Targa 4 GTS', 'M', true, 'active'),
('Porsche', '911 Turbo', 'M', true, 'active'),
('Porsche', '911 Turbo S', 'M', true, 'active'),
('Porsche', '911 GT3', 'M', true, 'active'),
('Porsche', '911 GT3 RS', 'M', true, 'active'),
('Porsche', '911 GT3 Touring', 'M', true, 'active'),
('Porsche', '911 Dakar', 'M', true, 'active'),
('Porsche', '911 S/T', 'M', true, 'active'),
('Porsche', '911 Sport Classic', 'M', true, 'active'),

-- Cayenne variants (all L — full-size SUV)
('Porsche', 'Cayenne S', 'L', true, 'active'),
('Porsche', 'Cayenne GTS', 'L', true, 'active'),
('Porsche', 'Cayenne Turbo', 'L', true, 'active'),
('Porsche', 'Cayenne Turbo GT', 'L', true, 'active'),
('Porsche', 'Cayenne E-Hybrid', 'L', true, 'active'),
('Porsche', 'Cayenne S E-Hybrid', 'L', true, 'active'),
('Porsche', 'Cayenne Coupe', 'L', true, 'active'),
('Porsche', 'Cayenne Coupe S', 'L', true, 'active'),
('Porsche', 'Cayenne Coupe GTS', 'L', true, 'active'),
('Porsche', 'Cayenne Coupe Turbo', 'L', true, 'active'),
('Porsche', 'Cayenne Coupe Turbo GT', 'L', true, 'active'),

-- Macan variants (M — compact SUV)
('Porsche', 'Macan S', 'M', true, 'active'),
('Porsche', 'Macan T', 'M', true, 'active'),
('Porsche', 'Macan GTS', 'M', true, 'active'),
('Porsche', 'Macan Turbo', 'M', true, 'active'),
('Porsche', 'Macan Electric', 'M', true, 'active'),
('Porsche', 'Macan 4 Electric', 'M', true, 'active'),
('Porsche', 'Macan Turbo Electric', 'M', true, 'active'),

-- Taycan variants (L — sedan/wagon EV)
('Porsche', 'Taycan 4S', 'L', true, 'active'),
('Porsche', 'Taycan GTS', 'L', true, 'active'),
('Porsche', 'Taycan Turbo', 'L', true, 'active'),
('Porsche', 'Taycan Turbo S', 'L', true, 'active'),
('Porsche', 'Taycan Sport Turismo', 'L', true, 'active'),
('Porsche', 'Taycan 4S Sport Turismo', 'L', true, 'active'),
('Porsche', 'Taycan GTS Sport Turismo', 'L', true, 'active'),
('Porsche', 'Taycan Turbo Sport Turismo', 'L', true, 'active'),
('Porsche', 'Taycan Cross Turismo', 'L', true, 'active'),
('Porsche', 'Taycan 4S Cross Turismo', 'L', true, 'active'),
('Porsche', 'Taycan Turbo Cross Turismo', 'L', true, 'active'),

-- Panamera variants (L — luxury sedan/wagon)
('Porsche', 'Panamera 4', 'L', true, 'active'),
('Porsche', 'Panamera 4S', 'L', true, 'active'),
('Porsche', 'Panamera GTS', 'L', true, 'active'),
('Porsche', 'Panamera Turbo', 'L', true, 'active'),
('Porsche', 'Panamera Turbo S', 'L', true, 'active'),
('Porsche', 'Panamera 4 E-Hybrid', 'L', true, 'active'),
('Porsche', 'Panamera Turbo S E-Hybrid', 'L', true, 'active'),
('Porsche', 'Panamera Sport Turismo', 'L', true, 'active'),

-- 718 variants (M — mid-engine sports)
('Porsche', '718 Cayman S', 'M', true, 'active'),
('Porsche', '718 Cayman GTS', 'M', true, 'active'),
('Porsche', '718 Cayman GT4', 'M', true, 'active'),
('Porsche', '718 Cayman GT4 RS', 'M', true, 'active'),
('Porsche', '718 Boxster S', 'M', true, 'active'),
('Porsche', '718 Boxster GTS', 'M', true, 'active'),
('Porsche', '718 Boxster Spyder', 'M', true, 'active'),
('Porsche', '718 Boxster Spyder RS', 'M', true, 'active')
ON CONFLICT DO NOTHING;
