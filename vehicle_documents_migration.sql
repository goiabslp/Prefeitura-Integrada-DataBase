-- Create vehicle_documents table
CREATE TABLE IF NOT EXISTS vehicle_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;

-- Policies for vehicle_documents
CREATE POLICY "Enable read access for all users" ON vehicle_documents FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON vehicle_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON vehicle_documents FOR DELETE USING (auth.role() = 'authenticated');

-- Storage Bucket Setup (This usually needs to be done in Supabase Dashboard, but we can try via SQL if the extension is enabled, 
-- otherwise the user must create a public bucket named 'vehicle-documents').
-- We will assume the user needs to create the bucket manually or we can try to insert into storage.buckets if permissions allow.

-- Policy for Storage (User must apply this in Storage > Policies if doing manually)
-- but we can try to define it if we could, but SQL for storage policies is tricky without knowing the exact setup.
-- We will stick to the table creation and instruct the user to create the bucket.
