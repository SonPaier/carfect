-- Set size L for kombi/wagon car models
UPDATE car_models SET size = 'L', updated_at = now()
WHERE name IN (
  'Golf Variant',
  'Golf Sportsvan'
) AND brand = 'Volkswagen';

UPDATE car_models SET size = 'L', updated_at = now()
WHERE name = 'Logan MCV' AND brand = 'Dacia';

UPDATE car_models SET size = 'L', updated_at = now()
WHERE name IN ('V40', 'V50') AND brand = 'Volvo';

UPDATE car_models SET size = 'L', updated_at = now()
WHERE name = 'Swace' AND brand = 'Suzuki';

UPDATE car_models SET size = 'L', updated_at = now()
WHERE name = 'ProCeed' AND brand = 'Kia';
