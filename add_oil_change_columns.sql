-- Migration: Add oil change columns to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS current_km BIGINT,
ADD COLUMN IF NOT EXISTS oil_last_change BIGINT,
ADD COLUMN IF NOT EXISTS oil_next_change BIGINT,
ADD COLUMN IF NOT EXISTS oil_calculation_base INTEGER DEFAULT 5000;

-- Comment to describe columns
COMMENT ON COLUMN vehicles.current_km IS 'Latest odometer reading from abastecimentos';
COMMENT ON COLUMN vehicles.oil_last_change IS 'Odometer at the time of the last oil change';
COMMENT ON COLUMN vehicles.oil_next_change IS 'Odometer target for the next oil change';
COMMENT ON COLUMN vehicles.oil_calculation_base IS 'Base mileage for oil change intervals (e.g., 5000, 7000, 10000)';
