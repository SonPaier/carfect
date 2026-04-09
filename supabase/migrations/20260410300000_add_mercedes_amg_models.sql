-- Add Mercedes-AMG model variants
INSERT INTO car_models (brand, name, size, active, status) VALUES
-- AMG Compact (M)
('Mercedes-Benz', 'A 35 AMG', 'M', true, 'active'),
('Mercedes-Benz', 'A 45 AMG', 'M', true, 'active'),
('Mercedes-Benz', 'A 45 S AMG', 'M', true, 'active'),
('Mercedes-Benz', 'CLA 35 AMG', 'M', true, 'active'),
('Mercedes-Benz', 'CLA 45 AMG', 'M', true, 'active'),
('Mercedes-Benz', 'CLA 45 S AMG', 'M', true, 'active'),
('Mercedes-Benz', 'GLA 35 AMG', 'M', true, 'active'),
('Mercedes-Benz', 'GLA 45 AMG', 'M', true, 'active'),
('Mercedes-Benz', 'GLA 45 S AMG', 'M', true, 'active'),

-- AMG Mid-size (L)
('Mercedes-Benz', 'C 43 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'C 63 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'C 63 S AMG', 'L', true, 'active'),
('Mercedes-Benz', 'C 63 S E Performance', 'L', true, 'active'),
('Mercedes-Benz', 'E 53 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'E 63 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'E 63 S AMG', 'L', true, 'active'),
('Mercedes-Benz', 'S 63 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'S 63 E Performance', 'L', true, 'active'),

-- AMG SUV (L)
('Mercedes-Benz', 'GLB 35 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'GLC 43 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'GLC 63 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'GLC 63 S AMG', 'L', true, 'active'),
('Mercedes-Benz', 'GLC 63 S E Performance', 'L', true, 'active'),
('Mercedes-Benz', 'GLE 53 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'GLE 63 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'GLE 63 S AMG', 'L', true, 'active'),
('Mercedes-Benz', 'GLS 63 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'G 63 AMG', 'L', true, 'active'),

-- AMG GT family (L)
('Mercedes-Benz', 'AMG GT S', 'L', true, 'active'),
('Mercedes-Benz', 'AMG GT R', 'L', true, 'active'),
('Mercedes-Benz', 'AMG GT R Pro', 'L', true, 'active'),
('Mercedes-Benz', 'AMG GT Black Series', 'L', true, 'active'),
('Mercedes-Benz', 'AMG GT 4-Door 43', 'L', true, 'active'),
('Mercedes-Benz', 'AMG GT 4-Door 53', 'L', true, 'active'),
('Mercedes-Benz', 'AMG GT 4-Door 63', 'L', true, 'active'),
('Mercedes-Benz', 'AMG GT 4-Door 63 S', 'L', true, 'active'),
('Mercedes-Benz', 'AMG GT 63 S E Performance', 'L', true, 'active'),

-- AMG SL (L)
('Mercedes-Benz', 'SL 43 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'SL 55 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'SL 63 AMG', 'L', true, 'active'),

-- AMG EQ (L)
('Mercedes-Benz', 'EQE 43 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'EQE 53 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'EQS 53 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'EQE SUV 43 AMG', 'L', true, 'active'),
('Mercedes-Benz', 'EQE SUV 53 AMG', 'L', true, 'active'),

-- AMG One (L)
('Mercedes-Benz', 'AMG ONE', 'L', true, 'active')
ON CONFLICT DO NOTHING;
