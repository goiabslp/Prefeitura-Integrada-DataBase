-- Create purchase_accounts table
CREATE TABLE IF NOT EXISTS public.purchase_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_number TEXT NOT NULL,
  description TEXT NOT NULL,
  sector TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente', -- 'Ativa', 'Pendente'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.purchase_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone logged in can see accounts (to select them in a purchase order)
-- but for selection we will filter status = 'Ativa' in the frontend or here
CREATE POLICY "Allow authenticated users to read accounts"
ON public.purchase_accounts FOR SELECT
TO authenticated
USING (true);

-- Policy: Anyone logged in can request a new account
CREATE POLICY "Allow authenticated users to insert account requests"
ON public.purchase_accounts FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Only admins can update or delete accounts (approve/reject/edit)
CREATE POLICY "Allow admins to manage accounts"
ON public.purchase_accounts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
    AND public.profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
    AND public.profiles.role = 'admin'
  )
);

-- Insert the default account
INSERT INTO public.purchase_accounts (account_number, description, sector, status)
VALUES ('100', 'Recurso Próprio', 'Geral', 'Ativa');
