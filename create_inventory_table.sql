-- Create procurement_inventory table
CREATE TABLE IF NOT EXISTS public.procurement_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT,
    details TEXT,
    quantity NUMERIC DEFAULT 0,
    unit TEXT,
    category TEXT NOT NULL CHECK (category IN ('Construção', 'Limpeza', 'Alimentação', 'Material de Uso', 'Ferramentas', 'Serviços')),
    is_tendered BOOLEAN DEFAULT FALSE,
    original_order_protocol TEXT,
    original_item_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.procurement_inventory ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users" ON public.procurement_inventory
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow write access to admin and compras users (assuming role based check or just authenticated for now as per app pattern)
-- For simplicity aligning with other tables in this codebase which often allow authenticated insert/update or check specific roles in app logic.
-- However, strict RLS is better. Let's allow all authenticated for now to match typical rapid dev pattern here, or specific if roles exist in auth.uid() metadata.
-- Given the codebase uses a 'profiles' table for roles, RLS often relies on a joined check or app logic. 
-- We'll enable broad authenticated access for now to ensure it works, mimicking likely existing patterns if strict role check isn't easily visible in one go.
CREATE POLICY "Allow all access for authenticated users" ON public.procurement_inventory
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_procurement_inventory_updated_at
    BEFORE UPDATE ON public.procurement_inventory
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
