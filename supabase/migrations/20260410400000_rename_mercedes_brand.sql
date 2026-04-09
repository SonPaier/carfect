-- Rename Mercedes-Benz to Mercedes, handling duplicates
-- First delete any "Mercedes Benz" (typo variant) rows
DELETE FROM car_models WHERE brand = 'Mercedes Benz';

-- For each Mercedes-Benz model, try to update brand to Mercedes
-- If a Mercedes + same name already exists, delete the Mercedes-Benz one
DELETE FROM car_models a
USING car_models b
WHERE a.brand = 'Mercedes-Benz'
  AND b.brand = 'Mercedes'
  AND a.name = b.name
  AND a.id != b.id;

UPDATE car_models SET brand = 'Mercedes' WHERE brand = 'Mercedes-Benz';
