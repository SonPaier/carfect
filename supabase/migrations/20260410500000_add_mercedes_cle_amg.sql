INSERT INTO car_models (brand, name, size, active, status) VALUES
('Mercedes', 'CLE', 'L', true, 'active'),
('Mercedes', 'CLE 53 AMG', 'L', true, 'active'),
('Mercedes', 'CLE Coupe', 'L', true, 'active'),
('Mercedes', 'CLE 53 AMG Coupe', 'L', true, 'active')
ON CONFLICT DO NOTHING;
