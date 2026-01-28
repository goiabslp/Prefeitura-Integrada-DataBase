-- Migration: Add timing belt columns to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS timing_belt_last_change BIGINT,
ADD COLUMN IF NOT EXISTS timing_belt_next_change BIGINT,
ADD COLUMN IF NOT EXISTS timing_belt_calculation_base INTEGER DEFAULT 50000;

-- Comment to describe columns
COMMENT ON COLUMN vehicles.timing_belt_last_change IS 'Odometer at the time of the last timing belt change';
COMMENT ON COLUMN vehicles.timing_belt_next_change IS 'Odometer target for the next timing belt change';
COMMENT ON COLUMN vehicles.timing_belt_calculation_base IS 'Base mileage for timing belt change intervals (e.g., 50000, 60000)';

-- Create history table for timing belt changes
CREATE TABLE IF NOT EXISTS vehicle_timing_belt_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    service_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_km BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE vehicle_timing_belt_changes ENABLE ROW LEVEL SECURITY;

-- Create policies (permissive for now, matching typical setup)
CREATE POLICY "Enable read/write for authenticated users" ON vehicle_timing_belt_changes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
