-- Create vehicle_oil_changes table
CREATE TABLE IF NOT EXISTS vehicle_oil_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    current_km BIGINT NOT NULL,
    service_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE vehicle_oil_changes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON vehicle_oil_changes FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON vehicle_oil_changes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
